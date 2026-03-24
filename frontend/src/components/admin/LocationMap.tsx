import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { X, MapPin, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default leaflet marker icon
// Custom marker icons
const createPinIcon = (color: string) => {
    return L.divIcon({
        className: 'custom-pin',
        html: `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="40" height="40" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
    });
};

const loginIcon = createPinIcon('#2563eb'); // Blue-600
const logoutIcon = createPinIcon('#f97316'); // Orange-500

interface Location {
    latitude: number;
    longitude: number;
}

interface LocationMapProps {
    loginLocation: Location | null;
    logoutLocation: Location | null;
    onClose: () => void;
}

function CopyButton({ text, className }: { text: string, className?: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            className={`h-5 w-5 ml-1.5 hover:bg-white/50 ${className}`}
            onClick={handleCopy}
            title="Copy coordinates"
        >
            {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
        </Button>
    );
}

export function LocationMap({ loginLocation, logoutLocation, onClose }: LocationMapProps) {
    // Center map on available location
    const center: [number, number] = loginLocation
        ? [loginLocation.latitude, loginLocation.longitude]
        : logoutLocation
            ? [logoutLocation.latitude, logoutLocation.longitude]
            : [0, 0];

    // Helper component to recenter map when props change
    function MapRecenter({ center }: { center: [number, number] }) {
        const map = useMap();
        useEffect(() => {
            map.setView(center, 15);
            map.invalidateSize();
        }, [center, map]);
        return null;
    }

    return createPortal(
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
            style={{ zIndex: 9999 }}
            onClick={onClose}
        >
            <div
                className="w-full max-w-4xl bg-white rounded-xl shadow-2xl ring-1 ring-gray-200 transform transition-all flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80 backdrop-blur-sm shrink-0 rounded-t-xl z-10">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <MapPin className="w-5 h-5" />
                        </div>
                        Attendance Location
                    </h3>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Map Container - Fixed Height for Stability */}
                <div className="relative w-full h-[500px] bg-gray-100">
                    <MapContainer center={center} zoom={15} className="h-full w-full outline-none" attributionControl={false}>
                        <MapRecenter center={center} />
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {loginLocation && (
                            <Marker position={[loginLocation.latitude, loginLocation.longitude]} icon={loginIcon}>
                                <Popup className="font-sans font-medium">
                                    <span className="text-green-600 font-bold">Login Location</span>
                                </Popup>
                            </Marker>
                        )}
                        {logoutLocation && (
                            <Marker position={[logoutLocation.latitude, logoutLocation.longitude]} icon={logoutIcon}>
                                <Popup className="font-sans font-medium">
                                    <span className="text-orange-600 font-bold">Logout Location</span>
                                </Popup>
                            </Marker>
                        )}
                    </MapContainer>
                </div>

                {/* Legend */}
                <div className="px-6 py-4 bg-white border-t border-gray-200 flex flex-wrap gap-4 text-sm shrink-0 rounded-b-xl z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    {loginLocation && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                            <div className="w-2 h-2 rounded-full bg-blue-600 shadow-sm ring-2 ring-white mr-1"></div>
                            <span className="font-semibold">Login:</span>
                            <span className="font-mono text-xs ml-1 opacity-80">
                                {loginLocation.latitude.toFixed(6)}, {loginLocation.longitude.toFixed(6)}
                            </span>
                            <CopyButton text={`${loginLocation.latitude},${loginLocation.longitude}`} className="text-blue-500 hover:text-blue-700" />
                        </div>
                    )}
                    {logoutLocation && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg border border-orange-100">
                            <div className="w-2 h-2 rounded-full bg-orange-500 shadow-sm ring-2 ring-white mr-1"></div>
                            <span className="font-semibold">Logout:</span>
                            <span className="font-mono text-xs ml-1 opacity-80">
                                {logoutLocation.latitude.toFixed(6)}, {logoutLocation.longitude.toFixed(6)}
                            </span>
                            <CopyButton text={`${logoutLocation.latitude},${logoutLocation.longitude}`} className="text-orange-500 hover:text-orange-700" />
                        </div>
                    )}
                    {!loginLocation && !logoutLocation && (
                        <span className="text-gray-400 italic flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> No location data available
                        </span>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
