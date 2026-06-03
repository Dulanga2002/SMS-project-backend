const express = require("express");
const Service = require("../models/serviceModel");
const { createService, deleteService } = require("../controllers/serviceController");
const clerkAuth = require("../middlewear/clerkAuth");
const adminAuth = require("../middlewear/adminAuth");

const router = express.Router();

// Get all services
router.get("/", async (req, res) => {
  try {
    const services = await Service.find();
    res.status(200).json(services);
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({ message: error.message });
  }
});

// Create a new service
router.post("/", createService);

// Delete a service
router.delete("/:id", clerkAuth, adminAuth, deleteService);

module.exports = router;
