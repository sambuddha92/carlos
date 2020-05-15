module.exports = (req, res, next) => {
    const {firstname, lastname, email} = req.body;

    const name = {
        first: firstname,
        last: lastname
    }
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    if (!name.first || name.first.length < 1 || name.first === " ") {
        let response = {
            success: false,
            msg: "First Name Missing",
            details: "First name is mandatory to create a new user"
        }
        return res.status(400).json(response);
    }

    if (!email) {
        let response = {
            success: false,
            msg: "Email ID Missing",
            details: "Email ID is mandatory to create a new user"
        }
        return res.status(400).json(response);
    }

    if (!re.test(email)) {
        let response = {
            success: false,
            msg: "Invalid Email",
            details: "A valid Email ID is mandatory to create a new user"
        }
        return res.status(400).json(response);
    }

    next();
}