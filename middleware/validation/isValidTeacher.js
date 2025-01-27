const util = require('../util');

module.exports = (req, res, next) => {
    let {
        firstname,
        lastname,
        email,
    } = req.body;

    const name = {
        first: firstname,
        last: lastname
    }
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    
    if ( !util.isName(firstname) ) {
        let response = {
            success: false,
            msg: "First Name Missing",
            details: "First name is mandatory to create a new teacher"
        }
        return res.status(400).json(response);
    }

    if ( !email ) {
        let response = {
            success: false,
            msg: "Email Id Missing",
            details: "Email Id is mandatory to create a new teacher"
        }
        return res.status(400).json(response);
    }

    if ( !re.test(email) ) {
        let response = {
            success: false,
            msg: "Invalid Email",
            details: "A valid email id is required to create a new teacher"
        }
        return res.status(400).json(response);
    }

    next();
}