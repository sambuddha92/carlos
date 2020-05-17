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
        enum: ['DOC', 'VIDEO', 'QUIZ'],
        required: true
    },
    video: {
        bucket: String,
        key: String
    },
    doc: {
        bucket: String,
        key: String
    },
    quiz: [{
        question: String,
        answer: String,
        options: [String]
    }],
    courses:[{
        type: mongoose.Schema.ObjectId,
        ref: 'Course'
    }]
})


// Export the model
module.exports = mongoose.model('Teacher', Schema);
