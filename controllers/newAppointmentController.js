const Appointment = require("../models/newAppointmentModel");
const Available = require("../models/availableModel");

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

    if (!appointments || appointments.length === 0) {
      return res.status(200).json({
        message: "No appointments found",
        appointments: [],
        count: 0,
      });
    }

    return res.status(200).json({
      message: "Appointments retrieved successfully",
      appointments,
      count: appointments.length,
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

    const availability = await Available.findOne({ staffUserId: clerkUserId }).lean();
    const assignedSlotes = availability?.assignedSlotes || [];

    console.log("Assigned slots:", assignedSlotes);
    return res.status(200).json({
      staffUserId: clerkUserId,
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

module.exports = {
  createNewAppointment,
  getAllAppointments,
  getAssignedSlots,
  markStaffSlotUnavailable,
  removeStaffSlotUnavailable,
};
