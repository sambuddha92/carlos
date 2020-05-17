const util = require('../util');

module.exports = (req, res, next) => {
    let {
        teacherid,
        title,
    } = req.body;

    if ( !teacherid ) {
        let response = {
            success: false,
            msg: "Teacher ID Missing",
            details: "Teacher ID is mandatory to create a new course"
        }
        return res.status(400).json(response);
    }

    if ( !util.isTitle(title) ) {
        let response = {
            success: false,
            msg: "Course Title Too Short",
            details: "Course title with at least 3 characters is mandatory to create a new course"
        }
        return res.status(400).json(response);
    }

    next();
}