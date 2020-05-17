const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const generator = require('generate-password');
const multer = require('multer');
const upload = multer().none();

require('dotenv').config();

const {isValidUser} = require('../middleware/validation');
const {isEditorOrAbove} = require('../middleware/auth');
const User = require('../models/user.js');

const permissionLevels = ['SUPERUSER', 'ADMIN', 'MODERATOR', 'EDITOR'];

//@route    POST api/user
//@desc     Create User
//@access   private

router.post('/', [ upload, isValidUser, isEditorOrAbove ], async(req, res) => {

    //Read and update request
    const {firstname, lastname, email, permissionlevel} = req.body;

    const name = {
        first: firstname,
        last: lastname
    }

    const created = {
        by: req.user.email,
        on: Date.now()
    }

    const permission = {
        level: permissionlevel,
        title: permissionLevels[permissionlevel]
    }

    if (permissionlevel && permission && permission.level < req.user.permission.level) {
        let response = {
            success: false,
            msg: "Insufficient Permission",
            details: "User cannot create another user with higher permission level"
        }

        return res.status(403).json(response);
    }

    let password = generator.generate({length: 6, numbers: true});

    try {
        //Check & handle if user exists
        let user = await User.findOne({email});

        if (user) {

            let response = {
                success: false,
                msg: "Duplicate User",
                details: "An user with the provided email id already exists"
            }

            return res.status(400).json(response);
        }

        //Initiate User
        user = new User({name, email, password, permission, created});

        //Encrypt password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        //Save user
        await user.save();


        //Send email to new user
        const msg = {
            to: user.email,
            from: 'carlos-noreply@wingmait.com',
            subject: 'Your Carlos account is ready',
            text: `Log on to https://carlos.wingmait.com\n\nusername: ${email}\ntemporary password: ${password}\n**You must change your password immediately by visiting "Profile" page after logging in.**`,
            html: `<p>Log on to https://carlos.wingmait.com</p><p>username: ${email}<br />password: ${password}<br /><strong>You must change your password immediately by visiting "Profile" page after logging in.</strong></p>`
        };

        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        sgMail.send(msg);

        const updatedUsers = await User.find();
        const filteredUpdatedUsers = updatedUsers.filter(user => (user.permission.level >= req.user.permission.level))

        let response = {
            success: true,
            msg: "User Created",
            payload: filteredUpdatedUsers
        }

        return res.status(200).json(response);

    } catch (err) {
        let response = {
            success: false,
            msg: "Server Error",
            details: "An unexpected error occured while creating a new user",
            error: err
        }

        return res.status(500).json(response);
    }

})

//@route    GET api/user
//@desc     Get Own Profile
//@access   private

router.get('/', (req, res) => {
    if (!req.user) {
        let response = {
            success: false,
            msg: "Unauthorized",
            details: "User could not be authenticated"
        }
        return res.status(401).json(response);
    }

    let response = {
        success: true,
        msg: "Got User",
        payload: req.user
    }

    return res.status(200).json(response);
})

//@route    GET api/user/all
//@desc     Get All Users
//@access   private

router.get('/all', [isEditorOrAbove], async(req, res) => {
    try {
        let users = await User.find();
        let filteredUsers = users.filter(user => (user.permission.level >= req.user.permission.level));
        let response = {
            success: true,
            msg: "Got All Users",
            payload: filteredUsers
        }
        return res.status(200).json(response);
    } catch (err) {
        let response = {
            success: false,
            msg: "Server Error",
            details: "An unexpected error occured while creating getting all users",
            error: err
        }
        return res.status(500).json(response);
    }
})

//@route    PUT api/user/password/reset
//@desc     Reset Password of User
//@access   private

router.put('/password/reset', [isEditorOrAbove], async(req, res) => {

    const {id} = req.body;

    if (!id) {
        let response = {
            success: false,
            msg: "User Id Missing",
            details: "User Id is mandatory to delete an user"
        }
        return res.status(400).json(response);
    }

    try {

        let user = await User.findById(id);

        if (user.permission.level < req.user.permission.level) {
            let response = {
                success: false,
                msg: "Insufficient Permission",
                details: "An user cannot reset password for another user with higher permission level"
            }
            return res.status(403).json(response);
        }

        let password = generator.generate({length: 6, numbers: true});

        //Encrypt password
        const salt = await bcrypt.genSalt(10);
        let hash = await bcrypt.hash(password, salt);

        await User.findByIdAndUpdate(id, {password: hash});

        //Send email to new user
        const msg = {
            to: user.email,
            from: 'carlos-noreply@wingmait.com',
            subject: 'Your Carlos Password was Reset',
            text: `New Password: ${password}`,
            html: `<p>New Password: ${password}</p>`
        };

        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        sgMail.send(msg);

        let response = {
            success: false,
            msg: "Password Reset Successful"
        }
        return res.status(200).json(response);

    } catch (err) {
        let response = {
            success: false,
            msg: "Server Error",
            details: "An unexpected error occured while resetting password for an user",
            error: err
        }
        return res.status(500).json(response);
    }
})

//@route    DELETE api/user
//@desc     Delete an User
//@access   private

router.delete('/:id', [isEditorOrAbove], async(req, res) => {
    const id = req.params.id;

    if (!id) {
        let response = {
            success: false,
            msg: "User Id Missing",
            details: "User Id is mandatory to delete an user"
        }
        return res.status(400).json(response);
    }

    try {
        let user = await User.findById(id);

        if (user.permission.level < req.user.permission.level) {
            let response = {
                success: false,
                msg: "Insufficient permission",
                details: "User cannot delete another user with higher permission level"
            }
            return res.status(403).json(response);
        }

        if (user.id === req.user.id) {
            let response = {
                success: false,
                msg: "Insufficient Permission",
                details: "User cannot delete their own profile"
            }
            return res.status(403).json(response);
        }

        await User.deleteOne({_id: id});
        const updatedUsers = await User.find();

        let response = {
            success: false,
            msg: "User Deleted",
            payload: updatedUsers
        }

        return res.status(200).json(response);

    } catch (err) {
        let response = {
            success: false,
            msg: "Server Error",
            details: "An unexpected error occured while deleting an user",
            error: err
        }
        return res.status(500).json(response);
    }

})

module.exports = router;