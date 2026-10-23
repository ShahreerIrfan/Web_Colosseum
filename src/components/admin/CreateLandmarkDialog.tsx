import React, { useState, useId } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { landmarkApi, type CreateLandmarkInput } from '@/apis/landmark/landmarkApi';
import type { Landmark } from '@/types/api/landmarkTypes';
import useToast from '@/hooks/component/useToast';
import {
  Landmark as LandmarkIcon,
  Sparkles,
  MapPin,
  Maximize2,
  Palette,
  ChevronDown,
  ChevronUp,
  Loader2,
  UploadCloud,
  CheckCircle2,
  Sliders,
  Compass,
} from 'lucide-react';

interface CreateLandmarkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (landmark: Landmark) => void;
}

const PRESET_COORDINATES = [
  { name: 'Colosseum', lat: 41.89021, lng: 12.492231, icon: '🏟️' },
  { name: 'Arch of Constantine', lat: 41.889762, lng: 12.490667, icon: '🏛️' },
  { name: 'Ludus Magnus', lat: 41.88973, lng: 12.49472, icon: '⚔️' },
  { name: 'Temple of Venus & Rome', lat: 41.89088, lng: 12.49072, icon: '⛩️' },
  { name: 'Roman Forum', lat: 41.8925, lng: 12.4853, icon: '🏛️' },
];

const PRESET_COLORS = [
  { label: 'Imperial Red', hex: '#DD1110' },
  { label: 'Ancient Travertine', hex: '#C68642' },
  { label: 'Royal Azure', hex: '#2563EB' },
  { label: 'Olive Bronze', hex: '#10B981' },
  { label: 'Tyrian Purple', hex: '#8B5CF6' },
];

