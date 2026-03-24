import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import {
    Database,
    Calendar,
    Edit3,
    RefreshCw,
    Users,
    Clock,
    TrendingUp,
    AlertCircle,
    FileEdit,
    Terminal,
    Cpu,
    Activity,
    Zap,
    Shield,
    Wifi,
    HardDrive,
    Eye,
} from 'lucide-react';
import { developerAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';

interface Stats {
    totalRecords: number;
    todayRecords: number;
    monthlyRecords: number;
    totalEmployees: number;
    incompleteRecords: number;
}

interface RecentAttendance {
    _id: string;
    employee: {
        name: string;
        employeeId: string;
        department: string;
    };
    date: string;
    loginTime: string;
    logoutTime: string;
    status: string;
    updatedAt: string;
}

// Matrix Rain Component
function MatrixRain() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789';
        const charArray = chars.split('');
        const fontSize = 14;
        const columns = canvas.width / fontSize;
        const drops: number[] = [];

        for (let i = 0; i < columns; i++) {
            drops[i] = Math.random() * -100;
        }

        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#0fa';
            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                const char = charArray[Math.floor(Math.random() * charArray.length)];
                ctx.fillStyle = `rgba(0, 255, 170, ${Math.random() * 0.5 + 0.1})`;
                ctx.fillText(char, i * fontSize, drops[i] * fontSize);

                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };

        const interval = setInterval(draw, 50);
        return () => clearInterval(interval);
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none opacity-[0.15]"
            style={{ zIndex: 0 }}
        />
    );
}

// Typing Effect Hook
function useTypingEffect(text: string, speed = 50) {
    const [displayText, setDisplayText] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        let i = 0;
        setDisplayText('');
        setIsComplete(false);
        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayText(text.substring(0, i + 1));
                i++;
            } else {
                setIsComplete(true);
                clearInterval(timer);
            }
        }, speed);
        return () => clearInterval(timer);
    }, [text, speed]);

    return { displayText, isComplete };
}

