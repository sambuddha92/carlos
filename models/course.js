const mongoose = require('mongoose');

// Define the model
const Schema = new mongoose.Schema({
    status:{
        type: String,
        enum: ['INCOMPLETE', 'LIVE', 'PAUSED'],
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
    titleId: {
        type: String,
        unique: true,
        required: true
    },
    subtitle: String,
    description: String,
    fees: {
        mrp: {
            type: Number
        },
        sp: {
            type: Number
        }
    },
    tags: [{
        type: String
    }],
    sections: [{
        id: String,
        title: String
    }],
    lessons: [{
        sectionid: String,
        access: {
            type: String,
            enum: ['Preview', 'Freeview', 'Premium'],
            default: 'Premium'
        },
        lesson: {
            type: mongoose.Schema.ObjectId,
            ref: 'Lesson',
            required: true
        }
    }]
})

// Export the model
module.exports = mongoose.model('Course', Schema);
