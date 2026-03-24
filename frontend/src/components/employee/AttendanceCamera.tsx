import { useRef, useState, useEffect, useCallback } from 'react';
import { X, Camera, RefreshCw, CheckCircle2, AlertCircle, MapPin, Loader2 } from 'lucide-react';
import * as faceapi from 'face-api.js';
import { attendanceAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

interface AttendanceCameraProps {
    type: 'login' | 'logout';
    onSuccess: () => void;
    onCancel: () => void;
}

type LocationState =
    | { status: 'pending' }
    | { status: 'fetching' }
    | { status: 'granted'; latitude: number; longitude: number }
    | { status: 'denied'; message: string }
    | { status: 'error'; message: string };

export function AttendanceCamera({ type, onSuccess, onCancel }: AttendanceCameraProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const submittingRef = useRef(false); // Debounce guard

    const [isModelLoading, setIsModelLoading] = useState(true);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [faceDetected, setFaceDetected] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const captureTriggered = useRef(false);

    // Location state — fetched BEFORE face detection begins
    const [location, setLocation] = useState<LocationState>({ status: 'pending' });

    // ─── Fetch location with timeout ───
    const fetchLocation = useCallback(async () => {
        setLocation({ status: 'fetching' });

        if (!navigator.geolocation) {
            setLocation({
                status: 'error',
                message: 'Geolocation is not supported by your browser. Please use a modern browser.',
            });
            return;
        }

        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                });
            });

            const { latitude, longitude } = position.coords;

            // Reject dummy 0,0 coords
            if (latitude === 0 && longitude === 0) {
                setLocation({
                    status: 'error',
                    message: 'Could not get a valid location. Please ensure GPS is enabled and try again.',
                });
                return;
            }

            setLocation({ status: 'granted', latitude, longitude });
        } catch (err) {
            const geoError = err as GeolocationPositionError;
            let message = 'Could not get your location. Please try again.';

            switch (geoError?.code) {
                case GeolocationPositionError.PERMISSION_DENIED:
                    message =
                        'Location permission was denied. Please allow location access in your browser settings and reload.';
                    setLocation({ status: 'denied', message });
                    return;
                case GeolocationPositionError.POSITION_UNAVAILABLE:
                    message =
                        'Location information is unavailable. Please ensure GPS/Location services are turned ON.';
                    break;
                case GeolocationPositionError.TIMEOUT:
                    message = 'Location request timed out. Please check your connection and try again.';
                    break;
            }

            setLocation({ status: 'error', message });
        }
    }, []);

    // ─── Initialize: fetch location first, then load models ───
    useEffect(() => {
        fetchLocation();
        loadModels();

        return () => {
            stopCamera();
            if (detectionIntervalRef.current) {
                clearInterval(detectionIntervalRef.current);
            }
        };
    }, []);

    // Start camera only after models are loaded, location is granted, and retryCount changes
    useEffect(() => {
        if (!isModelLoading && location.status === 'granted') {
            startCamera();
        }
    }, [isModelLoading, location.status, retryCount]);

    const loadModels = async () => {
        try {
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models'),
            ]);
            setIsModelLoading(false);
        } catch (error) {
            console.error('Error loading models:', error);
            setError('Failed to load face detection models. Please refresh the page.');
        }
    };

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 },
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            setError('Could not access camera. Please allow camera permissions in your browser and try again.');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
        }
    };

    const handleVideoPlay = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const displaySize = {
            width: videoRef.current.clientWidth,
            height: videoRef.current.clientHeight,
        };
        faceapi.matchDimensions(canvasRef.current, displaySize);

        // Clear any existing interval
        if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
        }

        detectionIntervalRef.current = setInterval(async () => {
            if (!videoRef.current || !canvasRef.current) {
                if (detectionIntervalRef.current) {
                    clearInterval(detectionIntervalRef.current);
                    detectionIntervalRef.current = null;
                }
                return;
            }

            // Ensure canvas has proper dimensions before getting context
            if (!canvasRef.current.width || !canvasRef.current.height) {
                return;
            }

            // Stricter detection with landmarks to ensure face visibility
            const detections = await faceapi
                .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.7 }))
                .withFaceLandmarks(true);

            // Clear previous drawings
            const ctx = canvasRef.current.getContext('2d');
            if (!ctx) return;
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

            if (detections.length > 0) {
                const resizedDetections = faceapi.resizeResults(detections, displaySize);
                faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
                faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
            }

            setFaceDetected(detections.length > 0);

            // Auto-capture if face is detected, not submitting, and not already triggered
            if (detections.length > 0 && !isSubmitting && !captureTriggered.current && !submittingRef.current) {
                captureTriggered.current = true;
                setFaceDetected(true);
                captureAndSubmit();
            }
        }, 100);
    };

    const captureAndSubmit = async () => {
        // Debounce guard
        if (submittingRef.current || !videoRef.current) return;
        submittingRef.current = true;

        setIsSubmitting(true);
        setError(null);

        try {
            // Double-check location is still available
            if (location.status !== 'granted') {
                throw new Error('Location is required for attendance. Please enable location services and retry.');
            }

            // Capture image
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
            const photoData = canvas.toDataURL('image/jpeg');

            if (type === 'login') {
                await attendanceAPI.markLogin({
                    photo: photoData,
                    latitude: location.latitude,
                    longitude: location.longitude,
                    faceDetected: true,
                });
            } else {
                await attendanceAPI.markLogout({
                    photo: photoData,
                    latitude: location.latitude,
                    longitude: location.longitude,
                    faceDetected: true,
                });
            }

            // Stop camera and clear interval before success callback
            stopCamera();
            if (detectionIntervalRef.current) {
                clearInterval(detectionIntervalRef.current);
                detectionIntervalRef.current = null;
            }

            // Call success callback (parent already refreshes the status)
            onSuccess();
        } catch (err: unknown) {
            console.error('Attendance error:', err);
            let errorMessage = 'Failed to mark attendance. Please try again.';

            if (typeof err === 'object' && err !== null && 'response' in err) {
                const apiError = err as { response?: { data?: { message?: string } } };
                if (apiError.response?.data?.message) {
                    errorMessage = apiError.response.data.message;
                }
            } else if (err instanceof Error) {
                errorMessage = err.message;
            }

            setError(errorMessage);
            setIsSubmitting(false);
            submittingRef.current = false;
        }
    };

    // ─── Retry handler ───
    const handleRetry = () => {
        if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
            detectionIntervalRef.current = null;
        }
        setError(null);
        setIsSubmitting(false);
        captureTriggered.current = false;
        submittingRef.current = false;

        // If location was the issue, re-fetch it
        if (location.status === 'error') {
            fetchLocation();
        }

        setRetryCount((c) => c + 1);
    };

    // ─── Determine what to show in the main area ───
    const showLocationBlock = location.status !== 'granted';
    const showCameraBlock = !showLocationBlock && !isModelLoading;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Mark {type === 'login' ? 'Punch In' : 'Punch Out'}
                    </h3>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onCancel}
                        className="h-8 w-8 rounded-full hover:bg-gray-100"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </Button>
                </div>

                {/* Content */}
                <div className="p-5">
                    {/* Error banner */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5 text-sm text-red-700 animate-in slide-in-from-top-2">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Location gate — shown when location is not yet granted */}
                    {showLocationBlock && (
                        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                            {location.status === 'pending' || location.status === 'fetching' ? (
                                <>
                                    <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                                        <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-700 mb-1">
                                        Fetching your location…
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Please allow location access when prompted
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
                                        <MapPin className="w-7 h-7 text-red-500" />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-900 mb-1">
                                        {location.status === 'denied'
                                            ? 'Location Permission Denied'
                                            : 'Location Unavailable'}
                                    </p>
                                    <p className="text-xs text-gray-500 mb-5 max-w-xs leading-relaxed">
                                        {location.message}
                                    </p>
                                    <Button
                                        className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl h-10 px-6"
                                        onClick={() => {
                                            if (location.status === 'denied') {
                                                // Browser permissions must be re-granted via browser settings
                                                // We can only retry the geolocation call
                                                window.location.reload();
                                            } else {
                                                fetchLocation();
                                            }
                                        }}
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        {location.status === 'denied' ? 'Reload Page' : 'Retry Location'}
                                    </Button>
                                </>
                            )}
                        </div>
                    )}

                    {/* Loading models */}
                    {!showLocationBlock && isModelLoading && (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Spinner className="text-indigo-600 border-indigo-200 border-t-indigo-600 w-8 h-8" />
                            <p className="mt-3 text-sm font-medium text-gray-500">Loading AI Models…</p>
                        </div>
                    )}

                    {/* Camera view — only when location is granted AND models are loaded */}
                    {showCameraBlock && (
                        <>
                            {/* Location confirmed badge */}
                            <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-100 rounded-lg text-xs text-green-700 font-medium">
                                <MapPin className="w-3.5 h-3.5" />
                                Location captured successfully
                            </div>

                            <div
                                className={`relative w-full aspect-[4/3] bg-gray-900 rounded-xl overflow-hidden mb-5 border-4 transition-colors duration-300 ${faceDetected ? 'border-green-500' : 'border-red-500'
                                    }`}
                            >
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    onPlay={handleVideoPlay}
                                    className="w-full h-full object-cover scale-x-[-1]"
                                />
                                <canvas
                                    ref={canvasRef}
                                    className="absolute top-0 left-0 w-full h-full scale-x-[-1]"
                                />

                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg ring-1 ring-white/10">
                                    <div
                                        className={`w-2 h-2 rounded-full transition-colors duration-300 ${faceDetected
                                                ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
                                                : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                                            }`}
                                    />
                                    <span className="text-xs font-medium text-white/90">
                                        {faceDetected ? 'Face Detected' : 'No Face Detected'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                {error ? (
                                    <Button
                                        className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-xl h-11"
                                        onClick={handleRetry}
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Retry
                                    </Button>
                                ) : (
                                    <div className="w-full h-11 pointer-events-none select-none rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center">
                                        {isSubmitting ? (
                                            <div className="flex items-center justify-center gap-2 text-indigo-600 font-medium text-sm animate-pulse">
                                                <Spinner className="w-4 h-4 text-indigo-600 border-indigo-600/30 border-t-indigo-600" />
                                                Verifying & Submitting…
                                            </div>
                                        ) : faceDetected ? (
                                            <span className="text-green-600 font-semibold text-sm flex items-center justify-center gap-2">
                                                <CheckCircle2 className="w-4 h-4" />
                                                Capturing…
                                            </span>
                                        ) : (
                                            <span className="text-gray-500 text-sm flex items-center justify-center gap-2">
                                                <Camera className="w-4 h-4" />
                                                Position face in frame
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
