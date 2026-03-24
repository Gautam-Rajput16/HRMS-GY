// User Types
export interface User {
    _id: string;
    employeeId: string;
    name: string;
    email: string;
    role: 'admin' | 'hr' | 'employee' | 'developer';
    department?: string;
    designation?: string;
    phone?: string;
    joiningDate: string;
    isActive: boolean;
    salaryStructure?: SalaryStructure;
}

export interface SalaryStructure {
    baseSalary: number;
}

// Auth Types
export interface LoginCredentials {
    email: string;
    password: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    token?: string;
    user?: User;
    data?: {
        token: string;
        user: User;
    };
}

// Attendance Types
export interface Location {
    latitude: number;
    longitude: number;
}

export interface AttendanceRecord {
    _id: string;
    employee: string | User;
    date: string;
    loginTime: string | null;
    loginPhoto: string | null;
    loginLocation: Location | null;
    loginFaceDetected: boolean;
    logoutTime: string | null;
    logoutPhoto: string | null;
    logoutLocation: Location | null;
    logoutFaceDetected: boolean;
    status: 'present' | 'incomplete' | 'absent';
    workingMinutes: number;
    workingHours: string;
}

export interface TodayStatus {
    hasLoggedIn: boolean;
    hasLoggedOut: boolean;
    loginTime: string | null;
    logoutTime: string | null;
    status: 'present' | 'incomplete' | 'absent' | 'not_marked';
}

export interface AttendanceMarkPayload {
    photo: string; // Base64
    latitude: number;
    longitude: number;
    faceDetected?: boolean; // Optional — backend does server-side face detection
}

// Leave Types
export interface LeaveRecord {
    _id: string;
    employee: string | User;
    leaveType: 'casual' | 'sick' | 'paid' | 'unpaid';
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    appliedOn: string;
    reviewedBy?: string | User;
    reviewedOn?: string;
    rejectionReason?: string;
}

export interface LeaveBalance {
    casual: { total: number; used: number; remaining: number };
    sick: { total: number; used: number; remaining: number };
    paid: { total: number; used: number; remaining: number };
}

export interface ApplyLeavePayload {
    leaveType: 'casual' | 'sick' | 'paid' | 'unpaid';
    startDate: string;
    endDate: string;
    reason: string;
}

// Payroll Types
export interface PayrollRecord {
    _id: string;
    employee: string | User;
    month: number;
    year: number;
    monthYear: string;
    workingDaysInMonth: number;
    daysPresent: number;
    daysAbsent: number;
    paidLeaveDays: number;
    unpaidLeaveDays: number;
    halfDays: number;
    baseSalary: number;
    grossSalary: number;
    fixedDeductions: number;
    unpaidLeaveDeduction: number;
    absentDeduction: number;
    totalDeductions: number;
    netSalary: number;
    status: 'draft' | 'processed' | 'paid';
    processedOn?: string;
    paidOn?: string;
    notes?: string;
}

// API Response Types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

// Navigation Types
export type RootStackParamList = {
    Auth: undefined;
    Main: undefined;
};

export type AuthStackParamList = {
    Login: undefined;
};

export type MainTabParamList = {
    Dashboard: undefined;
    Attendance: undefined;
    Leaves: undefined;
    Payroll: undefined;
    Profile: undefined;
};

export type AttendanceStackParamList = {
    FaceAttendance: undefined;
    QRAttendance: undefined;
    MyAttendance: undefined;
};

export type LeaveStackParamList = {
    ApplyLeave: undefined;
    LeaveHistory: undefined;
};
