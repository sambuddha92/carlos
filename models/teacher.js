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
      bucket: {
        type: String,
        default: 'wingmait-teacher'
      },
      key: {
        type: String,
        default: 'profile-placeholder.jpg'
      },
      url: {
        type: String,
        default: 'https://wingmait-public.s3.ap-south-1.amazonaws.com/profile-placeholder.jpg'
      }
    },
    about: {
      type: String
    },
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
    },
    courses: [{
      type: mongoose.Schema.ObjectId,
      ref: 'Course'
    }]
})


// Export the model
module.exports = mongoose.model('Teacher', Schema);
