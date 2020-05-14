const express = require('express');
const router = express.Router();
const multer = require('multer');
var storage = multer.memoryStorage();
var upload = multer({storage: storage});
const mongoose = require('mongoose');
const AWS = require('aws-sdk');
const {v4} = require('uuid');
const _ = require('lodash');
require('dotenv').config();

let s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'ap-south-1',
    signatureVersion: 'v4'
});

const s3Bucket = 'wingmait-course';

const {isValidCourse} = require('../middleware/validation');
const {isEditorOrAbove} = require('../middleware/auth');
const Course = require('../models/course.js');
const Teacher = require('../models/teacher.js');

//@route    POST api/course
//@desc     Create Course
//@access   private

router.post('/', [upload.none(), isValidCourse, isEditorOrAbove], async (req, res) => {
    let {
        teacherid,
        title,
    } = req.body;
    try {
        //Check if teacher exists
        const teacher = await Teacher.findById(teacherid);
        if (!teacher) {
            let response = {
                error: {
                    title: "Teacher not found",
                    desc: "The provided teacher id does not correspond to a teacher in database."
                }
            }
            return res.status(400).json(response);
        }
        
        const titleId = _.kebabCase(title);

        let course = await Course.findOne({titleId});
        if (course) {
            let response = {
                success: {
                    title: "Duplicate Course Title",
                    desc: "Another course with same title exists. Please choose a different title.",
                }
            }
            return res.status(400).json(response);
        }

        course = new Course({
            teacher: mongoose.Types.ObjectId(teacherid),
            title,
            titleId,
            status: 'INCOMPLETE'
        })

        
        const newCourse = await course.save();

        //Add course to teacher document
        let teacherCourses = teacher.courses;
        teacherCourses.push(mongoose.Types.ObjectId(newCourse.id));
        await Teacher.findByIdAndUpdate(teacherid, {courses: teacherCourses});

        let response = {
            success: {
                title: "Course created",
                desc: "A course with the provided details has been created successfully."
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

//@route    GET api/course/all
//@desc     Get All Courses
//@access   private

router.get('/all', [isEditorOrAbove], async(req, res) => {
    try {
        let courses = await Course.find().populate('teacher');
        return res.status(200).json(courses);
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