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

// Custom icon for user
const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Custom icon for geofence center
const geofenceIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
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
    };
    geofences: Geofence[];
    height?: string;
}

function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, 16);
    }, [center, map]);
    return null;
}

export default function GeofenceMap({ userLocation, geofences, height = '300px' }: GeofenceMapProps) {
    const mapRef = useRef<L.Map>(null);

    // Default center (Sao Paulo) if no location
    const defaultCenter: [number, number] = [-23.5505, -46.6333];

    const center: [number, number] = userLocation.latitude && userLocation.longitude
        ? [userLocation.latitude, userLocation.longitude]
        : (geofences.length > 0 ? [geofences[0].latitude, geofences[0].longitude] : defaultCenter);

    // Function to calculate distance between two points (Haversine formula)
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3; // metres
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
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

    return (
        <div style={{ height, width: '100%', borderRadius: '0.5rem', overflow: 'hidden' }}>
            <MapContainer
                center={center}
                zoom={16}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
                ref={mapRef}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {userLocation.latitude && userLocation.longitude && (
                    <>
                        <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userIcon}>
                            <Popup>Você está aqui</Popup>
                        </Marker>
                        <MapUpdater center={[userLocation.latitude, userLocation.longitude]} />
                    </>
                )}

                {geofences.map((fence) => {
                    const inside = isInside(fence);
                    return (
                        <div key={fence.id}>
                            <Circle
                                center={[fence.latitude, fence.longitude]}
                                radius={fence.radiusMeters}
                                pathOptions={{
                                    color: inside ? 'green' : 'red',
                                    fillColor: inside ? 'green' : 'red',
                                    fillOpacity: 0.2
                                }}
                            >
                                <Popup>
                                    <strong>{fence.name}</strong><br />
                                    {fence.description}
                                    <div className={`text-xs font-bold mt-1 ${inside ? 'text-green-600' : 'text-red-600'}`}>
                                        {inside ? 'Você está dentro da área' : 'Você está fora da área'}
                                    </div>
                                </Popup>
                            </Circle>
                            {/* Optional: Add marker for center of geofence */}
                            {/* <Marker position={[fence.latitude, fence.longitude]} icon={geofenceIcon}>
                 <Popup>{fence.name}</Popup>
              </Marker> */}
                        </div>
                    );
                })}
            </MapContainer>
        </div>
    );
}
