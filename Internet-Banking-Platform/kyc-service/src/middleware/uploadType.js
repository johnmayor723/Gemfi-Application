/**
 * ==========================================================
 * Upload Type Middleware
 * ----------------------------------------------------------
 * Sets the upload type for Multer.
 * ==========================================================
 */

module.exports = (type) => {

    return (req, res, next) => {

        req.uploadType = type;

        next();

    };

};