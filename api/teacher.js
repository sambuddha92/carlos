const express = require('express');
const router = express.Router();
const multer = require('multer');
var storage = multer.memoryStorage();
var upload = multer({storage: storage});
const AWS = require('aws-sdk');
const {v4} = require('uuid');
require('dotenv').config();

let s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'ap-south-1',
    signatureVersion: 'v4'
});

const s3Bucket = 'wingmait-teacher';

const {isValidTeacher} = require('../middleware/validation');
const {isEditorOrAbove} = require('../middleware/auth');
const Teacher = require('../models/teacher.js');

//@route    POST api/teacher
//@desc     Create Teacher
//@access   private

router.post('/', [upload.single('avatar'), isEditorOrAbove, isValidTeacher], async(req, res) => {
    //Read and process request
    const {
        firstname,
        lastname,
        email,
        about,
        facebook,
        linkedin,
        twitter
    } = req.body;

    const name = {
        first: firstname,
        last: lastname
    }

    const social = {
        facebook,
        linkedin,
        twitter
    }

    const created = {
        by: req.user.email,
        on: Date.now()
    }

    try {
        //Check & handle if user exists
        let teacher = await Teacher.findOne({email});

        if (teacher) {

            let response = {
                success: false,
                msg: "Duplicate Teacher Email",
                details: "The email ID provided is already mapped to an existing teacher"
            }

            return res.status(400).json(response);
        }

        let avatar = {
            bucket: '',
            key: '',
            url: 'https://wingmait-public.s3.ap-south-1.amazonaws.com/profile-placeholder.jpg'
        }

        let updates = {
            name,
            email,
            social,
            about,
            created,
            avatar
        }

        if (req.file) {
            const file = req.file;
            avatar = {
                bucket: s3Bucket,
                key: v4() + '_' + file.originalname,
                url: ''
            }
            //Upload file to S3
            let params = {
                Bucket: avatar.bucket,
                Key: avatar.key,
                Body: file.buffer,
                ContentType: file.mimetype
            };
    
            s3.upload(params, function (err) {
                if (err) {
                    let response = {
                        success: false,
                        msg: "Server Error",
                        details: "Encountered an error while trying to upload the new avatar to S3",
                        error: err
                    }
                    return res.status(500).json(response);
                }
            });
    
            updates.avatar = avatar;
        }

        //Initiate Teacher
        teacher = new Teacher(updates);

        await teacher.save();
        
        const updatedTeachers = await Teacher.find();

        let response = {
            success: true,
            msg: "Teacher Created",
            payload: updatedTeachers
        }

        return res.status(200).json(response);

    } catch (err) {
        let response = {
            success: false,
            msg: "Server Error",
            details: "An unexpected error occured while creating a new teacher",
            error: err
        }

        return res.status(500).json(response);
    }
})

//@route    GET api/teacher/all
//@desc     Get All Teachers
//@access   private

router.get('/all', [isEditorOrAbove], async(req, res) => {
    try {
        let teachers = await Teacher.find();

        let response = {
            success: true,
            msg: "All Teachers",
            payload: teachers
        }
        return res.status(200).json(response);
    } catch (err) {
        let response = {
            success: false,
            msg: "Server Error",
            details: "An unexpected error occured while getting all teachers",
            error: err
        }
        return res.status(500).json(response);
    }
})

//@route    GET api/teacher
//@desc     Get a Teacher
//@access   public

router.get('/:id', async(req, res) => {
    try {
        const id = req.params.id;
        let teacher = await Teacher.findById(id).populate('courses');
        
        if (!teacher) {
            let response = {
                success: false,
                msg: "Invalid URL",
                details: "The teacher id passed on as URL parameter does not correspond to any existing teacher"
            }
            return res.status(400).json(response);
        }

        if (teacher.avatar.bucket && teacher.avatar.key) {
            let params = {
                Bucket: teacher.avatar.bucket,
                Key: teacher.avatar.key,
                Expires: 28800
            }
            teacher.avatar.url = s3.getSignedUrl('getObject', params);
        }

        let response = {
            success: true,
            msg: "Teacher",
            payload: teacher
        }

        return res.status(200).json(response);

    } catch (err) {
        let response = {
            success: false,
            msg: "Server Error",
            details: "An unexpected error occured while getting teacher",
            error: err
        }

        return res.status(500).json(response);
    }
})

