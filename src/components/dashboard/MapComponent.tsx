'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom icons
const createCustomIcon = (color: string, innerHtml: string) => {
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        border: 2px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      ">
        ${innerHtml}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
};

const userIcon = createCustomIcon('#3b82f6', '📍');
const shelterIcon = createCustomIcon('#22c55e', '🏥');
const dangerIcon = createCustomIcon('#ef4444', '🚨');

// Helper to recenter map
function RecenterAutomatically({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 14);
  }, [lat, lng, map]);
  return null;
}

export interface SafetyMapData {
  userLocation: { lat: number; lng: number };
  dangerZone: {
    center: { lat: number; lng: number };
    radiusMeters: number;
    polygon: [number, number][];
  };
  nearestShelter: {
    name: string;
    lat: number;
    lng: number;
    capacity: number;
  };
  safeRoute: [number, number][];
  riskLevel: string;
  riskScore: number;
}

interface MapComponentProps {
  safetyData?: SafetyMapData | null;
}

export default function MapComponent({ safetyData }: MapComponentProps) {
  const defaultCenter: [number, number] = safetyData
    ? [safetyData.userLocation.lat, safetyData.userLocation.lng]
    : [13.0827, 80.2707]; // Default Chennai

  const showDangerZone = safetyData && (safetyData.riskLevel === 'HIGH' || safetyData.riskLevel === 'CRITICAL');

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm z-0">
      <MapContainer
        center={defaultCenter}
        zoom={safetyData ? 14 : 5}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {safetyData && (
          <>
            <RecenterAutomatically lat={safetyData.userLocation.lat} lng={safetyData.userLocation.lng} />

            {/* User Location Marker */}
            <Marker position={[safetyData.userLocation.lat, safetyData.userLocation.lng]} icon={userIcon}>
              <Popup>
                <div className="p-1">
                  <h3 className="font-bold text-blue-600">📍 Your Location</h3>
                  <p className="text-xs text-gray-500">Lat: {safetyData.userLocation.lat.toFixed(4)}, Lng: {safetyData.userLocation.lng.toFixed(4)}</p>
                </div>
              </Popup>
            </Marker>

            {/* Danger Zone Circle */}
            {showDangerZone && (
              <Circle
                center={[safetyData.dangerZone.center.lat, safetyData.dangerZone.center.lng]}
                radius={safetyData.dangerZone.radiusMeters}
                pathOptions={{
                  color: safetyData.riskLevel === 'CRITICAL' ? '#dc2626' : '#f97316',
                  fillColor: safetyData.riskLevel === 'CRITICAL' ? '#dc2626' : '#f97316',
                  fillOpacity: 0.25,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="p-1">
                    <span className="font-bold text-red-600 block">⚠️ Danger Zone</span>
                    <span className="text-xs text-gray-500">Risk: {safetyData.riskLevel} ({safetyData.riskScore}/100)</span>
                  </div>
                </Popup>
              </Circle>
            )}

            {/* Danger Zone Polygon */}
            {showDangerZone && safetyData.dangerZone.polygon.length > 0 && (
              <Polygon
                positions={safetyData.dangerZone.polygon}
                pathOptions={{
                  color: safetyData.riskLevel === 'CRITICAL' ? 'red' : 'orange',
                  fillColor: safetyData.riskLevel === 'CRITICAL' ? 'red' : 'orange',
                  fillOpacity: 0.2,
                  weight: 2,
                  dashArray: '5, 10',
                }}
              >
                <Popup>
                  <span className="font-bold text-red-600">Flood Risk Boundary</span>
                </Popup>
              </Polygon>
            )}

            {/* Danger Center */}
            {showDangerZone && (
              <Marker
                position={[safetyData.dangerZone.center.lat, safetyData.dangerZone.center.lng]}
                icon={dangerIcon}
              >
                <Popup>
                  <div className="p-1">
                    <h3 className="font-bold text-red-600">🚨 Danger Center</h3>
                    <p className="text-xs text-gray-700">Risk Score: {safetyData.riskScore}/100</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Nearest Shelter Marker */}
            <Marker position={[safetyData.nearestShelter.lat, safetyData.nearestShelter.lng]} icon={shelterIcon}>
              <Popup>
                <div className="p-1">
                  <h3 className="font-bold text-green-600">🏥 {safetyData.nearestShelter.name}</h3>
                  <p className="text-xs text-gray-500">Capacity: {safetyData.nearestShelter.capacity} people</p>
                </div>
              </Popup>
            </Marker>

            {/* Safe Route Polyline */}
            <Polyline
              positions={safetyData.safeRoute}
              pathOptions={{
                color: '#22c55e',
                weight: 4,
                dashArray: '8, 12',
                opacity: 0.8,
              }}
            >
              <Popup>
                <span className="font-bold text-green-600">🛤️ Safe Evacuation Route (Demo)</span>
              </Popup>
            </Polyline>
          </>
        )}

        {/* Default state when no safety data */}
        {!safetyData && (
          <>
            <Marker position={[13.0827, 80.2707]} icon={userIcon}>
              <Popup>
                <div className="p-1">
                  <h3 className="font-bold text-gray-700">Chennai (Demo)</h3>
                  <p className="text-xs text-gray-500">Run "Am I Safe?" from dashboard to see your personalized map.</p>
                </div>
              </Popup>
            </Marker>
            <RecenterAutomatically lat={13.0827} lng={80.2707} />
          </>
        )}
      </MapContainer>
    </div>
  );
}
