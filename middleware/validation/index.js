// Validation middleware for api requests to check validity of requests w.r.t content type, syntax etc.


const isValidUser = require('./isValidUser');
const isValidLogInAttempt = require('./isValidLogInAttempt');
const isValidPasswordResetAttempt = require('./isValidPasswordResetAttempt');
const isValidTeacher = require('./isValidTeacher');

module.exports = {
    isValidUser,
    isValidLogInAttempt,
    isValidPasswordResetAttempt,
    isValidTeacher
}