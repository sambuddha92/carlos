const util = require('../util');

module.exports = (req, res, next) => {
    const {firstname, email} = req.body;

    if (!util.isName(firstname)) {
        let response = {
            success: false,
            msg: "First Name Missing",
            details: "First name is mandatory to create a new user"
        }
        return res.status(400).json(response);
    }

    if (!util.isEmail(email)) {
        let response = {
            success: false,
            msg: "Email ID Invalid",
            details: "A valid Email ID is mandatory to create a new user"
        }
        return res.status(400).json(response);
    }

    next();
}