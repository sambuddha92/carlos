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
    
    if ( !name.first || name.first.length < 1 || name.first === " " ) {
        let response = {
            error: {
                title: "First name is missing",
                desc: "First name is mandatory to create a new user"
            }
        }
        return res.status(400).json(response);
    }

    if ( !email ) {
        let response = {
            error: {
                title: "Email is missing",
                desc: "Email is mandatory to create a new user"
            }
        }
        return res.status(400).json(response);
    }

    if ( !re.test(email) ) {
        let response = {
            error: {
                title: "Invalid email",
                desc: "The email ID provided is not valid. A valid email id is mandatory to create a new user."
            }
        }
        return res.status(400).json(response);
    }

    next();
}