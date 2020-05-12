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
            error: {
                title: "Access Denied",
                desc: "New user's permission level canot be above the requesting user."
            }
        }

        return res.status(403).json(response);
    }

    let password = generator.generate({length: 6, numbers: true});

    try {
        //Check & handle if user exists
        let user = await User.findOne({email});

        if (user) {

            let response = {
                error: {
                    title: "User already exists",
                    desc: "An user with the same email id already exists."
                }
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

        let response = {
            success: {
                title: "User created",
                desc: "An user with the provided details has been created successfully."
            }
        }

        return res.status(200).json(response);

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

})

//@route    GET api/user
//@desc     Get Own Profile
//@access   private

router.get('/', (req, res) => {
    if (!req.user) {
        let response = {
            error: {
                title: "Unauthorized",
                desc: "User could not be authenticated"
            }
        }
        return res.status(401).json(response);
    }

    return res.status(200).json(req.user);
})

//@route    GET api/user/all
//@desc     Get All Users
//@access   private

router.get('/all', [isEditorOrAbove], async(req, res) => {
    try {
        let users = await User.find();
        let filteredUsers = users.filter(user => (user.permission.level >= req.user.permission.level))
        return res.status(200).json(filteredUsers);
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
})

//@route    PUT api/user
//@desc     Update Own Profile
//@access   private

router.put('/', async(req, res) => {
    if (!req.user) {
        let response = {
            error: {
                title: "Unauthorized",
                desc: "User could not be authenticated."
            }
        }
        return res.status(401).json(response);
    }

    const updates = req.body;

    if (!updates.name || !updates.name.first) {
        let response = {
            error: {
                title: "First name missing",
                desc: "User must have a first name."
            }
        }
        return res.status(400).json(response);
    }

    delete updates.password;
    delete updates.created;
    delete updates.permission;

    try {
        await User.findByIdAndUpdate(req.user.id, updates);
        let response = {
            success: {
                title: "User updated successfully",
                desc: "The user has been updated according to the given details."
            }
        }
        return res.status(200).json(response);
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
})

//@route    PUT api/user/password/reset
//@desc     Reset Password of User
//@access   private

router.put('/password/reset', [isEditorOrAbove], async(req, res) => {

    const {id} = req.body;

    if (!id) {
        let response = {
            error: {
                title: "User Id Missing",
                desc: "User Id is neessary to delete an user."
            }
        }
        return res.status(400).json(response);
    }

    try {

        let user = await User.findById(id);

        if (user.permission.level < req.user.permission.level) {
            let response = {
                error: {
                    title: "Access denied",
                    desc: "User cannot reset password for another user with higher permission level"
                }
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
            success: {
                title: "Password Reset",
                desc: "The Password for the user has been updated successfully and they have received a" +
                        "n email with new credentials."
            }
        }
        return res.status(200).json(response);

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
})

//@route    DELETE api/user
//@desc     Delete an User
//@access   private

router.delete('/:id', [isEditorOrAbove], async(req, res) => {
    const id = req.params.id;

    if (!id) {
        let response = {
            error: {
                title: "User Id Missing",
                desc: "User Id is neessary to delete an user."
            }
        }
        return res.status(400).json(response);
    }

    try {
        let user = await User.findById(id);

        if (user.permission.level < req.user.permission.level) {
            let response = {
                error: {
                    title: "Access denied",
                    desc: "User cannot deete another user with higher permission level"
                }
            }
            return res.status(403).json(response);
        }

        if (user.id === req.user.id) {
            let response = {
                error: {
                    title: "Access denied",
                    desc: "User cannot delete own profile"
                }
            }
            return res.status(403).json(response);
        }

        await User.deleteOne({_id: id});

        let response = {
            success: {
                title: "User deleted",
                desc: "The user has been deleted successfully"
            }
        }

        return res.status(200).json(response);

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

})

module.exports = router;