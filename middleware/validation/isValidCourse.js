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

    if ( !title ) {
        let response = {
            success: false,
            msg: "Course Title Missing",
            details: "Course title is mandatory to create a new course"
        }
        return res.status(400).json(response);
    }

    next();
}