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

const {isValidCourse, isValidCourseOverview, isValidLesson} = require('../middleware/validation');
const {isEditorOrAbove} = require('../middleware/auth');
const util = require('../middleware/util');

const Course = require('../models/course.js');
const Teacher = require('../models/teacher.js');
const Lesson = require('../models/lesson.js');

//@route    POST api/course
//@desc     Create Course
//@access   private

router.post('/', [upload.none(), isValidCourse, isEditorOrAbove], async (req, res) => {
    try {
        let {
            teacherid,
            title,
        } = req.body;

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

//@route    POST api/course/id/section
//@desc     Add A New Course Section
//@access   private

router.post("/:id/section", [isEditorOrAbove], async (req, res) => {
    try {
        const { id } = req.params;

        let { 
            newSectionName
        } = req.body;

        if(!util.isTitle(newSectionName)) {
            let response = {
                success: false,
                msg: "Invalid Section Name",
                details: "Section name must have at least 3 characters"
            }
            return res.status(400).json(response);
        }

        let section = {
            id: _.kebabCase(newSectionName),
            title: newSectionName
        }

        let course = await Course.findById(id);

        if (course.sections.filter(sec => sec.id === section.id).length > 0) {
            let response = {
                success: false,
                msg: "Duplicate Section Name",
                details: "Section names in a course must be unique"
            }
            return res.status(400).json(response);
        }

        let updatedCourse = await Course.findByIdAndUpdate(id, {$push: {sections: section}}, {new: true}).populate('teacher lessons.lesson');
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
            details: "An unexpected error occured while adding a new section",
            error: err
        }
        return res.status(500).json(response);
    }
})

//@route    POST api/course/id/section/sectionid/lesson
//@desc     Add A New Lesson To A Course
//@access   private

router.post('/:id/section/:sectionid/lesson', [upload.single('resource'), isValidLesson, isEditorOrAbove], async (req, res) => {
    try {
        const {
            id,
            sectionid 
        } = req.params

        let {
            title,
            lessontype,
            lessonaccess
        } = req.body;

        let file = req.file;
        let filekey = v4() + "_" + file.originalname;

         //Upload file to S3
         let params = {
            Bucket: s3Bucket,
            Key: filekey,
            Body: file.buffer,
            ContentType: file.mimetype
        };

        s3.upload(params, function (err) {
            if (err) {
                let response = {
                    success: false,
                    msg: "Server Error",
                    details: "Encountered an error while trying to upload the lesson to S3",
                    error: err
                }

                return res.status(500).json(response);
            }
        });

        let course = await Course.findById(id).populate('teacher');

        let updates = {
            teacher: mongoose.Types.ObjectId(course.teacher.id),
            title,
            lessontype,
            video: {
                bucket: '',
                key: ''
            },
            doc: {
                bucket: '',
                key: ''
            },
            courses: [mongoose.Types.ObjectId(course.id)]
        }

        if (lessontype === "VIDEO") {
            updates.video.bucket = s3Bucket;
            updates.video.key = filekey
        }

        if (lessontype === "DOC") {
            updates.doc.bucket = s3Bucket;
            updates.doc.key = filekey
        }

        const lesson = new Lesson(updates);

        await lesson.save();

        const courseLesson = {
            sectionid,
            access: lessonaccess,
            lesson: mongoose.Types.ObjectId(lesson._id)
        }

        let updatedCourse = await Course.findByIdAndUpdate(id, {$push: {lessons: courseLesson}}, {new: true}).populate('teacher lessons.lesson');
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
            details: "An unexpected error occured while adding a new lesson",
            error: err
        }
        return res.status(500).json(response);
    }
})

//@route    GET api/course/id
//@desc     Get A Course
//@access   private

router.get('/:id', [isEditorOrAbove], async(req, res) => {
    try {
        const { id } = req.params;
        let course = await Course.findById(id).populate('teacher lessons.lesson');
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
    try {
        const { id } = req.params;
        let { description } = req.body;
        const updatedCourse = await Course.findByIdAndUpdate(id, {description}, {new: true}).populate('teacher lessons.lesson');
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
    try {
        const { id } = req.params;
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
        const updatedCourse = await Course.findByIdAndUpdate(id, updates, {new: true}).populate('teacher lessons.lesson');
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

//@route    PUT api/course/id/status/live
//@desc     Update Course Status to Live
//@access   private
router.put('/:id/status/live', [isEditorOrAbove], async (req, res) => {
    try {
        const {id} = req.params;
        let course = await Course.findById(id);
        
        if (!course.description) {
            let response = {
                success: false,
                msg: "Course Description Missing",
                details: "A course must have a description added to it before it can go live."
            }
            return res.status(400).json(response);
        }
        
        if (!course.subtitle) {
            let response = {
                success: false,
                msg: "Course Subtitle Missing",
                details: "A course must have a subtitle added to it before it can go live."
            }
            return res.status(400).json(response);
        }

        if (!course.sections.length > 0) {
            let response = {
                success: false,
                msg: "Course is empty.",
                details: "A course must have at least one section with at least one lesson, before it can go live."
            }
            return res.status(400).json(response);
        }

        if (!course.lessons.length > 0) {
            let response = {
                success: false,
                msg: "Course is empty.",
                details: "A course must have at least one section with at least one lesson, before it can go live."
            }
            return res.status(400).json(response);
        }

        const updatedCourse = await Course.findByIdAndUpdate(id, {status: "LIVE"}, {new: true}).populate('teacher lessons.lesson');
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
            details: "An unexpected error occured while making course live",
            error: err
        }
        return res.status(500).json(response);
    }
})

//@route    PUT api/course/id/status/live
//@desc     Update Course Status to Live
//@access   private
router.put('/:id/status/pause', [isEditorOrAbove], async (req, res) => {
    try {
        const {id} = req.params;
        let course = await Course.findById(id);

        const updatedCourse = await Course.findByIdAndUpdate(id, {status: "PAUSED"}, {new: true}).populate('teacher lessons.lesson');
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
            details: "An unexpected error occured while pausing course",
            error: err
        }
        return res.status(500).json(response);
    }
})

//@route    DELETE api/course/id/section/sectionid
//@desc     Delete an empty section
//@access   private

router.delete('/:id/section/:sectionid', [isEditorOrAbove], async (req, res) => {
    try {
        const {
            id,
            sectionid
        } = req.params;

        let course = await Course.findById(id);
        if (course.lessons.filter(lesson => lesson.sectionid === sectionid).length > 0) {
            let response = {
                success: false,
                msg: "Cannot Delete non-empty Section. Delete all lessons first",
                delete: "A section must have no lessons tagged to it for it to be deleted."
            }
            return res.status(400).json(response);
        }

        let updatedCourse = await Course.findByIdAndUpdate(id, {$pull: {sections: {id: sectionid}}}, {new: true}).populate('teacher lessons.lesson');
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
            details: "An unexpected error occured while deleting section",
            error: err
        }
        return res.status(500).json(response);
    }
})

//@route    DELETE api/course/id/lesson/lessonid
//@desc     Update A Course Overview
//@access   private

router.delete('/:id/lesson/:lessonid', [isEditorOrAbove], async (req, res) => {
    try {
        const {
            id,
            lessonid
        } = req.params;

        const lesson = await Lesson.findById(lessonid);
        let Bucket = "";
        let Key = "";
        
        if (lesson.lessontype === "VIDEO") {
            Bucket = lesson.video.bucket;
            Key = lesson.video.key
        }

        if (lesson.lessontype === "DOC") {
            Bucket = lesson.doc.bucket;
            Key = lesson.doc.key
        }

        s3.deleteObject({ Bucket, Key }, function(err) {
            if (err) {
                let response = {
                    success: false,
                    msg: "Server Error",
                    details: "Encountered an error while trying to delete lesson content from s3",
                    error: err
                }
                return res.status(500).json(response);
            }
        });

        await Lesson.deleteOne({_id: lessonid});

        let updatedCourse = await Course.findByIdAndUpdate(id, {$pull: {lessons: {lesson: lessonid}}}, {new: true}).populate('teacher lessons.lesson');
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
            details: "An unexpected error occured while deleting the lesson",
            error: err
        }
        return res.status(500).json(response);
    }
})

module.exports = router;