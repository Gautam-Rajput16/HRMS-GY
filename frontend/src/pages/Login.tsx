import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Fingerprint } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login, isAuthenticated, user } = useAuth();

    // Redirect if already logged in
    if (isAuthenticated && user) {
        return <Navigate to={user.role === 'admin' ? '/admin' : '/employee'} replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }

        setIsLoading(true);

        try {
            await login(email, password);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: 'linear-gradient(to bottom right, #eef2ff, #ffffff, #f1f5f9)',
        }}>
            <div className="animate-fade-in" style={{ width: '100%', maxWidth: '448px' }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '64px',
                        height: '64px',
                        borderRadius: '16px',
                        backgroundColor: '#4f46e5', // indigo-600
                        marginBottom: '16px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    }}>
                        <Fingerprint style={{ width: '32px', height: '32px', color: 'white' }} />
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827' }}>
                        Welcome to IDentix
                    </h1>
                    <p style={{ color: '#6b7280', marginTop: '4px' }}>Sign in for face-based attendance</p>
                </div>

                <Card style={{
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    border: 'none',
                }}>
                    <CardContent style={{ padding: '32px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111827' }}>Sign In</h2>
                            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Enter your credentials to continue</p>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {error && (
                                <div style={{
                                    padding: '12px',
                                    backgroundColor: '#fef2f2',
                                    border: '1px solid #fecaca',
                                    borderRadius: '8px',
                                    color: '#b91c1c',
                                    fontSize: '14px',
                                }}>
                                    {error}
                                </div>
                            )}

                            <Input
                                type="email"
                                label="Email Address"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                disabled={isLoading}
                            />

                            <div style={{ position: 'relative' }}>
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    label="Password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '34px',
                                        color: '#9ca3af',
                                        padding: '4px',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {showPassword ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                                </button>
                            </div>

                            <Button type="submit" style={{ width: '100%', height: '44px', fontSize: '16px' }} size="lg" isLoading={isLoading}>
                                {!isLoading && <LogIn style={{ width: '16px', height: '16px' }} />}
                                Sign In
                            </Button>
                        </form>

                        {/* Demo Credentials */}
                        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #f3f4f6' }}>
                            <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500, marginBottom: '8px' }}>
                                Demo Accounts
                            </p>
                            <p style={{ fontSize: '11px', color: '#10b981', textAlign: 'center', marginBottom: '16px', fontWeight: 600 }}>
                                Password for all: password123
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <button
                                    onClick={() => { setEmail('admin@identix.com'); setPassword('password123'); }}
                                    style={{
                                        padding: '10px',
                                        borderRadius: '8px',
                                        backgroundColor: '#fef3c7',
                                        border: '1px solid #fcd34d',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                                >
                                    <p style={{ fontWeight: 600, color: '#b45309', fontSize: '13px', marginBottom: '2px' }}>👑 Admin</p>
                                    <p style={{ color: '#92400e', fontSize: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>admin@identix.com</p>
                                </button>
                                <button
                                    onClick={() => { setEmail('hr@identix.com'); setPassword('password123'); }}
                                    style={{
                                        padding: '10px',
                                        borderRadius: '8px',
                                        backgroundColor: '#dbeafe',
                                        border: '1px solid #93c5fd',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                                >
                                    <p style={{ fontWeight: 600, color: '#1d4ed8', fontSize: '13px', marginBottom: '2px' }}>👤 HR</p>
                                    <p style={{ color: '#1e40af', fontSize: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>hr@identix.com</p>
                                </button>
                                {/*
                                <button
                                    onClick={() => { setEmail('developer@identix.com'); setPassword('password123'); }}
                                    style={{
                                        padding: '10px',
                                        borderRadius: '8px',
                                        backgroundColor: '#d1fae5',
                                        border: '1px solid #6ee7b7',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                                >
                                    <p style={{ fontWeight: 600, color: '#047857', fontSize: '13px', marginBottom: '2px' }}>💻 Developer</p>
                                    <p style={{ color: '#065f46', fontSize: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>developer@identix.com</p>
                                </button>
                                <button
                                    onClick={() => { setEmail('employee@identix.com'); setPassword('password123'); }}
                                    style={{
                                        padding: '10px',
                                        borderRadius: '8px',
                                        backgroundColor: '#f3e8ff',
                                        border: '1px solid #c4b5fd',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                                >
                                    <p style={{ fontWeight: 600, color: '#7c3aed', fontSize: '13px', marginBottom: '2px' }}>🧑‍💼 Employee</p>
                                    <p style={{ color: '#6d28d9', fontSize: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>employee@identix.com</p>
                                </button>
                                */}
                            </div>
                            {/* More employees */}
                            <details style={{ marginTop: '12px' }}>
                                <summary style={{ fontSize: '11px', color: '#6b7280', cursor: 'pointer', textAlign: 'center' }}>
                                    + More Employees
                                </summary>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginTop: '8px' }}>
                                    {[
                                        { name: 'Vikram', email: 'vikram@identix.com' },
                                        { name: 'Ananya', email: 'ananya@identix.com' },
                                        { name: 'Rajesh', email: 'rajesh@identix.com' },
                                    ].map((emp) => (
                                        <button
                                            key={emp.email}
                                            onClick={() => { setEmail(emp.email); setPassword('password123'); }}
                                            style={{
                                                padding: '8px',
                                                borderRadius: '6px',
                                                backgroundColor: '#f9fafb',
                                                border: '1px solid #e5e7eb',
                                                textAlign: 'center',
                                                cursor: 'pointer',
                                                fontSize: '10px',
                                                color: '#374151',
                                            }}
                                        >
                                            {emp.name}
                                        </button>
                                    ))}
                                </div>
                            </details>
                        </div>
                    </CardContent>
                </Card>

                <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '12px', marginTop: '24px' }}>
                    © 2024 IDentix. Biometric Attendance & Payroll Management.
                </p>
            </div>
        </div>
    );
}
