const express =require('express');
const router = express.Router();
const passport = require('../config/passport');

const { isValidLogInAttempt } = require('../middleware/validation');

//@route    GET api/auth
//@desc     Authenticate Request
//@access   private

router.get( '/', (req, res) => {
    try {

        if (req.isAuthenticated()) {
            
            let response = {
                success: true,
                msg: "User Authenticated"
            }        
            return res.status(200).json(response);

        } else {
            let response = {
                success: false,
                msg: "Unauthorized"
            }
            
            return res.status(401).json(response);
        }
        
    } catch (err) {

        let response = {
            success: false,
            msg: "Server Error",
            details: "An unexpected error occured while trying to authenticate user",
            error: err
        }
    
          return res.status(500).json(response);
    }
} )

//@route    POST api/auth/local
//@desc     Login User Using Local Strategy
//@access   public

router.post( '/local', isValidLogInAttempt, passport.authenticate('local'), (req, res) => {

    let response = {
        success: true,
        msg: "Logged In",
        payload: {
            permission: req.user.permission.level
        }
      }

    return res.status(200).json(response);
});

//@route    POST api/auth/logout
//@desc     Logout User
//@access   private

router.get( '/logout', (req, res) => {
    
    try {
        req.logOut();
        let response = {
            success: true,
            msg: "Logged Out"
        }
        return res.status(200).json(response);    
    } catch (err) {
        let response = {
            success: false,
            msg: "Server Error",
            details: "An unexpected error occured while logging out user",
            error: err
        }
        return res.status(500).json(response);
    }
    
  });

module.exports = router;