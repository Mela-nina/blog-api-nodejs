const cloudinary = require('cloudinary').v2;
require('dotenv').config();
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// configure cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET_KEY
});

//instance of Cloudinary Storage
const storage = new CloudinaryStorage({
    cloudinary,
    allowedFormats: ['jpeg', 'png', 'jpg'],
    params: {
        folder: 'blog-api',
        transformation: [{ width: 500, height: 500, crop: 'limit' }],
    }
});

module.exports = storage;
 // Path: middleware/upload.js