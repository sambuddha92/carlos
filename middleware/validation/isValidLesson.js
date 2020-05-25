const util = require('../util');

module.exports = (req, res, next) => {
    let {
        title,
        lessontype,
        lessonaccess,
        bucket,
        key
    } = req.body;

    if (!util.isTitle(title)) {
        let response = {
            success: false,
            msg: "Title Invalid",
            details: "A Lesson must have a title with at least three characters"
        }
        return res.status(400).json(response);
    }

    if (lessontype !== "DOC" && lessontype !== "VIDEO" && lessontype !== "QUIZ") {
        console.log(lessontype);
        let response = {
            success: false,
            msg: "Lesson Type Invalid"
        }
        return res.status(400).json(response);
    }

    if (lessonaccess !== "Preview" && lessonaccess !== "Freeview" && lessonaccess !== "Premium") {
        let response = {
            success: false,
            msg: "Lesson Access Invalid"
        }
        return res.status(400).json(response);
    }

    if (!bucket || !key) {
        let response = {
            success: false,
            msg: "File is required"
        }
        return res.status(400).json(response);
    }
    next();
}