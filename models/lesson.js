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
    lessontype: {
        type: String,
        enum: ['PDF', 'VIDEO', 'QUIZ'],
        required: true
    },
    resource: {
        bucket: String,
        key: String
    }
})


// Export the model
module.exports = mongoose.model('Teacher', Schema);
