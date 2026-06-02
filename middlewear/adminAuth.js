const User = require("../models/userModel");
const { clerkClient } = require("@clerk/express");

const adminAuth = async (req, res, next) => {
  try {
    const clerkUserId = req.auth?.userId;
    if (!clerkUserId) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }
    // Check DB User role
    const user = await User.findOne({ clerkUserId });
    
    // Check Clerk Public Metadata role
    const clerkUser = await clerkClient.users.getUser(clerkUserId);
    const isClerkAdmin = clerkUser?.publicMetadata?.role === 'admin';

    if ((!user || user.role !== 'admin') && !isClerkAdmin) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    next();
  } catch (error) {
    console.error("Admin verification error:", error);
    return res.status(500).json({ message: "Server error checking permissions" });
  }
};

module.exports = adminAuth;
