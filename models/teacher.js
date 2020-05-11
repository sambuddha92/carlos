const mongoose = require('mongoose');

// Define the model
const Schema = new mongoose.Schema({
  name: {
    first: {
        type: String,
        required: true
    },
    last: String,
    },
    email: {
        type: String,
        unique: true,
        lowercase: true,
        required: true
    },
    social: {
      linkedin: {
        type: String
      },
      twitter: {
        type: String
      },
      facebook: {
        type: String
      }
    },
    avatar: {
      type: String
    },
    about: {
      type: String
    },
    courses: [
      {
        course: {
          type: mongoose.Schema.ObjectId,
          ref: 'Course'
        }
      }
    ],
    created: {
      by: {
        type: String,
        required: true
      },
      on: {
        type: Number,
        required: true,
        default: Date.now()
      }
    }
})


// Export the model
module.exports = mongoose.model('Teacher', Schema);
