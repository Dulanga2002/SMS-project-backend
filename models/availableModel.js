const mongoose = require('mongoose');

const availableSchema = new mongoose.Schema({
    staffUserId: {
        type: String,
        required: true
    },
    assignedSlotes: [
        {
            date: {
                type: String,
                required: true
            },
            time: {
                type: String,
                required: true
            }
        }
    ]
});

const Available = mongoose.model('Available', availableSchema);

module.exports = Available;