const express = require("express");
const router = express.Router();
const {
  createNewAppointment,
  getAllAppointments,
} = require("../controllers/newAppointmentController");
const Appointment = require("../models/newAppointmentModel");
const clerkAuth = require("../middlewear/clerkAuth");

router.post("/", createNewAppointment);
router.get("/", getAllAppointments);

// retrive all appointments for a specific customer
router.get("/my-appointments", clerkAuth, async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;
    if (!clerkUserId) {
      return res.status(400).json({ message: "Token not recived" });
    }
    const allAppointments = await Appointment.find()
      .sort({ appointmentDate: -1, appointmentTime: -1 })
      .lean();

    if (!allAppointments || allAppointments.length === 0) {
      return res.status(200).json({
        message: "No appointments found",
        appointments: [],
        count: 0,
      });
    }
    if (!allAppointments) {
      return res.status(404).json({ message: "No appointment available!" });
    }
    // filter the appointments using customerId
    const appointments = allAppointments.filter(
      (appointment) => appointment?.customer?.customerId === clerkUserId,
    );

    return res.status(200).json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
