import mongoose from 'mongoose';
import { ErrorHandler } from './error.middleware.js';
const { isValidObjectId }= mongoose
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        console.log('CHECK MIDDLEWARE: IS AUTH: ', req.isAuthenticated());
        return next();
    }

    return next(ErrorHandler(401));
}

function validateObjectID(...ObjectIDs) {
    return function (req, res, next) {
        ObjectIDs.forEach((id) => {
            if (!isValidObjectId(req.params[id])) {
                return next(ErrorHandler(400, `ObjectID ${id} supplied is not valid`));
            } else {
                next();
            }
        });
    }
}

export { isAuthenticated, validateObjectID };

