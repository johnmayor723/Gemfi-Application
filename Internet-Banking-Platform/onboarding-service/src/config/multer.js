/**
 * ==========================================================
 * Multer Configuration
 * ----------------------------------------------------------
 * Handles tenant logo uploads. Single folder, single file
 * type - this service only ever accepts one kind of upload.
 * ==========================================================
 */

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuid } = require("uuid");

const { app: config } = require("./index");

const LOGO_DIR = path.join(config.upload.dir, "logos");

function ensureDirectory(directory) {

    if (!fs.existsSync(directory)) {

        fs.mkdirSync(directory, { recursive: true });

    }

}

const storage = multer.diskStorage({

    destination(req, file, cb) {

        ensureDirectory(LOGO_DIR);

        cb(null, LOGO_DIR);

    },

    filename(req, file, cb) {

        const extension = path.extname(file.originalname);

        cb(null, `${uuid()}${extension}`);

    }

});

const allowedMimeTypes = [

    "image/jpeg",

    "image/png",

    "image/jpg",

    "image/svg+xml",

    "image/webp"

];

function fileFilter(req, file, cb) {

    if (!allowedMimeTypes.includes(file.mimetype)) {

        return cb(
            new Error("Unsupported logo file type."),
            false
        );

    }

    cb(null, true);

}

const upload = multer({

    storage,

    fileFilter,

    limits: {

        fileSize: 2 * 1024 * 1024

    }

});

module.exports = upload;
