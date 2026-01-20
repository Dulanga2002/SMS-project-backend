const express = require("express");
const Appointment = require("../models/appointmentModel");
const User = require("../models/userModel");
const Service = require("../models/serviceModel");
const clerkAuth = require("../middlewear/clerkAuth");

const router = express.Router();

// Create a new appointment
router.post("/", clerkAuth, async (req, res) => {
  try {
    const { staffId, serviceId, date, time, duration, price } = req.body;
    const clerkUser = req.auth;

    // Get customer from database
    const customer = await User.findOne({ clerkUserId: clerkUser.userId });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Parse time to get start and end time
    const [timeStr, period] = time.split(' ');
    let [hours] = timeStr.split(':');
    hours = parseInt(hours);
    
    // Convert to 24-hour format
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    const startTime = `${hours.toString().padStart(2, '0')}:00`;
    
    // Calculate end time based on duration
    const endHours = hours + duration;
    const endTime = `${endHours.toString().padStart(2, '0')}:00`;

    // Create appointment
    const appointment = await Appointment.create({
      customer: customer._id,
      staff: staffId,
      service: serviceId,
      date: new Date(date),
      startTime,
      endTime,
      status: 'pending'
    });

    // Populate the appointment with full details
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('customer', 'name email')
      .populate('staff', 'name')
      .populate('service', 'name price duration');

    res.status(201).json(populatedAppointment);
  } catch (error) {
    console.error("Error creating appointment:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get all appointments for logged-in user
router.get("/my-appointments", clerkAuth, async (req, res) => {
  try {
    const clerkUser = req.auth;

    // Get user from database
    const user = await User.findOne({ clerkUserId: clerkUser.userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let appointments;
    if (user.role === 'staff') {
      // Get appointments where user is the staff member
      appointments = await Appointment.find({ staff: user._id })
        .populate('customer', 'name email')
        .populate('service', 'name price duration')
        .sort({ date: -1 });
    } else {
      // Get appointments where user is the customer
      appointments = await Appointment.find({ customer: user._id })
        .populate('staff', 'name')
        .populate('service', 'name price duration')
        .sort({ date: -1 });
    }

    res.status(200).json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get all appointments (admin only)
router.get("/", clerkAuth, async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('customer', 'name email')
      .populate('staff', 'name')
      .populate('service', 'name price duration')
      .sort({ date: -1 });

    res.status(200).json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ message: error.message });
  }
});

// get all appointments with customerId, staffId, serviceId and  without auth
router.get("/getAllAppointments", async (req, res) => {
  try {
    // Get query params
    const { customerId, staffId, serviceId } = req.query;

    // Build filter object dynamically
    const filter = {};
    if (customerId) filter.customer = customerId;
    if (staffId) filter.staff = staffId;
    if (serviceId) filter.service = serviceId;

    // Fetch appointments
    const appointments = await Appointment.find(filter)
      .populate('customer', 'firstName lastName email') // optional: include only necessary fields
      .populate('staff', 'firstName lastName email')
      .populate('service', 'name description price duration')
      .sort({ date: 1, startTime: 1 }); // sort by date and startTime

    res.status(200).json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving appointments', error });
  }
});


module.exports = router;
