const util = require('../util');

module.exports = (req, res, next) => {
    let {
        title,
        subtitle,
        mrp,
        sp
    } = req.body;

    if ( !util.isTitle(title) ) {
        let response = {
            success: false,
            msg: "Course Title Too Short",
            details: "Course title with at least 3 characters is mandatory"
        }
        return res.status(400).json(response);
    }

    if ( parseInt(sp) > parseInt(mrp) ) {
        let response = {
            success: false,
            msg: "Selling Price Cannot Be Higher Than Max Price",
            details: "Selling price must be equal to or lower than the maximum price"
        }
        return res.status(400).json(response);
    }

    next();
}