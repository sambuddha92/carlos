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
    password: {
      type: String,
      required: true
    },
    permission: {
      level: {
        type: Number,
        enum: [0,1,2,3],
        required: true,
        default: 3
      },
      title: {
        type: String,
        enum: ["SUPERUSER", "ADMIN", "MODERATOR", "EDITOR"],
        required: true,
        default: "EDITOR"
      }
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
    }
})

/*
Permission Levels and Titles:

[ LEVEL ] [     TITLE     ]
---------------------------
[   0   ] [   SUPERUSER   ]
[   1   ] [     ADMIN     ]
[   2   ] [   MODERATOR   ]
[   3   ] [     EDITOR    ]

*/


// Export the model
module.exports = mongoose.model('User', Schema);
