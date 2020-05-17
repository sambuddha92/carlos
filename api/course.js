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

const {isValidCourse, isValidCourseOverview} = require('../middleware/validation');
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
                success: false,
                msg: "Teacher does not exist",
                details: "The teacher id provided does not correspond to an existing teacher"
            }
            return res.status(400).json(response);
        }
        
        const titleId = _.kebabCase(title);

        let course = await Course.findOne({titleId});
        if (course) {
            let response = {
                success: false,
                msg: "Duplicate Course Title",
                details: "The selected course title is already in use"
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

        const updatedCourses = await Course.find().populate('teacher');

        let response = {
            success: true,
            msg: "Course Created",
            payload: updatedCourses
        }

        return res.status(200).json(response);

    } catch (err) {
        let response = {
            success: false,
            msg: "Server Error",
            details: "An unexpected error occured while creating a new course",
            error: err
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
        let response = {
            success: true,
            msg: "All Courses",
            payload: courses
        }
        return res.status(200).json(response);
    } catch (err) {
        let response = {
            success: false,
            msg: "Server Error",
            details: "An unexpected error occured while getting all courses",
            error: err
        }
        return res.status(500).json(response);
    }
})

//@route    GET api/course/id
//@desc     Get A Course
//@access   private

router.get('/:id', [isEditorOrAbove], async(req, res) => {
    const { id } = req.params;
    try {
        let course = await Course.findById(id).populate('teacher');
        let response = {
            success: true,
            msg: "All Courses",
            payload: course
        }
        return res.status(200).json(response);
    } catch (err) {
        let response = {
            success: false,
            msg: "Server Error",
            details: "An unexpected error occured while getting all courses",
            error: err
        }
        return res.status(500).json(response);
    }
})

//@route    PUT api/course/id/description
//@desc     Update A Course Description
//@access   private

router.put("/:id/description", [isEditorOrAbove], async (req, res) => {
    const { id } = req.params;
    try {
        let { description } = req.body;
        const updatedCourse = await Course.findByIdAndUpdate(id, {description}, {new: true}).populate('teacher');
        let response = {
            success: true,
            msg: "Course Updated",
            payload: updatedCourse
        }
        return res.status(200).json(response);

    } catch (err) {
        let response = {
            success: false,
            msg: "Server Error",
            details: "An unexpected error occured while updating course description",
            error: err
        }
        return res.status(500).json(response);
    }
})

//@route    PUT api/course/id/overview
//@desc     Update A Course Overview
//@access   private

router.put("/:id/overview", [upload.none(), isValidCourseOverview, isEditorOrAbove], async (req, res) => {
    const { id } = req.params;
    try {
        let { 
            title,
            subtitle,
            mrp,
            sp
        } = req.body;

        let updates = {
            title,
            subtitle,
            fees: {
                mrp: parseInt(mrp),
                sp: parseInt(sp)
            }
        }
        const updatedCourse = await Course.findByIdAndUpdate(id, updates, {new: true}).populate('teacher');
        let response = {
            success: true,
            msg: "Course Updated",
            payload: updatedCourse
        }
        return res.status(200).json(response);

    } catch (err) {
        let response = {
            success: false,
            msg: "Server Error",
            details: "An unexpected error occured while updating course overview",
            error: err
        }
        return res.status(500).json(response);
    }
})



module.exports = router;