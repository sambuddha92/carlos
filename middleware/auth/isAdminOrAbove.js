module.exports = (req, res, next) => {

    let user = req.user;

    if ( !user ) {
        let response = {
            error: {
                title: "Unauthorized",
                desc: "User could not be authenticated"
            }
        }
        return res.status(401).json(response);
    }

    let { permission } = user;

    if ( permission.level > 1 ) {
        let response = {
            error: {
                title: "Access denied",
                desc: "Insufficient permission for the requested resource."
            }
        }
        return res.status(403).json(response);
    }

    next();
}