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

    const file = req.file;
    const avatar = v4() + '_' + file.originalname;

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
                error: {
                    title: "Teacher already exists",
                    desc: "A teacher with the same email id already exists."
                }
            }

            return res.status(400).json(response);
        }

        //Upload file to S3
        let params = {
            Bucket: 'wingmait-teacher',
            Key: avatar,
            Body: file.buffer,
            ContentType: file.mimetype
        };

        s3.upload(params, function (err) {
            if (err) {
                let response = {
                    error: {
                        title: "Server error",
                        desc: "An unexpected error occured.",
                        msg: err
                    }
                }
                return res.status(500).json(response);
            }
        });

        //Initiate Teacher
        teacher = new Teacher({
            name,
            email,
            social,
            avatar,
            about,
            created
        });

        await teacher.save();

        let response = {
            success: {
                title: "Teacher created",
                desc: "A teacher with the provided details has been created successfully."
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

//@route    GET api/teacher/all
//@desc     Get All Teachers
//@access   private

router.get('/all', [isEditorOrAbove], async(req, res) => {
    try {
        let teachers = await Teacher.find();
        return res.status(200).json(teachers);
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

//@route    GET api/teacher
//@desc     Get a Teacher
//@access   public

router.get('/:id', async(req, res) => {
    try {
        const id = req.params.id;
        let teacher = await Teacher.findById(id);

        let params = {
            Bucket: 'wingmait-teacher',
            Key: teacher.avatar,
            Expires: 28800
        }
        teacher.avatar = s3.getSignedUrl('getObject', params);
        return res.status(200).json(teacher);

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

//@route    DELETE api/teacher/id
//@desc     Delete a Teacher
//@access   private

router.delete('/:id', [isEditorOrAbove], async(req, res) => {
    const id = req.params.id;

    if (!id) {
        let response = {
            error: {
                title: "Teacher Id Missing",
                desc: "Teacher Id is neessary to delete a teacher."
            }
        }
        return res.status(400).json(response);
    }

    try {
        let teacher = await Teacher.findById(id);

        if ( teacher.courses.length > 0 ) {
            let response = {
                error: {
                    title: "Access denied",
                    desc: "Teachers with one or more courses cannot be deleted."
                }
            }
            return res.status(403).json(response);
        }
        var params = {  Bucket: 'wingmait-teacher', Key: teacher.avatar };

        s3.deleteObject(params, function(err) {
            if (err) {
                let response = {
                    error: {
                        title: "Server error",
                        desc: "An unexpected error occured.",
                        msg: err
                    }
                }
                return res.status(500).json(response);
            }
          });


        await Teacher.deleteOne({_id: id});

        let response = {
            success: {
                title: "Teacher deleted",
                desc: "The teacher has been deleted successfully"
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