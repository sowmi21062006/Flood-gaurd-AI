'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet/dist/leaflet.css';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, query, where, limit } from 'firebase/firestore';

// Define custom icons using Tailwind/HTML
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

const shelterIcon = createCustomIcon('#3b82f6', '🏠'); // Blue
const sensorIcon = createCustomIcon('#6366f1', '📡'); // Indigo
const locationIcon = createCustomIcon('#22c55e', '📍'); // Green

// Mock Polygons for Flood Zones around Bangalore
const severeFloodZone: [number, number][] = [
  [12.98, 77.58],
  [12.99, 77.60],
  [12.97, 77.61],
  [12.96, 77.59],
];

const warningFloodZone: [number, number][] = [
  [12.95, 77.57],
  [12.96, 77.62],
  [12.93, 77.61],
  [12.92, 77.58],
];

const safeRoute: [number, number][] = [
  [12.9716, 77.5946],
  [12.9600, 77.5800],
  [12.9254, 77.5971], // Routes to Jayanagar Shelter
];

// Helper component to recenter map
function RecenterAutomatically({ lat, lng }: { lat: number, lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

export default function MapComponent({ isSimulating, globalTick = 0 }: { isSimulating: boolean; globalTick?: number }) {
  const [shelters, setShelters] = useState<any[]>([]);
  const [sensors, setSensors] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Fetch real-time data using Firestore onSnapshot
  useEffect(() => {
    // 1. Listen to shelters
    const sheltersQuery = query(collection(db, 'shelters'));
    const unsubscribeShelters = onSnapshot(sheltersQuery, (snapshot) => {
      const updatedShelters = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setShelters(updatedShelters);
    }, (error) => {
      console.error('Error listening to shelters:', error);
    });

    // 2. Listen to sensors
    const sensorsQuery = query(
      collection(db, 'sensor_data'),
      where('sensorType', '==', 'river_level'),
      limit(50)
    );
    const unsubscribeSensors = onSnapshot(sensorsQuery, (snapshot) => {
      const updatedSensors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSensors(updatedSensors);
    }, (error) => {
      console.error('Error listening to sensors:', error);
    });

    // We can also listen to flooded_roads for dynamic polygons (simulated logic omitted for brevity)

    return () => {
      unsubscribeShelters();
      unsubscribeSensors();
    };
  }, []);

  // Geolocation
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.warn("Geolocation access denied or unavailable", error);
        }
      );
    }
  }, []);

  // Simulation Logic
  const [simulationStep, setSimulationStep] = useState(globalTick); // Synchronize internal step with globalTick
  useEffect(() => {
    setSimulationStep(globalTick);
  }, [globalTick]);

  // Dynamic zones based on simulation
  const centerLat = 12.975;
  const centerLng = 77.595;
  
  const warnRadius = isSimulating ? 0.01 + (simulationStep * 0.005) : 0.02;
  const sevRadius = isSimulating ? (simulationStep > 2 ? 0.005 + ((simulationStep - 2) * 0.004) : 0) : 0.01;

  const generateCirclePolygon = (lat: number, lng: number, radius: number): [number, number][] => {
    if (radius <= 0) return [];
    const points: [number, number][] = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30) * (Math.PI / 180);
      points.push([lat + Math.cos(angle) * radius, lng + Math.sin(angle) * radius * 1.1]);
    }
    return points;
  };

  const dynamicWarningZone = isSimulating && simulationStep > 0
    ? generateCirclePolygon(centerLat, centerLng, warnRadius) 
    : warningFloodZone;

  const dynamicSevereZone = isSimulating && simulationStep > 2
    ? generateCirclePolygon(centerLat, centerLng, sevRadius) 
    : (isSimulating ? [] : severeFloodZone);

  const dynamicSafeRoute = (isSimulating && simulationStep > 5) 
    ? [
        [12.9716, 77.5946],
        [12.9800, 77.5700], // Detour west to avoid spreading flood
        [12.9500, 77.5600],
        [12.9254, 77.5971], 
      ] as [number, number][]
    : safeRoute;

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm z-0">
      <MapContainer 
        center={[20.5937, 78.9629]} // Default India
        zoom={5} 
        scrollWheelZoom={true} 
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles"
        />

        {userLocation && (
          <>
            <Marker position={userLocation} icon={locationIcon}>
              <Popup>
                <div className="text-sm font-semibold text-gray-900">Your Location</div>
              </Popup>
            </Marker>
            {!isSimulating && <RecenterAutomatically lat={userLocation[0]} lng={userLocation[1]} />}
          </>
        )}

        {isSimulating && <RecenterAutomatically lat={12.975} lng={77.595} />}

        {/* Severe Flood Zone */}
        <Polygon pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.4 }} positions={dynamicSevereZone}>
          <Popup><span className="font-bold text-red-600">Severe Flood Zone (&gt;1m)</span></Popup>
        </Polygon>

        {/* Warning Zone */}
        <Polygon pathOptions={{ color: 'orange', fillColor: 'orange', fillOpacity: 0.3 }} positions={dynamicWarningZone}>
          <Popup><span className="font-bold text-orange-600">Warning Zone (0.5-1m)</span></Popup>
        </Polygon>

        {/* Safe Route */}
        <Polyline pathOptions={{ color: 'green', weight: 4, dashArray: '10, 10' }} positions={dynamicSafeRoute}>
          <Popup><span className="font-bold text-green-600">Safe Evacuation Route</span></Popup>
        </Polyline>

        {/* Shelters */}
        {shelters.map((shelter) => (
          <Marker key={shelter.id} position={[shelter.latitude, shelter.longitude]} icon={shelterIcon}>
            <Popup>
              <div className="p-1">
                <h3 className="font-bold text-gray-900">{shelter.name}</h3>
                <p className="text-sm text-gray-600 mb-1">Status: {shelter.available ? <span className="text-green-600">Available</span> : <span className="text-red-600">Full</span>}</p>
                <p className="text-xs text-gray-500">Occupancy: {shelter.currentOccupancy} / {shelter.capacity}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Sensors */}
        {sensors.map((sensor) => (
          <Marker key={sensor.id} position={[sensor.latitude, sensor.longitude]} icon={sensorIcon}>
            <Popup>
              <div className="p-1">
                <h3 className="font-bold text-gray-900">{sensor.location}</h3>
                <p className="text-sm text-gray-600 mb-1">Level: <span className="font-semibold">{sensor.value} {sensor.unit}</span></p>
                <p className="text-xs text-gray-500">Last updated: {new Date(sensor.timestamp).toLocaleString()}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
