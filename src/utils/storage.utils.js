import { Storage } from '@google-cloud/storage';
import Multer from 'multer';
import config from '../config/config';

export default class CloudStorage {
    constructor() {
        const storage = new Storage(config.gCloudStorage);
        this.bucket = storage.bucket(process.env.FIREBASE_STORAGE_BUCKET_URL);
    }
}

export const multer = Multer({
    storage: Multer.memoryStorage(),
    limits: {
        fileSize: 2 * 1024 * 1024 // no larger than 2mb
    }
});