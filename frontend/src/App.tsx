import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Layout } from '@/components/common/Layout';
import { Login } from '@/pages/Login';
import { EmployeeDashboard } from '@/pages/EmployeeDashboard';
import { AttendanceHistory } from '@/components/employee/AttendanceHistory';
import { LeaveManagement } from '@/components/employee/LeaveManagement';
import { MyPayroll } from '@/components/employee/MyPayroll';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { AttendanceRecords } from '@/components/admin/AttendanceRecords';
import { EmployeeManagement } from '@/components/admin/EmployeeManagement';
import { AdminLeaveManagement } from '@/components/admin/LeaveManagement';
import { PayrollDashboard } from '@/components/admin/PayrollDashboard';
import { QRAttendance } from '@/components/admin/QRAttendance';
import { DeveloperDashboard } from '@/pages/DeveloperDashboard';
import { AttendanceEditor } from '@/components/developer/AttendanceEditor';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Employee Routes */}
          <Route
            path="/employee"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<EmployeeDashboard />} />
            <Route path="history" element={<AttendanceHistory />} />
            <Route path="leaves" element={<LeaveManagement />} />
            <Route path="payroll" element={<MyPayroll />} />
          </Route>

          {/* Admin/HR Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin', 'hr']}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="attendance" element={<AttendanceRecords />} />
            <Route path="employees" element={<EmployeeManagement />} />
            <Route path="leaves" element={<AdminLeaveManagement />} />
            <Route path="payroll" element={<PayrollDashboard />} />
            <Route path="qr-attendance" element={<QRAttendance />} />
          </Route>

          {/* HR Routes (same as admin) */}
          <Route
            path="/hr"
            element={
              <ProtectedRoute allowedRoles={['hr']}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="leaves" element={<AdminLeaveManagement />} />
            <Route path="payroll" element={<PayrollDashboard />} />
          </Route>

          {/* Developer Routes */}
          <Route
            path="/developer"
            element={
              <ProtectedRoute allowedRoles={['developer']}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DeveloperDashboard />} />
            <Route path="attendance" element={<AttendanceEditor />} />
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