export function DeveloperDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentAttendance, setRecentAttendance] = useState<RecentAttendance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [systemStatus, setSystemStatus] = useState({ cpu: 47, memory: 63, network: 'STABLE' });

    const welcomeText = useTypingEffect(`Welcome, ${user?.name || 'Developer'}`, 80);

    useEffect(() => {
        fetchStats();
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        const statusTimer = setInterval(() => {
            setSystemStatus({
                cpu: Math.floor(Math.random() * 30) + 35,
                memory: Math.floor(Math.random() * 20) + 55,
                network: Math.random() > 0.1 ? 'STABLE' : 'SYNCING',
            });
        }, 3000);
        return () => {
            clearInterval(timer);
            clearInterval(statusTimer);
        };
    }, []);

    const fetchStats = async () => {
        try {
            const response = await developerAPI.getStats();
            setStats(response.data.data.stats);
            setRecentAttendance(response.data.data.recentAttendance);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchStats();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] bg-black">
                <div className="text-center">
                    <div className="relative">
                        <div className="w-24 h-24 border-2 border-green-500/30 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Terminal className="w-8 h-8 text-green-400 animate-pulse" />
                        </div>
                    </div>
                    <div className="mt-6 font-mono text-sm">
                        <span className="text-green-400">root@identix</span>
                        <span className="text-white">:</span>
                        <span className="text-blue-400">~</span>
                        <span className="text-white">$ </span>
                        <span className="text-green-300 animate-pulse">loading system...</span>
                        <span className="animate-blink text-green-400">█</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black -mx-4 sm:-mx-6 lg:-mx-8 -my-6 px-4 sm:px-6 lg:px-8 py-6 relative overflow-hidden">
            {/* Matrix Rain Background */}
            <MatrixRain />

            {/* CRT Scanlines */}
            <div className="fixed inset-0 pointer-events-none z-10 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] opacity-30"></div>

            {/* Glowing border effect */}
            <div className="fixed inset-0 pointer-events-none z-10">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500 to-transparent animate-pulse"></div>
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-pulse"></div>
            </div>

            <div className="max-w-7xl mx-auto space-y-6 relative z-20">
                {/* Terminal Header */}
                <div className="bg-gray-950/90 border border-green-500/30 rounded-lg overflow-hidden backdrop-blur-sm">
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-900/80 border-b border-green-500/20">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="ml-2 text-xs font-mono text-gray-500">identix@dev-console — bash — 80×24</span>
                    </div>
                    <div className="p-4 sm:p-6">
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                            <div>
                                {/* Status Badges */}
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                    <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/40 rounded text-xs font-mono text-green-400 animate-pulse">
                                        <span className="w-2 h-2 rounded-full bg-green-400 animate-ping"></span>
                                        SYSTEM ONLINE
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded text-xs font-mono text-cyan-400">
                                        <Shield className="w-3 h-3" />
                                        SECURE_CONN
                                    </div>
                                    <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded text-xs font-mono text-purple-400">
                                        <Cpu className="w-3 h-3" />
                                        CPU: {systemStatus.cpu}%
                                    </div>
                                    <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/30 rounded text-xs font-mono text-orange-400">
                                        <HardDrive className="w-3 h-3" />
                                        MEM: {systemStatus.memory}%
                                    </div>
                                </div>

                                {/* Welcome Message */}
                                <div className="font-mono">
                                    <span className="text-green-400">root@identix</span>
                                    <span className="text-white">:</span>
                                    <span className="text-blue-400">~/dashboard</span>
                                    <span className="text-white"> </span>
                                    <span className="text-white">console.log "</span>
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-cyan-400 to-purple-400 text-xl sm:text-2xl font-bold">
                                        {welcomeText.displayText}
                                    </span>
                                    {!welcomeText.isComplete && <span className="animate-blink text-green-400">█</span>}
                                    <span className="text-white">"</span>
                                </div>

                                {/* Date/Time */}
                                <div className="flex items-center gap-4 mt-3 text-gray-400 font-mono text-sm">
                                    <span className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-green-500" />
                                        <span className="text-green-300">[</span>
                                        {format(new Date(), 'yyyy-MM-dd')}
                                        <span className="text-green-300">]</span>
                                    </span>
                                    <span className="flex items-center gap-2 text-cyan-400">
                                        <Clock className="w-4 h-4" />
                                        <span className="tabular-nums">{format(currentTime, 'HH:mm:ss')}</span>
                                    </span>
                                    <span className="hidden sm:flex items-center gap-2 text-yellow-400">
                                        <Wifi className="w-4 h-4" />
                                        {systemStatus.network}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="flex items-center gap-2 px-4 py-2 bg-black/50 border border-green-500/50 rounded text-green-400 font-mono text-sm hover:bg-green-500/10 hover:border-green-400 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all duration-300 disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                ./sync_data.sh
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Grid - Hacker Style */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <HackerStatCard value={stats?.totalRecords || 0} label="TOTAL_REC" icon={Database} color="green" />
                    <HackerStatCard value={stats?.todayRecords || 0} label="TODAY" icon={Eye} color="cyan" />
                    <HackerStatCard value={stats?.monthlyRecords || 0} label="MONTHLY" icon={TrendingUp} color="purple" />
                    <HackerStatCard value={stats?.totalEmployees || 0} label="USERS" icon={Users} color="blue" />
                    <HackerStatCard value={stats?.incompleteRecords || 0} label="PENDING" icon={AlertCircle} color="orange" isWarning />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Activity Feed */}
                    <div className="lg:col-span-2 bg-gray-950/80 backdrop-blur-sm border border-green-500/20 rounded-lg overflow-hidden">
                        <div className="px-4 py-3 border-b border-green-500/20 bg-gray-900/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-green-500/10 border border-green-500/30 rounded">
                                    <Activity className="w-4 h-4 text-green-400" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-green-400 font-mono">$ tail -f activity.log</h2>
                                    <p className="text-xs text-gray-600 font-mono">real-time feed</p>
                                </div>
                            </div>
                            <Link
                                to="/developer/attendance"
                                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
                            >
                                [MORE] →
                            </Link>
                        </div>
                        <div className="p-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                            {recentAttendance.length === 0 ? (
                                <div className="text-center py-8">
                                    <Terminal className="w-12 h-12 text-green-500/30 mx-auto mb-3" />
                                    <p className="text-gray-600 font-mono text-sm">No data streams detected...</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {recentAttendance.slice(0, 8).map((record, index) => (
                                        <div
                                            key={record._id}
                                            className="group flex items-center gap-3 px-3 py-2 rounded bg-black/30 border border-transparent hover:border-green-500/30 hover:bg-green-500/5 transition-all font-mono text-sm"
                                        >
                                            <span className="text-gray-600 text-xs w-6">{String(index + 1).padStart(2, '0')}</span>
                                            <span className="text-green-500">[</span>
                                            <span className="text-cyan-400 w-16">{format(new Date(record.date), 'MM-dd')}</span>
                                            <span className="text-green-500">]</span>
                                            <span className={`w-10 ${record.status === 'present' ? 'text-green-400' : 'text-orange-400'}`}>
                                                {record.loginTime ? format(new Date(record.loginTime), 'HH:mm') : '--:--'}
                                            </span>
                                            <span className="text-white flex-1 truncate">{record.employee?.name || 'UNKNOWN'}</span>
                                            <span className={`px-2 py-0.5 rounded text-xs ${record.status === 'present'
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-orange-500/20 text-orange-400'
                                                }`}>
                                                {record.status.toUpperCase()}
                                            </span>
                                            <Link
                                                to={`/developer/attendance?edit=${record._id}`}
                                                className="opacity-0 group-hover:opacity-100 text-cyan-400 hover:text-cyan-300 transition-all"
                                            >
                                                <Edit3 className="w-3.5 h-3.5" />
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel */}
                    <div className="space-y-4">
                        {/* Quick Actions */}
                        <div className="bg-gray-950/80 backdrop-blur-sm border border-cyan-500/20 rounded-lg overflow-hidden">
                            <div className="px-4 py-3 border-b border-cyan-500/20 bg-gray-900/50">
                                <h2 className="text-sm font-bold text-cyan-400 font-mono flex items-center gap-2">
                                    <Zap className="w-4 h-4" />
                                    QUICK_EXEC
                                </h2>
                            </div>
                            <div className="p-3 space-y-2">
                                <Link
                                    to="/developer/attendance"
                                    className="group flex items-center gap-3 p-3 rounded bg-black/30 border border-cyan-500/20 hover:border-cyan-400/50 hover:bg-cyan-500/5 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all"
                                >
                                    <div className="w-10 h-10 rounded bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <FileEdit className="w-5 h-5 text-cyan-400" />
                                    </div>
                                    <div className="font-mono">
                                        <p className="text-white text-sm group-hover:text-cyan-400 transition-colors">./attendance_editor</p>
                                        <p className="text-xs text-gray-600">CRUD operations</p>
                                    </div>
                                </Link>
                            </div>
                        </div>

                        {/* System Monitor */}
                        <div className="bg-gray-950/80 backdrop-blur-sm border border-purple-500/20 rounded-lg overflow-hidden">
                            <div className="px-4 py-3 border-b border-purple-500/20 bg-gray-900/50">
                                <h2 className="text-sm font-bold text-purple-400 font-mono flex items-center gap-2">
                                    <Cpu className="w-4 h-4" />
                                    SYS_MONITOR
                                </h2>
                            </div>
                            <div className="p-3 space-y-3 font-mono text-sm">
                                <div>
                                    <div className="flex justify-between text-gray-400 mb-1">
                                        <span>CPU</span>
                                        <span className="text-green-400">{systemStatus.cpu}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                                            style={{ width: `${systemStatus.cpu}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-gray-400 mb-1">
                                        <span>MEMORY</span>
                                        <span className="text-cyan-400">{systemStatus.memory}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-500"
                                            style={{ width: `${systemStatus.memory}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-gray-800">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="p-3 rounded bg-black/30 border border-green-500/20 text-center">
                                            <p className="text-2xl font-bold text-green-400">{stats?.todayRecords || 0}</p>
                                            <p className="text-xs text-gray-500">TODAY</p>
                                        </div>
                                        <div className="p-3 rounded bg-black/30 border border-orange-500/20 text-center">
                                            <p className="text-2xl font-bold text-orange-400">{stats?.incompleteRecords || 0}</p>
                                            <p className="text-xs text-gray-500">PENDING</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ASCII Art Footer */}
                        <div className="text-center p-3 bg-gray-950/50 rounded-lg border border-gray-800">
                            <pre className="text-green-500/50 text-[8px] leading-tight font-mono">
                                {`   _____  ______      __
  / __  \\/ ____/ _   / /
 / / / //  __/ | | / / 
/ /_/ / /  /_  | |/ /  
/_____/___/__|_|___/   
`}
                            </pre>
                            <p className="text-xs text-gray-600 font-mono mt-1">IDENTIX DEV CONSOLE v2.0</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add custom styles */}
            <style>{`
                @keyframes blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0; }
                }
                .animate-blink {
                    animation: blink 1s infinite;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0,0,0,0.3);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(34,197,94,0.3);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(34,197,94,0.5);
                }
            `}</style>
        </div>
    );
}

