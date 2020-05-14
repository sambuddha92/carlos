// Validation middleware for api requests to check validity of requests w.r.t content type, syntax etc.


const isValidUser = require('./isValidUser');
const isValidLogInAttempt = require('./isValidLogInAttempt');
const isValidTeacher = require('./isValidTeacher');
const isValidCourse = require('./isValidCourse');

module.exports = {
    isValidUser,
    isValidLogInAttempt,
    isValidTeacher,
    isValidCourse
}