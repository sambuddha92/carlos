const mongoose = require('mongoose');

// Define the model
const Schema = new mongoose.Schema({
    teacher: {
        type: mongoose.Schema.ObjectId,
        ref: 'Teacher',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    resource: {
        bucket: {
            type: String
        },
        folder: {
            type: String
        },
        file: {
            type: String
        }
    }
})


// Export the model
module.exports = mongoose.model('Teacher', Schema);
