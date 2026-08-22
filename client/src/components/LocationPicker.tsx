import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Edit3, CheckCircle2, AlertCircle, Compass, Search } from 'lucide-react';
import type { LocationState } from '../types';
import { reverseGeocode } from '../utils/exifHelper';

// Fix default leaflet marker icon issue in bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom amber civic pin icon
const customCivicIcon = new L.DivIcon({
  className: 'custom-civic-pin',
  html: `<div style="
    background: #f59e0b;
    width: 32px;
    height: 32px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #ffffff;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.6);
  ">
    <div style="
      width: 10px;
      height: 10px;
      background: #060810;
      border-radius: 50%;
    "></div>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

interface LocationPickerProps {
  location: LocationState;
  onChangeLocation: (location: LocationState) => void;
}

// Map event listener component to handle click and drag updates
const MapEventsHandler: React.FC<{
  onUpdateCoords: (lat: number, lng: number) => void;
}> = ({ onUpdateCoords }) => {
  useMapEvents({
    click(e) {
      onUpdateCoords(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Component to dynamically re-center map when coordinates change
const MapRecenter: React.FC<{ coords: [number, number] }> = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (
      coords &&
      Array.isArray(coords) &&
      !isNaN(Number(coords[0])) &&
      !isNaN(Number(coords[1])) &&
      (Number(coords[0]) !== 0 || Number(coords[1]) !== 0)
    ) {
      try {
        map.flyTo(coords, map.getZoom(), { animate: true, duration: 0.8 });
      } catch (e) {
        console.warn('MapRecenter flyTo failed:', e);
      }
    }
  }, [coords, map]);
  return null;
};

export const LocationPicker: React.FC<LocationPickerProps> = ({
  location,
  onChangeLocation,
}) => {
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocatingDevice, setIsLocatingDevice] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Synchronize address reverse geocoding on coordinate change if address is missing
  useEffect(() => {
    let isMounted = true;
    if (!location.address || location.address.startsWith('Coordinate Pin')) {
      reverseGeocode(location.latitude, location.longitude).then((res) => {
        if (isMounted && res.address) {
          onChangeLocation({
            ...location,
            address: res.address,
            city: res.city,
            state: res.state,
            postalCode: res.postalCode,
          });
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [location.latitude, location.longitude]);

  // Request Device Geolocation
  const requestDeviceLocation = () => {
    setErrorNotice(null);
    if (!navigator.geolocation) {
      setErrorNotice('Device geolocation is not supported by your browser.');
      return;
    }

    setIsLocatingDevice(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const geoInfo = await reverseGeocode(latitude, longitude);

        onChangeLocation({
          latitude,
          longitude,
          source: 'device',
          accuracy: accuracy || 15,
          address: geoInfo.address,
          city: geoInfo.city,
          state: geoInfo.state,
          postalCode: geoInfo.postalCode,
        });

        setIsLocatingDevice(false);
      },
      (err) => {
        console.warn('Device location error:', err);
        setErrorNotice('Device location permission was denied. You can manually adjust the pin on the map.');
        setIsLocatingDevice(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Handle marker drag or map click
  const handleUpdateCoordinates = async (lat: number, lng: number) => {
    const geoInfo = await reverseGeocode(lat, lng);
    onChangeLocation({
      latitude: lat,
      longitude: lng,
      source: 'manual',
      accuracy: null,
      address: geoInfo.address,
      city: geoInfo.city,
      state: geoInfo.state,
      postalCode: geoInfo.postalCode,
    });
  };

  // Handle address search lookup
  const handleAddressSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`, {
        headers: { 'Accept-Language': 'en' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const item = data[0];
          const lat = parseFloat(item.lat);
          const lon = parseFloat(item.lon);
          await handleUpdateCoordinates(lat, lon);
        } else {
          setErrorNotice('No matching locations found for that search query.');
        }
      }
    } catch (err) {
      console.warn('Search query error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Badge metadata based on source
  const getSourceBadge = () => {
    switch (location.source) {
      case 'exif':
        return {
          label: 'Location detected from photo',
          className: 'badge-emerald',
          icon: <CheckCircle2 size={12} />,
        };
      case 'device':
        return {
          label: 'Location detected from device',
          className: 'badge-indigo',
          icon: <Navigation size={12} />,
        };
      default:
        return {
          label: 'Location selected manually',
          className: 'badge-amber',
          icon: <MapPin size={12} />,
        };
    }
  };

  const badge = getSourceBadge();

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
      }}
    >
      {/* Header Info */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Compass size={18} color="var(--accent-amber)" />
          <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Incident Location</span>
        </div>

        <div className={`badge ${badge.className}`}>
          {badge.icon}
          <span>{badge.label}</span>
        </div>
      </div>

      {/* Address & Coordinate Display */}
      <div
        style={{
          backgroundColor: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ flex: 1, minWidth: '220px' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {location.address || 'Detecting address...'}
          </div>
          <div
            className="mono"
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              marginTop: '0.2rem',
            }}
          >
            {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
            {location.accuracy && ` (±${Math.round(location.accuracy)}m)`}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            type="button"
            onClick={requestDeviceLocation}
            className="btn btn-secondary btn-sm"
            disabled={isLocatingDevice}
            title="Use current GPS"
          >
            <Navigation size={13} />
            <span>{isLocatingDevice ? 'Locating...' : 'My GPS'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAdjusting(!isAdjusting)}
            className="btn btn-secondary btn-sm"
            style={{
              backgroundColor: isAdjusting ? 'var(--accent-amber-glow)' : undefined,
              borderColor: isAdjusting ? 'var(--accent-amber)' : undefined,
            }}
          >
            <Edit3 size={13} />
            <span>{isAdjusting ? 'Done Adjusting' : 'Adjust Location'}</span>
          </button>
        </div>
      </div>

      {errorNotice && (
        <div
          style={{
            fontSize: '0.8125rem',
            color: 'var(--accent-rose)',
            backgroundColor: 'var(--accent-rose-glow)',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '0.85rem',
            border: '1px solid rgba(244, 63, 94, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <AlertCircle size={14} />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Interactive Map View */}
      <div className="location-picker-map" style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        {isAdjusting && (
          <form
            onSubmit={handleAddressSearch}
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              right: '10px',
              zIndex: 1000,
              display: 'flex',
              gap: '0.4rem',
              backgroundColor: 'var(--bg-card)',
              padding: '0.35rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-medium)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <input
              type="text"
              className="input"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8125rem', height: '34px' }}
              placeholder="Search street, landmark or area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={isSearching}
              style={{ height: '34px', padding: '0 0.85rem' }}
            >
              <Search size={14} />
              <span>Search</span>
            </button>
          </form>
        )}

        {(() => {
          const safeLat = !isNaN(Number(location.latitude)) && Number(location.latitude) !== 0 ? Number(location.latitude) : 19.0760;
          const safeLng = !isNaN(Number(location.longitude)) && Number(location.longitude) !== 0 ? Number(location.longitude) : 72.8777;
          const safeCoords: [number, number] = [safeLat, safeLng];

          return (
            <MapContainer
              center={safeCoords}
              zoom={15}
              scrollWheelZoom={false}
              style={{ height: '230px', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapRecenter coords={safeCoords} />
              <MapEventsHandler onUpdateCoords={handleUpdateCoordinates} />

              <Marker
                position={safeCoords}
                icon={customCivicIcon}
                draggable={isAdjusting}
                eventHandlers={{
                  dragend: (e) => {
                    const marker = e.target;
                    const position = marker.getLatLng();
                    handleUpdateCoordinates(position.lat, position.lng);
                  },
                }}
              />

              {location.accuracy && !isNaN(Number(location.accuracy)) && (
                <Circle
                  center={safeCoords}
                  radius={Number(location.accuracy)}
                  pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.15 }}
                />
              )}
            </MapContainer>
          );
        })()}

        {isAdjusting && (
          <div
            style={{
              position: 'absolute',
              bottom: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              backgroundColor: 'rgba(6, 8, 16, 0.88)',
              color: '#ffffff',
              fontSize: '0.75rem',
              padding: '0.35rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              backdropFilter: 'blur(6px)',
              border: '1px solid var(--border-medium)',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            📍 Drag marker or click anywhere on the map to set location
          </div>
        )}
      </div>
    </div>
  );
};
