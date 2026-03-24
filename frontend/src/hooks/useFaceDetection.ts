import { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from 'face-api.js';

interface UseFaceDetectionOptions {
    minConfidence?: number;
    detectionInterval?: number;
}

interface UseFaceDetectionResult {
    isModelLoaded: boolean;
    isDetecting: boolean;
    faceDetected: boolean;
    detectionCount: number;
    error: string | null;
    startDetection: (video: HTMLVideoElement) => void;
    stopDetection: () => void;
}

export function useFaceDetection(
    options: UseFaceDetectionOptions = {}
): UseFaceDetectionResult {
    const { minConfidence = 0.5, detectionInterval = 200 } = options;

    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const [detectionCount, setDetectionCount] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const intervalRef = useRef<number | null>(null);
    const consecutiveDetections = useRef(0);

    // Load face-api models
    useEffect(() => {
        const loadModels = async () => {
            try {
                const MODEL_URL = '/models';

                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
                ]);

                setIsModelLoaded(true);
                console.log('Face detection models loaded successfully');
            } catch (err) {
                console.error('Error loading face detection models:', err);
                setError('Failed to load face detection models');
            }
        };

        loadModels();

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    const detectFace = useCallback(async () => {
        if (!videoRef.current || !isModelLoaded) return;

        try {
            const detections = await faceapi.detectSingleFace(
                videoRef.current,
                new faceapi.TinyFaceDetectorOptions({
                    inputSize: 320,
                    scoreThreshold: minConfidence,
                })
            );

            if (detections) {
                consecutiveDetections.current += 1;
                setDetectionCount((prev) => prev + 1);

                // Require at least 3 consecutive detections for stability
                if (consecutiveDetections.current >= 3) {
                    setFaceDetected(true);
                }
            } else {
                consecutiveDetections.current = 0;
                setFaceDetected(false);
            }
        } catch (err) {
            console.error('Face detection error:', err);
        }
    }, [isModelLoaded, minConfidence]);

    const startDetection = useCallback(
        (video: HTMLVideoElement) => {
            if (!isModelLoaded) {
                setError('Models not loaded yet');
                return;
            }

            videoRef.current = video;
            setIsDetecting(true);
            setError(null);
            consecutiveDetections.current = 0;

            // Start detection loop
            intervalRef.current = window.setInterval(detectFace, detectionInterval);
        },
        [isModelLoaded, detectFace, detectionInterval]
    );

    const stopDetection = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsDetecting(false);
        setFaceDetected(false);
        consecutiveDetections.current = 0;
        videoRef.current = null;
    }, []);

    return {
        isModelLoaded,
        isDetecting,
        faceDetected,
        detectionCount,
        error,
        startDetection,
        stopDetection,
    };
}
