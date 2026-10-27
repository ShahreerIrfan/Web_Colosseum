import { landmarkApi } from '@/apis/landmark/landmarkApi';
import { CreateLandmarkDialog } from '@/components/admin/CreateLandmarkDialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import useToast from '@/hooks/component/useToast';
import type { UserPayload } from '@/types/api/authTypes';
import type { Landmark as LandmarkModel } from '@/types/api/landmarkTypes';
import { getUserPayload } from '@/utils/localStorageUtils';
import { getEffectiveRbac, isModuleVisibleInSidebar } from '@/utils/rbacUtils';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  Footprints,
  Globe,
  Headphones,
  Landmark,
  Layers,
  Loader2,
  MapPin,
  Maximize2,
  Navigation,
  Plus,
  RefreshCw,
  Route,
  Search,
  Settings,
  ShieldCheck,
  Ticket,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

const MODULE_DEFINITIONS: Record<
  string,
  {
    name: string;
    description: string;
    category: string;
    singular: string;
    icon: React.ComponentType<{ className?: string }>;
    sampleData: Array<{ id: string; title: string; subtitle: string; tag: string }>;
  }
> = {
  viewpoints: {
    name: 'Viewpoint Hotspots',
    description:
      'Interactive 360-degree panorama hotspots, camera perspective angles, and compass gaze calibrations',
    category: 'Core Heritage',
    singular: 'Viewpoint',
    icon: Eye,
    sampleData: [
      {
        id: 'vp_hypogeum_01',
        title: 'Hypogeum Underground Gateway',
        subtitle: 'Lat: 41.89019, Lng: 12.49221 • Heading: 180°',
        tag: 'Level -1 Underground',
      },
      {
        id: 'vp_arena_02',
        title: 'Arena Floor Imperial Gladiator Box',
        subtitle: 'Lat: 41.89025, Lng: 12.49234 • Heading: 045°',
        tag: 'Level 1 Arena',
      },
      {
        id: 'vp_attic_03',
        title: 'Attic Panoramic Arch Viewpoint',
        subtitle: 'Lat: 41.89032, Lng: 12.49245 • Heading: 270°',
        tag: 'Level 3 Attic Overlook',
      },
    ],
  },
  landmarks: {
    name: 'Monuments & Landmarks',
    description:
      'Archaeological monuments, boundary polygon geometry, GPS anchors, and pin calibrations',
    category: 'Core Heritage',
    singular: 'Landmark',
    icon: Landmark,
    sampleData: [
      {
        id: 'lm_colosseum_main',
        title: 'Flavian Amphitheatre (Colosseum)',
        subtitle: 'GPS: 41.8902° N, 12.4922° E • 32 Polygon Anchors',
        tag: 'Monument Primary',
      },
      {
        id: 'lm_arch_constantine',
        title: 'Arch of Constantine',
        subtitle: 'GPS: 41.8898° N, 12.4913° E • Triumphal Arch',
        tag: 'Associated Site',
      },
    ],
  },
  floors: {
    name: 'Vector Floor Maps',
    description:
      'Multi-level architectural vector floor plans, SVG ground overlays, and indoor wayfinding',
    category: 'Core Heritage',
    singular: 'Floor Map',
    icon: Layers,
    sampleData: [
      {
        id: 'fl_level_neg1',
        title: 'Hypogeum Underground Level',
        subtitle: 'Elevation: -6.0m • Calibrated SVG Matrix Overlays',
        tag: 'floor_underground',
      },
      {
        id: 'fl_level_1',
        title: 'Arena Floor & Outer Ring',
        subtitle: 'Elevation: 0.0m • Wayfinding Graph Nodes',
        tag: 'floor_1',
      },
    ],
  },
  audio: {
    name: 'Audio Guides & Narration',
    description:
      'Studio narration audio tracks, multi-language acoustic guides, duration metadata, and streaming assets',
    category: 'Media & Localization',
    singular: 'Audio Track',
    icon: Headphones,
    sampleData: [
      {
        id: 'aud_gladiators_en',
        title: 'Gladiatorial Battles of the Arena (English)',
        subtitle: 'Duration: 3m 45s • High-Definition Studio Audio MP3',
        tag: 'Language: EN',
      },
      {
        id: 'aud_gladiators_it',
        title: 'Battaglie dei Gladiatori (Italiano)',
        subtitle: 'Duration: 3m 50s • Studio Narration IT',
        tag: 'Language: IT',
      },
    ],
  },
  languages: {
    name: 'Languages & Localization',
    description:
      'Multi-language translation catalogs (EN, IT, ES, FR, DE), locale preferences, and audio mappings',
    category: 'Media & Localization',
    singular: 'Language',
    icon: Globe,
    sampleData: [
      {
        id: 'lang_en',
        title: 'English (United States & UK)',
        subtitle: 'Code: en • 100% Translations Complete',
        tag: 'Default Locale',
      },
      {
        id: 'lang_it',
        title: 'Italiano (Italia)',
        subtitle: 'Code: it • 100% Translations Complete',
        tag: 'Native Park Locale',
      },
    ],
  },
  itineraries: {
    name: 'Walking Tour Itineraries',
    description:
      'Curated visitor pathways, sequential POI waypoint segments, walking distance, and pacing times',
    category: 'Navigation & Wayfinding',
    singular: 'Itinerary Pathway',
    icon: Footprints,
    sampleData: [
      {
        id: 'itin_highlights_45',
        title: 'Colosseum Express Tour (45 Minutes)',
        subtitle: '8 Viewpoints • 650m Walking Distance',
        tag: 'Popular Route',
      },
      {
        id: 'itin_full_underground',
        title: 'Deep Hypogeum & Top Tiers Comprehensive',
        subtitle: '16 Viewpoints • 1,200m Walking Distance',
        tag: 'Full Access Only',
      },
    ],
  },
  'pedestrian-routes': {
    name: 'Pedestrian Street Routes',
    description:
      'Turn-by-turn outdoor street routing between monuments, road graph geometry, and connectivity',
    category: 'Navigation & Wayfinding',
    singular: 'Street Route',
    icon: Route,
    sampleData: [
      {
        id: 'route_col_to_forum',
        title: 'Colosseum to Roman Forum Pathway',
        subtitle: 'Distance: 320m • Paved Pedestrian Walkway',
        tag: 'Outdoor Street',
      },
    ],
  },
  gps: {
    name: 'GPS Geofencing & Tracking',
    description:
      'Real-time visitor GPS positioning, magnetometer compass alignment, and proximity boundary triggers',
    category: 'Navigation & Wayfinding',
    singular: 'Geofence Rule',
    icon: Navigation,
    sampleData: [
      {
        id: 'geo_arena_perimeter',
        title: 'Arena Entry Proximity Trigger',
        subtitle: 'Trigger Radius: 4.5m • GPS Boundary Mesh',
        tag: 'Proximity: 4.5m',
      },
    ],
  },
  sync: {
    name: 'Sync Bundles & Manifests',
    description:
      'Offline package distribution, SHA-256 integrity hashes, delta sync manifests, and bundle releases',
    category: 'Distribution & Offline',
    singular: 'Sync Manifest',
    icon: RefreshCw,
    sampleData: [
      {
        id: 'pkg_v1_0_0',
        title: 'Master Offline Package Release 1.0.0',
        subtitle: 'SHA-256: e8b941...c82a • 14.8 MB Asset Bundle',
        tag: 'Current Active',
      },
    ],
  },
  'offline-storage': {
    name: 'Mobile Client Offline Cache',
    description:
      'Local client SQLite/JSON storage, media assets caching, and offline tour validation for zero-connectivity visits',
    category: 'Distribution & Offline',
    singular: 'Cache Store',
    icon: RefreshCw,
    sampleData: [
      {
        id: 'cache_vector_store',
        title: 'Vector Map Tiles SQLite Cache',
        subtitle: 'Local Storage Allocation: 24.2 MB',
        tag: 'Offline Verified',
      },
    ],
  },
  tickets: {
    name: 'Access & Tickets',
    description:
      'Tier access validation (General, Arena Priority, Full Access), QR voucher scans, and entry guard',
    category: 'Visitor Operations',
    singular: 'Ticket Tier',
    icon: Ticket,
    sampleData: [
      {
        id: 'tkt_tier_general',
        title: 'General Admission Ticket Tier',
        subtitle: 'Access: Outer Ring & Level 1 Corridors',
        tag: 'Tier: general',
      },
      {
        id: 'tkt_tier_full',
        title: 'Full Access All-Inclusive VIP',
        subtitle: 'Access: Hypogeum, Arena Floor, Attic Overlook',
        tag: 'Tier: full_access',
      },
    ],
  },
  'park-config': {
    name: 'Park Configuration',
    description:
      'Global park operating hours, proximity geofence radius settings, and visitor capacity limits',
    category: 'Park Administration',
    singular: 'Park Parameter',
    icon: Settings,
    sampleData: [
      {
        id: 'cfg_hours',
        title: 'Operating Hours Configuration',
        subtitle: '08:30 - 19:15 CEST • Max Concurrent Visitors: 3,000',
        tag: 'Active Rules',
      },
    ],
  },
  'staff-accounts': {
    name: 'Staff & User Accounts',
    description:
      'Administrative console credentials, staff accounts, authentication logs, and user profile management',
    category: 'Security & Access',
    singular: 'Staff Account',
    icon: Users,
    sampleData: [
      {
        id: 'usr_admin',
        title: 'Primary Administrator',
        subtitle: 'Email: admin@colosseumtour.it • Role: SUPER_ADMIN',
        tag: 'Root Access',
      },
      {
        id: 'usr_mod',
        title: 'Content Moderator',
        subtitle: 'Email: moderator@colosseumtour.it • Role: MODERATOR',
        tag: 'Content Staff',
      },
    ],
  },
  users: {
    name: 'Staff & User Accounts',
    description:
      'Administrative console credentials, staff accounts, authentication logs, and user profile management',
    category: 'Security & Access',
    singular: 'Staff Account',
    icon: Users,
    sampleData: [
      {
        id: 'usr_admin',
        title: 'Primary Administrator',
        subtitle: 'Email: admin@colosseumtour.it • Role: SUPER_ADMIN',
        tag: 'Root Access',
      },
      {
        id: 'usr_mod',
        title: 'Content Moderator',
        subtitle: 'Email: moderator@colosseumtour.it • Role: MODERATOR',
        tag: 'Content Staff',
      },
    ],
  },
};

