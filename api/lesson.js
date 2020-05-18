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

const s3Bucket = 'wingmait-course';

const {isEditorOrAbove} = require('../middleware/auth');

const Lesson = require('../models/lesson.js');

//@route    Get api/lesson/id/url
//@desc     Get a lesson url
//@access   private

router.get('/:id/url', [isEditorOrAbove], async (req,res) => {

    const {id} = req.params;

    try {
        const lesson = await Lesson.findById(id);
        let filekey = '';

        if (lesson.lessontype === "VIDEO") {
            filekey = lesson.video.key
        }

        if (lesson.lessontype === "DOC") {
            filekey = lesson.doc.key
        }

        let params = {
            Bucket: s3Bucket,
            Key: filekey,
            Expires: 28800
        }
    
        let url = s3.getSignedUrl('getObject', params);
        let response = {
            success: true,
            msg: "Lesson URL",
            payload: url
        }
        return res.status(200).json(response);

    } catch (err) {
        console.log(err);
        let response = {
            success: false,
            msg: "Server Error",
            details: "An unexpected error occured while getting lesson url",
            error: err
        }
        return res.status(500).json(response);
    }
})



module.exports = router;