import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { COLOSSEUM_DEFAULT_COORDS } from './mapConstants';

interface LocationPickerMapProps {
  latitude: number | string;
  longitude: number | string;
  onChange: (lat: number, lng: number) => void;
  className?: string;
}

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  latitude,
  longitude,
  onChange,
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const labelsLayerRef = useRef<L.TileLayer | null>(null);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const isUserInteractingRef = useRef<boolean>(false);
  const isProgrammaticMoveRef = useRef<boolean>(false);

  const [mapType, setMapType] = useState<'streets' | 'satellite'>('streets');

  const currentLat = typeof latitude === 'number' ? latitude : parseFloat(latitude);
  const currentLng = typeof longitude === 'number' ? longitude : parseFloat(longitude);

  const validLat =
    !isNaN(currentLat) && currentLat >= -90 && currentLat <= 90
      ? currentLat
      : COLOSSEUM_DEFAULT_COORDS.lat;
  const validLng =
    !isNaN(currentLng) && currentLng >= -180 && currentLng <= 180
      ? currentLng
      : COLOSSEUM_DEFAULT_COORDS.lng;

  const initialCenterRef = useRef<[number, number]>([validLat, validLng]);

  // Initialize Map on mount
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: initialCenterRef.current,
      zoom: 17,
      zoomControl: false,
      attributionControl: false,
    });

    mapRef.current = map;

    // Default tile layer: CartoDB Voyager
    tileLayerRef.current = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        subdomains: 'abcd',
        maxZoom: 20,
      }
    ).addTo(map);

    // Map drag/move event listeners
    const handleMoveStart = () => {
      if (!isProgrammaticMoveRef.current) {
        isUserInteractingRef.current = true;
      }
    };

    const handleMove = () => {
      if (isUserInteractingRef.current && !isProgrammaticMoveRef.current) {
        const center = map.getCenter();
        onChangeRef.current(Number(center.lat.toFixed(6)), Number(center.lng.toFixed(6)));
      }
    };

    const handleMoveEnd = () => {
      if (isUserInteractingRef.current && !isProgrammaticMoveRef.current) {
        const center = map.getCenter();
        onChangeRef.current(Number(center.lat.toFixed(6)), Number(center.lng.toFixed(6)));
        isUserInteractingRef.current = false;
      }
    };

    map.on('movestart', handleMoveStart);
    map.on('move', handleMove);
    map.on('moveend', handleMoveEnd);

    // Invalidate map size after mount/animation
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    // ResizeObserver to handle modal resize
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      map.off('movestart', handleMoveStart);
      map.off('move', handleMove);
      map.off('moveend', handleMoveEnd);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update map center when latitude/longitude props change from outside (user typing)
  useEffect(() => {
    if (!mapRef.current) return;
    if (isUserInteractingRef.current) return;

    const parsedLat = typeof latitude === 'number' ? latitude : parseFloat(latitude);
    const parsedLng = typeof longitude === 'number' ? longitude : parseFloat(longitude);

    if (isNaN(parsedLat) || isNaN(parsedLng)) return;
    if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) return;

    const center = mapRef.current.getCenter();
    const diffLat = Math.abs(center.lat - parsedLat);
    const diffLng = Math.abs(center.lng - parsedLng);

    // Only set view if coordinates moved noticeably (avoid jitter loop)
    if (diffLat > 0.000005 || diffLng > 0.000005) {
      isProgrammaticMoveRef.current = true;
      mapRef.current.setView([parsedLat, parsedLng], mapRef.current.getZoom(), {
        animate: true,
      });

      const timer = setTimeout(() => {
        isProgrammaticMoveRef.current = false;
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [latitude, longitude]);

  // Switch between Streets and Satellite layers
  const toggleMapType = useCallback(() => {
    if (!mapRef.current) return;
    const nextType = mapType === 'streets' ? 'satellite' : 'streets';
    setMapType(nextType);

    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }
    if (labelsLayerRef.current) {
      mapRef.current.removeLayer(labelsLayerRef.current);
      labelsLayerRef.current = null;
    }

    if (nextType === 'satellite') {
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19 }
      ).addTo(mapRef.current);

      labelsLayerRef.current = L.tileLayer(
        'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19 }
      ).addTo(mapRef.current);
    } else {
      tileLayerRef.current = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          subdomains: 'abcd',
          maxZoom: 20,
        }
      ).addTo(mapRef.current);
    }
  }, [mapType]);

  const handleRecenterColosseum = useCallback(() => {
    if (!mapRef.current) return;
    isProgrammaticMoveRef.current = true;
    mapRef.current.flyTo([COLOSSEUM_DEFAULT_COORDS.lat, COLOSSEUM_DEFAULT_COORDS.lng], 17, {
      duration: 0.8,
    });
    onChangeRef.current(COLOSSEUM_DEFAULT_COORDS.lat, COLOSSEUM_DEFAULT_COORDS.lng);
    setTimeout(() => {
      isProgrammaticMoveRef.current = false;
    }, 900);
  }, []);

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();

  return (
    <div
      className={`relative w-full h-56 sm:h-64 rounded-xl overflow-hidden border border-border select-none shadow-inner bg-muted/40 ${className}`}
    >
      {/* Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0 cursor-grab active:cursor-grabbing" />

      {/* Fixed Center Pointer (Red Pin pointing to exact center) */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-[1000] flex flex-col items-center"
        aria-hidden="true"
      >
        <div className="relative transform transition-transform duration-150">
          <svg
            viewBox="0 0 24 36"
            className="w-9 h-11 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.45)]"
          >
            {/* Red Pin Teardrop Body */}
            <path
              d="M12 0C5.373 0 0 5.373 0 12c0 8.5 10.2 22.3 11.3 23.8.38.52 1.02.52 1.4 0C13.8 34.3 24 20.5 24 12c0-6.627-5.373-12-12-12z"
              fill="#EF4444"
              stroke="#B91C1C"
              strokeWidth="1"
            />
            {/* White Circular Lens */}
            <circle cx="12" cy="12" r="4.5" fill="#FFFFFF" />
            {/* Red Center Focal Dot */}
            <circle cx="12" cy="12" r="2.2" fill="#DC2626" />
          </svg>
        </div>
        {/* Soft Ground Contact Shadow right under the needle tip */}
        <div className="w-3 h-1 bg-black/40 rounded-full blur-[1px] -mt-0.5" />
      </div>

      {/* Top Floating Controls */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-[500]">
        {/* Map Style Toggle */}
        <button
          type="button"
          onClick={toggleMapType}
          className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium bg-background/90 hover:bg-background text-foreground backdrop-blur-md border border-border rounded-lg shadow-sm transition-all"
          title="Toggle Satellite / Street Map"
        >
          <Layers className="size-3 text-primary" />
          <span className="capitalize">{mapType === 'streets' ? 'Satellite' : 'Street'}</span>
        </button>

        {/* Recenter Colosseum Button */}
        <button
          type="button"
          onClick={handleRecenterColosseum}
          className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium bg-background/90 hover:bg-background text-foreground backdrop-blur-md border border-border rounded-lg shadow-sm transition-all"
          title="Reset map view to Colosseum"
        >
          <RotateCcw className="size-3 text-red-500" />
          <span>Colosseum</span>
        </button>
      </div>

      {/* Bottom Right Zoom Controls */}
      <div className="absolute bottom-2.5 right-2.5 flex flex-col gap-1 z-[500]">
        <button
          type="button"
          onClick={handleZoomIn}
          className="size-7 flex items-center justify-center bg-background/90 hover:bg-background text-foreground backdrop-blur-md border border-border rounded-md shadow-sm transition-all"
          title="Zoom In"
        >
          <ZoomIn className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="size-7 flex items-center justify-center bg-background/90 hover:bg-background text-foreground backdrop-blur-md border border-border rounded-md shadow-sm transition-all"
          title="Zoom Out"
        >
          <ZoomOut className="size-3.5" />
        </button>
      </div>

      {/* Live Crosshair Center Coordinates Badge */}
      <div className="absolute bottom-2 left-2 z-[500] pointer-events-none">
        <span className="px-2 py-0.5 rounded bg-background/85 text-[10px] font-mono text-muted-foreground backdrop-blur-sm border border-border/60 shadow-xs">
          Center: {validLat.toFixed(5)}, {validLng.toFixed(5)}
        </span>
      </div>
    </div>
  );
};
