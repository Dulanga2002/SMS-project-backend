const Service = require("../models/serviceModel");

const createService = async (req, res) => {
  try {
    const { name, description, price, duration } = req.body;

    // Validation
    if (!name || !description || !price || !duration) {
      return res.status(400).json({
        message: "Missing required fields: name, description, price, duration",
      });
    }

    // Validate data types
    if (typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ message: "Invalid name" });
    }
    if (typeof description !== "string" || description.trim() === "") {
      return res.status(400).json({ message: "Invalid description" });
    }
    if (typeof price !== "number" || price <= 0) {
      return res.status(400).json({ message: "Price must be a positive number" });
    }
    if (typeof duration !== "number" || duration <= 0) {
      return res.status(400).json({ message: "Duration must be a positive number (in minutes)" });
    }

    // Check if service with same name already exists
    const existingService = await Service.findOne({ name: name.trim() });
    if (existingService) {
      return res.status(400).json({
        message: "Service with this name already exists",
      });
    }

    // Create new service
    const newService = new Service({
      name: name.trim(),
      description: description.trim(),
      price,
      duration,
    });

    const savedService = await newService.save();
    res.status(201).json({
      message: "Service created successfully",
      service: savedService,
    });
  } catch (error) {
    console.error("Error creating service:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createService,
};
