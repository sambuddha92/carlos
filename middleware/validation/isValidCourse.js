module.exports = (req, res, next) => {
    let {
        teacherid,
        title,
    } = req.body;

    if ( !teacherid ) {
        let response = {
            error: {
                title: "Teacher is missing",
                desc: "Teacher is mandatory to create a new course"
            }
        }
        return res.status(400).json(response);
    }

    if ( !title ) {
        let response = {
            error: {
                title: "Title is missing",
                desc: "Title is mandatory to create a new course"
            }
        }
        return res.status(400).json(response);
    }

    next();
}