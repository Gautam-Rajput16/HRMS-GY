// API Configuration
// In development: uses local network IP so device can connect
// In production: uses Vercel deployment URL
const DEV_API_URL = 'http://10.159.5.141:5000/api';
const PROD_API_URL = 'https://hrms-backend-rose.vercel.app/api';
export const API_BASE_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;

// App Configuration
export const APP_NAME = 'IDentix';
export const TOKEN_KEY = '@auth_token';
export const USER_KEY = '@user_data';

// Attendance Settings
export const MIN_FACE_DETECTION_CONFIDENCE = 0.7;

// Leave Types
export const LEAVE_TYPES = [
    { label: 'Casual Leave', value: 'casual' },
    { label: 'Sick Leave', value: 'sick' },
    { label: 'Paid Leave', value: 'paid' },
    { label: 'Unpaid Leave', value: 'unpaid' },
];