//@route    PUT api/teacher/id
//@desc     Update a Teacher
//@access   private

router.put('/:id', [upload.single('avatar'), isValidTeacher], async (req, res) => {
    const id = req.params.id;
    const teacher = await Teacher.findById(id);
    
    if (!teacher) {
        let response = {
            success: false,
            msg: "Invalid URL",
            details: "The teacher id passed on as URL parameter does not correspond to any existing teacher"
        }
        return res.status(400).json(response);
    }

    //Read and process request
    const {
        firstname,
        lastname,
        email,
        about,
        facebook,
        linkedin,
        twitter
    } = req.body;

    const name = {
        first: firstname,
        last: lastname
    }

    const social = {
        facebook,
        linkedin,
        twitter
    }

    let updates = {
        name,
        email,
        social,
        about,
        avatar: teacher.avatar
    }

    try {

        if (req.file) {
            const file = req.file;
            let avatar = {
                bucket: s3Bucket,
                key: v4() + '_' + file.originalname,
                url: ''
            }
            //Upload file to S3
            let params = {
                Bucket: avatar.bucket,
                Key: avatar.key,
                Body: file.buffer,
                ContentType: file.mimetype
            };
    
            s3.upload(params, function (err) {
                if (err) {
                    let response = {
                        success: false,
                        msg: "Server Error",
                        details: "Encountered an error while trying to upload the new avatar to S3",
                        error: err
                    }

                    return res.status(500).json(response);
                }
            });

            //Find and delete old image from s3
            if (teacher.avatar.bucket && teacher.avatar.key) {
                s3.deleteObject({  Bucket: teacher.avatar.bucket, Key: teacher.avatar.key }, function(err) {
                    if (err) {
                        let response = {
                            success: false,
                            msg: "Server Error",
                            details: "Encountered an error while trying to delete the previous avatar from S3",
                            error: err
                        }
                        return res.status(500).json(response);
                    }
                });
            }
    
            updates.avatar = avatar;
        }
    
        const updatedTeacher = await Teacher.findByIdAndUpdate(id, updates, {new: true});

        if (updatedTeacher.avatar.bucket && updatedTeacher.avatar.key) {

            let params = {
                Bucket: updatedTeacher.avatar.bucket,
                Key: updatedTeacher.avatar.key,
                Expires: 28800
            }

            updatedTeacher.avatar.url = s3.getSignedUrl('getObject', params);
        }

        let response = {
            success: true,
            msg: "Teacher Updated",
            payload: updatedTeacher
        }

        return res.status(200).json(response);
        
    } catch (err) {

        let response = {
            success: false,
            msg: "Server Error",
            details: "An unexpected error occured while updating teacher profile",
            error: err
        }

        return res.status(500).json(response);
    }
    
})

//@route    DELETE api/teacher/id
//@desc     Delete a Teacher
//@access   private

router.delete('/:id', [isEditorOrAbove], async(req, res) => {
    const id = req.params.id;

    if (!id) {
        let response = {
            success: false,
            msg: "Teacher Id Missing",
            details: "Request URL does not contain a teacher id",
            error: err
        }
        return res.status(400).json(response);
    }

    try {
        let teacher = await Teacher.findById(id);

        if ( teacher.courses.length > 0 ) {
            let response = {
                success: false,
                msg: "Cannot Delete",
                details: "Teachers with one or more courses cannot be deleted"
            }
            return res.status(403).json(response);
        }
        
        if (teacher.avatar.bucket && teacher.avatar.key) {
            var params = {  Bucket: teacher.avatar.bucket, Key: teacher.avatar.key };

            s3.deleteObject(params, function(err) {
                if (err) {
                    let response = {
                        error: {
                            title: "Server error",
                            desc: "An unexpected error occured while trying to delete avatar from S3",
                            msg: err
                        }
                    }
                    return res.status(500).json(response);
                }
            });
        }

        await Teacher.deleteOne({_id: id});

        const updatedTeachers = await Teacher.find();

        let response = {
            success: true,
            msg: "Teacher Deleted",
            payload: updatedTeachers
        }

        return res.status(200).json(response);

    } catch (err) {
        let response = {
            success: false,
            msg: "Server Error",
            details: "An unexpected error occured while deleting teacher",
            error: err
        }
        return res.status(500).json(response);
    }
})

module.exports = router;