export const CreateLandmarkDialog: React.FC<CreateLandmarkDialogProps> = ({
  open,
  onOpenChange,
  onCreated,
}) => {
  const { showSuccess, showError } = useToast();
  const publishId = useId();

  // Form State
  const [name, setName] = useState('Arch of Constantine');
  const [code, setCode] = useState('arch_of_constantine');
  const [description, setDescription] = useState(
    "Triumphal arch celebrating Emperor Constantine I's victory at the Battle of Milvian Bridge."
  );
  const [latitude, setLatitude] = useState<number | string>(41.889762);
  const [longitude, setLongitude] = useState<number | string>(12.490667);
  const [widthMeters, setWidthMeters] = useState<number | string>(25.7);
  const [heightMeters, setHeightMeters] = useState<number | string>(21.0);
  const [assetFileName, setAssetFileName] = useState('assets/logo/Arch of Constantine.png');
  const [category, setCategory] = useState('Triumphal Arch');
  const [colorHex, setColorHex] = useState('#DD1110');
  const [iconSymbol, setIconSymbol] = useState('🏛️');
  const [isPublished, setIsPublished] = useState(true);

  // Advanced Calibration State
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [rotationDegrees, setRotationDegrees] = useState<number>(0.0);
  const [anchorX, setAnchorX] = useState<number>(0.5);
  const [anchorY, setAnchorY] = useState<number>(0.5);
  const [zIndex, setZIndex] = useState<number>(1);
  const [minZoom, setMinZoom] = useState<number>(13.0);
  const [maxZoom, setMaxZoom] = useState<number>(21.0);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-slug generator
  const handleNameChange = (val: string) => {
    setName(val);
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    setCode(generatedSlug);
  };

  const handleApplyPreset = (preset: (typeof PRESET_COORDINATES)[0]) => {
    setLatitude(preset.lat);
    setLongitude(preset.lng);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showError('Validation Error', 'Monument name is required');
      return;
    }
    if (!code.trim()) {
      showError('Validation Error', 'Unique code slug is required');
      return;
    }

    const latNum = Number(latitude);
    const lngNum = Number(longitude);
    const widthNum = Number(widthMeters);
    const heightNum = Number(heightMeters);

    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      showError('Validation Error', 'Latitude must be a valid coordinate between -90 and 90');
      return;
    }
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      showError('Validation Error', 'Longitude must be a valid coordinate between -180 and 180');
      return;
    }
    if (isNaN(widthNum) || widthNum <= 0) {
      showError('Validation Error', 'Width in meters must be a positive number');
      return;
    }
    if (isNaN(heightNum) || heightNum <= 0) {
      showError('Validation Error', 'Height in meters must be a positive number');
      return;
    }

    const payload: CreateLandmarkInput = {
      code: code.trim(),
      name: name.trim(),
      description: description.trim(),
      assetPath: assetFileName || 'assets/floor_map/floor_level_1.svg',
      center: {
        latitude: latNum,
        longitude: lngNum,
      },
      widthMeters: widthNum,
      heightMeters: heightNum,
      rotationDegrees,
      anchorX,
      anchorY,
      zIndex,
      minZoom,
      maxZoom,
      marker: {
        colorHex,
        category,
        iconName: category.toLowerCase().replace(/\s+/g, '_'),
        labelOffsetY: 0,
      },
      isPublished,
    };

    try {
      setIsSubmitting(true);
      const created = await landmarkApi.create(payload);
      showSuccess(
        'Landmark Registered',
        `"${created.name}" (${created.code}) created successfully.`
      );
      if (onCreated) {
        onCreated(created);
      }
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to register landmark.';
      showError('Creation Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-2xl md:max-w-4xl lg:max-w-5xl p-0 overflow-hidden bg-card border-border shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-border flex items-center justify-between bg-muted/40 pr-12 sm:pr-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xl font-bold shrink-0">
              <LandmarkIcon className="size-5" />
            </div>
            <DialogHeader className="space-y-0.5 min-w-0">
              <DialogTitle className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2 flex-wrap">
                <span>Add New Landmark or Monument</span>
                <span className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  New Record
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground line-clamp-1 sm:line-clamp-none">
                Define geographic bounds, vector map dimensions, and mobile guide marker
                calibrations.
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Columns: Form Inputs */}
            <div className="lg:col-span-7 space-y-5">
              {/* 01 Basic Identity */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                  <span>01</span>
                  <span>Basic Identity</span>
                  <span className="ml-auto text-[11px] text-amber-500 font-normal">
                    ● Manual Input
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Monument Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arch of Constantine"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-foreground">
                      System Code (Slug) <span className="text-destructive">*</span>
                    </label>
                    <span className="text-[11px] text-emerald-500 dark:text-emerald-400 flex items-center gap-1 font-medium">
                      <Sparkles className="size-3" /> Auto-slugified
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="e.g. arch_of_constantine"
                      className="w-full px-3 py-2 bg-muted/40 border border-input rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    <span className="absolute right-3 top-2 text-[11px] text-muted-foreground font-mono">
                      unique_id
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Historical Description
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief background for tourist mobile audioguide..."
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              {/* 02 Geographic Position */}
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                  <MapPin className="size-3.5" />
                  <span>02 Geographic Position</span>
                  <span className="ml-auto text-[11px] text-emerald-500 font-normal">
                    GeoJSON Point
                  </span>
                </div>

                {/* Preset Fast Picker */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-muted-foreground">Colosseum Park Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_COORDINATES.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors flex items-center gap-1.5 cursor-pointer ${
                          latitude === preset.lat && longitude === preset.lng
                            ? 'bg-primary/10 border-primary text-primary font-semibold'
                            : 'bg-muted/40 border-border text-foreground hover:bg-muted'
                        }`}
                      >
                        <span>{preset.icon}</span>
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Latitude <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Longitude <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
              </div>

              {/* 03 Map Overlay & Dimensions */}
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                  <Maximize2 className="size-3.5" />
                  <span>03 Map Overlay & Dimensions</span>
                  <span className="ml-auto text-[11px] text-amber-500 font-normal">
                    ● Manual Input
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Vector Floor Map / SVG Asset <span className="text-destructive">*</span>
                  </label>
                  <div className="border-2 border-dashed border-border hover:border-primary/60 rounded-xl p-3.5 text-center bg-muted/20 transition-colors">
                    <UploadCloud className="size-6 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs text-foreground font-medium mb-2">
                      Drop SVG or Image file here, or specify asset path:
                    </p>
                    <input
                      type="text"
                      value={assetFileName}
                      onChange={(e) => setAssetFileName(e.target.value)}
                      placeholder="e.g. assets/floor_map/floor_level_1.svg"
                      className="w-full px-2.5 py-1.5 bg-background border border-input rounded-md text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1.5">
                      Backend automatically resolves Cloudinary storage URLs & SHA manifests.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Width (Meters) <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      required
                      value={widthMeters}
                      onChange={(e) => setWidthMeters(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Height (Meters) <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      required
                      value={heightMeters}
                      onChange={(e) => setHeightMeters(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
              </div>

              {/* 04 Pin & Marker Styling */}
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                  <Palette className="size-3.5" />
                  <span>04 Pin & Marker Styling</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-2.5 py-2 bg-background border border-input rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="Triumphal Arch">Triumphal Arch</option>
                      <option value="Amphitheatre">Amphitheatre</option>
                      <option value="Temple">Temple</option>
                      <option value="Gladiator Barracks">Gladiator Barracks</option>
                      <option value="Monument">Monument</option>
                      <option value="Ruins">Ruins / Arena</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Pin Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={colorHex}
                        onChange={(e) => setColorHex(e.target.value)}
                        className="size-8 rounded-md border border-input cursor-pointer bg-transparent shrink-0"
                      />
                      <input
                        type="text"
                        value={colorHex}
                        onChange={(e) => setColorHex(e.target.value)}
                        className="w-full px-2 py-1.5 bg-background border border-input rounded-md text-xs font-mono text-foreground"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Marker Icon
                    </label>
                    <select
                      value={iconSymbol}
                      onChange={(e) => setIconSymbol(e.target.value)}
                      className="w-full px-2.5 py-2 bg-background border border-input rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="🏛️">🏛️ Arch / Monument</option>
                      <option value="🏟️">🏟️ Stadium / Arena</option>
                      <option value="⛩️">⛩️ Ancient Temple</option>
                      <option value="⚔️">⚔️ Gladiator School</option>
                      <option value="📍">📍 Waypoint Pin</option>
                    </select>
                  </div>
                </div>

                {/* Color Swatches */}
                <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                  <span className="text-[11px] text-muted-foreground mr-1">Palettes:</span>
                  {PRESET_COLORS.map((swatch) => (
                    <button
                      key={swatch.hex}
                      type="button"
                      onClick={() => setColorHex(swatch.hex)}
                      title={swatch.label}
                      className="size-5 rounded-full border border-border transition-transform hover:scale-110 cursor-pointer"
                      style={{ backgroundColor: swatch.hex }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Live Preview & Auto Defaults */}
            <div className="lg:col-span-5 space-y-4">
              {/* Live Preview Card */}
              <div className="bg-muted/30 border border-border rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Live Client Preview
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      isPublished
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                    }`}
                  >
                    {isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <div
                    className="size-12 rounded-xl flex items-center justify-center text-2xl border shrink-0 transition-all"
                    style={{
                      backgroundColor: `${colorHex}20`,
                      borderColor: `${colorHex}50`,
                      color: colorHex,
                    }}
                  >
                    {iconSymbol}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-foreground truncate">
                      {name || 'Untitled Monument'}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">{category}</p>
                    <div className="flex items-center gap-1 mt-1 text-[11px] font-mono text-muted-foreground truncate">
                      <MapPin className="size-3 text-primary shrink-0" />
                      <span>
                        {Number(latitude).toFixed(6)}, {Number(longitude).toFixed(6)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-background p-2.5 rounded-lg border border-border">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                      Overlay Dimensions
                    </span>
                    <span className="font-mono text-foreground font-medium truncate block">
                      {widthMeters}m × {heightMeters}m
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                      System Code
                    </span>
                    <span className="font-mono text-amber-500 font-semibold truncate block">
                      {code || 'not_set'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Automatic Backend Fillup Box */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-primary">
                  <CheckCircle2 className="size-4" />
                  <span>Automatically Handled by Backend</span>
                </div>
                <ul className="text-xs space-y-1.5 text-foreground/80">
                  <li className="flex items-center justify-between">
                    <span className="text-muted-foreground">GeoJSON Structure:</span>
                    <span className="font-mono text-primary text-[11px]">
                      location: &#123; type: 'Point' &#125;
                    </span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-muted-foreground">Spatial Indexing:</span>
                    <span className="font-mono text-emerald-500 text-[11px]">
                      2dsphere Geospatial
                    </span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-muted-foreground">Default Pivot Anchor:</span>
                    <span className="font-mono text-primary text-[11px]">
                      ({anchorX}, {anchorY})
                    </span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-muted-foreground">Display Layer:</span>
                    <span className="font-mono text-primary text-[11px]">
                      zIndex: {zIndex} (Zoom {minZoom}-{maxZoom})
                    </span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-muted-foreground">Audit Tracking:</span>
                    <span className="font-mono text-emerald-500 text-[11px]">
                      _id, createdAt, updatedAt
                    </span>
                  </li>
                </ul>
              </div>

              {/* Collapsible Advanced Calibration */}
              <div className="border border-border rounded-xl overflow-hidden bg-card">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full p-3 text-xs font-semibold text-foreground flex items-center justify-between bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Sliders className="size-3.5 text-primary" />
                    <span>Advanced Calibration (Optional)</span>
                  </span>
                  {showAdvanced ? (
                    <ChevronUp className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  )}
                </button>

                {showAdvanced && (
                  <div className="p-3.5 space-y-3 border-t border-border text-xs bg-background/50">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Compass className="size-3" /> Rotation Angle:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={rotationDegrees}
                          onChange={(e) => setRotationDegrees(Number(e.target.value))}
                          step="0.5"
                          className="w-16 px-1.5 py-1 bg-background border border-input rounded text-right font-mono text-xs"
                        />
                        <span className="text-muted-foreground">deg</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Anchor (X, Y):</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={anchorX}
                          onChange={(e) => setAnchorX(Number(e.target.value))}
                          step="0.1"
                          min="0"
                          max="1"
                          className="w-12 px-1.5 py-1 bg-background border border-input rounded text-center font-mono text-xs"
                        />
                        <input
                          type="number"
                          value={anchorY}
                          onChange={(e) => setAnchorY(Number(e.target.value))}
                          step="0.1"
                          min="0"
                          max="1"
                          className="w-12 px-1.5 py-1 bg-background border border-input rounded text-center font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Z-Index Stacking:</span>
                      <input
                        type="number"
                        value={zIndex}
                        onChange={(e) => setZIndex(Number(e.target.value))}
                        className="w-14 px-1.5 py-1 bg-background border border-input rounded text-center font-mono text-xs"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Min / Max Zoom:</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={minZoom}
                          onChange={(e) => setMinZoom(Number(e.target.value))}
                          step="0.5"
                          className="w-12 px-1.5 py-1 bg-background border border-input rounded text-center font-mono text-xs"
                        />
                        <span>-</span>
                        <input
                          type="number"
                          value={maxZoom}
                          onChange={(e) => setMaxZoom(Number(e.target.value))}
                          step="0.5"
                          className="w-12 px-1.5 py-1 bg-background border border-input rounded text-center font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <input
                id={publishId}
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="size-4 rounded accent-primary cursor-pointer shrink-0"
              />
              <label
                htmlFor={publishId}
                className="text-xs text-foreground cursor-pointer select-none"
              >
                Publish immediately to tourist mobile guide
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                size="sm"
                className="bg-primary text-primary-foreground font-semibold gap-1.5 cursor-pointer shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Registering...</span>
                  </>
                ) : (
                  <>
                    <span>Create Landmark</span>
                    <span>→</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateLandmarkDialog;
