const mongoose = require('mongoose');
const ReviewSchema = new mongoose.Schema(
    {
        service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
        staff: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // optional
        customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        rating: { type: Number, min: 1, max: 5, required: true },
        comment: { type: String, maxlength: 500 },
    },
    { timestamps: true } // adds createdAt / updatedAt
);
module.exports = mongoose.model('Review', ReviewSchema);