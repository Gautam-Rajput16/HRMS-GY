import { LogOut, User, Menu, X, Terminal, Zap } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Navbar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    if (!user) return null;

    const isAdmin = user.role === 'admin';
    const isHR = user.role === 'hr';
    const isDeveloper = user.role === 'developer';
    const isAdminOrHR = isAdmin || isHR;

    const navLinks = isAdminOrHR
        ? [
            { path: isHR ? '/hr' : '/admin', label: 'Dashboard' },
            { path: '/admin/attendance', label: 'Attendance' },
            { path: '/admin/employees', label: 'Employees' },
            { path: isHR ? '/hr/leaves' : '/admin/leaves', label: 'Leave Mgmt' },
            { path: isHR ? '/hr/payroll' : '/admin/payroll', label: 'Payroll' },
            { path: '/admin/qr-attendance', label: 'QR Code' },
        ]
        : isDeveloper
            ? [
                { path: '/developer', label: 'Dashboard' },
                { path: '/developer/attendance', label: 'Attendance Editor' },
            ]
            : [
                { path: '/employee', label: 'Dashboard' },
                { path: '/employee/history', label: 'History' },
                { path: '/employee/leaves', label: 'Leaves' },
                { path: '/employee/payroll', label: 'Payroll' },
            ];

    const homePath = isAdmin ? '/admin' : isHR ? '/hr' : isDeveloper ? '/developer' : '/employee';

    // Developer gets a dark cyberpunk navbar
    if (isDeveloper) {
        return (
            <nav className="sticky top-0 z-30 w-full bg-gray-900/95 backdrop-blur-md border-b border-cyan-500/20 shadow-lg shadow-cyan-500/5 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        {/* Logo */}
                        <Link to={homePath} className="flex items-center gap-2.5 group">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 group-hover:from-cyan-400 group-hover:to-purple-500 transition-all shadow-lg shadow-cyan-500/30">
                                <Terminal className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-lg font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 group-hover:from-cyan-300 group-hover:to-purple-300 transition-all">
                                IDentix
                            </span>
                            <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 rounded text-xs font-mono text-cyan-400">
                                <Zap className="w-3 h-3" />
                                DEV
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-1">
                            {navLinks.map((link) => {
                                const isActive = location.pathname === link.path;
                                return (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        className={cn(
                                            "px-4 py-2 rounded-lg text-sm font-mono font-medium transition-all duration-200",
                                            isActive
                                                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm"
                                                : "text-gray-400 hover:text-cyan-400 hover:bg-gray-800/50"
                                        )}
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* User Profile */}
                        <div className="hidden md:flex items-center gap-3">
                            <div className="flex items-center gap-3 pl-4 border-l border-cyan-500/20">
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-white font-mono leading-tight">{user.name}</p>
                                    <p className="text-xs text-cyan-400 leading-tight font-mono uppercase">{user.role}</p>
                                </div>
                                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                                    <User className="h-4 w-4" />
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={logout}
                                className="h-9 w-9 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/30"
                                title="Logout"
                            >
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-gray-800 transition-colors"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-cyan-500/20 bg-gray-900 absolute w-full shadow-lg animate-fade-in">
                        <div className="px-4 py-3 space-y-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={cn(
                                        "block px-3 py-2.5 rounded-lg text-sm font-mono font-medium transition-colors",
                                        location.pathname === link.path
                                            ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                                            : "text-gray-400 hover:bg-gray-800 hover:text-cyan-400"
                                    )}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <div className="pt-3 mt-3 border-t border-gray-800">
                                <div className="flex items-center gap-3 px-3 py-2">
                                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white font-mono">{user.name}</p>
                                        <p className="text-xs text-cyan-400 font-mono">{user.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={logout}
                                    className="w-full mt-3 px-4 py-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 font-mono text-sm hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </nav>
        );
    }

    // Default navbar for admin and employee
    return (
        <nav className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link to={homePath} className="flex items-center gap-2.5 group">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 group-hover:bg-indigo-700 transition-colors shadow-sm">
                            <span className="font-bold text-white text-sm">I</span>
                        </div>
                        <span className="text-lg font-bold text-gray-900 tracking-tight group-hover:text-indigo-600 transition-colors">IDentix</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => {
                            const isActive = location.pathname === link.path;
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                        isActive
                                            ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200"
                                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:shadow-sm"
                                    )}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                    </div>

                    {/* User Profile */}
                    <div className="hidden md:flex items-center gap-3">
                        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                            <div className="text-right">
                                <p className="text-sm font-semibold text-gray-900 leading-tight">{user.name}</p>
                                <p className="text-xs text-gray-500 leading-tight capitalize font-medium">{user.role}</p>
                            </div>
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 ring-2 ring-white shadow-sm">
                                <User className="h-4 w-4" />
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={logout}
                            className="h-9 w-9 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Logout"
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-gray-200 bg-white absolute w-full shadow-lg animate-fade-in">
                    <div className="px-4 py-3 space-y-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                    "block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                    location.pathname === link.path
                                        ? "bg-indigo-50 text-indigo-600"
                                        : "text-gray-600 hover:bg-gray-50"
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="pt-3 mt-3 border-t border-gray-200">
                            <div className="flex items-center gap-3 px-3 py-2">
                                <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                    <User className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                    <p className="text-xs text-gray-500">{user.email}</p>
                                </div>
                            </div>
                            <Button
                                variant="destructive"
                                className="w-full mt-3 justify-center"
                                onClick={logout}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
