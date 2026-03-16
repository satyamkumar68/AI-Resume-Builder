const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log("Checking Cloudinary connection...");
cloudinary.api.ping(function (error, result) {
    if (error) {
        console.error("Cloudinary connection failed:");
        console.error(error);
    } else {
        console.log("Cloudinary connection successful!");
        console.log(result);
    }
});
