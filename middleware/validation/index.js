// Validation middleware for api requests to check validity of requests w.r.t content type, syntax etc.


const isValidUser = require('./isValidUser');
const isValidLogInAttempt = require('./isValidLogInAttempt');
const isValidTeacher = require('./isValidTeacher');
const isValidCourse = require('./isValidCourse');
const isValidCourseOverview = require('./isValidCourseOverview');
const isValidLesson = require('./isValidLesson');

module.exports = {
    isValidUser,
    isValidLogInAttempt,
    isValidTeacher,
    isValidCourse,
    isValidCourseOverview,
    isValidLesson
}