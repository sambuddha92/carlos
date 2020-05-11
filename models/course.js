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
        price: {
            type: Number,
            required: true
        },
        discount: {
            type: Number
        }
    },
    tags: [ 
        {
            tag: {
                type: String,
                required: true
            }
        }
    ],
    sections: [
        {
            title: {
                type: String,
                required: true
            },
            lessons: [
                {
                    lesson: {
                        type: mongoose.Schema.ObjectId,
                        ref: 'Lesson'
                    }
                }
            ]
        }
    ],
    active: {
        type: Boolean,
        default: false
    }
})

// Export the model
module.exports = mongoose.model('Course', Schema);
