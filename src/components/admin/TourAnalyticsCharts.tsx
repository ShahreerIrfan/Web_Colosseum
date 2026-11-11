import { useId } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Count = { _id: string; count: number };

export interface TourAnalyticsSummary {
  totals: Count[];
  landmarks: Count[];
  skipped: Count[];
  lastStops: Count[];
  completedDurations: { averageMs: number }[];
}

const exampleWeek = [
  { day: 'Mon', started: 18, completed: 12, stopped: 4 },
  { day: 'Tue', started: 24, completed: 17, stopped: 5 },
  { day: 'Wed', started: 20, completed: 14, stopped: 4 },
  { day: 'Thu', started: 30, completed: 21, stopped: 6 },
  { day: 'Fri', started: 28, completed: 19, stopped: 5 },
  { day: 'Sat', started: 42, completed: 31, stopped: 7 },
  { day: 'Sun', started: 36, completed: 27, stopped: 6 },
];

const demoCounts = (values: Record<string, number>): Count[] =>
  Object.entries(values).map(([_id, count]) => ({ _id, count }));

export const sampleTourAnalytics: TourAnalyticsSummary = {
  totals: demoCounts({
    tour_started: exampleWeek.reduce((total, row) => total + row.started, 0),
    tour_completed: exampleWeek.reduce((total, row) => total + row.completed, 0),
    tour_stopped: exampleWeek.reduce((total, row) => total + row.stopped, 0),
    narration_started: 384,
    narration_completed: 292,
  }),
  landmarks: demoCounts({
    Colosseum: 92,
    'Roman Forum': 55,
    'Arch of Constantine': 38,
    'Ludus Magnus': 24,
  }),
  skipped: demoCounts({
    'Arena overview': 16,
    'Imperial entrance': 12,
    'Upper terrace': 9,
    'East gallery': 6,
  }),
  lastStops: demoCounts({
    'North passage': 11,
    'Arena overlook': 8,
    'Museum entrance': 6,
    'East terrace': 4,
  }),
  completedDurations: [{ averageMs: 19.4 * 60_000 }],
};

export function eventCount(summary: TourAnalyticsSummary, type: string) {
  return summary.totals.find((item) => item._id === type)?.count ?? 0;
}

const primary = 'var(--chart-1)';
const gold = 'var(--chart-3)';
const tooltipStyle = {
  backgroundColor: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--popover-foreground)',
  fontSize: 12,
};
const tick = { fill: 'var(--muted-foreground)', fontSize: 11 };

function ExampleTrend() {
  const gradient = useId();
  return (
    <>
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-chart-1" /> Tours started
        </span>
        <span className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-chart-3" /> Tours completed
        </span>
      </div>
      <ResponsiveContainer width="100%" height={244}>
        <AreaChart
          accessibilityLayer
          data={exampleWeek}
          margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={primary} stopOpacity={0.34} />
              <stop offset="100%" stopColor={primary} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.32} />
          <XAxis dataKey="day" tick={tick} tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tick={tick} tickLine={false} axisLine={false} width={30} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Area
            type="monotone"
            dataKey="started"
            name="Tours started"
            stroke={primary}
            strokeWidth={2.5}
            fill={`url(#${gradient})`}
          />
          <Area
            type="monotone"
            dataKey="completed"
            name="Tours completed"
            stroke={gold}
            strokeWidth={2.5}
            fill={gold}
            fillOpacity={0.13}
          />
        </AreaChart>
      </ResponsiveContainer>
    </>
  );
}

function Breakdown({
  rows,
  color = primary,
  name = 'Count',
}: {
  rows: Count[];
  color?: string;
  name?: string;
}) {
  if (rows.length === 0)
    return <p className="py-10 text-center text-muted-foreground">No activity recorded.</p>;
  return (
    <>
      <ResponsiveContainer width="100%" height={Math.max(148, Math.min(rows.length, 5) * 37 + 30)}>
        <BarChart
          accessibilityLayer
          layout="vertical"
          data={rows.slice(0, 5)}
          margin={{ top: 4, right: 6, left: 0, bottom: 0 }}
        >
          <XAxis
            type="number"
            tick={tick}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="_id"
            width={110}
            tick={tick}
            axisLine={false}
            tickLine={false}
            tickFormatter={(label: string) =>
              label.length > 17 ? `${label.slice(0, 16)}…` : label
            }
          />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--muted)', opacity: 0.45 }} />
          <Bar dataKey="count" name={name} fill={color} maxBarSize={18} radius={[0, 5, 5, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <details className="mt-2 text-xs text-muted-foreground">
        <summary className="cursor-pointer">View counts</summary>
        <ul className="mt-2 space-y-1.5">
          {rows.map(({ _id, count }) => (
            <li key={_id} className="flex justify-between gap-3">
              <span className="break-all">{_id}</span>
              <span>{count}</span>
            </li>
          ))}
        </ul>
      </details>
    </>
  );
}

export default function TourAnalyticsCharts({
  summary,
  sample,
}: {
  summary: TourAnalyticsSummary;
  sample: boolean;
}) {
  const starts = eventCount(summary, 'narration_started');
  const completed = eventCount(summary, 'narration_completed');
  const narration = [
    { name: 'Completions', value: completed, color: primary },
    { name: 'Starts without a completion', value: Math.max(0, starts - completed), color: gold },
  ];
  const activity = demoCounts({
    'Tours started': eventCount(summary, 'tour_started'),
    'Tours completed': eventCount(summary, 'tour_completed'),
    'Tour stop events': eventCount(summary, 'tour_stopped'),
  });

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>{sample ? 'Tour activity over time' : 'Tour activity'}</CardTitle>
            <CardDescription>
              {sample
                ? 'Example week of tour starts and completions'
                : 'Event counts for the selected filters'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sample ? <ExampleTrend /> : <Breakdown rows={activity} name="Events" />}
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Narration activity</CardTitle>
            <CardDescription>
              {sample ? 'Example completions per start' : 'Recorded starts and completions'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sample ? (
              <>
                <div className="relative">
                  <ResponsiveContainer width="100%" height={194}>
                    <PieChart accessibilityLayer>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Pie
                        data={narration}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="62%"
                        outerRadius="88%"
                        stroke="var(--card)"
                        strokeWidth={3}
                      >
                        {narration.map((item) => (
                          <Cell key={item.name} fill={item.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
                    <strong className="text-2xl tabular-nums">
                      {Math.round((completed / starts) * 100)}%
                    </strong>
                    <span className="text-xs text-muted-foreground">per start</span>
                  </div>
                </div>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  {narration.map(({ name, value, color }) => (
                    <li key={name} className="flex items-center gap-2">
                      <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
                      <span className="flex-1">{name}</span>
                      <span className="tabular-nums">{value.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <Breakdown
                rows={demoCounts({ Starts: starts, Completions: completed })}
                name="Events"
              />
            )}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        {(
          [
            ['Landmark entries', 'Most entered locations', summary.landmarks, primary],
            ['Skipped Viewpoints', 'Stops most often skipped', summary.skipped, gold],
            [
              'Last Viewpoints in stopped tours',
              'Last recorded stop before an unfinished tour ended',
              summary.lastStops,
              'var(--chart-5)',
            ],
          ] as const
        ).map(([title, description, rows, color]) => (
          <Card key={title} className="min-w-0">
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Breakdown rows={rows} color={color} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
