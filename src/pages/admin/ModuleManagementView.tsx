import { floorApi } from '@/apis/floor/floorApi';
import { landmarkApi } from '@/apis/landmark/landmarkApi';
import { viewpointApi } from '@/apis/viewpoint/viewpointApi';
import { CreateFloorDialog } from '@/components/admin/CreateFloorDialog';
import { CreateLandmarkDialog } from '@/components/admin/CreateLandmarkDialog';
import { CreateViewpointDialog } from '@/components/admin/CreateViewpointDialog';
import ModuleLoading from '@/components/admin/ModuleLoading';
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
import type { FloorModel } from '@/types/api/floorTypes';
import type { Landmark as LandmarkModel } from '@/types/api/landmarkTypes';
import type { ViewpointModel } from '@/types/api/viewpointTypes';
import { getUserPayload } from '@/utils/localStorageUtils';
import { getEffectiveRbac, isModuleVisibleInSidebar } from '@/utils/rbacUtils';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  Globe,
  Landmark,
  Layers,
  MapPin,
  Maximize2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Ticket,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  return <ModuleCatalog key={moduleKey} moduleKey={moduleKey} />;
};

function ModuleCatalog({ moduleKey }: { moduleKey: string }) {
  const { showSuccess, showInfo, showError } = useToast();

  const [isCreateLandmarkOpen, setIsCreateLandmarkOpen] = useState(false);
  const [editingLandmark, setEditingLandmark] = useState<LandmarkModel | null>(null);
  const [landmarkToDelete, setLandmarkToDelete] = useState<LandmarkModel | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [landmarks, setLandmarks] = useState<LandmarkModel[]>([]);
  const [landmarkSearch, setLandmarkSearch] = useState('');

  // Floors State
  const [isCreateFloorOpen, setIsCreateFloorOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState<FloorModel | null>(null);
  const [floorToDelete, setFloorToDelete] = useState<FloorModel | null>(null);
  const [isDeleteFloorModalOpen, setIsDeleteFloorModalOpen] = useState(false);
  const [isDeletingFloor, setIsDeletingFloor] = useState(false);
  const [floors, setFloors] = useState<FloorModel[]>([]);
  const [floorSearch, setFloorSearch] = useState('');
  const [collapsedLandmarks, setCollapsedLandmarks] = useState<Record<string, boolean>>({});
  const [targetLandmarkForNewFloor, setTargetLandmarkForNewFloor] = useState<string | undefined>(
    undefined
  );

  // Viewpoints State
  const [isCreateViewpointOpen, setIsCreateViewpointOpen] = useState(false);
  const [editingViewpoint, setEditingViewpoint] = useState<ViewpointModel | null>(null);
  const [viewpointToDelete, setViewpointToDelete] = useState<ViewpointModel | null>(null);
  const [isDeleteViewpointModalOpen, setIsDeleteViewpointModalOpen] = useState(false);
  const [isDeletingViewpoint, setIsDeletingViewpoint] = useState(false);
  const [viewpoints, setViewpoints] = useState<ViewpointModel[]>([]);
  const [viewpointLoadFailed, setViewpointLoadFailed] = useState(false);
  const [viewpointSearch, setViewpointSearch] = useState('');
  const [collapsedViewpointLandmarks, setCollapsedViewpointLandmarks] = useState<
    Record<string, boolean>
  >({});
  const [collapsedViewpointFloors, setCollapsedViewpointFloors] = useState<Record<string, boolean>>(
    {}
  );
  const [targetLandmarkForNewViewpoint, setTargetLandmarkForNewViewpoint] = useState<
    string | undefined
  >(undefined);
  const [targetFloorForNewViewpoint, setTargetFloorForNewViewpoint] = useState<string | undefined>(
    undefined
  );

  const user = useMemo<UserPayload | null>(() => {
    try {
      return getUserPayload();
    } catch {
      return null;
    }
  }, []);

  const moduleDef = MODULE_DEFINITIONS[moduleKey];

  const [loading, setLoading] = useState(
    moduleKey === 'landmarks' || moduleKey === 'floors' || moduleKey === 'viewpoints'
  );

  useEffect(() => {
    if (moduleKey !== 'landmarks' && moduleKey !== 'floors' && moduleKey !== 'viewpoints') return;
    let active = true;

    const landmarkRequest = landmarkApi
      .getAll()
      .then((items) => {
        if (active) setLandmarks(items);
      })
      .catch((error: unknown) => console.error('Failed to load landmarks:', error));
    const floorRequest =
      moduleKey === 'landmarks'
        ? null
        : floorApi
            .getAll()
            .then((items) => {
              if (active) setFloors(items);
            })
            .catch((error: unknown) => console.error('Failed to load floor maps:', error));
    const viewpointRequest =
      moduleKey !== 'viewpoints'
        ? null
        : viewpointApi
            .getAll()
            .then((items) => {
              if (active) setViewpoints(items);
            })
            .catch(() => {
              if (active) setViewpointLoadFailed(true);
            });

    void Promise.all([landmarkRequest, floorRequest, viewpointRequest]).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [moduleKey]);

  const filteredLandmarks = useMemo(() => {
    if (!landmarkSearch.trim()) return landmarks;
    const q = landmarkSearch.toLowerCase();
    return landmarks.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q) ||
        (l.description && l.description.toLowerCase().includes(q))
    );
  }, [landmarks, landmarkSearch]);

  const filteredFloors = useMemo(() => {
    if (!floorSearch.trim()) return floors;
    const q = floorSearch.toLowerCase();
    return floors.filter(
      (f) =>
        f.displayName.toLowerCase().includes(q) ||
        f.shortName.toLowerCase().includes(q) ||
        f.floorId.toLowerCase().includes(q) ||
        f.landmarkCode.toLowerCase().includes(q) ||
        (f.semanticLabel && f.semanticLabel.toLowerCase().includes(q))
    );
  }, [floors, floorSearch]);

  const groupedFloors = useMemo<
    Array<{
      landmarkCode: string;
      landmarkName: string;
      landmarkLogo?: string;
      floors: FloorModel[];
    }>
  >(() => {
    const norm = (str: string) => str.toLowerCase().replace(/[-_]/g, '');

    const landmarkMap = new Map<string, LandmarkModel>();
    landmarks.forEach((lm) => {
      landmarkMap.set(norm(lm.code), lm);
      if (lm.id) landmarkMap.set(norm(lm.id), lm);
    });

    const groupsMap = new Map<
      string,
      {
        landmarkCode: string;
        landmarkName: string;
        landmarkLogo?: string;
        floors: FloorModel[];
      }
    >();

    filteredFloors.forEach((fl) => {
      const code = fl.landmarkCode || 'colosseum';
      const normalizedKey = norm(code);
      const matchedLandmark = landmarkMap.get(normalizedKey);

      const landmarkName =
        matchedLandmark?.name ||
        (code === 'colosseum'
          ? 'Colosseum (Flavian Amphitheatre)'
          : code
              .split(/[-_]/)
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' '));

      const landmarkLogo = matchedLandmark?.thumbnailUrl || matchedLandmark?.assetPath;

      if (!groupsMap.has(normalizedKey)) {
        groupsMap.set(normalizedKey, {
          landmarkCode: matchedLandmark?.code || code,
          landmarkName,
          landmarkLogo,
          floors: [],
        });
      }

      groupsMap.get(normalizedKey)!.floors.push(fl);
    });

    return Array.from(groupsMap.values());
  }, [filteredFloors, landmarks]);

  const toggleLandmarkCollapse = useCallback((landmarkCode: string) => {
    setCollapsedLandmarks((prev) => ({
      ...prev,
      [landmarkCode]: !prev[landmarkCode],
    }));
  }, []);

  const handleExpandAll = useCallback(() => {
    setCollapsedLandmarks({});
  }, []);

  const handleCollapseAll = useCallback(() => {
    const allCollapsed: Record<string, boolean> = {};
    groupedFloors.forEach((g) => {
      allCollapsed[g.landmarkCode] = true;
    });
    setCollapsedLandmarks(allCollapsed);
  }, [groupedFloors]);

  const groupedViewpoints = useMemo<
    Array<{
      landmarkCode: string;
      landmarkName: string;
      landmarkLogo?: string;
      totalHotspots: number;
      floors: Array<{
        floorId: string;
        displayName: string;
        shortName?: string;
        levelIndex?: number;
        floorModel?: FloorModel;
        viewpoints: ViewpointModel[];
      }>;
    }>
  >(() => {
    const norm = (str?: string) => (str || '').toLowerCase().replace(/[-_]/g, '');

    const landmarkMap = new Map<string, LandmarkModel>();
    landmarks.forEach((lm) => {
      landmarkMap.set(norm(lm.code), lm);
      if (lm.id) landmarkMap.set(norm(lm.id), lm);
    });

    const floorMap = new Map<string, FloorModel>();
    floors.forEach((fl) => {
      floorMap.set(norm(fl.floorId), fl);
      if (fl.id) floorMap.set(norm(fl.id), fl);
    });

    const q = viewpointSearch.trim().toLowerCase();
    const matchesSearch = (vp: ViewpointModel, fl?: FloorModel, lm?: LandmarkModel) => {
      if (!q) return true;
      return (
        vp.title.toLowerCase().includes(q) ||
        vp.id.toLowerCase().includes(q) ||
        vp.floorId.toLowerCase().includes(q) ||
        (vp.description && vp.description.toLowerCase().includes(q)) ||
        (fl &&
          (fl.displayName.toLowerCase().includes(q) ||
            fl.shortName.toLowerCase().includes(q) ||
            fl.floorId.toLowerCase().includes(q))) ||
        (lm && (lm.name.toLowerCase().includes(q) || lm.code.toLowerCase().includes(q)))
      );
    };

    const matchingViewpoints = viewpoints.filter((vp) => {
      const fl = floorMap.get(norm(vp.floorId));
      const lmCode = fl?.landmarkCode || 'colosseum';
      const lm = landmarkMap.get(norm(lmCode));
      return matchesSearch(vp, fl, lm);
    });

    type FloorGroup = {
      floorId: string;
      displayName: string;
      shortName?: string;
      levelIndex?: number;
      floorModel?: FloorModel;
      viewpoints: ViewpointModel[];
    };

    const landmarkGroups = new Map<
      string,
      {
        landmarkCode: string;
        landmarkName: string;
        landmarkLogo?: string;
        floorsMap: Map<string, FloorGroup>;
      }
    >();

    // When no search query is active, preload registered landmarks and their floors
    if (!q) {
      landmarks.forEach((lm) => {
        const lmKey = norm(lm.code);
        landmarkGroups.set(lmKey, {
          landmarkCode: lm.code,
          landmarkName: lm.name,
          landmarkLogo: lm.thumbnailUrl || lm.assetPath,
          floorsMap: new Map(),
        });
      });

      floors.forEach((fl) => {
        const code = fl.landmarkCode || 'colosseum';
        const lmKey = norm(code);
        let lmGroup = landmarkGroups.get(lmKey);
        if (!lmGroup) {
          const matchedLm = landmarkMap.get(lmKey);
          lmGroup = {
            landmarkCode: matchedLm?.code || code,
            landmarkName: matchedLm?.name || code,
            landmarkLogo: matchedLm?.thumbnailUrl || matchedLm?.assetPath,
            floorsMap: new Map(),
          };
          landmarkGroups.set(lmKey, lmGroup);
        }

        const flKey = norm(fl.floorId || fl.id);
        if (!lmGroup.floorsMap.has(flKey)) {
          lmGroup.floorsMap.set(flKey, {
            floorId: fl.floorId || fl.id,
            displayName: fl.displayName || fl.shortName || fl.floorId,
            shortName: fl.shortName,
            levelIndex: fl.levelIndex,
            floorModel: fl,
            viewpoints: [],
          });
        }
      });
    }

    matchingViewpoints.forEach((vp) => {
      const matchedFloor = floorMap.get(norm(vp.floorId));
      const rawLandmarkCode = matchedFloor?.landmarkCode || 'colosseum';
      const lmKey = norm(rawLandmarkCode);

      let lmGroup = landmarkGroups.get(lmKey);
      if (!lmGroup) {
        const matchedLm = landmarkMap.get(lmKey);
        const landmarkName =
          matchedLm?.name ||
          (rawLandmarkCode === 'colosseum'
            ? 'Colosseum (Flavian Amphitheatre)'
            : rawLandmarkCode
                .split(/[-_]/)
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' '));
        lmGroup = {
          landmarkCode: matchedLm?.code || rawLandmarkCode,
          landmarkName,
          landmarkLogo: matchedLm?.thumbnailUrl || matchedLm?.assetPath,
          floorsMap: new Map(),
        };
        landmarkGroups.set(lmKey, lmGroup);
      }

      const flKey = norm(vp.floorId);
      let floorGroup = lmGroup.floorsMap.get(flKey);
      if (!floorGroup) {
        floorGroup = {
          floorId: vp.floorId,
          displayName: matchedFloor?.displayName || `Floor: ${vp.floorId}`,
          shortName: matchedFloor?.shortName,
          levelIndex: matchedFloor?.levelIndex,
          floorModel: matchedFloor,
          viewpoints: [],
        };
        lmGroup.floorsMap.set(flKey, floorGroup);
      }

      floorGroup.viewpoints.push(vp);
    });

    const result: Array<{
      landmarkCode: string;
      landmarkName: string;
      landmarkLogo?: string;
      totalHotspots: number;
      floors: FloorGroup[];
    }> = [];

    landmarkGroups.forEach((lmGroup) => {
      const floorsList = Array.from(lmGroup.floorsMap.values());
      floorsList.sort((a, b) => {
        const aIdx = a.levelIndex ?? 999;
        const bIdx = b.levelIndex ?? 999;
        return aIdx - bIdx;
      });

      const totalHotspots = floorsList.reduce((acc, f) => acc + f.viewpoints.length, 0);

      if (q && totalHotspots === 0) return;
      if (!q && floorsList.length === 0 && totalHotspots === 0) return;

      floorsList.forEach((fl) => {
        fl.viewpoints.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      });

      result.push({
        landmarkCode: lmGroup.landmarkCode,
        landmarkName: lmGroup.landmarkName,
        landmarkLogo: lmGroup.landmarkLogo,
        totalHotspots,
        floors: q ? floorsList.filter((f) => f.viewpoints.length > 0) : floorsList,
      });
    });

    result.sort((a, b) => {
      if (norm(a.landmarkCode) === 'colosseum') return -1;
      if (norm(b.landmarkCode) === 'colosseum') return 1;
      return b.totalHotspots - a.totalHotspots;
    });

    return result;
  }, [viewpoints, floors, landmarks, viewpointSearch]);

  const totalFilteredHotspots = useMemo(
    () => groupedViewpoints.reduce((acc, g) => acc + g.totalHotspots, 0),
    [groupedViewpoints]
  );

  const toggleViewpointLandmarkCollapse = useCallback((landmarkCode: string) => {
    setCollapsedViewpointLandmarks((prev) => ({
      ...prev,
      [landmarkCode]: !prev[landmarkCode],
    }));
  }, []);

  const toggleViewpointFloorCollapse = useCallback((floorKey: string) => {
    setCollapsedViewpointFloors((prev) => ({
      ...prev,
      [floorKey]: !prev[floorKey],
    }));
  }, []);

  const handleExpandAllViewpoints = useCallback(() => {
    setCollapsedViewpointLandmarks({});
    setCollapsedViewpointFloors({});
  }, []);

  const handleCollapseAllViewpoints = useCallback(() => {
    const allLm: Record<string, boolean> = {};
    const allFl: Record<string, boolean> = {};
    groupedViewpoints.forEach((lm) => {
      allLm[lm.landmarkCode] = true;
      lm.floors.forEach((fl) => {
        allFl[`${lm.landmarkCode}_${fl.floorId}`] = true;
      });
    });
    setCollapsedViewpointLandmarks(allLm);
    setCollapsedViewpointFloors(allFl);
  }, [groupedViewpoints]);

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

  const handleConfirmDeleteFloor = async () => {
    if (!floorToDelete) return;
    const targetId = floorToDelete.id || floorToDelete.floorId;
    const name = floorToDelete.displayName;
    try {
      setIsDeletingFloor(true);
      await floorApi.delete(targetId);
      setFloors((prev) => prev.filter((f) => f.id !== targetId && f.floorId !== targetId));
      showSuccess('Floor Map Deleted', `Removed "${name}" and unlinked its vector map assets.`);
      setIsDeleteFloorModalOpen(false);
      setFloorToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to delete floor map';
      showError('Delete Failed', msg);
    } finally {
      setIsDeletingFloor(false);
    }
  };

  const handleConfirmDeleteViewpoint = async () => {
    if (!viewpointToDelete) return;
    const targetId = viewpointToDelete.id;
    const name = viewpointToDelete.title;
    try {
      setIsDeletingViewpoint(true);
      await viewpointApi.delete(targetId);
      setViewpoints((prev) => prev.filter((v) => v.id !== targetId));
      showSuccess('Viewpoint Deleted', `Removed "${name}" from tour stops.`);
      setIsDeleteViewpointModalOpen(false);
      setViewpointToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to delete viewpoint';
      showError('Delete Failed', msg);
    } finally {
      setIsDeletingViewpoint(false);
    }
  };

  if (loading) return <ModuleLoading />;

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

      {/* Create / Edit Floor Map Modal */}
      {moduleKey === 'floors' && (
        <CreateFloorDialog
          open={isCreateFloorOpen}
          onOpenChange={(open) => {
            setIsCreateFloorOpen(open);
            if (!open) {
              setEditingFloor(null);
            }
          }}
          floorToEdit={editingFloor}
          onCreated={(newFloor) => {
            setFloors((prev) => [
              newFloor,
              ...prev.filter((f) => f.floorId !== newFloor.floorId && f.id !== newFloor.id),
            ]);
          }}
          onUpdated={(updatedFloor) => {
            setFloors((prev) =>
              prev.map((f) =>
                f.id === editingFloor?.id || f.floorId === editingFloor?.floorId ? updatedFloor : f
              )
            );
          }}
          landmarkOptions={
            landmarks.length > 0
              ? landmarks.map((l) => ({ code: l.code, name: l.name }))
              : [{ code: 'colosseum', name: 'Colosseum (Flavian Amphitheatre)' }]
          }
          defaultLandmarkCode={targetLandmarkForNewFloor}
          onSubmitFloor={async (payload) => {
            if (editingFloor) {
              const targetId = editingFloor.id || editingFloor.floorId;
              return await floorApi.update(targetId, payload);
            }
            return await floorApi.create(payload);
          }}
        />
      )}

      {/* Create / Edit Viewpoint Modal */}
      {moduleKey === 'viewpoints' && (
        <CreateViewpointDialog
          open={isCreateViewpointOpen}
          onOpenChange={(open) => {
            setIsCreateViewpointOpen(open);
            if (!open) {
              setEditingViewpoint(null);
              setTargetLandmarkForNewViewpoint(undefined);
              setTargetFloorForNewViewpoint(undefined);
            }
          }}
          viewpointToEdit={editingViewpoint}
          landmarks={landmarks}
          floors={floors}
          defaultLandmarkCode={targetLandmarkForNewViewpoint}
          defaultFloorId={targetFloorForNewViewpoint}
          onCreated={(newVp) => {
            setViewpoints((prev) => [newVp, ...prev.filter((v) => v.id !== newVp.id)]);
          }}
          onUpdated={(updatedVp) => {
            setViewpoints((prev) => prev.map((v) => (v.id === updatedVp.id ? updatedVp : v)));
          }}
          onSubmitViewpoint={async (payload) => {
            if (editingViewpoint) {
              return await viewpointApi.update(editingViewpoint.id, payload);
            }
            return await viewpointApi.create(payload);
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

      {/* Delete Floor Confirmation Warning Modal */}
      <Dialog open={isDeleteFloorModalOpen} onOpenChange={setIsDeleteFloorModalOpen}>
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
                  Delete Floor Map
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Confirm permanent deletion of the selected vector floor map
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-3 space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <span className="font-bold text-foreground">{floorToDelete?.displayName}</span>? This
              action cannot be undone and will unlink viewpoints and navigation graph nodes
              associated with this floor.
            </p>

            {floorToDelete && (
              <div className="p-3 bg-muted/40 border border-border rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Floor Identifier:</span>
                  <span className="font-mono font-semibold text-foreground">
                    {floorToDelete.floorId}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Level Index:</span>
                  <span className="font-mono text-foreground">
                    Level {floorToDelete.levelIndex} ({floorToDelete.floorNumberLabel})
                  </span>
                </div>
                {floorToDelete.calibration?.centerCoordinates && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Coordinates:</span>
                    <span className="font-mono text-foreground">
                      {floorToDelete.calibration.centerCoordinates.latitude.toFixed(5)},{' '}
                      {floorToDelete.calibration.centerCoordinates.longitude.toFixed(5)}
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
              onClick={() => setIsDeleteFloorModalOpen(false)}
              disabled={isDeletingFloor}
              className="cursor-pointer border-border hover:bg-muted focus-visible:ring-0 focus-visible:outline-none"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmDeleteFloor}
              disabled={isDeletingFloor}
              className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold cursor-pointer shadow-xs focus-visible:ring-0 focus-visible:outline-none"
            >
              {isDeletingFloor ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="size-3.5" />
                  <span>Delete Floor Map</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Warning Modal for Viewpoints */}
      <Dialog open={isDeleteViewpointModalOpen} onOpenChange={setIsDeleteViewpointModalOpen}>
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
                  Delete Viewpoint
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Confirm permanent deletion of the selected viewpoint hotspot
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-3 space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <span className="font-bold text-foreground">{viewpointToDelete?.title}</span>? This
              action cannot be undone and will remove the hotspot from audio tour guides and floor
              maps.
            </p>

            {viewpointToDelete && (
              <div className="p-3 bg-muted/40 border border-border rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Viewpoint ID:</span>
                  <span className="font-mono font-semibold text-foreground">
                    {viewpointToDelete.id}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Associated Floor:</span>
                  <span className="font-mono text-foreground">{viewpointToDelete.floorId}</span>
                </div>
                {viewpointToDelete.latitude !== null && viewpointToDelete.longitude !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">GPS Coordinates:</span>
                    <span className="font-mono text-foreground">
                      {viewpointToDelete.latitude?.toFixed(5)},{' '}
                      {viewpointToDelete.longitude?.toFixed(5)}
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
              onClick={() => setIsDeleteViewpointModalOpen(false)}
              disabled={isDeletingViewpoint}
              className="cursor-pointer border-border hover:bg-muted focus-visible:ring-0 focus-visible:outline-none"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmDeleteViewpoint}
              disabled={isDeletingViewpoint}
              className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold cursor-pointer shadow-xs focus-visible:ring-0 focus-visible:outline-none"
            >
              {isDeletingViewpoint ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="size-3.5" />
                  <span>Delete Viewpoint</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="space-y-1">
          {moduleKey !== 'landmarks' && moduleKey !== 'floors' && moduleKey !== 'viewpoints' && (
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold">
              <IconComponent className="size-3.5 text-primary" />
              <span>Admin Console</span>
              <span>/</span>
              <span>{moduleDef.category}</span>
            </div>
          )}
          <h1 className="text-2xl font-black text-foreground tracking-tight">{moduleDef.name}</h1>
          {moduleKey !== 'landmarks' && moduleKey !== 'floors' && moduleKey !== 'viewpoints' && (
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
              } else if (moduleKey === 'floors') {
                setTargetLandmarkForNewFloor(undefined);
                setEditingFloor(null);
                setIsCreateFloorOpen(true);
              } else if (moduleKey === 'viewpoints') {
                setTargetLandmarkForNewViewpoint(undefined);
                setTargetFloorForNewViewpoint(undefined);
                setEditingViewpoint(null);
                setIsCreateViewpointOpen(true);
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
      {moduleKey !== 'landmarks' && moduleKey !== 'floors' && moduleKey !== 'viewpoints' && (
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
            {moduleKey !== 'landmarks' && moduleKey !== 'floors' && moduleKey !== 'viewpoints' && (
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
            {moduleKey === 'floors' && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={
                    Object.values(collapsedLandmarks).some(Boolean)
                      ? handleExpandAll
                      : handleCollapseAll
                  }
                  className="h-8 text-xs text-muted-foreground hover:text-foreground cursor-pointer px-2"
                >
                  {Object.values(collapsedLandmarks).some(Boolean) ? 'Expand All' : 'Collapse All'}
                </Button>
                <div className="relative">
                  <Search className="size-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Filter floor maps..."
                    value={floorSearch}
                    onChange={(e) => setFloorSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-background border border-input rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-44 sm:w-56"
                  />
                </div>
              </div>
            )}
            {moduleKey === 'viewpoints' && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={
                    Object.values(collapsedViewpointLandmarks).some(Boolean) ||
                    Object.values(collapsedViewpointFloors).some(Boolean)
                      ? handleExpandAllViewpoints
                      : handleCollapseAllViewpoints
                  }
                  className="h-8 text-xs text-muted-foreground hover:text-foreground cursor-pointer px-2"
                >
                  {Object.values(collapsedViewpointLandmarks).some(Boolean) ||
                  Object.values(collapsedViewpointFloors).some(Boolean)
                    ? 'Expand All'
                    : 'Collapse All'}
                </Button>
                <div className="relative">
                  <Search className="size-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Filter viewpoints by title, floor or ID..."
                    value={viewpointSearch}
                    onChange={(e) => setViewpointSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-background border border-input rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-48 sm:w-64"
                  />
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold whitespace-nowrap">
                  {`${viewpoints.length} Registered`}
                </span>
              </div>
            )}
            {moduleKey !== 'landmarks' && moduleKey !== 'floors' && moduleKey !== 'viewpoints' && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold whitespace-nowrap">
                {`${moduleDef.sampleData.length} Registered`}
              </span>
            )}
          </div>
        </div>

        {/* Landmarks Specific Catalog */}
        {moduleKey === 'landmarks' ? (
          <div>
            {filteredLandmarks.length === 0 ? (
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
        ) : moduleKey === 'floors' ? (
          /* Floors Grouped by Landmark */
          <div>
            {groupedFloors.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <p className="text-sm font-medium text-foreground">No floor maps found</p>
                <p className="text-xs text-muted-foreground">
                  {floorSearch
                    ? 'No records match your search filter.'
                    : 'Click "New Floor Map" above to register an architectural floor plan.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {groupedFloors.map((group) => {
                  const isCollapsed = Boolean(collapsedLandmarks[group.landmarkCode]);
                  return (
                    <div key={group.landmarkCode} className="transition-colors">
                      {/* Landmark Accordion Header */}
                      <div
                        onClick={() => toggleLandmarkCollapse(group.landmarkCode)}
                        className="p-3 sm:px-5 bg-muted/40 hover:bg-muted/70 transition-colors flex items-center justify-between gap-3 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            aria-label={
                              isCollapsed ? 'Extend landmark floors' : 'Collapse landmark floors'
                            }
                            className="size-6 rounded-md flex items-center justify-center hover:bg-muted text-foreground transition-transform shrink-0"
                          >
                            <ChevronDown
                              className={`size-4 text-foreground transition-transform duration-200 ${
                                isCollapsed ? '-rotate-90' : 'rotate-0'
                              }`}
                            />
                          </span>

                          <div className="size-7 rounded-lg border border-border bg-card overflow-hidden shrink-0 flex items-center justify-center">
                            {group.landmarkLogo ? (
                              <img
                                src={group.landmarkLogo}
                                alt={group.landmarkName}
                                className="size-full object-cover"
                              />
                            ) : (
                              <Landmark className="size-4 text-primary" />
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <span className="font-bold text-sm text-foreground truncate">
                              {group.landmarkName}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border font-medium">
                              {group.floors.length} {group.floors.length === 1 ? 'Floor' : 'Floors'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!canCreate}
                            onClick={(e) => {
                              e.stopPropagation();
                              setTargetLandmarkForNewFloor(group.landmarkCode);
                              setEditingFloor(null);
                              setIsCreateFloorOpen(true);
                            }}
                            className="h-7 px-2.5 text-xs text-primary hover:text-primary hover:bg-primary/10 cursor-pointer disabled:opacity-40"
                          >
                            <Plus className="size-3 mr-1" />
                            <span>Add Floor</span>
                          </Button>
                        </div>
                      </div>

                      {/* Floor Items under Landmark */}
                      {!isCollapsed && (
                        <div className="divide-y divide-border/60 bg-card border-t border-border/50 pl-4 sm:pl-8">
                          {group.floors.map((fl) => (
                            <div
                              key={fl.floorId || fl.id}
                              className="py-3 px-4 sm:px-6 hover:bg-muted/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="min-w-0 flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-foreground">
                                  {fl.displayName}
                                </span>
                                {fl.elevationMeters !== undefined && (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border">
                                    {fl.elevationMeters > 0
                                      ? `+${fl.elevationMeters}m`
                                      : `${fl.elevationMeters}m`}
                                  </span>
                                )}
                                <span
                                  className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${
                                    fl.autoFloorDetectionEnabled !== false
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                      : 'bg-muted text-muted-foreground border-border'
                                  }`}
                                >
                                  {fl.autoFloorDetectionEnabled !== false
                                    ? 'Auto-Detect: ON'
                                    : 'Auto-Detect: OFF'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={!canUpdate}
                                  onClick={(e) => {
                                    e.currentTarget.blur();
                                    setEditingFloor(fl);
                                    setIsCreateFloorOpen(true);
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
                                    setFloorToDelete(fl);
                                    setIsDeleteFloorModalOpen(true);
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
                  );
                })}
              </div>
            )}
          </div>
        ) : moduleKey === 'viewpoints' ? (
          /* Viewpoints Grouped by Landmark & Floor */
          <div>
            {viewpointLoadFailed ? (
              <p role="alert" className="p-10 text-center text-sm text-destructive">
                Unable to load Viewpoints. Reload the page to try again.
              </p>
            ) : groupedViewpoints.length === 0 || totalFilteredHotspots === 0 ? (
              <div className="p-10 text-center space-y-2">
                <Eye className="size-8 text-muted-foreground mx-auto" />
                <p className="text-sm font-medium text-foreground">No Viewpoints Found</p>
                <p className="text-xs text-muted-foreground">
                  {viewpointSearch
                    ? 'No viewpoints match your filter query.'
                    : 'Click "New Viewpoint" above to register your first hotspot.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {groupedViewpoints.map((landmarkGroup) => {
                  const isLandmarkCollapsed = Boolean(
                    collapsedViewpointLandmarks[landmarkGroup.landmarkCode]
                  );
                  return (
                    <div key={landmarkGroup.landmarkCode} className="transition-colors">
                      {/* Landmark Accordion Header */}
                      <div
                        onClick={() => toggleViewpointLandmarkCollapse(landmarkGroup.landmarkCode)}
                        className="p-3 sm:px-5 bg-muted/40 hover:bg-muted/70 transition-colors flex items-center justify-between gap-3 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            aria-label={
                              isLandmarkCollapsed
                                ? 'Expand landmark viewpoints'
                                : 'Collapse landmark viewpoints'
                            }
                            className="size-6 rounded-md flex items-center justify-center hover:bg-muted text-foreground transition-transform shrink-0"
                          >
                            <ChevronDown
                              className={`size-4 text-foreground transition-transform duration-200 ${
                                isLandmarkCollapsed ? '-rotate-90' : 'rotate-0'
                              }`}
                            />
                          </span>

                          <div className="size-7 rounded-lg border border-border bg-card overflow-hidden shrink-0 flex items-center justify-center">
                            {landmarkGroup.landmarkLogo ? (
                              <img
                                src={landmarkGroup.landmarkLogo}
                                alt={landmarkGroup.landmarkName}
                                className="size-full object-cover"
                              />
                            ) : (
                              <Landmark className="size-4 text-primary" />
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <span className="font-bold text-sm text-foreground truncate">
                              {landmarkGroup.landmarkName}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border font-medium">
                              {landmarkGroup.totalHotspots}{' '}
                              {landmarkGroup.totalHotspots === 1 ? 'Hotspot' : 'Hotspots'}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/60">
                              {landmarkGroup.floors.length}{' '}
                              {landmarkGroup.floors.length === 1 ? 'Floor' : 'Floors'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!canCreate}
                            onClick={(e) => {
                              e.stopPropagation();
                              setTargetLandmarkForNewViewpoint(landmarkGroup.landmarkCode);
                              setTargetFloorForNewViewpoint(undefined);
                              setEditingViewpoint(null);
                              setIsCreateViewpointOpen(true);
                            }}
                            className="h-7 px-2.5 text-xs text-primary hover:text-primary hover:bg-primary/10 cursor-pointer disabled:opacity-40"
                          >
                            <Plus className="size-3 mr-1" />
                            <span>Add Viewpoint</span>
                          </Button>
                        </div>
                      </div>

                      {/* Floor Subgroups under Landmark */}
                      {!isLandmarkCollapsed && (
                        <div className="divide-y divide-border/60 bg-card border-t border-border/50">
                          {landmarkGroup.floors.map((floorGroup) => {
                            const floorCollapseKey = `${landmarkGroup.landmarkCode}_${floorGroup.floorId}`;
                            const isFloorCollapsed = Boolean(
                              collapsedViewpointFloors[floorCollapseKey]
                            );
                            return (
                              <div key={floorGroup.floorId} className="transition-colors">
                                {/* Floor Subheader */}
                                <div
                                  onClick={() => toggleViewpointFloorCollapse(floorCollapseKey)}
                                  className="py-2.5 px-4 sm:px-8 bg-muted/20 hover:bg-muted/40 transition-colors flex items-center justify-between gap-3 cursor-pointer select-none border-b border-border/30"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span
                                      aria-label={
                                        isFloorCollapsed
                                          ? 'Expand floor viewpoints'
                                          : 'Collapse floor viewpoints'
                                      }
                                      className="size-5 rounded flex items-center justify-center hover:bg-muted text-foreground transition-transform shrink-0"
                                    >
                                      <ChevronDown
                                        className={`size-3.5 text-foreground transition-transform duration-200 ${
                                          isFloorCollapsed ? '-rotate-90' : 'rotate-0'
                                        }`}
                                      />
                                    </span>
                                    <Layers className="size-3.5 text-primary/70 shrink-0" />
                                    <span className="font-semibold text-xs sm:text-sm text-foreground truncate">
                                      {floorGroup.displayName}
                                    </span>
                                    {floorGroup.shortName && (
                                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/60">
                                        {floorGroup.shortName}
                                      </span>
                                    )}
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border font-medium">
                                      {floorGroup.viewpoints.length}{' '}
                                      {floorGroup.viewpoints.length === 1 ? 'Hotspot' : 'Hotspots'}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      disabled={!canCreate}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setTargetLandmarkForNewViewpoint(
                                          landmarkGroup.landmarkCode
                                        );
                                        setTargetFloorForNewViewpoint(floorGroup.floorId);
                                        setEditingViewpoint(null);
                                        setIsCreateViewpointOpen(true);
                                      }}
                                      className="h-6 px-2 text-[11px] text-primary hover:text-primary hover:bg-primary/10 cursor-pointer disabled:opacity-40"
                                    >
                                      <Plus className="size-3 mr-1" />
                                      <span>Add Hotspot</span>
                                    </Button>
                                  </div>
                                </div>

                                {/* Viewpoint Items under Floor */}
                                {!isFloorCollapsed && (
                                  <div>
                                    {floorGroup.viewpoints.length === 0 ? (
                                      <div className="py-3 px-8 sm:px-14 text-xs text-muted-foreground italic flex items-center justify-between">
                                        <span>No viewpoints registered on this floor.</span>
                                        {canCreate && (
                                          <Button
                                            variant="link"
                                            size="sm"
                                            onClick={() => {
                                              setTargetLandmarkForNewViewpoint(
                                                landmarkGroup.landmarkCode
                                              );
                                              setTargetFloorForNewViewpoint(floorGroup.floorId);
                                              setEditingViewpoint(null);
                                              setIsCreateViewpointOpen(true);
                                            }}
                                            className="h-auto p-0 text-xs text-primary"
                                          >
                                            + Add first hotspot
                                          </Button>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="divide-y divide-border/40 pl-6 sm:pl-12">
                                        {floorGroup.viewpoints.map((vp) => (
                                          <div
                                            key={vp.id}
                                            className="p-3 sm:px-6 hover:bg-muted/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                          >
                                            <div className="space-y-1 min-w-0">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-bold text-sm text-foreground truncate">
                                                  {vp.title}
                                                </span>
                                                {vp.order !== undefined && (
                                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/50">
                                                    #{vp.order}
                                                  </span>
                                                )}
                                              </div>

                                              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                                {vp.latitude !== null && vp.longitude !== null && (
                                                  <span className="flex items-center gap-1 font-mono text-[11px]">
                                                    <MapPin className="size-3 text-primary shrink-0" />
                                                    Lat: {vp.latitude.toFixed(5)}, Lng:{' '}
                                                    {vp.longitude.toFixed(5)}
                                                  </span>
                                                )}
                                                {vp.triggerRadiusMeters && (
                                                  <span>Trigger: {vp.triggerRadiusMeters}m</span>
                                                )}
                                                {vp.targetGazeHeadingDegrees !== null &&
                                                  vp.targetGazeHeadingDegrees !== undefined && (
                                                    <span>
                                                      Heading: {vp.targetGazeHeadingDegrees}°
                                                    </span>
                                                  )}
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={!canUpdate}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setEditingViewpoint(vp);
                                                  setIsCreateViewpointOpen(true);
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
                                                  e.stopPropagation();
                                                  setViewpointToDelete(vp);
                                                  setIsDeleteViewpointModalOpen(true);
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
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
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
}

export default ModuleManagementView;
