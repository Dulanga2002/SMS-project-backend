const Appointment = require("../models/newAppointmentModel");

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
      customer,
      staff,
      services,
      appointmentDate,
      appointmentTime,
      totalCost,
      description,
    });

    await newAppointment.save();

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

module.exports = {
  createNewAppointment,
  getAllAppointments,
};
