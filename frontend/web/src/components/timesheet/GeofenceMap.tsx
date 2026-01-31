'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in Leaflet with Next.js/Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icon for user position
const userIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Custom icon for geofence center (Red)
const geofenceIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface Geofence {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    radiusMeters: number;
    description?: string;
    active: boolean;
}

interface GeofenceMapProps {
    userLocation: {
        latitude: number | null;
        longitude: number | null;
        accuracy: number | null;
    };
    geofences: Geofence[];
    height?: string;
}

// Map center handler
function ChangeView({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center);
    }, [center, map]);
    return null;
}

export default function GeofenceMap({ userLocation, geofences, height = '300px' }: GeofenceMapProps) {
    const defaultCenter: [number, number] = [-23.5505, -46.6333]; // São Paulo

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371000; // Earth radius in meters
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const isInside = (fence: Geofence) => {
        if (!userLocation.latitude || !userLocation.longitude) return false;
        const dist = calculateDistance(
            userLocation.latitude, userLocation.longitude,
            fence.latitude, fence.longitude
        );
        return dist <= fence.radiusMeters;
    };

    const center: [number, number] = userLocation.latitude && userLocation.longitude
        ? [userLocation.latitude, userLocation.longitude]
        : (geofences.length > 0 ? [geofences[0].latitude, geofences[0].longitude] : defaultCenter);

    return (
        <div style={{ height, width: '100%', borderRadius: '0.5rem', overflow: 'hidden', position: 'relative', zIndex: 0 }}>
            <MapContainer
                center={center}
                zoom={16}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
            >
                <ChangeView center={center} />
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {geofences.map((fence) => {
                    const inside = isInside(fence);
                    return (
                        <div key={fence.id}>
                            <Circle
                                center={[fence.latitude, fence.longitude]}
                                radius={fence.radiusMeters}
                                pathOptions={{
                                    color: inside ? '#22c55e' : '#ef4444',
                                    fillColor: inside ? '#22c55e' : '#ef4444',
                                    fillOpacity: 0.2
                                }}
                            />
                            <Marker position={[fence.latitude, fence.longitude]} icon={geofenceIcon}>
                                <Popup>
                                    <div className="text-sm">
                                        <p className="font-bold">{fence.name}</p>
                                        <p className="text-xs text-gray-500">{fence.description}</p>
                                        <p className="text-xs mt-1">Raio: {fence.radiusMeters}m</p>
                                    </div>
                                </Popup>
                            </Marker>
                        </div>
                    );
                })}

                {userLocation.latitude && userLocation.longitude && (
                    <>
                        <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userIcon}>
                            <Popup>
                                <div className="text-sm">
                                    <p className="font-bold">Sua Localização</p>
                                    <p className="text-xs text-gray-500">
                                        Precisão: {userLocation.accuracy ? `${Math.round(userLocation.accuracy)}m` : 'N/A'}
                                    </p>
                                </div>
                            </Popup>
                        </Marker>
                        <Circle
                            center={[userLocation.latitude, userLocation.longitude]}
                            radius={userLocation.accuracy || 0}
                            pathOptions={{
                                color: '#3b82f6',
                                fillColor: '#3b82f6',
                                fillOpacity: 0.1,
                                weight: 1,
                                dashArray: '5, 5'
                            }}
                        />
                    </>
                )}
            </MapContainer>
        </div>
    );
}
