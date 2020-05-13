const mongoose = require('mongoose');

// Define the model
const Schema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.ObjectId,
        ref: 'Course',
        required: true
      },
      discounttype: {
          type: String,
          required: true,
          default: "PERCENTAGE"
      },
      amount: {
          type: Number,
          required: true,
          default: 0
      },
      start: {
          type: Date,
          required: true,
          default: Date.now()
      },
      end: {
        type: Date,
        required: true,
        default: Date.now() + 604800000
      }
})


// Export the model
module.exports = mongoose.model('Discount', Schema);
