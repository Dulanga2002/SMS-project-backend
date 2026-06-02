const express = require('express');
const router = express.Router();
const { getReviews, createReview } = require('../controllers/reviewController');
const clerkAuth = require('../middlewear/clerkAuth');

// Public GET reviews
router.get('/', getReviews);

// Protected POST review (auth required)
router.post('/', clerkAuth, createReview);

module.exports = router;
