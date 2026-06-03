const express = require("express");
const router = express.Router();
const {
  createNewAppointment,
  getAllAppointments,
  getAssignedSlots,
  markStaffSlotUnavailable,
  removeStaffSlotUnavailable,
  deleteAppointment,
  completeExpiredAppointments,
} = require("../controllers/newAppointmentController");
const Appointment = require("../models/newAppointmentModel");
const clerkAuth = require("../middlewear/clerkAuth");
const adminAuth = require("../middlewear/adminAuth");

router.post("/", clerkAuth, createNewAppointment);
router.get("/", getAllAppointments);
router.get("/assigned-slots", clerkAuth, getAssignedSlots);
router.post("/mark-unavailable", clerkAuth, markStaffSlotUnavailable);
router.delete("/remove-unavailable", clerkAuth, removeStaffSlotUnavailable);
router.delete("/:id", clerkAuth, adminAuth, deleteAppointment);

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

    const normalizedAppointments = await completeExpiredAppointments(allAppointments);

    if (!normalizedAppointments || normalizedAppointments.length === 0) {
      return res.status(200).json({
        message: "No appointments found",
        appointments: [],
        count: 0,
      });
    }
    // filter the appointments using customerId
    const appointments = allAppointments.filter(
      (appointment) => appointment?.customer?.customerId === clerkUserId,
    );

    const customerAppointments = normalizedAppointments.filter(
      (appointment) => appointment?.customer?.customerId === clerkUserId,
    );

    return res.status(200).json(customerAppointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// retrive all appointments for a specific staff member
router.get("/staff-appointments", clerkAuth, async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;
    if (!clerkUserId) {
      return res.status(400).json({ message: "Token not recived" });
    }

    const allAppointments = await Appointment.find()
      .sort({ appointmentDate: -1, appointmentTime: -1 })
      .lean();

    const normalizedAppointments = await completeExpiredAppointments(allAppointments);

    if (!normalizedAppointments || normalizedAppointments.length === 0) {
      return res.status(200).json({
        message: "No appointments found",
        appointments: [],
        count: 0,
      });
    }

    // filter the appointments using staffId
    const staffAppointments = normalizedAppointments.filter(
      (appointment) => appointment?.staff?.staffId === clerkUserId,
    );

    return res.status(200).json(staffAppointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
