const Appointment = require("../models/newAppointmentModel");
const Available = require("../models/availableModel");
const User = require("../models/userModel");
const emailService = require("../utils/emailService");
const { clerkClient, clerkMiddleware, getAuth } = require('@clerk/express');

const isExpiredAppointment = (appointment, now = new Date()) => {
  if (!appointment?.appointmentDate) {
    return false;
  }

  const appointmentDay = new Date(appointment.appointmentDate);
  if (Number.isNaN(appointmentDay.getTime())) {
    return false;
  }

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  appointmentDay.setHours(0, 0, 0, 0);

  return appointmentDay < todayStart;
};

const completeExpiredAppointments = async (appointments = []) => {
  const expiredIds = appointments
    .filter((appointment) => {
      const status = (appointment?.status || 'pending').toLowerCase();
      return isExpiredAppointment(appointment) && status !== 'completed' && status !== 'cancelled';
    })
    .map((appointment) => appointment._id)
    .filter(Boolean);

  if (expiredIds.length > 0) {
    await Appointment.updateMany(
      { _id: { $in: expiredIds } },
      { $set: { status: 'completed' } },
    );
  }

  const expiredIdSet = new Set(expiredIds.map(String));
  return appointments.map((appointment) => {
    if (expiredIdSet.has(String(appointment._id))) {
      return { ...appointment, status: 'completed' };
    }
    return appointment;
  });
};

