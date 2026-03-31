import multer from 'multer';
import { ALLOWED_MIMETYPES, ALLOWED_EXTENSIONS, FILE_ERROR_MESSAGES } from './file.constants';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    },
});

export const fileUploadMiddleware = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const isMimeAllowed = ALLOWED_MIMETYPES.includes(file.mimetype);
        const ext = file.originalname.substring(file.originalname.lastIndexOf('.')).toLowerCase();
        const isExtAllowed = ALLOWED_EXTENSIONS.includes(ext);

        if (isMimeAllowed || isExtAllowed) {
            cb(null, true);
        } else {
            cb(new Error(FILE_ERROR_MESSAGES.INVALID_FILE_TYPE));
        }
    }
}).single('file');
