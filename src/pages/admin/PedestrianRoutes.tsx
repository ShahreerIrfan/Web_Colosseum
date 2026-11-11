import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { latLng } from 'leaflet';
import api from '@/apis/axios';
import ModuleLoading from '@/components/admin/ModuleLoading';
import { PedestrianRouteMap, type RoutePoint } from '@/components/admin/PedestrianRouteMap';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Landmark } from '@/types/api/landmarkTypes';
import type { BaseSuccessResponse } from '@/types/api/CommonTypes';

interface WalkingRoute {
  routeId: string;
  name: string;
  fromLandmarkCode: string;
  toLandmarkCode: string;
  waypoints: RoutePoint[];
  estimatedWalkMinutes: number;
  distanceMeters: number;
  isAccessibleWheelchair: boolean;
  isPublished: boolean;
  isOneWay?: boolean;
  instruction?: string;
  instructionTranslations?: Record<string, string>;
}

const endpoint = '/pedestrian-routes';
type LandmarkOption = Pick<Landmark, 'code' | 'name'>;
const inputClass = 'block w-full rounded border bg-background p-2';
const emptyRoute: WalkingRoute = {
  routeId: '',
  name: '',
  fromLandmarkCode: '',
  toLandmarkCode: '',
  waypoints: [],
  estimatedWalkMinutes: 5,
  distanceMeters: 0,
  isAccessibleWheelchair: false,
  isPublished: false,
};

function messageFor(error: unknown) {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? error.message;
  }
  return error instanceof Error ? error.message : 'The request failed.';
}

async function loadPages<T>(url: string, key: (item: T) => string) {
  const items = new Map<string, T>();
  const limit = 100;
  for (let page = 1; ; page++) {
    const { data } = await api.get<BaseSuccessResponse<T[]>>(url, {
      params: { page, limit },
    });
    const previousSize = items.size;
    for (const item of data.data) items.set(key(item), item);
    if (data.data.length < limit) return [...items.values()];
    if (previousSize === items.size) throw new Error('The catalog did not return the next page.');
  }
}

