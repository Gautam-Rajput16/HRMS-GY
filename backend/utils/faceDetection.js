const faceapi = require('face-api.js');
const { createCanvas, Image, ImageData, loadImage } = require('@napi-rs/canvas');
const path = require('path');

// Get the real internal Canvas class so face-api.js instanceof checks pass
const CanvasRealClass = createCanvas(1, 1).constructor;

// Polyfill browser globals for face-api.js in Node.js
faceapi.env.monkeyPatch({
    Canvas: CanvasRealClass,
    Image,
    ImageData,
    createCanvasElement: () => createCanvas(1, 1),
    createImageElement: () => new Image(),
});

const MODEL_PATH = path.join(__dirname, '..', 'models', 'face-api');

let modelsLoaded = false;

/**
 * Load face detection models (called once at server startup)
 */
const loadModels = async () => {
    if (modelsLoaded) return;
    try {
        await faceapi.nets.tinyFaceDetector.loadFromDisk(MODEL_PATH);
        modelsLoaded = true;
        console.log('✅ Face detection models loaded successfully');
    } catch (error) {
        console.error('❌ Failed to load face detection models:', error.message);
        throw error;
    }
};

/**
 * Detect face in a base64-encoded image
 * @param {string} base64Image - Base64 string (with or without data URI prefix)
 * @returns {Promise<{ faceDetected: boolean, confidence: number, faceCount: number }>}
 */
const detectFace = async (base64Image) => {
    if (!modelsLoaded) {
        await loadModels();
    }

    try {
        // Strip data URI prefix if present
        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
        const imgBuffer = Buffer.from(base64Data, 'base64');

        // Load image into canvas
        const img = await loadImage(imgBuffer);

        // Run face detection with TinyFaceDetector
        const detections = await faceapi.detectAllFaces(
            img,
            new faceapi.TinyFaceDetectorOptions({
                inputSize: 320,       // Balance between speed and accuracy
                scoreThreshold: 0.5,  // Minimum confidence to count as a face
            })
        );

        const faceCount = detections.length;
        const confidence = faceCount > 0
            ? Math.round(detections[0].score * 100) / 100
            : 0;

        console.log(`🔍 Face detection: ${faceCount} face(s) found, confidence: ${confidence}`);

        return {
            faceDetected: faceCount > 0,
            confidence,
            faceCount,
        };
    } catch (error) {
        console.error('Face detection error:', error.message);
        // On error, fail-safe: reject the attempt
        return {
            faceDetected: false,
            confidence: 0,
            faceCount: 0,
        };
    }
};

module.exports = { loadModels, detectFace };
