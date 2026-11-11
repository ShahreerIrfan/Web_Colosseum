import { useEffect, useState } from 'react';
import api from '@/apis/axios';
import ModuleLoading from '@/components/admin/ModuleLoading';
import TourAnalyticsCharts, {
  eventCount,
  sampleTourAnalytics,
  type TourAnalyticsSummary,
} from '@/components/admin/TourAnalyticsCharts';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import type { BaseSuccessResponse } from '@/types/api/CommonTypes';

const defaultFilters = { days: '30', tourKind: '', landmarkId: '', floorId: '', language: '' };
const inputClass = 'block w-full rounded border bg-background p-2';

export default function Dashboard() {
  const [filters, setFilters] = useState(defaultFilters);
  const [applied, setApplied] = useState(defaultFilters);
  const [summary, setSummary] = useState<TourAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const params = Object.fromEntries(Object.entries(applied).filter(([, value]) => value));
    api
      .get<BaseSuccessResponse<TourAnalyticsSummary>>('/analytics/summary', { params })
      .then(({ data }) => {
        if (active) setSummary(data.data);
      })
      .catch(() => {
        if (active) setError('Unable to load analytics.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [applied]);

  const hasContentFilter =
    applied.tourKind || applied.landmarkId || applied.floorId || applied.language;
  const sample = summary != null && !hasContentFilter && summary.totals.length === 0;
  const displayed = sample ? sampleTourAnalytics : summary;
  const count = (type: string) => (displayed ? eventCount(displayed, type) : 0);
  const played = count('narration_started');
  const completed = count('narration_completed');
  const average = displayed?.completedDurations[0]?.averageMs;

  return (
    <div className="flex w-full max-w-7xl flex-1 flex-col gap-5 md:p-6">
      <h1 className="text-2xl font-bold">Tour analytics</h1>
      <p className="text-sm text-muted-foreground">
        Totals cover consenting visitors. The stop report shows the last recorded Viewpoint for
        sessions with a stop event and no completion event in this report.
      </p>
      <form
        className="grid gap-3 sm:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault();
          setError('');
          setSummary(null);
          setLoading(true);
          setApplied({ ...filters });
        }}
      >
        <label htmlFor="analytics-time-window">
          Time window
          <Select value={filters.days} onValueChange={(days) => setFilters({ ...filters, days })}>
            <SelectTrigger id="analytics-time-window" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <label htmlFor="analytics-tour-type">
          Tour type
          <Select
            value={filters.tourKind || 'all'}
            onValueChange={(tourKind) =>
              setFilters({ ...filters, tourKind: tourKind === 'all' ? '' : tourKind })
            }
          >
            <SelectTrigger id="analytics-tour-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="outdoor">Outdoor</SelectItem>
              <SelectItem value="floor">Floor</SelectItem>
            </SelectContent>
          </Select>
        </label>
        {(
          [
            ['landmarkId', 'Landmark code'],
            ['floorId', 'Floor ID'],
            ['language', 'Language code'],
          ] as const
        ).map(([field, label]) => (
          <label key={field}>
            {label}
            <input
              className={inputClass}
              maxLength={120}
              value={filters[field]}
              onChange={(event) => setFilters({ ...filters, [field]: event.target.value.trim() })}
            />
          </label>
        ))}
        <Button type="submit" className="self-end">
          Apply filters
        </Button>
      </form>
      {loading && <ModuleLoading />}
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      {sample && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-muted px-4 py-3 text-sm"
        >
          <span className="font-semibold">Sample data</span>
          <span className="text-muted-foreground">
            No live activity in this time window. The cards and charts show an example week.
          </span>
        </div>
      )}
      {displayed && (
        <>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Tours started', count('tour_started')],
              ['Tours completed', count('tour_completed')],
              ['Tour stop events', count('tour_stopped')],
              [
                'Average completed tour',
                average == null ? '—' : `${(average / 60000).toFixed(1)} min`,
              ],
              ['Narration starts', played],
              ['Narration completions', completed],
              [
                'Narration completions per start',
                played ? `${Math.round((completed / played) * 100)}%` : '—',
              ],
            ].map(([label, value]) => (
              <Card
                key={label}
                className={`gap-1 px-4 ${label === 'Narration completions per start' ? 'sm:col-span-2' : ''}`}
              >
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="text-2xl font-semibold tabular-nums">{value}</dd>
              </Card>
            ))}
          </dl>
          <TourAnalyticsCharts summary={displayed} sample={sample} />
        </>
      )}
    </div>
  );
}
