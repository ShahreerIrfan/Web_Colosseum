import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { latLng } from 'leaflet';
import { ArrowDown, ArrowUp, MapPin, Plus, RotateCcw, Trash2 } from 'lucide-react';
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
type LandmarkOption = {
  code: string;
  name: string;
  center?: { latitude: number; longitude: number };
};
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

  const fromLandmark = landmarks.find((l) => l.code === draft?.fromLandmarkCode);
  const toLandmark = landmarks.find((l) => l.code === draft?.toLandmarkCode);

  function addStopToEnd() {
    if (!draft) return;
    const count = draft.waypoints.length;
    let nextPoint: RoutePoint;
    if (count === 0) {
      nextPoint = fromLandmark?.center ?? { latitude: 41.89021, longitude: 12.492231 };
    } else if (count === 1) {
      if (toLandmark?.center) {
        nextPoint = {
          latitude: Number(
            ((draft.waypoints[0].latitude + toLandmark.center.latitude) / 2).toFixed(6)
          ),
          longitude: Number(
            ((draft.waypoints[0].longitude + toLandmark.center.longitude) / 2).toFixed(6)
          ),
        };
      } else {
        nextPoint = {
          latitude: Number((draft.waypoints[0].latitude + 0.0003).toFixed(6)),
          longitude: Number((draft.waypoints[0].longitude + 0.0003).toFixed(6)),
        };
      }
    } else {
      const last = draft.waypoints[count - 1];
      const prev = draft.waypoints[count - 2];
      const dLat = last.latitude - prev.latitude;
      const dLng = last.longitude - prev.longitude;
      nextPoint = {
        latitude: Number((last.latitude + dLat * 0.5).toFixed(6)),
        longitude: Number((last.longitude + dLng * 0.5).toFixed(6)),
      };
    }
    setDraft({ ...draft, waypoints: [...draft.waypoints, nextPoint] });
  }

  function insertStopAfter(index: number) {
    if (!draft) return;
    const count = draft.waypoints.length;
    const curr = draft.waypoints[index];
    let newPoint: RoutePoint;
    if (index + 1 < count) {
      const next = draft.waypoints[index + 1];
      newPoint = {
        latitude: Number(((curr.latitude + next.latitude) / 2).toFixed(6)),
        longitude: Number(((curr.longitude + next.longitude) / 2).toFixed(6)),
      };
    } else {
      newPoint = {
        latitude: Number((curr.latitude + 0.0002).toFixed(6)),
        longitude: Number((curr.longitude + 0.0002).toFixed(6)),
      };
    }
    const waypoints = [...draft.waypoints];
    waypoints.splice(index + 1, 0, newPoint);
    setDraft({ ...draft, waypoints });
  }

  function updateStopCoordinate(index: number, field: 'latitude' | 'longitude', value: number) {
    if (!draft || isNaN(value)) return;
    const waypoints = [...draft.waypoints];
    waypoints[index] = { ...waypoints[index], [field]: value };
    setDraft({ ...draft, waypoints });
  }

  function moveStop(index: number, direction: 'up' | 'down') {
    if (!draft) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= draft.waypoints.length) return;
    const waypoints = [...draft.waypoints];
    [waypoints[index], waypoints[targetIndex]] = [waypoints[targetIndex], waypoints[index]];
    setDraft({ ...draft, waypoints });
  }

  function removeStop(index: number) {
    if (!draft) return;
    setDraft({
      ...draft,
      waypoints: draft.waypoints.filter((_, i) => i !== index),
    });
  }

  function reverseStopOrder() {
    if (!draft || draft.waypoints.length < 2) return;
    setDraft({
      ...draft,
      waypoints: [...draft.waypoints].reverse(),
    });
  }

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
            <div className="space-y-3 rounded-lg border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="flex items-center gap-2 text-base font-semibold">
                    <MapPin className="h-4 w-4 text-primary" />
                    Walking Stops & Waypoints ({draft.waypoints.length}{' '}
                    {draft.waypoints.length === 1 ? 'stop' : 'stops'})
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Click anywhere on the map to add stops in order. Drag pins to move them, or edit
                    coordinates below.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={reverseStopOrder}
                    disabled={draft.waypoints.length < 2}
                    title="Reverse the walking direction of stops"
                  >
                    <RotateCcw className="mr-1 h-3.5 w-3.5" />
                    Reverse
                  </Button>
                  <Button
                    size="sm"
                    type="button"
                    onClick={addStopToEnd}
                    title="Add a new stop to the end of the route"
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Add Stop
                  </Button>
                </div>
              </div>

              <PedestrianRouteMap
                key={editingId ?? 'new'}
                points={draft.waypoints}
                start={fromLandmark?.center}
                end={toLandmark?.center}
                onChange={(waypoints) => {
                  if (!busy) setDraft({ ...draft, waypoints });
                }}
              />

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Stops Sequence ({draft.waypoints.length} stops)
                  </span>
                  {draft.waypoints.length > 0 && (
                    <button
                      type="button"
                      className="cursor-pointer text-xs text-destructive hover:underline"
                      onClick={() => {
                        if (window.confirm('Remove all stops?')) {
                          setDraft({ ...draft, waypoints: [] });
                        }
                      }}
                    >
                      Clear all stops
                    </button>
                  )}
                </div>

                {draft.waypoints.length === 0 ? (
                  <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                    <MapPin className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    <p className="font-medium">No walking stops added yet.</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Click anywhere on the map above to place Stop 1, or click{' '}
                      <button
                        type="button"
                        onClick={addStopToEnd}
                        className="font-semibold text-primary underline cursor-pointer"
                      >
                        + Add Stop
                      </button>
                      .
                    </p>
                  </div>
                ) : (
                  <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                    {draft.waypoints.map((point, index) => (
                      <div
                        key={index}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-background p-2.5 text-xs shadow-xs transition-colors hover:border-primary/50"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground shadow-xs">
                            {index + 1}
                          </span>
                          <span className="font-semibold">Stop {index + 1}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1">
                            <span className="font-medium text-muted-foreground">Lat:</span>
                            <input
                              type="number"
                              step="any"
                              className="w-28 rounded border bg-card px-2 py-1 font-mono text-xs"
                              value={point.latitude}
                              onChange={(e) =>
                                updateStopCoordinate(index, 'latitude', parseFloat(e.target.value))
                              }
                            />
                          </label>
                          <label className="flex items-center gap-1">
                            <span className="font-medium text-muted-foreground">Lng:</span>
                            <input
                              type="number"
                              step="any"
                              className="w-28 rounded border bg-card px-2 py-1 font-mono text-xs"
                              value={point.longitude}
                              onChange={(e) =>
                                updateStopCoordinate(index, 'longitude', parseFloat(e.target.value))
                              }
                            />
                          </label>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            type="button"
                            className="h-8 px-2 text-xs"
                            title="Insert a new stop right after this one"
                            onClick={() => insertStopAfter(index)}
                          >
                            <Plus className="mr-0.5 h-3.5 w-3.5 text-primary" />
                            Insert
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            type="button"
                            className="h-8 w-8 p-0"
                            disabled={index === 0}
                            title="Move stop earlier"
                            onClick={() => moveStop(index, 'up')}
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            type="button"
                            className="h-8 w-8 p-0"
                            disabled={index === draft.waypoints.length - 1}
                            title="Move stop later"
                            onClick={() => moveStop(index, 'down')}
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            type="button"
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            title="Delete this stop"
                            onClick={() => removeStop(index)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    className="w-full border-dashed"
                    onClick={addStopToEnd}
                  >
                    <Plus className="mr-1 h-4 w-4 text-primary" />+ Add Another Stop (Stop{' '}
                    {draft.waypoints.length + 1})
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between rounded bg-muted/50 p-2.5 text-xs text-muted-foreground">
                <span>
                  Total Stops: <strong className="text-foreground">{draft.waypoints.length}</strong>
                </span>
                <span>
                  Calculated Distance:{' '}
                  <strong className="text-foreground">{Math.round(distance)} m</strong>
                </span>
                <span>
                  Est. Walk:{' '}
                  <strong className="text-foreground">{draft.estimatedWalkMinutes} min</strong>
                </span>
              </div>
            </div>
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
