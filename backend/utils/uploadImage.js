const cloudinary = require('../config/cloudinary');

/**
 * Upload base64 image to Cloudinary
 * @param {string} base64Image - Base64 encoded image data
 * @param {string} folder - Folder name in Cloudinary
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadImage = async (base64Image, folder = 'identix') => {
    try {
        // Ensure the base64 string has the proper prefix
        let imageData = base64Image;
        if (!base64Image.startsWith('data:image')) {
            imageData = `data:image/jpeg;base64,${base64Image}`;
        }

        const result = await cloudinary.uploader.upload(imageData, {
            folder: folder,
            resource_type: 'image',
            transformation: [
                { width: 400, height: 400, crop: 'limit' }, // Limit size for storage
                { quality: 'auto:good' }, // Optimize quality
            ],
        });

        return {
            url: result.secure_url,
            publicId: result.public_id,
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new Error('Failed to upload image to cloud storage');
    }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Public ID of the image to delete
 */
const deleteImage = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        // Don't throw - deletion failures shouldn't break the flow
    }
};

module.exports = { uploadImage, deleteImage };