// Hacker Style Stat Card
interface HackerStatCardProps {
    value: number;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: 'green' | 'cyan' | 'purple' | 'blue' | 'orange';
    isWarning?: boolean;
}

function HackerStatCard({ value, label, icon: Icon, color, isWarning }: HackerStatCardProps) {
    const colorMap = {
        green: { border: 'border-green-500/30', text: 'text-green-400', glow: 'hover:shadow-green-500/20' },
        cyan: { border: 'border-cyan-500/30', text: 'text-cyan-400', glow: 'hover:shadow-cyan-500/20' },
        purple: { border: 'border-purple-500/30', text: 'text-purple-400', glow: 'hover:shadow-purple-500/20' },
        blue: { border: 'border-blue-500/30', text: 'text-blue-400', glow: 'hover:shadow-blue-500/20' },
        orange: { border: 'border-orange-500/30', text: 'text-orange-400', glow: 'hover:shadow-orange-500/20' },
    };

    const c = colorMap[color];

    return (
        <div className={`relative bg-gray-950/80 backdrop-blur-sm border ${c.border} rounded-lg p-4 transition-all duration-300 hover:shadow-lg ${c.glow} group overflow-hidden`}>
            {/* Scan line effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transform -translate-y-full group-hover:translate-y-full transition-all duration-700"></div>

            <div className="relative">
                <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-mono ${c.text} tracking-wider`}>{label}</span>
                    <Icon className={`w-4 h-4 ${c.text} ${isWarning && value > 0 ? 'animate-pulse' : ''}`} />
                </div>
                <p className={`text-2xl font-bold font-mono ${c.text}`}>
                    {String(value).padStart(2, '0')}
                </p>
                {/* Glitch effect on value */}
                <div className={`absolute bottom-4 left-4 text-2xl font-bold font-mono ${c.text} opacity-0 group-hover:opacity-30`} style={{ clipPath: 'inset(40% 0 0 0)' }}>
                    {String(value).padStart(2, '0')}
                </div>
            </div>
        </div>
    );
}
