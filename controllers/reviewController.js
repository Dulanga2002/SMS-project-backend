const Review = require('../models/reviewModel');
const User = require('../models/userModel');

// POST /reviews – create a new review (auth required)
const createReview = async (req, res) => {
  try {
    const clerkUserId = req.auth?.userId;
    if (!clerkUserId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { serviceId, staffId, rating, comment } = req.body;
    if (!serviceId || rating == null) {
      return res.status(400).json({ message: 'serviceId and rating are required' });
    }

    // Find the local MongoDB User document using clerkUserId
    const userDoc = await User.findOne({ clerkUserId });
    if (!userDoc) {
      return res.status(404).json({ message: 'User profile not found. Please sync first.' });
    }

    const newReview = new Review({
      service: serviceId,
      staff: staffId || undefined,
      customer: userDoc._id,
      rating,
      comment,
    });

    await newReview.save();
    return res.status(201).json({ message: 'Review created', review: newReview });
  } catch (error) {
    console.error('Create review error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /reviews – fetch reviews (public)
// Query params: serviceId, staffId, page, limit
const getReviews = async (req, res) => {
  try {
    const { serviceId, staffId, page = 1, limit = 0 } = req.query;
    const filter = {};
    if (serviceId) filter.service = serviceId;
    if (staffId) filter.staff = staffId;

    const query = Review.find(filter)
      .populate('customer', 'name')
      .populate('service', 'name price')
      .populate('staff', 'name')
      .sort({ createdAt: -1 });

    const total = await Review.countDocuments(filter);
    if (limit > 0) {
      const skip = (page - 1) * limit;
      query.skip(skip).limit(limit);
    }

    const reviews = await query.lean();

    // Aggregate average rating & count (used regardless of pagination)
    const agg = await Review.aggregate([
      { $match: filter },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    const stats = agg[0] || { avgRating: 0, count: 0 };

    return res.status(200).json({
      reviews,
      stats: { averageRating: stats.avgRating, totalReviews: stats.count, total },
      pagination: limit > 0 ? { page: Number(page), limit: Number(limit) } : null,
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createReview, getReviews };