export const ModuleManagementView: React.FC = () => {
  const { moduleKey = 'viewpoints' } = useParams<{ moduleKey: string }>();
  const { showSuccess, showInfo, showError } = useToast();

  const [isCreateLandmarkOpen, setIsCreateLandmarkOpen] = useState(false);
  const [editingLandmark, setEditingLandmark] = useState<LandmarkModel | null>(null);
  const [landmarkToDelete, setLandmarkToDelete] = useState<LandmarkModel | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [landmarks, setLandmarks] = useState<LandmarkModel[]>([]);
  const [isLoadingLandmarks, setIsLoadingLandmarks] = useState(false);
  const [landmarkSearch, setLandmarkSearch] = useState('');

  const user = useMemo<UserPayload | null>(() => {
    try {
      return getUserPayload();
    } catch {
      return null;
    }
  }, []);

  const moduleDef = MODULE_DEFINITIONS[moduleKey];

  // Fetch real landmarks when viewing landmarks module
  useEffect(() => {
    if (moduleKey === 'landmarks') {
      setIsLoadingLandmarks(true);
      landmarkApi
        .getAll()
        .then((res) => {
          setLandmarks(res);
        })
        .catch((err) => {
          console.error('Failed to load landmarks:', err);
        })
        .finally(() => {
          setIsLoadingLandmarks(false);
        });
    }
  }, [moduleKey]);

  // If module key doesn't exist, redirect to error
  if (!moduleDef) {
    return <Navigate to="/admin/dashboard/error" replace />;
  }

  // Check if current user has access to this module
  const hasAccess = isModuleVisibleInSidebar(moduleDef.name, user);
  if (!hasAccess) {
    return <Navigate to="/admin/dashboard/error" replace />;
  }

  // Get specific CRUD permissions for the badge display
  const effectiveRbac = getEffectiveRbac(user);
  const currentRbac = effectiveRbac.find(
    (item) => item['module name'].toLowerCase() === moduleDef.name.toLowerCase()
  ) || {
    'module name': moduleDef.name,
    Create: 'false',
    Read: 'true',
    Update: 'false',
    Delete: 'false',
  };

  const IconComponent = moduleDef.icon;
  const canCreate = currentRbac.Create === 'true';
  const canUpdate = currentRbac.Update === 'true';
  const canDelete = currentRbac.Delete === 'true';

  const filteredLandmarks = landmarks.filter((l) => {
    if (!landmarkSearch.trim()) return true;
    const q = landmarkSearch.toLowerCase();
    return (
      l.name.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q) ||
      (l.description && l.description.toLowerCase().includes(q))
    );
  });

  const handleConfirmDelete = async () => {
    if (!landmarkToDelete) return;
    const targetId = landmarkToDelete.id || landmarkToDelete.code;
    const name = landmarkToDelete.name;
    try {
      setIsDeleting(true);
      await landmarkApi.delete(targetId);
      setLandmarks((prev) => prev.filter((l) => l.id !== targetId && l.code !== targetId));
      showSuccess('Landmark Deleted', `Removed "${name}" and its associated media completely.`);
      setIsDeleteModalOpen(false);
      setLandmarkToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to delete landmark';
      showError('Delete Failed', msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 bg-background text-foreground space-y-6 max-w-6xl mx-auto w-full pb-12">
      {/* Create / Edit Landmark Modal */}
      {moduleKey === 'landmarks' && (
        <CreateLandmarkDialog
          open={isCreateLandmarkOpen}
          onOpenChange={(open) => {
            setIsCreateLandmarkOpen(open);
            if (!open) {
              setEditingLandmark(null);
            }
          }}
          landmarkToEdit={editingLandmark}
          onCreated={(newLandmark) => {
            setLandmarks((prev) => [
              newLandmark,
              ...prev.filter((l) => l.code !== newLandmark.code && l.id !== newLandmark.id),
            ]);
          }}
          onUpdated={(updatedLandmark) => {
            setLandmarks((prev) =>
              prev.map((l) =>
                l.id === updatedLandmark.id || l.code === updatedLandmark.code ? updatedLandmark : l
              )
            );
          }}
        />
      )}

      {/* Delete Confirmation Warning Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="sm:max-w-md bg-card border-border shadow-2xl p-6 overflow-hidden focus:outline-none focus-visible:ring-0"
        >
          <DialogHeader className="pb-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive font-bold shrink-0 border border-destructive/20">
                <AlertTriangle className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg font-black text-foreground tracking-tight">
                  Delete Landmark
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Confirm permanent deletion of the selected monument or landmark
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-3 space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <span className="font-bold text-foreground">{landmarkToDelete?.name}</span>? This
              action cannot be undone and will remove the monument from all active tours, floor
              maps, and Cloudinary media assets.
            </p>

            {landmarkToDelete && (
              <div className="p-3 bg-muted/40 border border-border rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">System Code:</span>
                  <span className="font-mono font-semibold text-foreground">
                    {landmarkToDelete.code}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Coordinates:</span>
                  <span className="font-mono text-foreground">
                    {landmarkToDelete.location?.coordinates?.[1]?.toFixed(5)},{' '}
                    {landmarkToDelete.location?.coordinates?.[0]?.toFixed(5)}
                  </span>
                </div>
                {landmarkToDelete.dimensions && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Dimensions:</span>
                    <span className="font-mono text-foreground">
                      {landmarkToDelete.dimensions.widthMeters}m ×{' '}
                      {landmarkToDelete.dimensions.heightMeters}m
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
              className="cursor-pointer border-border hover:bg-muted focus-visible:ring-0 focus-visible:outline-none"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold cursor-pointer shadow-xs focus-visible:ring-0 focus-visible:outline-none"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="size-3.5" />
                  <span>Delete Landmark</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="space-y-1">
          {moduleKey !== 'landmarks' && (
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold">
              <IconComponent className="size-3.5 text-primary" />
              <span>Admin Console</span>
              <span>/</span>
              <span>{moduleDef.category}</span>
            </div>
          )}
          <h1 className="text-2xl font-black text-foreground tracking-tight">{moduleDef.name}</h1>
          {moduleKey !== 'landmarks' && (
            <p className="text-xs text-muted-foreground">{moduleDef.description}</p>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {moduleKey !== 'landmarks' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                showInfo('Export Triggered', `Exporting current ${moduleDef.name} catalog...`)
              }
              className="gap-2 cursor-pointer border-border hover:bg-muted"
            >
              <Download className="size-3.5 text-muted-foreground" />
              <span>Export</span>
            </Button>
          )}

          <Button
            size="sm"
            disabled={!canCreate}
            onClick={() => {
              if (moduleKey === 'landmarks') {
                setEditingLandmark(null);
                setIsCreateLandmarkOpen(true);
              } else {
                showSuccess('Entry Created', `New ${moduleDef.singular} draft initialized.`);
              }
            }}
            className="gap-2 bg-primary text-primary-foreground font-semibold cursor-pointer shadow-xs hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            title={canCreate ? `Create new ${moduleDef.singular}` : 'Requires Create permission'}
          >
            <Plus className="size-3.5" />
            <span>New {moduleDef.singular}</span>
          </Button>
        </div>
      </div>

      {/* Permissions Transparency Banner */}
      {moduleKey !== 'landmarks' && (
        <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-foreground">
                Your Active Access Privileges ({user?.userRole || user?.role || 'SUPER_ADMIN'})
              </span>
              <p className="text-[11px] text-muted-foreground">
                Role permissions strictly enforced according to system RBAC policy.
              </p>
            </div>
          </div>

          {/* Granular CRUD Indicator Badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                canCreate
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {canCreate ? <CheckCircle2 className="size-2.5" /> : <XCircle className="size-2.5" />}
              CREATE
            </span>

            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="size-2.5" />
              READ
            </span>

            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                canUpdate
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {canUpdate ? <CheckCircle2 className="size-2.5" /> : <XCircle className="size-2.5" />}
              UPDATE
            </span>

            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                canDelete
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {canDelete ? <CheckCircle2 className="size-2.5" /> : <XCircle className="size-2.5" />}
              DELETE
            </span>

            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] font-semibold text-primary underline px-1.5"
            >
              <Link to="/admin/dashboard/rbac">Modify in RBAC</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Module Data Table */}
      <div className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border bg-secondary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Active {moduleDef.name} Catalog Entries
            </h2>
            {moduleKey !== 'landmarks' && (
              <p className="text-xs text-muted-foreground">
                Manage live records, coordinate calibrations, and sync manifests.
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {moduleKey === 'landmarks' && (
              <div className="relative">
                <Search className="size-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter landmarks..."
                  value={landmarkSearch}
                  onChange={(e) => setLandmarkSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-background border border-input rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-48 sm:w-60"
                />
              </div>
            )}
            {moduleKey !== 'landmarks' && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold whitespace-nowrap">
                {`${moduleDef.sampleData.length} Registered`}
              </span>
            )}
          </div>
        </div>

        {/* Landmarks Specific Catalog */}
        {moduleKey === 'landmarks' ? (
          <div>
            {isLoadingLandmarks ? (
              <div className="p-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-primary" />
                <span>Loading active monuments...</span>
              </div>
            ) : filteredLandmarks.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <p className="text-sm font-medium text-foreground">No landmarks found</p>
                <p className="text-xs text-muted-foreground">
                  {landmarkSearch
                    ? 'No records match your search filter.'
                    : 'Click "New Landmark" above to create your first monument.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredLandmarks.map((lm) => (
                  <div
                    key={lm.id || lm.code}
                    className="p-4 sm:px-6 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Logo Badge or Card preview */}
                      <div className="relative size-12 rounded-xl border border-border bg-muted/40 overflow-hidden shrink-0 flex items-center justify-center">
                        {lm.thumbnailUrl || lm.assetPath ? (
                          <img
                            src={lm.thumbnailUrl || lm.assetPath}
                            alt={lm.name}
                            className="size-full object-cover"
                          />
                        ) : (
                          <Landmark className="size-6 text-primary/60" />
                        )}
                        {lm.assetPath && lm.thumbnailUrl && (
                          <div
                            className="absolute -bottom-1 -right-1 size-5 rounded-md border border-border bg-card p-0.5 shadow-xs"
                            title="Logo Badge configured"
                          >
                            <img
                              src={lm.assetPath}
                              alt="Logo Badge"
                              className="size-full object-contain"
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-foreground">{lm.name}</span>
                          <span className="font-mono text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                            {lm.code}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              lm.isPublished
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            }`}
                          >
                            {lm.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <MapPin className="size-3 text-primary shrink-0" />
                            Lat: {lm.location?.coordinates?.[1]?.toFixed(5) ?? '0.00000'}, Lng:{' '}
                            {lm.location?.coordinates?.[0]?.toFixed(5) ?? '0.00000'}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <Maximize2 className="size-3 text-primary shrink-0" />
                            {lm.dimensions?.widthMeters ?? 0}m × {lm.dimensions?.heightMeters ?? 0}m
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!canUpdate}
                        onClick={(e) => {
                          e.currentTarget.blur();
                          setEditingLandmark(lm);
                          setIsCreateLandmarkOpen(true);
                        }}
                        className="h-8 px-3 text-xs border-border hover:bg-muted cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!canDelete}
                        onClick={(e) => {
                          e.currentTarget.blur();
                          setLandmarkToDelete(lm);
                          setIsDeleteModalOpen(true);
                        }}
                        className="h-8 px-3 text-xs border-destructive/20 text-destructive hover:bg-destructive/10 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Standard Generic Catalog for other modules */
          <div className="divide-y divide-border">
            {moduleDef.sampleData.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:px-6 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">{item.title}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-mono">
                      {item.tag}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">{item.subtitle}</div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canUpdate}
                    onClick={() => showInfo('Edit Triggered', `Editing "${item.title}"...`)}
                    className="h-8 px-3 text-xs border-border hover:bg-muted cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canDelete}
                    onClick={() => showSuccess('Removed', `Entry "${item.title}" deleted.`)}
                    className="h-8 px-3 text-xs border-destructive/20 text-destructive hover:bg-destructive/10 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleManagementView;