export default function PedestrianRoutes() {
  const [routes, setRoutes] = useState<WalkingRoute[]>([]);
  const [landmarks, setLandmarks] = useState<LandmarkOption[]>([]);
  const [draft, setDraft] = useState<WalkingRoute | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [instructionLanguage, setInstructionLanguage] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      loadPages<WalkingRoute>(`${endpoint}/admin/list`, (route) => route.routeId),
      loadPages<LandmarkOption>('/landmarks', (place) => place.code),
    ])
      .then(([loaded, places]) => {
        if (active) {
          setRoutes(loaded);
          setLandmarks(places);
        }
      })
      .catch((error: unknown) => {
        if (active) setError(messageFor(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const distance =
    draft?.waypoints.reduce((total, point, index, points) => {
      if (index === 0) return total;
      const previous = points[index - 1];
      return (
        total +
        latLng(previous.latitude, previous.longitude).distanceTo(
          latLng(point.latitude, point.longitude)
        )
      );
    }, 0) ?? 0;

  async function save() {
    if (!draft) return;
    if (
      !draft.fromLandmarkCode ||
      !draft.toLandmarkCode ||
      draft.waypoints.length < 2 ||
      distance <= 0 ||
      draft.fromLandmarkCode === draft.toLandmarkCode
    ) {
      setError('Choose different Landmarks and draw at least two distinct points.');
      return;
    }
    setBusy(true);
    setError('');
    const body = { ...draft, distanceMeters: Math.max(1, Math.round(distance)) };
    try {
      const result = editingId
        ? await api.patch<BaseSuccessResponse<WalkingRoute>>(
            `${endpoint}/${encodeURIComponent(editingId)}`,
            body
          )
        : await api.post<BaseSuccessResponse<WalkingRoute>>(endpoint, body);
      const saved = result.data.data;
      setRoutes((current) => [
        ...current.filter((route) => route.routeId !== saved.routeId),
        saved,
      ]);
      setDraft(null);
      setEditingId(null);
    } catch (error) {
      setError(messageFor(error));
    } finally {
      setBusy(false);
    }
  }

  async function remove(route: WalkingRoute) {
    if (!window.confirm(`Delete “${route.name}” permanently?`)) return;
    setBusy(true);
    setError('');
    try {
      await api.delete(`${endpoint}/${encodeURIComponent(route.routeId)}`);
      setRoutes((current) => current.filter((item) => item.routeId !== route.routeId));
    } catch (error) {
      setError(messageFor(error));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <ModuleLoading />;

  return (
    <section className="max-w-4xl space-y-5 p-6">
      <h1 className="text-2xl font-bold">Pedestrian Routes</h1>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      {!draft && (
        <>
          <Button
            disabled={busy || landmarks.length < 2}
            onClick={() => {
              setError('');
              setDraft({ ...emptyRoute });
            }}
          >
            New route
          </Button>
          {!error && landmarks.length < 2 && (
            <p>Add at least two Landmarks to create a walking route.</p>
          )}
          {routes.length === 0 && !error && <p>No routes yet.</p>}
          <ul className="divide-y">
            {routes.map((route) => (
              <li
                key={route.routeId}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="font-semibold">
                    {route.name} · {route.isPublished ? 'Published' : 'Draft'}
                  </p>
                  <p className="text-sm">
                    {route.fromLandmarkCode} {route.isOneWay ? '→' : '↔'} {route.toLandmarkCode} ·{' '}
                    {route.distanceMeters} m
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => {
                      setEditingId(route.routeId);
                      setDraft(route);
                      setError('');
                    }}
                  >
                    Edit
                  </Button>
                  <Button variant="destructive" disabled={busy} onClick={() => void remove(route)}>
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      {draft && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <fieldset disabled={busy} className="space-y-4">
            <label className="block">
              Route name
              <input
                className={inputClass}
                required
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              />
            </label>
            <label className="block">
              Route ID
              <input
                className={inputClass}
                required
                pattern="[a-zA-Z0-9_\-]+"
                readOnly={editingId != null}
                value={draft.routeId}
                onChange={(event) => setDraft({ ...draft, routeId: event.target.value })}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              {(['fromLandmarkCode', 'toLandmarkCode'] as const).map((field) => (
                <label htmlFor={field} className="block" key={field}>
                  {field === 'fromLandmarkCode' ? 'From Landmark' : 'To Landmark'}
                  <Select
                    required
                    value={draft[field]}
                    onValueChange={(value) => setDraft({ ...draft, [field]: value })}
                  >
                    <SelectTrigger id={field} className="w-full">
                      <SelectValue placeholder="Select a Landmark" />
                    </SelectTrigger>
                    <SelectContent>
                      {draft[field] && !landmarks.some((place) => place.code === draft[field]) && (
                        <SelectItem value={draft[field]}>{draft[field]}</SelectItem>
                      )}
                      {landmarks.map((place) => (
                        <SelectItem key={place.code} value={place.code}>
                          {place.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              ))}
            </div>
            <p className="text-sm">
              Click to add walking points in order. Drag a numbered pin to adjust it.
            </p>
            <PedestrianRouteMap
              key={editingId ?? 'new'}
              points={draft.waypoints}
              onChange={(waypoints) => {
                if (!busy) setDraft({ ...draft, waypoints });
              }}
            />
            <ol className="max-h-56 space-y-2 overflow-y-auto">
              {draft.waypoints.map((point, index) => (
                <li key={index} className="flex flex-wrap items-center gap-2 text-sm">
                  <span>
                    Point {index + 1} · {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    disabled={index === 0}
                    onClick={() => {
                      const waypoints = [...draft.waypoints];
                      [waypoints[index - 1], waypoints[index]] = [
                        waypoints[index],
                        waypoints[index - 1],
                      ];
                      setDraft({ ...draft, waypoints });
                    }}
                  >
                    Move up
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        waypoints: draft.waypoints.filter((_, i) => i !== index),
                      })
                    }
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ol>
            <p>Calculated distance: {Math.round(distance)} m</p>
            <label className="block">
              Estimated walking time (minutes)
              <input
                className={inputClass}
                type="number"
                step="any"
                min="0.1"
                required
                value={
                  Number.isFinite(draft.estimatedWalkMinutes) ? draft.estimatedWalkMinutes : ''
                }
                onChange={(event) =>
                  setDraft({ ...draft, estimatedWalkMinutes: event.target.valueAsNumber })
                }
              />
            </label>
            <label className="block">
              <input
                type="checkbox"
                checked={draft.isAccessibleWheelchair}
                onChange={(event) =>
                  setDraft({ ...draft, isAccessibleWheelchair: event.target.checked })
                }
              />{' '}
              Wheelchair accessible
            </label>
            <label className="block">
              <input
                type="checkbox"
                checked={draft.isOneWay ?? false}
                onChange={(event) => setDraft({ ...draft, isOneWay: event.target.checked })}
              />{' '}
              One way (from → to)
            </label>
            <label className="block">
              Walking instruction (from → to)
              <textarea
                className={inputClass}
                maxLength={2000}
                value={draft.instruction ?? ''}
                onChange={(event) => setDraft({ ...draft, instruction: event.target.value })}
              />
            </label>
            <label className="block">
              Instruction translation language code
              <input
                className={inputClass}
                value={instructionLanguage}
                placeholder="For example, it"
                onChange={(event) => setInstructionLanguage(event.target.value.trim())}
              />
            </label>
            {/^[a-z]{2,3}(-[a-zA-Z0-9]{2,8})*$/.test(instructionLanguage) &&
              instructionLanguage !== 'en' && (
                <label className="block">
                  Translated walking instruction
                  <textarea
                    className={inputClass}
                    maxLength={2000}
                    value={draft.instructionTranslations?.[instructionLanguage] ?? ''}
                    onChange={(event) => {
                      const translations = { ...draft.instructionTranslations };
                      if (event.target.value.trim())
                        translations[instructionLanguage] = event.target.value;
                      else delete translations[instructionLanguage];
                      setDraft({ ...draft, instructionTranslations: translations });
                    }}
                  />
                </label>
              )}
            <label className="block">
              <input
                type="checkbox"
                checked={draft.isPublished}
                onChange={(event) => setDraft({ ...draft, isPublished: event.target.checked })}
              />{' '}
              Published
            </label>
            <div className="flex gap-2">
              <Button type="submit">{busy ? 'Saving…' : 'Save route'}</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDraft(null);
                  setEditingId(null);
                  setError('');
                }}
              >
                Cancel
              </Button>
            </div>
          </fieldset>
        </form>
      )}
    </section>
  );
}
