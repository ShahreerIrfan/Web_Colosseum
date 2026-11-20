import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import useToast from '@/hooks/component/useToast';
import type { CreateFloorInput, FloorModel } from '@/types/api/floorTypes';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  Layers,
  Loader2,
  MapPin,
  RotateCcw,
  ShieldCheck,
  Sliders,
} from 'lucide-react';
import React, { useCallback, useEffect, useId, useState } from 'react';
import { LocationPickerMap } from './LocationPickerMap';
import { COLOSSEUM_DEFAULT_COORDS } from './mapConstants';

export interface CreateFloorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  floorToEdit?: FloorModel | null;
  onCreated?: (floor: FloorModel) => void;
  onUpdated?: (floor: FloorModel) => void;
  landmarkOptions?: Array<{ code: string; name: string }>;
  defaultLandmarkCode?: string;
  onSubmitFloor: (payload: CreateFloorInput) => Promise<FloorModel>;
}

const TIER_OPTIONS = [
  { id: 'general', label: 'General Access', description: 'Standard entry ticket holders' },
  {
    id: 'arena_priority',
    label: 'Arena Priority',
    description: 'Arena floor and gladiator access',
  },
  {
    id: 'full_access',
    label: 'Full Access',
    description: 'Underground hypogeum & attic colonnade',
  },
] as const;

