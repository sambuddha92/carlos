const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../../models/user');
const bcrypt = require('bcryptjs');

const strategy = new LocalStrategy({usernameField: "email"}, (username, password, done) => {
    try {
      User.findOne({ email: username }, (err, user) => {
        if (err) { return done(err); }

        //Match User
        if (!user) {
          return done(null, false, { message: 'Incorrect email.' });
        }

        //Match Password
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) throw err;
          if(isMatch) {
            return done(null, user);
          } else {
            return done(null, false, { message: 'Incorrect password.' });
          }
        });

      });
    } catch (e) {
      console.log(e);
    }
  }
);

module.exports = strategy