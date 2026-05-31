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
    const { staffUserId, date } = req.query;
    console.log("Get assigned slots request:", { staffUserId, date });
    if (!staffUserId) {
      return res.status(400).json({ message: "staffUserId is required" });
    }

    const availability = await Available.findOne({ staffUserId }).lean();
    const assignedSlotes = availability?.assignedSlotes || [];
    const filteredSlots = date
      ? assignedSlotes.filter((slot) => slot.date === date)
      : assignedSlotes;

    console.log("Filtered assigned slots:", filteredSlots);
    return res.status(200).json({
      staffUserId,
      assignedSlotes: filteredSlots,
      count: filteredSlots.length,
    });
  } catch (error) {
    console.error("Get assigned slots error:", error);
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
};
