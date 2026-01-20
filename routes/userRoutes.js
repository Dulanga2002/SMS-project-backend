const express = require("express");
const User = require("../models/userModel");
const clerkAuth = require("../middlewear/clerkAuth");
const { clerkClient, clerkMiddleware, getAuth } = require('@clerk/express');

const router = express.Router();

router.post("/sync", clerkAuth, async (req, res) => {
    console.log("connected to /sync route");
    console.log("req.auth:", req.auth);
  try {

    const clerkUser = req.auth;

    if (!clerkUser || !clerkUser.userId) {
      console.error("No clerkUser or userId found in request");
      return res.status(401).json({ message: "Unauthorized - Invalid Clerk token" });
    }

    console.log("Looking for user with clerkUserId:", clerkUser.userId);
    let user = await User.findOne({ clerkUserId: clerkUser.userId });

    if (!user) {
      console.log("User not found, creating new user");
      user = await User.create({
        clerkUserId: clerkUser.userId,
        email: clerkUser.sessionClaims?.email || "no-email@example.com",
        name: clerkUser.sessionClaims?.name || "New User",
        role: "customer"
      });
      console.log("New user created:", user);
    } else {
      console.log("Existing user found:", user);
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error in /sync route:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get user profile
router.get("/profile", clerkAuth, async (req, res) => {
  try {
    const clerkUser = req.auth;
    const user = await User.findOne({ clerkUserId: clerkUser.userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all staff members
router.get("/staff", async (req, res) => {
  try {
    const staffMembers = await User.find({ role: "staff" }).select('_id name email specialization');
    res.status(200).json(staffMembers);
  } catch (error) {
    console.error("Error fetching staff:", error);
    res.status(500).json({ message: error.message });
  }
});

// Create staff members (seed data)
router.post("/seed-staff", async (req, res) => {
  try {
    const existingStaff = await User.find({ role: "staff" });
    if (existingStaff.length > 0) {
      return res.status(200).json({ message: "Staff already exist", staff: existingStaff });
    }

    const staffMembers = [
      {
        clerkUserId: 'staff_sarah_johnson',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@aura.com',
        role: 'staff',
        specialization: 'Hair Stylist',
        phone: '0771234567'
      },
      {
        clerkUserId: 'staff_michael_chen',
        name: 'Michael Chen',
        email: 'michael.chen@aura.com',
        role: 'staff',
        specialization: 'Hair Specialist',
        phone: '0772234567'
      },
      {
        clerkUserId: 'staff_emily_rodriguez',
        name: 'Emily Rodriguez',
        email: 'emily.rodriguez@aura.com',
        role: 'staff',
        specialization: 'Color Expert',
        phone: '0773234567'
      }
    ];

    const createdStaff = await User.insertMany(staffMembers);
    res.status(201).json(createdStaff);
  } catch (error) {
    console.error("Error seeding staff:", error);
    res.status(500).json({ message: error.message });
  }
});

// get all users using clerkClient - filtered
router.get("/getAllUsers", async (req, res) => {
  const formatUser = (user) => {
    return {
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.emailAddresses[0]?.emailAddress,
      imageUrl: user.imageUrl,
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt,
      publicMetadata: user.publicMetadata,
      privateMetadata: user.privateMetadata,
      unsafeMetadata: user.unsafeMetadata
    };
  };

  try {
    const users = await clerkClient.users.getUserList();
    const formattedUsers = users.data.map(formatUser);
    res.json(formattedUsers);
  } catch (err) {
    console.error("Error fetching all users:", err);
    res.status(500).send({ message: "Internal server error" });
  }
});

// get all users using clerkClient - not filtered
router.get("/getClerkUsers", async (req, res) => {
  try {
    const users = await clerkClient.users.getUserList();
    res.json(users);
  } catch (err) {
    console.error("Error fetching all users:", err);
    res.status(500).send({ message: "Internal server error" });
  }
});

module.exports = router;
