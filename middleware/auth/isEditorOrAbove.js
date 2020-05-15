module.exports = (req, res, next) => {

    let user = req.user;

    if ( !user ) {
        let response = {
            success: false,
            msg: "Unauthorized",
            details: "User identity could not be authenticated"
        }
        return res.status(401).json(response);
    }

    let { permission } = user;

    if ( permission.level > 3 ) {
        let response = {
            success: false,
            msg: "Insufficient permission",
            details: "User does not have sufficient permission to perform this action"
        }
        return res.status(403).json(response);
    }

    next();
}