export const CreateFloorDialog: React.FC<CreateFloorDialogProps> = ({
  open,
  onOpenChange,
  floorToEdit,
  onCreated,
  onUpdated,
  landmarkOptions = [{ code: 'colosseum', name: 'Colosseum (Flavian Amphitheatre)' }],
  defaultLandmarkCode,
  onSubmitFloor,
}) => {
  const { showSuccess, showError } = useToast();
  const publishId = useId();
  const landmarkSelectId = useId();
  const isEditMode = Boolean(floorToEdit);

  // Form State
  const [displayName, setDisplayName] = useState('');
  const [shortName, setShortName] = useState('');
  const [floorId, setFloorId] = useState('');
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);
  const [levelIndex, setLevelIndex] = useState<number>(-1);
  const [floorNumberLabel, setFloorNumberLabel] = useState('Underground');
  const [elevationMeters, setElevationMeters] = useState<number>(-6);
  const [autoFloorDetectionEnabled, setAutoFloorDetectionEnabled] = useState<boolean>(true);
  const [landmarkCode, setLandmarkCode] = useState('colosseum');
  const [semanticLabel, setSemanticLabel] = useState('');

  // Calibration State
  const [showCalibration, setShowCalibration] = useState(false);
  const [latitude, setLatitude] = useState<number | string>(
    COLOSSEUM_DEFAULT_COORDS.lat.toFixed(6)
  );
  const [longitude, setLongitude] = useState<number | string>(
    COLOSSEUM_DEFAULT_COORDS.lng.toFixed(6)
  );
  const [defaultZoom, setDefaultZoom] = useState<number>(18.6);
  const [mapNorthOffsetDegrees, setMapNorthOffsetDegrees] = useState<number>(-20.0);

  // Access Tiers & Status
  const [selectedTiers, setSelectedTiers] = useState<string[]>([
    'general',
    'arena_priority',
    'full_access',
  ]);
  const [isPublished, setIsPublished] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to slugify floor ID based on level index and name
  const slugify = (name: string, level: number, landmark = landmarkCode) => {
    const clean = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    const prefix = landmark.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    return `${prefix}_${clean || (level < 0 ? 'underground' : `floor_${level}`)}`;
  };

  const handleDisplayNameChange = (val: string) => {
    setDisplayName(val);
    if (!shortName || !isSlugCustomized) {
      setShortName(val.split('(')[0].trim());
    }
    if (!isSlugCustomized) {
      const generatedSlug = slugify(val, levelIndex);
      setFloorId(generatedSlug);
    }
  };

  const handleLevelIndexChange = (val: number) => {
    setLevelIndex(val);
    setFloorNumberLabel(val < 0 ? 'Underground' : `Floor ${val}`);
    if (!isSlugCustomized) {
      setFloorId(slugify(displayName, val));
    }
  };

  const handleLandmarkChange = (code: string) => {
    setLandmarkCode(code);
    if (!isSlugCustomized) {
      setFloorId(slugify(displayName, levelIndex, code));
    }
  };

  const handleMapLocationChange = useCallback((newLat: number, newLng: number) => {
    setLatitude(newLat.toFixed(6));
    setLongitude(newLng.toFixed(6));
  }, []);

  const toggleTier = (tierId: string) => {
    setSelectedTiers((prev) =>
      prev.includes(tierId) ? prev.filter((t) => t !== tierId) : [...prev, tierId]
    );
  };

  const handleResetForm = useCallback(() => {
    setDisplayName('');
    setShortName('');
    setFloorId('');
    setIsSlugCustomized(false);
    setLevelIndex(1);
    setFloorNumberLabel('Floor 1');
    setLandmarkCode('colosseum');
    setSemanticLabel('');
    setShowCalibration(false);
    setLatitude(COLOSSEUM_DEFAULT_COORDS.lat.toFixed(6));
    setLongitude(COLOSSEUM_DEFAULT_COORDS.lng.toFixed(6));
    setDefaultZoom(18.6);
    setMapNorthOffsetDegrees(-20.0);
    setSelectedTiers(['general', 'arena_priority', 'full_access']);
    setIsPublished(true);
    setElevationMeters(-6);
    setAutoFloorDetectionEnabled(true);
  }, []);

  // Populate form if editing
  useEffect(() => {
    if (open) {
      if (floorToEdit) {
        setDisplayName(floorToEdit.displayName || '');
        setShortName(floorToEdit.shortName || '');
        setFloorId(floorToEdit.floorId || floorToEdit.id || '');
        setIsSlugCustomized(true);
        setLevelIndex(floorToEdit.levelIndex ?? 1);
        setFloorNumberLabel(floorToEdit.floorNumberLabel || `Floor ${floorToEdit.levelIndex ?? 1}`);
        setElevationMeters(floorToEdit.elevationMeters ?? (floorToEdit.levelIndex === -1 ? -6 : 0));
        setAutoFloorDetectionEnabled(floorToEdit.autoFloorDetectionEnabled ?? true);
        setLandmarkCode(floorToEdit.landmarkCode || 'colosseum');
        setSemanticLabel(floorToEdit.semanticLabel || '');

        const lat =
          floorToEdit.calibration?.centerCoordinates?.latitude !== undefined
            ? floorToEdit.calibration.centerCoordinates.latitude.toFixed(6)
            : COLOSSEUM_DEFAULT_COORDS.lat.toFixed(6);
        const lng =
          floorToEdit.calibration?.centerCoordinates?.longitude !== undefined
            ? floorToEdit.calibration.centerCoordinates.longitude.toFixed(6)
            : COLOSSEUM_DEFAULT_COORDS.lng.toFixed(6);
        setLatitude(lat);
        setLongitude(lng);
        setDefaultZoom(floorToEdit.calibration?.defaultZoom ?? 18.6);
        setMapNorthOffsetDegrees(floorToEdit.calibration?.mapNorthOffsetDegrees ?? -20.0);

        setSelectedTiers(
          floorToEdit.isAccessibleForTier && floorToEdit.isAccessibleForTier.length > 0
            ? floorToEdit.isAccessibleForTier
            : ['general', 'arena_priority', 'full_access']
        );
        setIsPublished(floorToEdit.isPublished ?? true);
        setShowCalibration(Boolean(floorToEdit.calibration));
      } else {
        handleResetForm();
        if (defaultLandmarkCode) {
          setLandmarkCode(defaultLandmarkCode);
        }
      }
    }
  }, [open, floorToEdit, handleResetForm, defaultLandmarkCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) {
      showError('Validation Error', 'Display name is required');
      return;
    }
    const finalFloorId = (floorId.trim() || slugify(displayName, levelIndex)).replace(
      /^_+|_+$/g,
      ''
    );
    if (!finalFloorId) {
      showError('Validation Error', 'A unique floor identifier is required');
      return;
    }

    const latNum = Number(latitude);
    const lngNum = Number(longitude);
    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      showError('Validation Error', 'Latitude must be between -90 and 90');
      return;
    }
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      showError('Validation Error', 'Longitude must be between -180 and 180');
      return;
    }

    if (selectedTiers.length === 0) {
      showError('Validation Error', 'Select at least one permitted ticket tier.');
      return;
    }

    const payload: CreateFloorInput = {
      floorId: finalFloorId,
      landmarkCode: landmarkCode.trim() || 'colosseum',
      levelIndex,
      displayName: displayName.trim(),
      shortName: (shortName.trim() || displayName.split('(')[0]).trim(),
      floorNumberLabel:
        floorNumberLabel.trim() || (levelIndex < 0 ? 'Underground' : `Floor ${levelIndex}`),
      semanticLabel: semanticLabel.trim() || `${displayName.trim()}, current floor`,
      calibration: {
        centerCoordinates: {
          latitude: latNum,
          longitude: lngNum,
        },
        defaultZoom: Number(defaultZoom) || 18.6,
        mapNorthOffsetDegrees: Number(mapNorthOffsetDegrees) || -20.0,
      },
      mapAsset: {
        assetId: floorToEdit?.mapAsset?.assetId || `${finalFloorId}_map`,
        url: floorToEdit?.mapAsset?.url || '',
        cloudinaryPublicId: floorToEdit?.mapAsset?.cloudinaryPublicId,
      },
      isAccessibleForTier: selectedTiers,
      isPublished,
      elevationMeters,
      autoFloorDetectionEnabled,
    };

    try {
      setIsSubmitting(true);
      const saved = await onSubmitFloor(payload);
      if (isEditMode) onUpdated?.(saved);
      else onCreated?.(saved);

      showSuccess(
        isEditMode ? 'Floor Map Updated' : 'Floor Map Created',
        `"${payload.displayName}" (${payload.floorId}) saved successfully.`
      );
      handleResetForm();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to save floor map.';
      showError(isEditMode ? 'Update Failed' : 'Creation Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl p-0 overflow-hidden bg-card border-border shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-border flex items-center justify-between bg-muted/40 pr-12 sm:pr-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xl font-bold shrink-0">
              <Layers className="size-5" />
            </div>
            <DialogHeader className="space-y-0.5 min-w-0">
              <DialogTitle className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
                {isEditMode
                  ? `Edit Floor Map: ${floorToEdit?.displayName || displayName}`
                  : 'Add New Floor Map'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground truncate">
                Configure architectural floor, level index, ticket tiers, and spatial GPS
                calibration.
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Identity, Level, and Association */}
            <div className="space-y-6">
              {/* 01 Floor Identity */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                  <span>01</span>
                  <span>Floor Identity & Level</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Display Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Level 1 (Arena Floor)"
                    value={displayName}
                    onChange={(e) => handleDisplayNameChange(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Full architectural title displayed in map banners and tour guides.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Short Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Level 1"
                      value={shortName}
                      onChange={(e) => setShortName(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Floor Number Label <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Floor 1 or Underground"
                      value={floorNumberLabel}
                      onChange={(e) => setFloorNumberLabel(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Level Index <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      step="1"
                      value={levelIndex}
                      onChange={(e) => handleLevelIndexChange(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary font-mono"
                    />
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Use -1 for Hypogeum, 1 for Arena, 2 for Tier 2, etc.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Elevation (meters)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={elevationMeters}
                      onChange={(e) => setElevationMeters(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary font-mono"
                    />
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Relative height (e.g. -6m for Underground, 0m for Level 1, 25m for Attic)
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor={landmarkSelectId}
                      className="block text-xs font-medium text-foreground mb-1"
                    >
                      Associated Landmark <span className="text-destructive">*</span>
                    </label>
                    <Select value={landmarkCode} onValueChange={handleLandmarkChange}>
                      <SelectTrigger id={landmarkSelectId} className="w-full">
                        <SelectValue placeholder="Select a Landmark" />
                      </SelectTrigger>
                      <SelectContent>
                        {landmarkOptions.map((opt) => (
                          <SelectItem key={opt.code} value={opt.code}>
                            {opt.name} ({opt.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Auto Floor Detection Toggle */}
                <div className="flex items-center gap-2 pt-1 pb-1">
                  <input
                    type="checkbox"
                    id="autoFloorDetectionEnabled"
                    checked={autoFloorDetectionEnabled}
                    onChange={(e) => setAutoFloorDetectionEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                  />
                  <label
                    htmlFor="autoFloorDetectionEnabled"
                    className="text-xs font-medium text-foreground cursor-pointer select-none"
                  >
                    Enable Automatic Floor Detection (Stairway Portals & Barometer)
                  </label>
                </div>

                {/* Floor Identifier Slug */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-foreground">
                      Floor ID Slug <span className="text-destructive">*</span>
                    </label>
                    {isSlugCustomized && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsSlugCustomized(false);
                          setFloorId(slugify(displayName, levelIndex));
                        }}
                        className="text-[10px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="size-2.5" />
                        Reset auto
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. ludus_magnus_lower_level"
                      value={floorId}
                      onChange={(e) => {
                        setIsSlugCustomized(true);
                        setFloorId(e.target.value);
                      }}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Database primary key referenced by viewpoints and offline sync bundles.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Semantic Accessibility Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Underground Hypogeum, current floor"
                    value={semanticLabel}
                    onChange={(e) => setSemanticLabel(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Audio description voiced for visually impaired visitors using screen readers.
                  </p>
                </div>
              </div>

              {/* 02 Permitted Ticket Tiers */}
              <div className="space-y-3 pt-3 border-t border-border">
                <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                  <ShieldCheck className="size-3.5" />
                  <span>Ticket Tier Entitlements</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Specify ticket holders authorized to access and navigate this floor plan.
                </p>

                <div className="space-y-2">
                  {TIER_OPTIONS.map((tier) => {
                    const isChecked = selectedTiers.includes(tier.id);
                    return (
                      <div
                        key={tier.id}
                        onClick={() => toggleTier(tier.id)}
                        className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-primary/5 border-primary/30'
                            : 'bg-muted/20 border-border hover:bg-muted/40'
                        }`}
                      >
                        <div
                          className={`mt-0.5 size-4 rounded flex items-center justify-center border transition-colors ${
                            isChecked
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-muted-foreground/40 bg-background'
                          }`}
                        >
                          {isChecked && <CheckCircle2 className="size-3.5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground">{tier.label}</p>
                          <p className="text-[11px] text-muted-foreground">{tier.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Publication Status & Calibration */}
            <div className="space-y-6">
              {/* Publication Status Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-muted/30 border border-border rounded-xl">
                <div>
                  <label
                    htmlFor={publishId}
                    className="text-xs font-bold text-foreground block cursor-pointer"
                  >
                    Publish Floor Map
                  </label>
                  <p className="text-[11px] text-muted-foreground">
                    Available immediately for mobile sync manifests and visitor devices.
                  </p>
                </div>
                <input
                  id={publishId}
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="size-4 accent-primary rounded cursor-pointer"
                />
              </div>

              {/* Spatial Calibration & GPS Anchor (Interactive Map) */}
              <div className="border border-border rounded-xl overflow-hidden bg-card shadow-xs">
                <button
                  type="button"
                  onClick={() => setShowCalibration(!showCalibration)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Sliders className="size-4 text-primary" />
                    <div>
                      <span className="text-xs font-bold text-foreground block">
                        Spatial Calibration & GPS Anchor
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Center anchor coordinates, default zoom, and true north orientation
                      </span>
                    </div>
                  </div>
                  {showCalibration ? (
                    <ChevronUp className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  )}
                </button>

                {showCalibration && (
                  <div className="p-4 border-t border-border space-y-4 bg-muted/10">
                    {/* Interactive Map Picker */}
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3 text-primary" />
                          Pin Floor Center Anchor
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Drag pin to update GPS center
                        </span>
                      </label>
                      <div className="h-44 rounded-xl overflow-hidden border border-border">
                        <LocationPickerMap
                          latitude={latitude}
                          longitude={longitude}
                          onChange={handleMapLocationChange}
                          className="size-full"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-foreground mb-1">
                          Latitude
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={latitude}
                          onChange={(e) => setLatitude(e.target.value)}
                          className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-foreground mb-1">
                          Longitude
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={longitude}
                          onChange={(e) => setLongitude(e.target.value)}
                          className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-foreground mb-1">
                          Default Zoom Level
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="10"
                          max="22"
                          value={defaultZoom}
                          onChange={(e) => setDefaultZoom(parseFloat(e.target.value) || 18.6)}
                          className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-foreground mb-1 flex items-center gap-1">
                          <Compass className="size-3 text-primary" />
                          North Offset (deg)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          value={mapNorthOffsetDegrees}
                          onChange={(e) =>
                            setMapNorthOffsetDegrees(parseFloat(e.target.value) || -20.0)
                          }
                          className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-3 sticky bottom-0 bg-card py-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              className="border-border hover:bg-muted cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="gap-2 bg-primary text-primary-foreground font-semibold cursor-pointer shadow-xs hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Saving Floor Map...</span>
                </>
              ) : (
                <>
                  <Layers className="size-3.5" />
                  <span>{isEditMode ? 'Update Floor Map' : 'Register Floor Map'}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFloorDialog;
