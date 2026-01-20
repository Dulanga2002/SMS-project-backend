const express = require("express");
const Service = require("../models/serviceModel");

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

// Create initial services (seed data)
router.post("/seed", async (req, res) => {
  try {
    // Check if services already exist
    const existingServices = await Service.find();
    if (existingServices.length > 0) {
      return res.status(200).json({ message: "Services already exist", services: existingServices });
    }

    const services = [
      {
        name: 'Hair Cut',
        description: 'Professional styling to match styles',
        price: 1000,
        duration: 60, // in minutes
        category: 'Hair'
      },
      {
        name: 'Hair Color',
        description: 'Transform your look with vibrant colors',
        price: 2500,
        duration: 120,
        category: 'Hair'
      },
      {
        name: 'Hair Straightening',
        description: 'Get smooth and manageable hair',
        price: 2500,
        duration: 120,
        category: 'Hair'
      }
    ];

    const createdServices = await Service.insertMany(services);
    res.status(201).json(createdServices);
  } catch (error) {
    console.error("Error seeding services:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
