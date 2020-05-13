const mongoose = require('mongoose');

// Define the model
const Schema = new mongoose.Schema({
    status:{
        type: String,
        enum: ['INCOMPLETE', 'COMPLETE_PAUSED', 'COMPLETE_LIVE'],
        default: 'INCOMPLETE',
        required: true
    },
    teacher: {
        type: mongoose.Schema.ObjectId,
        ref: 'Teacher',
        required: true
    },
    title: {
        type: String,
        unique: true,
        required: true
    },
    subtitle: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    fees: {
        mrp: {
            type: Number,
            required: true
        },
        sp: {
            type: Number,
            required: true
        }
    },
    tags: [{
        type: String
    }],
    sections: [{
        title: {
            type: String,
            required: true
        },
        lessons: [{
            type: mongoose.Schema.ObjectId,
            ref: 'Lesson'
        }]
    }]
})

// Export the model
module.exports = mongoose.model('Course', Schema);
