// Permission based authentication of requests

const isEditorOrAbove = require('./isEditorOrAbove');
const isModeratorOrAbove = require('./isModeratorOrAbove');
const isAdminOrAbove = require('./isAdminOrAbove');
const isSuperUser = require('./isSuperUser');

module.exports = {
    isEditorOrAbove,
    isModeratorOrAbove,
    isAdminOrAbove,
    isSuperUser
}