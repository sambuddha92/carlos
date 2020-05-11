const express =require('express');
const router = express.Router();
 
require('dotenv').config();

const { isValidTeacher } = require('../../middleware/validation');
const { isEditorOrAbove } = require('../../middleware/auth');
const Teacher = require('../../models/teacher.js');

//@route    POST api/teacher
//@desc     Create Teacher
//@access   private

router.post('/', [ isValidTeacher, isEditorOrAbove ], async (req, res) => {

        //Read and update request  
        let { email, name, social, about } = req.body;
    
        const created = {
          by: req.user.email,
          on: Date.now()
        }
    
        try {
            //Check & handle if user exists
            let teacher = await Teacher.findOne({ email });

            if (teacher) {

            let response = {
                error: {
                    title: "Teacher already exists",
                    desc: "A teacher with the same email id already exists."
                }
            }

            return res.status(400).json(response);
            }

            //Initiate Teacher
            teacher = new Teacher({
            name,
            email,
            social,
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

router.get( '/all', [isEditorOrAbove], async (req, res) => {
    try {
      let teachers = await Teacher.find();
      res.status(200).json(teachers);
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