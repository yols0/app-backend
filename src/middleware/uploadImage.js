const Busboy = require('busboy');
const fs = require('fs');
const MongooseError = require('mongoose').Error;
const { Image } = require('../models');
const { UnsetEnvError } = require('../utils/errors');

const UPLOADS_DIR = process.env.UPLOADS_DIR;
const MAX_IMAGE_SIZE = parseInt(process.env.MAX_IMAGE_SIZE) || 5242880;

if (!UPLOADS_DIR) {
    throw new UnsetEnvError('UPLOADS_DIR');
}

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

            // Use the ObjectId of the model as the filename.
            const path = `${UPLOADS_DIR}/${image._id}${ext}`;
            state.imageData.path = path;

            const writeStream = fs.createWriteStream(path);

            writeStream.on('error', (err) => {
                console.error(err);
                state.uploadError = true;

                if (err instanceof MongooseError) {
                    return res.status(400).send({
                        error: err.message,
                    });
                } else {
                    state.emit('error', err);
                }
            });
            writeStream.on('close', async () => {
                state.wroteToDisk = true;

                // Only save to the database if the file was successfully written
                await image.save();
            });
            file.pipe(writeStream);
        }
    );

    // Also parse the body
    busboy.on('field', (fieldname, value) => {
        req.body[fieldname] = value;
    });

    busboy.on('error', (err) => {
        return next(err);
    });

    // Just like all roads lead to Rome, all events lead to the finish event.
    // As such, we can use it to clean up any invalid state we might have.
    busboy.on('finish', async () => {
        if (state.uploadError) {
            // console.warn('File upload error');

            if (state.imageData.model) {
                await state.imageData.model.remove();
            }
            if (state.wroteToDisk) {
                fs.unlinkSync(state.imageData.path);
            }
        } else {
            // Only continue if there was no error uploading the file.
            req.body.image = state.imageData.model;
            return next();
        }
    });

    req.pipe(busboy);
}

module.exports = storeImage;
