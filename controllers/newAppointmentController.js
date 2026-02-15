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

module.exports = {
  createNewAppointment,
};
