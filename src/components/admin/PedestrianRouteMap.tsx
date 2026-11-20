import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import { renderToString } from 'react-dom/server';
import { TbStairs } from 'react-icons/tb';
import { COLOSSEUM_DEFAULT_COORDS } from './mapConstants';

export type RoutePoint = { latitude: number; longitude: number };

export type PortalMarker = {
  id: string;
  name: string;
  position: RoutePoint;
  toFloorLabel?: string;
  isAscending?: boolean;
};

export function PedestrianRouteMap({
  points,
  onChange,
  start,
  end,
  stops = [],
  connections = [],
  portals = [],
}: {
  points: RoutePoint[];
  onChange?: (points: RoutePoint[]) => void;
  start?: RoutePoint | null;
  end?: RoutePoint | null;
  stops?: { position: RoutePoint; label: string }[];
  connections?: { points: RoutePoint[]; published: boolean }[];
  portals?: PortalMarker[];
}) {
  const container = useRef<HTMLDivElement>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const initialPoints = useRef([
    ...stops.map(({ position }) => position),
    ...portals.map(({ position }) => position),
    ...(start ? [start] : []),
    ...points,
    ...(end ? [end] : []),
  ]);
  const latest = useRef({ points, onChange });
  useEffect(() => {
    latest.current = { points, onChange };
  }, [points, onChange]);

  useEffect(() => {
    if (!container.current) return;
    const map = L.map(container.current, {
      center: [COLOSSEUM_DEFAULT_COORDS.lat, COLOSSEUM_DEFAULT_COORDS.lng],
      zoom: 17,
    });
    const hybrid = L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      subdomains: ['0', '1', '2', '3'],
      attribution: 'Map data © Google',
      maxZoom: 21,
    });
    const streets = L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      subdomains: ['0', '1', '2', '3'],
      attribution: 'Map data © Google',
      maxZoom: 21,
    });
    hybrid.addTo(map);
    L.control
      .layers({ 'Satellite Aerial': hybrid, 'Roadmap Streets': streets }, undefined, {
        position: 'topright',
      })
      .addTo(map);
    layer.current = L.layerGroup().addTo(map);
    if (initialPoints.current.length > 0) {
      map.fitBounds(
        L.latLngBounds(
          initialPoints.current.map(({ latitude, longitude }) => L.latLng(latitude, longitude))
        ),
        { padding: [28, 28], maxZoom: 18 }
      );
    }
    map.on('click', ({ latlng }: L.LeafletMouseEvent) => {
      const point = latlng.wrap();
      latest.current.onChange?.([
        ...latest.current.points,
        {
          latitude: point.lat,
          longitude: point.lng,
        },
      ]);
    });
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container.current);
    return () => {
      observer.disconnect();
      layer.current = null;
      map.remove();
    };
  }, []);

  useEffect(() => {
    const group = layer.current;
    if (!group) return;
    group.clearLayers();
    for (const connection of connections) {
      const line = connection.points.map(({ latitude, longitude }) =>
        L.latLng(latitude, longitude)
      );
      const color = connection.published ? '#9c3426' : '#64748b';
      L.polyline(line, {
        color,
        weight: 3,
        dashArray: connection.published ? undefined : '6 5',
      }).addTo(group);
      const middle = Math.floor(line.length / 2);
      if (middle > 0) {
        const a = line[middle - 1];
        const b = line[middle];
        const angle = Math.atan2(
          a.lat - b.lat,
          (b.lng - a.lng) * Math.cos((a.lat * Math.PI) / 180)
        );
        L.marker([(a.lat + b.lat) / 2, (a.lng + b.lng) / 2], {
          interactive: false,
          icon: L.divIcon({
            className: '',
            iconSize: [16, 16],
            html: `<span style="display:block;color:${color};transform:rotate(${angle}rad)">➤</span>`,
          }),
        }).addTo(group);
      }
    }
    for (const { position, label } of stops) {
      const orderNum = label.split('·')[0]?.trim() || '';
      L.marker([position.latitude, position.longitude], {
        interactive: false,
        icon: L.divIcon({
          className: '',
          html: `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;background-color:#8b261e;color:#ffffff;border:1.5px solid #ffffff;border-radius:6px;box-shadow:0 2px 4px rgba(0,0,0,0.25);font-size:11px;font-weight:700;line-height:1;text-align:center;box-sizing:border-box;user-select:none;letter-spacing:-0.2px;">${orderNum}</div>`,
          iconSize: [36, 22],
          iconAnchor: [18, 11],
        }),
      }).addTo(group);
    }
    const stairsSvg = renderToString(<TbStairs size={18} strokeWidth={2.4} />);
    for (const portal of portals) {
      L.marker([portal.position.latitude, portal.position.longitude], {
        interactive: false,
        icon: L.divIcon({
          className: '',
          html: `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;background-color:#f59e0b;color:#ffffff;border:1.5px solid #ffffff;border-radius:6px;box-shadow:0 2px 4px rgba(0,0,0,0.25);box-sizing:border-box;user-select:none;">${stairsSvg}</div>`,
          iconSize: [28, 24],
          iconAnchor: [14, 12],
        }),
      }).addTo(group);
    }
    const path = [...(start ? [start] : []), ...points, ...(end ? [end] : [])];
    L.polyline(
      path.map(({ latitude, longitude }) => L.latLng(latitude, longitude)),
      {
        color: '#9c3426',
        weight: 4,
      }
    ).addTo(group);
    for (const [point, label] of [
      [start, 'From'],
      [end, 'To'],
    ] as const) {
      if (point)
        L.circleMarker([point.latitude, point.longitude], { radius: 7 })
          .bindTooltip(label)
          .addTo(group);
    }
    points.forEach(({ latitude, longitude }, index) => {
      const marker = L.marker([latitude, longitude], {
        draggable: Boolean(onChange),
        title: `Stop ${index + 1}`,
        icon: L.divIcon({
          className:
            'flex items-center justify-center rounded-full bg-primary text-primary-foreground text-center font-bold text-xs shadow-md border-2 border-white cursor-grab active:cursor-grabbing',
          html: `<span>${index + 1}</span>`,
          iconSize: [26, 26],
        }),
      }).addTo(group);

      if (onChange) {
        const popupDiv = document.createElement('div');
        popupDiv.className = 'text-xs p-1 space-y-1 font-sans min-w-[140px]';
        popupDiv.innerHTML = `<div class="font-bold text-sm text-foreground">Stop ${index + 1}</div><div class="text-muted-foreground font-mono text-[11px]">${latitude.toFixed(6)}, ${longitude.toFixed(6)}</div>`;
        const deleteBtn = document.createElement('button');
        deleteBtn.className =
          'mt-1.5 px-2 py-1 rounded bg-red-600 text-white text-[11px] font-semibold hover:bg-red-700 block w-full text-center cursor-pointer';
        deleteBtn.textContent = 'Delete Stop';
        deleteBtn.onclick = (e) => {
          e.stopPropagation();
          latest.current.onChange?.(latest.current.points.filter((_, i) => i !== index));
        };
        popupDiv.appendChild(deleteBtn);
        marker.bindPopup(popupDiv);
      }

      marker.on('dragend', () => {
        const point = marker.getLatLng().wrap();
        latest.current.onChange?.(
          latest.current.points.map((previous, i) =>
            i === index
              ? { latitude: Number(point.lat.toFixed(6)), longitude: Number(point.lng.toFixed(6)) }
              : previous
          )
        );
      });
    });
  }, [points, start, end, stops, connections, portals, onChange]);

  return (
    <div
      ref={container}
      className="isolate h-[460px] w-full rounded-xl border border-border shadow-sm overflow-hidden"
      aria-label="Walking route map"
    />
  );
}
