const express = require("express");
const router = express.Router();
const { createNewAppointment } = require("../controllers/newAppointmentController")

router.post("/", createNewAppointment);

module.exports = router;