const createNewAppointment = async (req, res) => {
  try {
    const {
      customer,
      staff,
      services,
      appointmentDate,
      appointmentTime,
      description,
      totalCost,
    } = req.body;

    const clerkUserId = req.auth?.userId;
    if (!clerkUserId) {
      return res.status(400).json({ message: "Token not recived" });
    }

    if (customer?.customerId && customer.customerId !== clerkUserId) {
      return res.status(403).json({ message: "Customer token mismatch" });
    }

    if (
      !customer?.customerId ||
      !customer?.customerName ||
      !staff?.staffId ||
      !staff?.staffName ||
      !services ||
      services.length === 0 ||
      !appointmentDate ||
      !appointmentTime ||
      !totalCost
    ) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    const newAppointment = new Appointment({
      customer: {
        ...customer,
        customerId: customer?.customerId || clerkUserId,
      },
      staff,
      services,
      appointmentDate,
      appointmentTime,
      totalCost,
      status: 'pending',
      description,
    });

    await newAppointment.save();

    if (staff?.staffId) {
      const dateKey = new Date(appointmentDate).toISOString().split("T")[0];
      await Available.findOneAndUpdate(
        { staffUserId: staff.staffId },
        {
          $push: {
            assignedSlotes: {
              date: dateKey,
              time: appointmentTime,
            },
          },
        },
        { upsert: true, new: true },
      );
    }

    return res.status(201).json({
      message: "Appointment created successfully",
      appointment: newAppointment,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Staff already has an appointment at this time",
      });
    }

    console.error("Create appointment error:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .sort({ appointmentDate: -1, appointmentTime: -1 })
      .lean();

    const normalizedAppointments = await completeExpiredAppointments(appointments);

    if (!normalizedAppointments || normalizedAppointments.length === 0) {
      return res.status(200).json({
        message: "No appointments found",
        appointments: [],
        count: 0,
      });
    }

    return res.status(200).json({
      message: "Appointments retrieved successfully",
      appointments: normalizedAppointments,
      count: normalizedAppointments.length,
    });
  } catch (error) {
    console.error("Get all appointments error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const getAssignedSlots = async (req, res) => {
  try {
    const clerkUserId = req.auth?.userId;
    if (!clerkUserId) {
      return res.status(400).json({ message: "Token not received" });
    }

    const targetUserId = req.query.staffUserId || clerkUserId;

    const availability = await Available.findOne({ staffUserId: targetUserId }).lean();
    let assignedSlotes = availability?.assignedSlotes || [];

    if (req.query.date) {
      const dateKey = new Date(req.query.date).toISOString().split("T")[0];
      assignedSlotes = assignedSlotes.filter(slot => slot.date === dateKey);
    }

    console.log("Assigned slots for", targetUserId, ":", assignedSlotes);
    return res.status(200).json({
      staffUserId: targetUserId,
      assignedSlotes: assignedSlotes,
      count: assignedSlotes.length,
    });
  } catch (error) {
    console.error("Get assigned slots error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const markStaffSlotUnavailable = async (req, res) => {
  try {
    const clerkUserId = req.auth?.userId;
    const { appointmentDate, appointmentTime } = req.body;

    if (!clerkUserId) {
      return res.status(400).json({ message: "Token not recived" });
    }

    if (!appointmentDate || !appointmentTime) {
      return res.status(400).json({
        message: "appointmentDate and appointmentTime are required",
      });
    }

    const dateKey = new Date(appointmentDate).toISOString().split("T")[0];

    const availability = await Available.findOneAndUpdate(
      { staffUserId: clerkUserId },
      {
        $addToSet: {
          assignedSlotes: {
            date: dateKey,
            time: appointmentTime,
          },
        },
      },
      { upsert: true, new: true },
    );

    return res.status(200).json({
      message: "Staff slot marked as unavailable",
      staffUserId: clerkUserId,
      assignedSlotes: availability.assignedSlotes,
    });
  } catch (error) {
    console.error("Mark staff slot unavailable error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const removeStaffSlotUnavailable = async (req, res) => {
  try {
    const clerkUserId = req.auth?.userId;
    const { appointmentDate, appointmentTime } = req.body;

    if (!clerkUserId) {
      return res.status(400).json({ message: "Token not recived" });
    }

    if (!appointmentDate || !appointmentTime) {
      return res.status(400).json({
        message: "appointmentDate and appointmentTime are required",
      });
    }

    const dateKey = new Date(appointmentDate).toISOString().split("T")[0];

    const availability = await Available.findOne({ staffUserId: clerkUserId });
    if (!availability) {
      return res.status(404).json({ message: "No availability record found" });
    }

    const slotExists = availability.assignedSlotes?.some(
      (slot) => slot.date === dateKey && slot.time === appointmentTime,
    );

    if (!slotExists) {
      return res.status(404).json({ message: "Time slot not found" });
    }

    const updatedAvailability = await Available.findOneAndUpdate(
      { staffUserId: clerkUserId },
      {
        $pull: {
          assignedSlotes: {
            date: dateKey,
            time: appointmentTime,
          },
        },
      },
      { new: true },
    );

    return res.status(200).json({
      message: "Staff unavailable slot removed successfully",
      staffUserId: clerkUserId,
      assignedSlotes: updatedAvailability?.assignedSlotes || [],
    });
  } catch (error) {
    console.error("Remove staff slot unavailable error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // 1. If staff is assigned, remove the slot from staff availability
    if (appointment.staff?.staffId) {
      const dateKey = new Date(appointment.appointmentDate).toISOString().split("T")[0];
      await Available.findOneAndUpdate(
        { staffUserId: appointment.staff.staffId },
        {
          $pull: {
            assignedSlotes: {
              date: dateKey,
              time: appointment.appointmentTime,
            },
          },
        }
      );
    }

    // optional -> get all users from cleark
    const formatUser = (user) => {
      return {
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.emailAddresses[0]?.emailAddress,
        imageUrl: user.imageUrl,
        createdAt: user.createdAt,
        lastSignInAt: user.lastSignInAt,
        publicMetadata: user.publicMetadata,
        privateMetadata: user.privateMetadata,
        unsafeMetadata: user.unsafeMetadata
      };
    };
    const users = await clerkClient.users.getUserList();
    const formattedUsers = users.data.map(formatUser);

    console.log("formattedUsers", formattedUsers);


    // 2. Fetch customer and staff email addresses to notify them
    let customer = formattedUsers.find(user => user.userId === appointment.customer?.customerId);
    let staff = formattedUsers.find(user => user.userId === appointment.staff?.staffId);

    const customerEmail = customer.email;
    const staffEmail = staff.email;

    console.log("customerEmail", customerEmail);
    console.log("staffEmail", staffEmail);


    // 3. Delete the appointment
    await Appointment.findByIdAndDelete(id);

    // 4. Send email notifications (non-blocking / error-safe)
    try {
      await emailService.sendAppointmentDeletionEmail(appointment, customerEmail, staffEmail);
    } catch (emailError) {
      console.error("Email service error:", emailError);
      // We don't fail the response, just log the email failure.
    }

    return res.status(200).json({
      message: "Appointment deleted successfully and notification emails sent",
    });
  } catch (error) {
    console.error("Delete appointment error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  createNewAppointment,
  getAllAppointments,
  getAssignedSlots,
  markStaffSlotUnavailable,
  removeStaffSlotUnavailable,
  deleteAppointment,
  completeExpiredAppointments,
};
