import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { latLng } from 'leaflet';
import api from '@/apis/axios';
import { floorApi } from '@/apis/floor/floorApi';
import { landmarkApi } from '@/apis/landmark/landmarkApi';
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
import type { FloorModel } from '@/types/api/floorTypes';
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
type FloorContent = { floorPublished: boolean; viewpoints: Stop[]; segments: Segment[] };
type Draft = {
  segmentId?: string;
  fromId: string;
  toId: string;
  waypoints: RoutePoint[];
  geometryChanged: boolean;
  walkingDurationSeconds: number;
  instruction: string;
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
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold">Walking connections</h2>
                {canCreate && (
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
              </div>
              {eligible.length < 2 && (
                <p className="text-sm">
                  Two Viewpoints with GPS coordinates are needed to add a connection.
                </p>
              )}
              {!content.segments.length && (
                <p className="text-sm">No connections saved on this Floor.</p>
              )}
              <ul className="divide-y rounded-md border">
                {content.segments.map((segment) => {
                  const start = stops.get(segment.fromId);
                  const end = stops.get(segment.toId);
                  const canPublish =
                    content.floorPublished && start?.isPublished && end?.isPublished;
                  return (
                    <li
                      key={segment._id}
                      className="flex flex-wrap items-start justify-between gap-3 p-3"
                    >
                      <div>
                        <p className="font-medium">
                          {stopLabel(segment.fromId)} → {stopLabel(segment.toId)}
                        </p>
                        <p className="text-sm">
                          {segment.isPublished ? 'Published' : 'Draft'} · {segment.distanceMeters} m
                          · {segment.walkingDurationSeconds} s
                        </p>
                        {segment.instruction && <p className="text-sm">{segment.instruction}</p>}
                        {!canPublish && (
                          <p className="text-sm">
                            Both Viewpoints and the Floor must be published for visitors to see this
                            connection.
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
            </div>
          )}
        </>
      )}
    </section>
  );
}
