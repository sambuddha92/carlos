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
                success: {
                    title: "Authenticated",
                    desc: "User has been authenticated successfully"
                }
            }
            
            return res.status(200).json(response);
        } else {

            let response = {
                error: {
                    title: "Unauthorized",
                    desc: "User could not be authenticated"
                }
            }
            
            return res.status(401).json(response);
        }
        
    } catch (err) {

        let response = {
            error: {
                title: "Server error",
                desc: "An unexpected error occured.",
                msg: err
            }
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
            details: err
          }
        return res.status(500).json(response);
    }
    
  });

module.exports = router;