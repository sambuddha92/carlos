module.exports = (req, res, next) => {
    const { email, password } = req.body;
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    if ( !email ) {
        return res.status(400).send("Email is required");
    }

    if ( !re.test(email) ) {
        return res.status(400).send("Invalid email");
    }

    if ( !password ) {
        return res.status(400).send("Password is required");
    }

    next();
}