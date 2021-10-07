const Busboy = require('busboy');
const fs = require('fs');
const sharp = require('sharp');
const MongooseError = require('mongoose').Error;
const { Image } = require('../models');
const { UnsetEnvError } = require('../utils/errors');

const UPLOADS_DIR = process.env.UPLOADS_DIR;
const MAX_IMAGE_SIZE = parseInt(process.env.MAX_IMAGE_SIZE) || 5242880;
const THUMBNAIL_SIZE = parseInt(process.env.THUMBNAIL_SIZE) || 100;

if (!UPLOADS_DIR) {
    throw new UnsetEnvError('UPLOADS_DIR');
}

const existingDirPromise = fs.promises
    .mkdir(UPLOADS_DIR, { recursive: true })
    .then(console.log('Created uploads directory ' + UPLOADS_DIR))
    .catch((err) => {
        if (err.code !== 'EEXIST') {
            throw err;
        }
    });

// Middleware for uploading images, and also parses multiform data instead of
// JSON.
// Likely not the best way to do this, but it works for now.
function storeImage(req, res, next) {
    if (!req.is('multipart/form-data')) {
        return next();
    }

    const busboy = new Busboy({
        headers: req.headers,
        limits: { fileSize: MAX_IMAGE_SIZE },
    });

    // Helper object to get a grasp of the state of the upload.
    const state = {};
    state.imageData = {};

    state.uploadError = false;
    state.wroteToDisk = false;
    state.receivedOne = false;

    busboy.on(
        'file',
        async (_fieldname, file, _filename, _encoding, mimetype) => {
            // console.log('Uploading image...');

            // Only accept one file.
            if (state.receivedOne) {
                // console.log(`Ignoring additional file ${_fieldname}`);
                file.resume();
                return;
            }
            state.receivedOne = true;

            file.on('end', () => {
                // Check if the upload was interrupted by being too large.
                if (file.truncated) {
                    state.uploadError = true;
                    return res.status(413).send({
                        error: `File too large (>${MAX_IMAGE_SIZE} bytes)`,
                    });
                }
            });

            if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
                state.uploadError = true;

                // Finish consuming the stream so that it doesn't hang when
                // the client uses it repeatedly (weird).
                file.resume();
                return res
                    .status(415)
                    .send({ error: `Unsupported file type: ${mimetype}` });
            }

            const ext = mimetype === 'image/png' ? '.png' : '.jpg';
            const image = new Image({
                extension: ext,
            });
            state.imageData.model = image;

            const path = `${UPLOADS_DIR}/${image.fileName}`;
            state.imageData.path = path;
            state.imageData.thumbnail = `${UPLOADS_DIR}/${image.thumbnail}`;

            await existingDirPromise;
            const writeStream = fs.createWriteStream(path);
            state.wroteToDisk = true;

            // If this event is called, something horrible has gone wrong.
            writeStream.on('error', (err) => {
                console.error(err);
                state.uploadError = true;
                state.emit('error', err);
            });
            file.pipe(writeStream);
        }
    );

    // Also parse the body
    busboy.on('field', (fieldname, value) => {
        if (fieldname == 'payload') {
            try {
                req.body = JSON.parse(value);
            } catch (err) {
                if (err instanceof SyntaxError) {
                    state.uploadError = true;
                    return res.status(400).send({
                        error: 'Invalid JSON payload',
                    });
                }
            }
        }
    });

    busboy.on('error', (err) => {
        return next(err);
    });

    // Just like all roads lead to Rome, all events lead to the finish event.
    // As such, we can use it to clean up any invalid state we might have.
    busboy.on('finish', async () => {
        if (state.uploadError) {
            if (state.wroteToDisk) {
                await fs.promises.unlink(state.imageData.path);
            }
        } else {
            const image = state.imageData.model;

            try {
                // Generate a thumbnail.
                await generateThumbnail(
                    state.imageData.path,
                    state.imageData.thumbnail
                );
            } catch (err) {
                // If for whatever reason the file was not actually what the
                // mimetype said it was, we should delete it.
                await fs.promises.unlink(state.imageData.path);
                if (
                    err.message ===
                    'Input file contains unsupported image format'
                ) {
                    return res.status(415).send({
                        error: 'Unsupported image format',
                    });
                }
                return next(err);
            }

            await image.save();
            req.body.image = image;
            return next();
        }
    });

    req.pipe(busboy);
}

// Generate a thumbnail using the sharp library.
// This is a separate function because it's not a middleware, but it's
// convenient to have it here.
async function generateThumbnail(path, thumbnailPath) {
    // Generate a thumbnail using the sharp library.
    await sharp(path)
        .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE)
        .jpeg()
        .toFile(thumbnailPath);
}

module.exports = storeImage;
