import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { QrCode, RefreshCw, Download, Copy, CheckCircle, Shield, Clock, MapPin } from 'lucide-react';
import api from '../../services/api';

interface QRData {
    qrPayload: string;
    createdAt: string;
    expiresAt: string;
    secret: string;
}

export const QRAttendance = () => {
    const [qrData, setQrData] = useState<QRData | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateQR = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await api.post('/attendance/generate-qr');
            const data = res.data;
            if (data.success) {
                setQrData(data.data);
            } else {
                setError(data.message || 'Failed to generate QR code');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Network error generating QR code');
        } finally {
            setLoading(false);
        }
    };

    const fetchQRInfo = async () => {
        try {
            const res = await api.get('/attendance/qr-info');
            const data = res.data;
            if (data.success) {
                setQrData(prev => prev ? prev : {
                    qrPayload: data.data.secret,
                    createdAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    secret: data.data.secret,
                });
            }
        } catch (err) {
            console.error('Error fetching QR info:', err);
        }
    };

    useEffect(() => {
        fetchQRInfo();
    }, []);

    const copySecret = async () => {
        if (!qrData) return;
        try {
            await navigator.clipboard.writeText(qrData.secret);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback
            const textArea = document.createElement('textarea');
            textArea.value = qrData.secret;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const downloadQR = () => {
        const svg = document.getElementById('qr-code-svg');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.onload = () => {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, 512, 512);
            ctx.drawImage(img, 56, 56, 400, 400);
            // Add label
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('IDentix HRMS — Scan to Mark Attendance', 256, 490);

            const link = document.createElement('a');
            link.download = 'identix-qr-attendance.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
        });
    };

    const isExpired = qrData ? new Date(qrData.expiresAt) < new Date() : false;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <QrCode className="w-7 h-7 text-blue-600" />
                            QR Code Attendance
                        </h1>
                        <p className="text-gray-500 mt-1">Generate and manage QR codes for employee attendance</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* QR Code Display */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <div className="text-center">
                            <h2 className="text-lg font-semibold text-gray-800 mb-6">Office Attendance QR Code</h2>

                            {qrData ? (
                                <div className="flex flex-col items-center">
                                    <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-gray-200 inline-block mb-6">
                                        <QRCode
                                            id="qr-code-svg"
                                            value={qrData.secret}
                                            size={220}
                                            level="H"
                                            fgColor={isExpired ? '#EF4444' : '#1F2937'}
                                        />
                                    </div>

                                    {isExpired && (
                                        <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm font-medium mb-4">
                                            ⚠️ This QR code has expired. Generate a new one.
                                        </div>
                                    )}

                                    <div className="flex gap-3 mb-6">
                                        <button
                                            onClick={downloadQR}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download PNG
                                        </button>
                                        <button
                                            onClick={copySecret}
                                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                                        >
                                            {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                            {copied ? 'Copied!' : 'Copy Secret'}
                                        </button>
                                    </div>

                                    <p className="text-xs text-gray-400">
                                        Print this QR code and place it at the office entrance.
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center py-10">
                                    <QrCode className="w-16 h-16 text-gray-300 mb-4" />
                                    <p className="text-gray-500 mb-6">No QR code generated yet</p>
                                    <button
                                        onClick={generateQR}
                                        disabled={loading}
                                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <QrCode className="w-4 h-4" />
                                        )}
                                        {loading ? 'Generating...' : 'Generate QR Code'}
                                    </button>
                                </div>
                            )}

                            {error && (
                                <div className="mt-4 bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* QR Info Panel */}
                    <div className="space-y-6">
                        {/* Generate / Regenerate */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <RefreshCw className="w-4 h-4 text-blue-600" />
                                QR Code Management
                            </h3>
                            <button
                                onClick={generateQR}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                            >
                                {loading ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <QrCode className="w-4 h-4" />
                                )}
                                {qrData ? 'Regenerate QR Code' : 'Generate QR Code'}
                            </button>
                            {qrData && (
                                <div className="mt-4 space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500 flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" /> Created
                                        </span>
                                        <span className="text-gray-800 font-medium">{formatDate(qrData.createdAt)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500 flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" /> Expires
                                        </span>
                                        <span className={`font-medium ${isExpired ? 'text-red-600' : 'text-green-600'}`}>
                                            {formatDate(qrData.expiresAt)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Security Info */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-green-600" />
                                Security Features
                            </h3>
                            <ul className="space-y-3 text-sm text-gray-600">
                                <li className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                    <span><strong>GPS Geo-Fencing:</strong> Employees must be within {import.meta.env.VITE_OFFICE_RADIUS || '100'}m of the office to punch in via QR.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Clock className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                    <span><strong>1-Month Validity:</strong> QR codes have a 30-day expiry to ensure periodic rotation.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Shield className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span><strong>Anti-Buddy Punching:</strong> Even if the QR image is shared, the GPS check rejects remote scans.</span>
                                </li>
                            </ul>
                        </div>

                        {/* Instructions */}
                        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                            <h3 className="text-sm font-semibold text-blue-900 mb-3">📋 How to Use</h3>
                            <ol className="space-y-2 text-sm text-blue-800 list-decimal list-inside">
                                <li>Click <strong>"Generate QR Code"</strong> above.</li>
                                <li>Download and <strong>print</strong> the QR code.</li>
                                <li>Place it at the <strong>office entrance</strong>.</li>
                                <li>Employees scan it from the <strong>IDentix App</strong> → Attendance → QR icon.</li>
                                <li>Regenerate the QR code every <strong>30 days</strong>.</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
