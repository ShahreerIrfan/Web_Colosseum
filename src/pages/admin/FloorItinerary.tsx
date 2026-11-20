import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { latLng } from 'leaflet';
import { TbStairs } from 'react-icons/tb';
import api from '@/apis/axios';
import { floorApi } from '@/apis/floor/floorApi';
import { landmarkApi } from '@/apis/landmark/landmarkApi';
import ModuleLoading from '@/components/admin/ModuleLoading';
import {
  PedestrianRouteMap,
  type PortalMarker,
  type RoutePoint,
} from '@/components/admin/PedestrianRouteMap';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { BaseSuccessResponse } from '@/types/api/CommonTypes';
import type { FloorModel, FloorPortalModel } from '@/types/api/floorTypes';
import { getUserPayload } from '@/utils/localStorageUtils';
import { getEffectiveRbac } from '@/utils/rbacUtils';

type Stop = {
  id: string;
  title: string;
  order: number;
  isPublished: boolean;
  position: RoutePoint | null;
};
type Segment = {
  _id: string;
  fromId: string;
  toId: string;
  points: { x: number; y: number }[];
  coordinateSpace?: 'gps';
  distanceMeters: number;
  walkingDurationSeconds: number;
  instruction?: string;
  isPublished: boolean;
};
type FloorContent = {
  floorPublished: boolean;
  elevationMeters?: number;
  autoFloorDetectionEnabled?: boolean;
  viewpoints: Stop[];
  segments: Segment[];
  portals?: FloorPortalModel[];
};
type Draft = {
  segmentId?: string;
  fromId: string;
  toId: string;
  waypoints: RoutePoint[];
  geometryChanged: boolean;
  walkingDurationSeconds: number;
  instruction: string;
};

type PortalDraft = {
  id?: string;
  name: string;
  fromViewpointId: string;
  toFloorId: string;
  toViewpointId?: string;
  elevationDeltaMeters: number;
  isAscending: boolean;
  triggerRadiusMeters: number;
};

const emptyDraft: Draft = {
  fromId: '',
  toId: '',
  waypoints: [],
  geometryChanged: true,
  walkingDurationSeconds: 0,
  instruction: '',
};
const inputClass = 'w-full rounded-md border bg-background p-2';

function errorMessage(error: unknown) {
  if (isAxiosError<{ message?: string }>(error))
    return error.response?.data?.message ?? error.message;
  return error instanceof Error ? error.message : 'The request failed.';
}

function generatePortalId(floorId: string): string {
  return `portal_${floorId}_${Date.now()}`;
}

function segmentPath(segment: Segment, stops: Map<string, Stop>): RoutePoint[] {
  const start = stops.get(segment.fromId)?.position;
  const end = stops.get(segment.toId)?.position;
  if (!start || !end) return [];
  const inner = segment.points.slice(1, -1).map(({ x, y }, index) => {
    if (segment.coordinateSpace === 'gps' || (x > 1 && y > 1)) {
      return { latitude: x, longitude: y };
    }
    const fraction = (index + 1) / (segment.points.length - 1);
    return {
      latitude: start.latitude + (end.latitude - start.latitude) * fraction,
      longitude: start.longitude + (end.longitude - start.longitude) * fraction,
    };
  });
  return [start, ...inner, end];
}

