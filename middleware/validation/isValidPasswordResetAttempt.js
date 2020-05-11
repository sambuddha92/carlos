module.exports = (req, res, next) => {
    
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if ( !currentPassword ) {
        return res.status(400).send("Current password is required");
    }

    if ( !newPassword ) {
        return res.status(400).send("New password is required");
    }

    if ( !confirmNewPassword ) {
        return res.status(400).send("Confirm new password is required");
    }

    if ( newPassword !== confirmNewPassword ) {
        return res.status(400).send("New password and confirm new password do not match.");
    }

    if (newPassword.length < 6) {
        return res.status(400).send("Password needs to be at least 6 characters long.");
    }

    next()
}