function FieldSelect({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <p className="mb-1 text-sm font-medium">{label}</p>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full" aria-label={label}>
          <SelectValue placeholder={`Select ${label}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function FloorItinerary() {
  const permissions = getEffectiveRbac(getUserPayload()).find(
    (row) => row['module name'] === 'Floor Itinerary'
  );
  const canCreate = permissions?.Create === 'true';
  const canUpdate = permissions?.Update === 'true';
  const canDelete = permissions?.Delete === 'true';
  const [landmarks, setLandmarks] = useState<{ code: string; name: string }[]>([]);
  const [floors, setFloors] = useState<FloorModel[]>([]);
  const [landmark, setLandmark] = useState('');
  const [floorId, setFloorId] = useState('');
  const [content, setContent] = useState<FloorContent | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [activeTab, setActiveTab] = useState<'connections' | 'portals'>('connections');
  const [portalDraft, setPortalDraft] = useState<PortalDraft | null>(null);
  const [portalError, setPortalError] = useState('');
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loadingFloor, setLoadingFloor] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let current = true;
    Promise.all([landmarkApi.getAll(), floorApi.getAll()])
      .then(([places, floorList]) => {
        if (!current) return;
        setLandmarks(places);
        setFloors(floorList);
      })
      .catch((error: unknown) => {
        if (current) setError(errorMessage(error));
      })
      .finally(() => {
        if (current) setLoadingCatalog(false);
      });
    return () => {
      current = false;
    };
  }, []);

  const endpoint = `/floor-itineraries/${encodeURIComponent(floorId)}`;
  useEffect(() => {
    if (!floorId) return;
    const controller = new AbortController();
    api
      .get<BaseSuccessResponse<FloorContent>>(endpoint, { signal: controller.signal })
      .then(({ data }) => {
        if (!controller.signal.aborted) setContent(data.data);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setError(errorMessage(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingFloor(false);
      });
    return () => controller.abort();
  }, [endpoint, floorId]);

  function selectFloor(nextFloor: string) {
    if (nextFloor === floorId) return;
    setFloorId(nextFloor);
    setContent(null);
    setDraft(null);
    setPortalDraft(null);
    setPortalError('');
    setError('');
    setNotice('');
    setLoadingFloor(Boolean(nextFloor));
  }

  const stops = new Map((content?.viewpoints ?? []).map((stop) => [stop.id, stop]));
  const stopLabel = (id: string) => {
    const stop = stops.get(id);
    return stop ? `${stop.order} · ${stop.title}${stop.isPublished ? '' : ' (unpublished)'}` : id;
  };
  const mapStops = (content?.viewpoints ?? []).flatMap((stop) =>
    stop.position ? [{ position: stop.position, label: stopLabel(stop.id) }] : []
  );
  const eligible = (content?.viewpoints ?? []).filter((stop) => stop.position);
  const from = draft ? stops.get(draft.fromId) : undefined;
  const to = draft ? stops.get(draft.toId) : undefined;
  const orderWarning = from && to && from.order >= to.order;
  const preview =
    from?.position && to?.position && draft ? [from.position, ...draft.waypoints, to.position] : [];
  const distance = preview.reduce(
    (meters, point, index) =>
      index === 0
        ? meters
        : meters +
          latLng(preview[index - 1].latitude, preview[index - 1].longitude).distanceTo(
            latLng(point.latitude, point.longitude)
          ),
    0
  );
  const selectedSegment = content?.segments.find((segment) => segment._id === draft?.segmentId);
  const floorLandmarks = [...new Set(floors.map((floor) => floor.landmarkCode))].map((code) => ({
    value: code,
    label: landmarks.find((place) => place.code === code)?.name ?? code,
  }));
  const targetFloorOptions = floors
    .filter((f) => f.landmarkCode === landmark && f.floorId !== floorId)
    .map((f) => ({ value: f.floorId, label: f.displayName }));
  const mapPortals: PortalMarker[] = (content?.portals ?? []).flatMap((portal) => {
    const vpPos = portal.fromViewpointId ? stops.get(portal.fromViewpointId)?.position : null;
    const pos =
      portal.coordinates?.latitude && portal.coordinates?.longitude ? portal.coordinates : vpPos;
    if (!pos) return [];
    const targetFloor = floors.find((f) => f.floorId === portal.toFloorId);
    return [
      {
        id: portal.id,
        name: portal.name,
        position: pos,
        toFloorLabel: targetFloor?.displayName ?? portal.toFloorId,
        isAscending: portal.isAscending,
      },
    ];
  });

  function edit(segment: Segment) {
    setError('');
    setNotice('');
    setDraft({
      segmentId: segment._id,
      fromId: segment.fromId,
      toId: segment.toId,
      instruction: segment.instruction ?? '',
      walkingDurationSeconds: segment.walkingDurationSeconds,
      waypoints: segmentPath(segment, stops).slice(1, -1),
      geometryChanged: false,
    });
  }

  function remember(segment: Segment) {
    setContent(
      (current) =>
        current && {
          ...current,
          segments: current.segments.some((old) => old._id === segment._id)
            ? current.segments.map((old) => (old._id === segment._id ? segment : old))
            : [...current.segments, segment],
        }
    );
  }

  async function mutate(operation: () => Promise<void>) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await operation();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!draft) return;
    if (
      draft.geometryChanged &&
      (!from?.position || !to?.position || from.id === to.id || distance <= 0)
    ) {
      setError('Select two different Viewpoints with GPS coordinates and a non-zero path.');
      return;
    }
    const path = draft.geometryChanged
      ? {
          fromId: draft.fromId,
          toId: draft.toId,
          waypoints: draft.waypoints,
        }
      : {};
    const payload = {
      ...path,
      instruction: draft.instruction,
      walkingDurationSeconds: draft.walkingDurationSeconds,
    };
    await mutate(async () => {
      const result = draft.segmentId
        ? await api.patch<BaseSuccessResponse<Segment>>(`${endpoint}/${draft.segmentId}`, payload)
        : await api.post<BaseSuccessResponse<Segment>>(endpoint, payload);
      remember(result.data.data);
      setDraft(null);
      setNotice(result.data.data.isPublished ? 'Published connection updated.' : 'Draft saved.');
    });
  }

  function changePublication(segment: Segment) {
    const start = stops.get(segment.fromId);
    const end = stops.get(segment.toId);
    const publish = !segment.isPublished;
    if (
      publish &&
      start &&
      end &&
      start.order >= end.order &&
      !window.confirm('This connection goes against the Tour Order Index. Publish anyway?')
    )
      return;
    void mutate(async () => {
      const { data } = await api.patch<BaseSuccessResponse<Segment>>(`${endpoint}/${segment._id}`, {
        isPublished: publish,
      });
      remember(data.data);
      setNotice(publish ? 'Connection published.' : 'Connection unpublished.');
    });
  }

  function remove(segment: Segment) {
    if (
      !window.confirm(
        `Delete the connection ${stopLabel(segment.fromId)} → ${stopLabel(segment.toId)}?`
      )
    )
      return;
    void mutate(async () => {
      await api.delete(`${endpoint}/${segment._id}`);
      setContent(
        (current) =>
          current && {
            ...current,
            segments: current.segments.filter((old) => old._id !== segment._id),
          }
      );
      setNotice('Connection deleted.');
    });
  }

  async function savePortal(draftPortal: PortalDraft) {
    if (!content || !floorId) return;
    if (!draftPortal.name.trim()) {
      setPortalError('Please enter a name for this staircase portal.');
      return;
    }
    if (!draftPortal.toFloorId) {
      setPortalError('Please select a destination floor.');
      return;
    }
    const anchorVp = stops.get(draftPortal.fromViewpointId);
    const portalId = draftPortal.id || generatePortalId(floorId);
    const coords = anchorVp?.position
      ? { latitude: anchorVp.position.latitude, longitude: anchorVp.position.longitude }
      : undefined;

    const newPortal: FloorPortalModel = {
      id: portalId,
      name: draftPortal.name.trim(),
      fromFloorId: floorId,
      toFloorId: draftPortal.toFloorId,
      fromViewpointId: draftPortal.fromViewpointId || undefined,
      toViewpointId: draftPortal.toViewpointId || undefined,
      normalizedX: 0.5,
      normalizedY: 0.5,
      coordinates: coords,
      elevationDeltaMeters: draftPortal.elevationDeltaMeters,
      isAscending: draftPortal.isAscending,
      triggerRadiusMeters: draftPortal.triggerRadiusMeters || 15,
    };

    const existing = content.portals || [];
    const updated = draftPortal.id
      ? existing.map((p) => (p.id === draftPortal.id ? newPortal : p))
      : [...existing, newPortal];

    await mutate(async () => {
      const saved = await floorApi.updateFloorPortals(floorId, updated);
      setContent((current) => (current ? { ...current, portals: saved } : current));
      setPortalDraft(null);
      setNotice('Staircase portal saved and mobile sync broadcasted.');
    });
  }

  async function deletePortal(portalIdToDelete: string) {
    if (!content || !floorId) return;
    if (!window.confirm('Delete this staircase level transition?')) return;
    const existing = content.portals || [];
    const updated = existing.filter((p) => p.id !== portalIdToDelete);

    await mutate(async () => {
      const saved = await floorApi.updateFloorPortals(floorId, updated);
      setContent((current) => (current ? { ...current, portals: saved } : current));
      setNotice('Staircase portal deleted.');
    });
  }

  if (loadingCatalog) return <ModuleLoading />;

  return (
    <section className="mx-auto w-full max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Floor Itinerary</h1>
        <p className="mt-1 text-sm">
          Draw walking connections between Viewpoints on the same Floor. Tour Order Index still
          determines the visiting order.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldSelect
          label="Landmark"
          value={landmark}
          disabled={busy || Boolean(draft)}
          options={floorLandmarks}
          onChange={(value) => {
            setLandmark(value);
            selectFloor('');
          }}
        />
        <FieldSelect
          label="Floor"
          value={floorId}
          disabled={!landmark || busy || Boolean(draft)}
          options={floors
            .filter((floor) => floor.landmarkCode === landmark)
            .map((floor) => ({ value: floor.floorId, label: floor.displayName }))}
          onChange={selectFloor}
        />
      </div>
      {error && (
        <p role="alert" className="rounded-md border border-destructive p-3 text-destructive">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm">
          {notice}
        </p>
      )}
      {loadingFloor && <ModuleLoading />}
      {!floorId && !error && (
        <p className="text-sm">Choose a Landmark and a Floor to see its connections.</p>
      )}
      {content && (
        <>
          <PedestrianRouteMap
            key={`${floorId}:${draft?.segmentId ?? (draft ? 'new' : 'overview')}`}
            points={draft?.waypoints ?? []}
            start={from?.position}
            end={to?.position}
            stops={mapStops}
            portals={mapPortals}
            connections={content.segments
              .filter((segment) => segment._id !== draft?.segmentId)
              .map((segment) => ({
                points: segmentPath(segment, stops),
                published: segment.isPublished,
              }))}
            onChange={
              draft && !busy && from?.position && to?.position
                ? (waypoints) => setDraft({ ...draft, waypoints, geometryChanged: true })
                : undefined
            }
          />
          {draft ? (
            <form
              className="space-y-4 rounded-md border p-4"
              onSubmit={(event) => {
                event.preventDefault();
                void save();
              }}
            >
              <h2 className="font-semibold">
                {draft.segmentId ? 'Edit Connection' : 'New Connection'}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {(['fromId', 'toId'] as const).map((field) => {
                  const options = eligible.map((stop) => ({
                    value: stop.id,
                    label: stopLabel(stop.id),
                  }));
                  if (draft[field] && !options.some((option) => option.value === draft[field])) {
                    options.unshift({ value: draft[field], label: stopLabel(draft[field]) });
                  }
                  return (
                    <FieldSelect
                      key={field}
                      label={field === 'fromId' ? 'From Viewpoint' : 'To Viewpoint'}
                      value={draft[field]}
                      options={options}
                      disabled={busy}
                      onChange={(value) =>
                        setDraft({ ...draft, [field]: value, geometryChanged: true })
                      }
                    />
                  );
                })}
              </div>
              <p className="text-sm">
                Click the map to add bends. Drag numbered waypoints to adjust them.
              </p>
              {draft.waypoints.length > 0 && (
                <ol className="flex flex-wrap gap-2">
                  {draft.waypoints.map((_, index) => (
                    <li key={index}>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() =>
                          setDraft({
                            ...draft,
                            geometryChanged: true,
                            waypoints: draft.waypoints.filter((_, i) => i !== index),
                          })
                        }
                      >
                        Remove waypoint {index + 1}
                      </Button>
                    </li>
                  ))}
                </ol>
              )}
              {orderWarning && (
                <p role="status" className="text-sm">
                  This direction goes against the current Tour Order Index.
                </p>
              )}
              <p className="text-sm">
                Distance{' '}
                {(draft.geometryChanged
                  ? distance
                  : (selectedSegment?.distanceMeters ?? distance)
                ).toFixed(1)}{' '}
                m
              </p>
              <label className="block text-sm">
                Walking time (seconds)
                <input
                  className={inputClass}
                  type="number"
                  min={0}
                  max={86400}
                  required
                  disabled={busy}
                  value={draft.walkingDurationSeconds}
                  onChange={(event) =>
                    setDraft({ ...draft, walkingDurationSeconds: Number(event.target.value) })
                  }
                />
              </label>
              <label className="block text-sm">
                Walking instruction
                <textarea
                  className={inputClass}
                  value={draft.instruction}
                  maxLength={1000}
                  disabled={busy}
                  onChange={(event) => setDraft({ ...draft, instruction: event.target.value })}
                />
              </label>
              <div className="flex gap-2">
                <Button type="submit" disabled={busy}>
                  {selectedSegment?.isPublished ? 'Save Changes' : 'Save Draft'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setDraft(null)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Tab Navigation and Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-2.5 shadow-xs">
                <div className="flex gap-1.5 rounded-md bg-muted p-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('connections')}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-3.5 py-1.5 text-sm font-medium transition-all cursor-pointer',
                      activeTab === 'connections'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span>Walking Connections</span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      {content.segments.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('portals')}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-3.5 py-1.5 text-sm font-medium transition-all cursor-pointer',
                      activeTab === 'portals'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <TbStairs className="size-4 text-amber-600" />
                    <span>Staircase Portals</span>
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                      {content.portals?.length ?? 0}
                    </span>
                  </button>
                </div>

                {activeTab === 'connections' && canCreate && (
                  <Button
                    disabled={busy || eligible.length < 2}
                    onClick={() => {
                      setError('');
                      setNotice('');
                      setDraft(emptyDraft);
                    }}
                  >
                    Add Connection
                  </Button>
                )}

                {activeTab === 'portals' && canCreate && (
                  <Button
                    variant="default"
                    className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 cursor-pointer"
                    disabled={busy || targetFloorOptions.length === 0}
                    onClick={() => {
                      setPortalError('');
                      setPortalDraft({
                        name: '',
                        fromViewpointId: eligible[0]?.id || '',
                        toFloorId: targetFloorOptions[0]?.value || '',
                        isAscending: true,
                        elevationDeltaMeters: 4.5,
                        triggerRadiusMeters: 15,
                      });
                    }}
                  >
                    <TbStairs className="size-4" />
                    <span>Add Staircase Portal</span>
                  </Button>
                )}
              </div>

              {/* Tab 1: Walking Connections */}
              {activeTab === 'connections' && (
                <div className="space-y-3">
                  {eligible.length < 2 && (
                    <p className="text-sm text-muted-foreground">
                      Two Viewpoints with GPS coordinates are needed to add a connection.
                    </p>
                  )}
                  {!content.segments.length && (
                    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                      No walking connections saved on this floor. Click &quot;Add Connection&quot;
                      to draw pedestrian routes between viewpoints.
                    </div>
                  )}
                  {content.segments.length > 0 && (
                    <ul className="divide-y rounded-lg border bg-card shadow-xs">
                      {content.segments.map((segment) => {
                        const start = stops.get(segment.fromId);
                        const end = stops.get(segment.toId);
                        const canPublish =
                          content.floorPublished && start?.isPublished && end?.isPublished;
                        return (
                          <li
                            key={segment._id}
                            className="flex flex-wrap items-start justify-between gap-3 p-3.5 hover:bg-muted/30 transition-colors"
                          >
                            <div className="space-y-0.5">
                              <p className="font-semibold text-foreground">
                                {stopLabel(segment.fromId)} → {stopLabel(segment.toId)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                <span
                                  className={cn(
                                    'inline-block rounded px-1.5 py-0.5 font-medium mr-1.5',
                                    segment.isPublished
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : 'bg-muted text-muted-foreground'
                                  )}
                                >
                                  {segment.isPublished ? 'Published' : 'Draft'}
                                </span>
                                · {segment.distanceMeters} m · {segment.walkingDurationSeconds} s
                              </p>
                              {segment.instruction && (
                                <p className="text-xs text-muted-foreground italic mt-1">
                                  {segment.instruction}
                                </p>
                              )}
                              {!canPublish && (
                                <p className="text-xs text-amber-600 mt-1">
                                  Both Viewpoints and the Floor must be published for visitors to
                                  see this connection.
                                </p>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {canUpdate && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={busy}
                                  onClick={() => edit(segment)}
                                >
                                  Edit
                                </Button>
                              )}
                              {canUpdate && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={busy || (!segment.isPublished && !canPublish)}
                                  onClick={() => changePublication(segment)}
                                >
                                  {segment.isPublished ? 'Unpublish' : 'Publish'}
                                </Button>
                              )}
                              {canDelete && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={busy}
                                  onClick={() => remove(segment)}
                                >
                                  Delete
                                </Button>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}

              {/* Tab 2: Staircase Portals */}
              {activeTab === 'portals' && (
                <div className="space-y-3">
                  {targetFloorOptions.length === 0 && (
                    <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                      ℹ️ This landmark only has one floor. Staircase level transitions are used to
                      connect multi-level monuments (such as Colosseum Hypogeum ↔ Level 1 ↔ Attic).
                    </div>
                  )}

                  {(!content.portals || content.portals.length === 0) &&
                    targetFloorOptions.length > 0 && (
                      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 mb-3">
                          <TbStairs className="size-6" />
                        </div>
                        <p className="font-medium text-foreground">
                          No staircase portals defined on this floor yet
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Add a staircase transition to allow visitors to automatically switch floor
                          maps as they climb or descend stairs.
                        </p>
                        {canCreate && (
                          <Button
                            variant="default"
                            className="mt-4 bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                            onClick={() => {
                              setPortalError('');
                              setPortalDraft({
                                name: '',
                                fromViewpointId: eligible[0]?.id || '',
                                toFloorId: targetFloorOptions[0]?.value || '',
                                isAscending: true,
                                elevationDeltaMeters: 4.5,
                                triggerRadiusMeters: 15,
                              });
                            }}
                          >
                            <TbStairs className="size-4 mr-1.5" />
                            <span>Add First Staircase Portal</span>
                          </Button>
                        )}
                      </div>
                    )}

                  {content.portals && content.portals.length > 0 && (
                    <ul className="divide-y rounded-lg border bg-card shadow-xs">
                      {content.portals.map((portal) => {
                        const anchor = stops.get(portal.fromViewpointId || '');
                        const targetFloor = floors.find((f) => f.floorId === portal.toFloorId);
                        return (
                          <li
                            key={portal.id}
                            className="flex flex-wrap items-center justify-between gap-3 p-3.5 hover:bg-muted/30 transition-colors"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <div className="flex size-7 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                  <TbStairs className="size-4" />
                                </div>
                                <span className="font-semibold text-foreground">{portal.name}</span>
                                <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                  {portal.isAscending ? '▲ Ascent' : '▼ Descent'} (
                                  {portal.elevationDeltaMeters > 0
                                    ? `+${portal.elevationDeltaMeters}`
                                    : portal.elevationDeltaMeters}
                                  m)
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground pl-9">
                                Anchor:{' '}
                                <strong className="text-foreground">
                                  {anchor
                                    ? stopLabel(anchor.id)
                                    : portal.fromViewpointId || 'Coordinates'}
                                </strong>{' '}
                                → Destination:{' '}
                                <strong className="text-foreground">
                                  {targetFloor?.displayName || portal.toFloorId}
                                </strong>{' '}
                                · Trigger Radius: {portal.triggerRadiusMeters}m
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {canUpdate && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={busy}
                                  onClick={() => {
                                    setPortalError('');
                                    setPortalDraft({
                                      id: portal.id,
                                      name: portal.name,
                                      fromViewpointId: portal.fromViewpointId || '',
                                      toFloorId: portal.toFloorId,
                                      toViewpointId: portal.toViewpointId || '',
                                      isAscending: portal.isAscending,
                                      elevationDeltaMeters: portal.elevationDeltaMeters,
                                      triggerRadiusMeters: portal.triggerRadiusMeters,
                                    });
                                  }}
                                >
                                  Edit
                                </Button>
                              )}
                              {canDelete && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={busy}
                                  onClick={() => void deletePortal(portal.id)}
                                >
                                  Delete
                                </Button>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          <Dialog
            open={Boolean(portalDraft)}
            onOpenChange={(open) => !open && setPortalDraft(null)}
          >
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <TbStairs className="size-5 text-amber-600" />
                  <span>{portalDraft?.id ? 'Edit Staircase Portal' : 'Add Staircase Portal'}</span>
                </DialogTitle>
                <DialogDescription>
                  Configure a staircase transition connecting this floor to another level.
                </DialogDescription>
              </DialogHeader>
              {portalDraft && (
                <form
                  className="space-y-4 py-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void savePortal(portalDraft);
                  }}
                >
                  {portalError && (
                    <p
                      role="alert"
                      className="rounded-md border border-destructive p-2 text-xs text-destructive"
                    >
                      {portalError}
                    </p>
                  )}
                  <label className="block text-sm">
                    Portal / Staircase Name
                    <input
                      className={inputClass}
                      required
                      placeholder="e.g. North Hypogeum Staircase to Level 1"
                      value={portalDraft.name}
                      onChange={(e) => setPortalDraft({ ...portalDraft, name: e.target.value })}
                    />
                  </label>
                  <FieldSelect
                    label="Anchor Viewpoint (Near Stairs)"
                    value={portalDraft.fromViewpointId}
                    options={eligible.map((s) => ({ value: s.id, label: stopLabel(s.id) }))}
                    onChange={(val) => setPortalDraft({ ...portalDraft, fromViewpointId: val })}
                  />
                  <FieldSelect
                    label="Destination Floor"
                    value={portalDraft.toFloorId}
                    options={targetFloorOptions}
                    onChange={(val) => setPortalDraft({ ...portalDraft, toFloorId: val })}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-sm">
                      Transition Direction
                      <select
                        className={inputClass}
                        value={portalDraft.isAscending ? 'asc' : 'desc'}
                        onChange={(e) => {
                          const isAsc = e.target.value === 'asc';
                          setPortalDraft({
                            ...portalDraft,
                            isAscending: isAsc,
                            elevationDeltaMeters: isAsc
                              ? Math.abs(portalDraft.elevationDeltaMeters || 4.5)
                              : -Math.abs(portalDraft.elevationDeltaMeters || 4.5),
                          });
                        }}
                      >
                        <option value="asc">▲ Ascent (Going Up)</option>
                        <option value="desc">▼ Descent (Going Down)</option>
                      </select>
                    </label>
                    <label className="block text-sm">
                      Elevation Delta (Meters)
                      <input
                        type="number"
                        step="0.5"
                        className={inputClass}
                        required
                        value={portalDraft.elevationDeltaMeters}
                        onChange={(e) =>
                          setPortalDraft({
                            ...portalDraft,
                            elevationDeltaMeters: Number(e.target.value),
                          })
                        }
                      />
                    </label>
                  </div>
                  <label className="block text-sm">
                    Trigger Radius (Meters around stairs)
                    <input
                      type="number"
                      step="1"
                      min="5"
                      max="50"
                      className={inputClass}
                      required
                      value={portalDraft.triggerRadiusMeters}
                      onChange={(e) =>
                        setPortalDraft({
                          ...portalDraft,
                          triggerRadiusMeters: Number(e.target.value),
                        })
                      }
                    />
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Recommended: 12m - 18m. When the visitor is within this radius, the mobile app
                      triggers automatic level switching.
                    </span>
                  </label>
                  <DialogFooter className="mt-4 flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setPortalDraft(null)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={busy}>
                      {portalDraft.id ? 'Save Portal' : 'Create Portal'}
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </section>
  );
}
