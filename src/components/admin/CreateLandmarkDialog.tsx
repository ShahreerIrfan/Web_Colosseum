import React, { useState, useId, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { landmarkApi, type CreateLandmarkInput } from '@/apis/landmark/landmarkApi';
import { uploadApi } from '@/apis/upload/uploadApi';
import type { Landmark } from '@/types/api/landmarkTypes';
import useToast from '@/hooks/component/useToast';
import { LocationPickerMap } from './LocationPickerMap';
import { COLOSSEUM_DEFAULT_COORDS } from './mapConstants';
import {
  Landmark as LandmarkIcon,
  ChevronDown,
  ChevronUp,
  Loader2,
  UploadCloud,
  Sliders,
  Compass,
  Layers,
  RotateCcw,
  CheckCircle2,
  Trash2,
  Image as ImageIcon,
  Plus,
  Volume2,
  ShieldCheck,
  Sparkles,
  BookOpen,
} from 'lucide-react';

export interface CreateLandmarkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  landmarkToEdit?: Landmark | null;
  onCreated?: (landmark: Landmark) => void;
  onUpdated?: (landmark: Landmark) => void;
}

export const CreateLandmarkDialog: React.FC<CreateLandmarkDialogProps> = ({
  open,
  onOpenChange,
  landmarkToEdit,
  onCreated,
  onUpdated,
}) => {
  const { showSuccess, showError } = useToast();
  const publishId = useId();
  const categorySelectId = useId();
  const iconSelectId = useId();
  const isEditMode = Boolean(landmarkToEdit);

  // Form State - Defaulted to Colosseum coordinates as the origin pin
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState<number | string>(
    COLOSSEUM_DEFAULT_COORDS.lat.toFixed(6)
  );
  const [longitude, setLongitude] = useState<number | string>(
    COLOSSEUM_DEFAULT_COORDS.lng.toFixed(6)
  );
  const [widthMeters, setWidthMeters] = useState<number | string>('');
  const [heightMeters, setHeightMeters] = useState<number | string>('');

  // 1. Landmark Logo (Map Overlay Badge e.g. from assets/logo)
  const [logoFileName, setLogoFileName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoPublicId, setLogoPublicId] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoProgress, setLogoProgress] = useState<number | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);

  // 2. Tourist Guide Card Image (Cover Thumbnail)
  const [cardFileName, setCardFileName] = useState('');
  const [cardUrl, setCardUrl] = useState('');
  const [cardPublicId, setCardPublicId] = useState('');
  const [isUploadingCard, setIsUploadingCard] = useState(false);
  const [cardProgress, setCardProgress] = useState<number | null>(null);
  const [cardPreviewUrl, setCardPreviewUrl] = useState<string | null>(null);

  const [category, setCategory] = useState('Monument');
  const [colorHex, setColorHex] = useState('#DD1110');
  const [iconSymbol, setIconSymbol] = useState('🏛️');
  const [isPublished, setIsPublished] = useState(true);

  // 3. Visitor Onboarding & Orientation Briefing State
  const [era, setEra] = useState('');
  const [builders, setBuilders] = useState('');
  const [historicalSummary, setHistoricalSummary] = useState('');
  const [securityGuidelines, setSecurityGuidelines] = useState<string[]>([]);
  const [newGuideline, setNewGuideline] = useState('');
  const [levelHighlights, setLevelHighlights] = useState<string[]>([]);
  const [newLevelHighlight, setNewLevelHighlight] = useState('');
  const [audioIntroText, setAudioIntroText] = useState('');

  // Helper actions for dynamic list editing
  const handleAddGuideline = () => {
    const trimmed = newGuideline.trim();
    if (!trimmed) return;
    setSecurityGuidelines((prev) => [...prev, trimmed]);
    setNewGuideline('');
  };

  const handleRemoveGuideline = (index: number) => {
    setSecurityGuidelines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddDefaultGuidelines = () => {
    setSecurityGuidelines([
      'Valid ticket and official government photo ID must match and be presented at the gate.',
      'Backpacks and bags exceeding 30×30×15 cm are strictly prohibited (no luggage storage on site).',
      'Glass bottles, alcoholic beverages, sharp objects, and selfie sticks are not permitted.',
      'All visitors must pass through security screening and metal detectors prior to entry.',
    ]);
  };

  const handleAddLevelHighlight = () => {
    const trimmed = newLevelHighlight.trim();
    if (!trimmed) return;
    setLevelHighlights((prev) => [...prev, trimmed]);
    setNewLevelHighlight('');
  };

  const handleRemoveLevelHighlight = (index: number) => {
    setLevelHighlights((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerateAudioScript = () => {
    const landmarkName = name.trim() || 'this historic Roman monument';
    const builderStr = builders.trim() ? ` Commissioned by ${builders.trim()}.` : '';
    const eraStr = era.trim() ? ` dating from ${era.trim()}.` : '';
    const summaryStr = historicalSummary.trim() || description.trim();
    const rulesStr =
      securityGuidelines.length > 0
        ? ` Before entering the security gates, please ensure your photo ID and ticket voucher are ready.`
        : ' Please review entry requirements before stepping inside.';

    const script =
      `Welcome to ${landmarkName}${eraStr}${builderStr} ${summaryStr} ${rulesStr}`.trim();
    setAudioIntroText(script);
  };

  // Sync map center dragging directly into text inputs
  const handleMapLocationChange = useCallback((newLat: number, newLng: number) => {
    setLatitude(newLat.toFixed(6));
    setLongitude(newLng.toFixed(6));
  }, []);

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
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);

  // Helper to slugify a human-readable title
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+/, '');
  };

  // Auto-slug generator from user input
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isSlugCustomized) {
      setCode(slugify(val));
    }
  };

  // Allow manual customization of the slug by admin
  const handleCodeChange = (val: string) => {
    setCode(val);
    if (val.trim() === '') {
      setIsSlugCustomized(false);
      setCode(slugify(name));
    } else {
      setIsSlugCustomized(true);
    }
  };

  const handleResetSlugToAuto = () => {
    setIsSlugCustomized(false);
    setCode(slugify(name));
  };

  // Handle Logo (Map Overlay Badge) Upload
  const handleLogoUpload = async (file: File) => {
    const isValidExtension = file.name.match(/\.(svg|png|jpe?g|webp)$/i);
    if (!isValidExtension) {
      showError('Unsupported File', 'Please select a PNG, SVG, or JPG landmark logo badge.');
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setLogoPreviewUrl(localPreview);
    setLogoFileName(file.name);

    const targetSlug = (code.trim() || slugify(name) || 'temp_monument').replace(/^_+|_+$/g, '');

    try {
      setIsUploadingLogo(true);
      setLogoProgress(0);

      const uploadRes = await uploadApi.uploadFile(file, {
        section: 'landmarks',
        slug: targetSlug,
        subSection: 'logos',
        onProgress: (pct) => setLogoProgress(pct),
      });

      setLogoUrl(uploadRes.secureUrl || uploadRes.url);
      setLogoPublicId(uploadRes.publicId);
      showSuccess('Logo Uploaded to Cloudinary', `Stored in ${uploadRes.folder}`);
    } catch (err: unknown) {
      console.error('Logo upload error:', err);
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        axiosErr?.response?.data?.message ||
        axiosErr.message ||
        'Failed to upload logo to Cloudinary.';
      showError('Logo Upload Failed', msg);
    } finally {
      setIsUploadingLogo(false);
      setLogoProgress(null);
    }
  };

  const handleRemoveLogo = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLogoFileName('');
    setLogoUrl('');
    setLogoPublicId('');
    setLogoPreviewUrl((prev) => {
      if (prev?.startsWith('blob:')) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
  };

  // Handle Card (Tourist Guide Thumbnail) Upload
  const handleCardUpload = async (file: File) => {
    const isValidExtension = file.name.match(/\.(png|jpe?g|webp)$/i);
    if (!isValidExtension) {
      showError('Unsupported File', 'Please select a PNG, JPG, or WebP cover image for the card.');
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setCardPreviewUrl(localPreview);
    setCardFileName(file.name);

    const targetSlug = (code.trim() || slugify(name) || 'temp_monument').replace(/^_+|_+$/g, '');

    try {
      setIsUploadingCard(true);
      setCardProgress(0);

      const uploadRes = await uploadApi.uploadFile(file, {
        section: 'landmarks',
        slug: targetSlug,
        subSection: 'cards',
        onProgress: (pct) => setCardProgress(pct),
      });

      setCardUrl(uploadRes.secureUrl || uploadRes.url);
      setCardPublicId(uploadRes.publicId);
      showSuccess('Card Image Uploaded', `Stored in ${uploadRes.folder}`);
    } catch (err: unknown) {
      console.error('Card upload error:', err);
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        axiosErr?.response?.data?.message ||
        axiosErr.message ||
        'Failed to upload card image to Cloudinary.';
      showError('Card Upload Failed', msg);
    } finally {
      setIsUploadingCard(false);
      setCardProgress(null);
    }
  };

  const handleRemoveCard = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCardFileName('');
    setCardUrl('');
    setCardPublicId('');
    setCardPreviewUrl((prev) => {
      if (prev?.startsWith('blob:')) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
  };

  const handleResetForm = useCallback(() => {
    setName('');
    setCode('');
    setIsSlugCustomized(false);
    setDescription('');
    setLatitude(COLOSSEUM_DEFAULT_COORDS.lat.toFixed(6));
    setLongitude(COLOSSEUM_DEFAULT_COORDS.lng.toFixed(6));
    setWidthMeters('');
    setHeightMeters('');
    setLogoFileName('');
    setLogoUrl('');
    setLogoPublicId('');
    setLogoPreviewUrl((prev) => {
      if (prev?.startsWith('blob:')) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
    setCardFileName('');
    setCardUrl('');
    setCardPublicId('');
    setCardPreviewUrl((prev) => {
      if (prev?.startsWith('blob:')) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
    setCategory('Monument');
    setColorHex('#DD1110');
    setIconSymbol('🏛️');
    setIsPublished(true);
    setEra('');
    setBuilders('');
    setHistoricalSummary('');
    setSecurityGuidelines([]);
    setNewGuideline('');
    setLevelHighlights([]);
    setNewLevelHighlight('');
    setAudioIntroText('');
    setShowAdvanced(false);
    setRotationDegrees(0.0);
    setAnchorX(0.5);
    setAnchorY(0.5);
    setZIndex(1);
    setMinZoom(13.0);
    setMaxZoom(21.0);
  }, []);

  // Synchronize dialog state with landmarkToEdit when opened
  useEffect(() => {
    if (open) {
      if (landmarkToEdit) {
        setName(landmarkToEdit.name || '');
        setCode(landmarkToEdit.code || landmarkToEdit.id || '');
        setIsSlugCustomized(true);
        setDescription(landmarkToEdit.description || '');
        const lat =
          landmarkToEdit.location?.coordinates?.[1] !== undefined
            ? landmarkToEdit.location.coordinates[1].toFixed(6)
            : COLOSSEUM_DEFAULT_COORDS.lat.toFixed(6);
        const lng =
          landmarkToEdit.location?.coordinates?.[0] !== undefined
            ? landmarkToEdit.location.coordinates[0].toFixed(6)
            : COLOSSEUM_DEFAULT_COORDS.lng.toFixed(6);
        setLatitude(lat);
        setLongitude(lng);
        setWidthMeters(
          landmarkToEdit.dimensions?.widthMeters !== undefined
            ? String(landmarkToEdit.dimensions.widthMeters)
            : ''
        );
        setHeightMeters(
          landmarkToEdit.dimensions?.heightMeters !== undefined
            ? String(landmarkToEdit.dimensions.heightMeters)
            : ''
        );
        // Logo Map Overlay state
        setLogoUrl(landmarkToEdit.assetPath || '');
        setLogoFileName(
          landmarkToEdit.assetPath ? landmarkToEdit.assetPath.split('/').pop() || '' : ''
        );
        setLogoPublicId(landmarkToEdit.cloudinaryPublicId || '');
        setLogoPreviewUrl(landmarkToEdit.assetPath || null);

        // Card Thumbnail Image state
        setCardUrl(landmarkToEdit.thumbnailUrl || '');
        setCardFileName(
          landmarkToEdit.thumbnailUrl ? landmarkToEdit.thumbnailUrl.split('/').pop() || '' : ''
        );
        setCardPublicId(landmarkToEdit.thumbnailPublicId || '');
        setCardPreviewUrl(landmarkToEdit.thumbnailUrl || null);

        setRotationDegrees(landmarkToEdit.calibration?.rotationDegrees ?? 0.0);
        setAnchorX(landmarkToEdit.calibration?.anchorX ?? 0.5);
        setAnchorY(landmarkToEdit.calibration?.anchorY ?? 0.5);
        setZIndex(landmarkToEdit.zIndex ?? 1);
        setMinZoom(landmarkToEdit.minZoom ?? 13.0);
        setMaxZoom(landmarkToEdit.maxZoom ?? 21.0);
        setIsPublished(landmarkToEdit.isPublished ?? true);
        setEra(landmarkToEdit.era || '');
        setBuilders(landmarkToEdit.builders || '');
        setHistoricalSummary(landmarkToEdit.historicalSummary || landmarkToEdit.description || '');
        setSecurityGuidelines(
          Array.isArray(landmarkToEdit.securityGuidelines)
            ? [...landmarkToEdit.securityGuidelines]
            : []
        );
        setLevelHighlights(
          Array.isArray(landmarkToEdit.levelHighlights) ? [...landmarkToEdit.levelHighlights] : []
        );
        setAudioIntroText(landmarkToEdit.audioIntroText || '');
        setShowAdvanced(
          Boolean(
            landmarkToEdit.calibration?.rotationDegrees ||
            (landmarkToEdit.calibration?.anchorX !== undefined &&
              landmarkToEdit.calibration.anchorX !== 0.5) ||
            (landmarkToEdit.calibration?.anchorY !== undefined &&
              landmarkToEdit.calibration.anchorY !== 0.5)
          )
        );
      } else {
        handleResetForm();
      }
    }
  }, [open, landmarkToEdit, handleResetForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showError('Validation Error', 'Monument name is required');
      return;
    }
    const finalCode = (code.trim() || slugify(name)).replace(/^_+|_+$/g, '');
    if (!finalCode) {
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
      code: finalCode,
      name: name.trim(),
      description: description.trim(),
      era: era.trim(),
      builders: builders.trim(),
      historicalSummary: historicalSummary.trim() || description.trim(),
      securityGuidelines: securityGuidelines.filter((g) => g.trim().length > 0),
      levelHighlights: levelHighlights.filter((l) => l.trim().length > 0),
      audioIntroText: audioIntroText.trim(),
      assetPath: logoUrl || logoFileName || 'assets/floor_map/floor_level_1.svg',
      cloudinaryPublicId: logoPublicId || undefined,
      thumbnailUrl: cardUrl || undefined,
      thumbnailPublicId: cardPublicId || undefined,
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
      if (isEditMode && landmarkToEdit) {
        const targetId = landmarkToEdit.id || landmarkToEdit.code;
        const updated = await landmarkApi.update(targetId, payload);
        showSuccess('Landmark Updated', `"${updated.name}" (${updated.code}) saved successfully.`);
        if (onUpdated) {
          onUpdated(updated);
        }
      } else {
        const created = await landmarkApi.create(payload);
        showSuccess(
          'Landmark Registered',
          `"${created.name}" (${created.code}) created successfully.`
        );
        if (onCreated) {
          onCreated(created);
        }
      }
      handleResetForm();
      onOpenChange(false);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        axiosErr?.response?.data?.message ||
        axiosErr?.message ||
        (isEditMode ? 'Unable to update landmark.' : 'Unable to register landmark.');
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
              <LandmarkIcon className="size-5" />
            </div>
            <DialogHeader className="space-y-0.5 min-w-0">
              <DialogTitle className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
                {isEditMode
                  ? `Edit Landmark: ${landmarkToEdit?.name || name}`
                  : 'Add New Landmark or Monument'}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {isEditMode
                  ? 'Update existing landmark configuration'
                  : 'Create a new landmark or monument record'}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Identity & Coordinates */}
            <div className="space-y-6">
              {/* 01 Basic Identity */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                  <span>01</span>
                  <span>Basic Identity</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Monument Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arch of Septimius Severus"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-foreground">
                      System Code (Slug) <span className="text-destructive">*</span>
                    </label>
                    {isEditMode ? (
                      <span className="text-[10px] text-muted-foreground font-normal">
                        Fixed identifier
                      </span>
                    ) : isSlugCustomized ? (
                      <button
                        type="button"
                        onClick={handleResetSlugToAuto}
                        className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer font-medium"
                        title="Re-sync code with Monument Name"
                      >
                        <RotateCcw className="size-3" />
                        <span>Reset to auto</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-muted-foreground font-normal">
                        Auto-generated
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    disabled={isEditMode}
                    value={code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    placeholder="e.g. arch_of_septimius_severus"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-60 disabled:bg-muted/40 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Historical Description
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter historical background for visitors and audio guides..."
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </div>

              {/* 02 Geographic Position */}
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                    <span>02 Geographic Position</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Pan map to calibrate center pin
                  </span>
                </div>

                {/* Map with Fixed Red Pointer in Center */}
                <LocationPickerMap
                  latitude={latitude}
                  longitude={longitude}
                  onChange={handleMapLocationChange}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Latitude <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="e.g. 41.8902"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
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
                      placeholder="e.g. 12.4922"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Logo, Card Image, Dimensions, Styling & Calibration */}
            <div className="space-y-6">
              {/* 03 Landmark Logo (Map Overlay Badge) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                    <span>03</span>
                    <span>Landmark Logo (Map Badge)</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    assets/logo overlay
                  </span>
                </div>

                <div>
                  {isUploadingLogo ? (
                    <div className="border-2 border-dashed border-primary/50 rounded-xl p-5 text-center bg-primary/5 flex flex-col items-center justify-center space-y-2">
                      <Loader2 className="size-6 text-primary animate-spin" />
                      <p className="text-xs font-medium text-foreground">
                        Uploading logo to Cloudinary...{' '}
                        {logoProgress !== null ? `${logoProgress}%` : ''}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono truncate max-w-xs">
                        colosseum/landmarks/{code.trim() || 'monument'}/logos
                      </p>
                    </div>
                  ) : logoFileName ? (
                    <div className="border border-border rounded-xl p-3 bg-card flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        {logoPreviewUrl ? (
                          <img
                            src={logoPreviewUrl}
                            alt="Logo Preview"
                            className="size-12 rounded-lg object-contain border border-border bg-muted/40 p-1 shrink-0"
                          />
                        ) : (
                          <div className="size-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                            <ImageIcon className="size-6 text-primary" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {logoFileName}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {logoUrl ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium font-mono">
                                <CheckCircle2 className="size-3" /> Cloudinary CDN
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground font-mono">
                                Selected locally
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <label className="text-xs font-medium text-primary hover:underline cursor-pointer px-2 py-1">
                          Change
                          <input
                            type="file"
                            accept=".svg,.png,.jpg,.jpeg,.webp"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleLogoUpload(file);
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="p-1 text-muted-foreground hover:text-destructive rounded-md transition-colors cursor-pointer"
                          title="Remove logo"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleLogoUpload(file);
                      }}
                      className="border-2 border-dashed border-border hover:border-primary/60 rounded-xl p-5 text-center bg-muted/20 transition-colors flex flex-col items-center justify-center cursor-pointer"
                    >
                      <UploadCloud className="size-7 mb-1.5 text-muted-foreground" />
                      <p className="text-xs text-foreground font-medium">
                        Drop Landmark Logo here, or{' '}
                        <span className="text-primary underline">browse</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Supports transparent PNG or SVG badge (anchored on map)
                      </p>
                      <input
                        type="file"
                        accept=".svg,.png,.jpg,.jpeg,.webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleLogoUpload(file);
                        }}
                      />
                    </label>
                  )}
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
                      placeholder="e.g. 25.0"
                      value={widthMeters}
                      onChange={(e) => setWidthMeters(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
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
                      placeholder="e.g. 20.0"
                      value={heightMeters}
                      onChange={(e) => setHeightMeters(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* 04 Landmark Card Image */}
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                    <span>04</span>
                    <span>Landmark Card Image</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Tourist Guide Card
                  </span>
                </div>

                <div>
                  {isUploadingCard ? (
                    <div className="border-2 border-dashed border-primary/50 rounded-xl p-5 text-center bg-primary/5 flex flex-col items-center justify-center space-y-2">
                      <Loader2 className="size-6 text-primary animate-spin" />
                      <p className="text-xs font-medium text-foreground">
                        Uploading card image to Cloudinary...{' '}
                        {cardProgress !== null ? `${cardProgress}%` : ''}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono truncate max-w-xs">
                        colosseum/landmarks/{code.trim() || 'monument'}/cards
                      </p>
                    </div>
                  ) : cardFileName ? (
                    <div className="border border-border rounded-xl p-3 bg-card flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        {cardPreviewUrl ? (
                          <img
                            src={cardPreviewUrl}
                            alt="Card Preview"
                            className="size-12 rounded-lg object-cover border border-border bg-muted/40 shrink-0"
                          />
                        ) : (
                          <div className="size-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                            <ImageIcon className="size-6 text-primary" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {cardFileName}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {cardUrl ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium font-mono">
                                <CheckCircle2 className="size-3" /> Cloudinary CDN
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground font-mono">
                                Selected locally
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <label className="text-xs font-medium text-primary hover:underline cursor-pointer px-2 py-1">
                          Change
                          <input
                            type="file"
                            accept=".png,.jpg,.jpeg,.webp"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleCardUpload(file);
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleRemoveCard}
                          className="p-1 text-muted-foreground hover:text-destructive rounded-md transition-colors cursor-pointer"
                          title="Remove card image"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleCardUpload(file);
                      }}
                      className="border-2 border-dashed border-border hover:border-primary/60 rounded-xl p-5 text-center bg-muted/20 transition-colors flex flex-col items-center justify-center cursor-pointer"
                    >
                      <UploadCloud className="size-7 mb-1.5 text-muted-foreground" />
                      <p className="text-xs text-foreground font-medium">
                        Drop Card cover image here, or{' '}
                        <span className="text-primary underline">browse</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Supports PNG/JPG photo for tourist guide cards and list previews
                      </p>
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleCardUpload(file);
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* 05 Pin & Marker Styling */}
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                  <span>05</span>
                  <span>Pin & Marker Styling</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label
                      htmlFor={categorySelectId}
                      className="block text-xs font-medium text-foreground mb-1"
                    >
                      Category
                    </label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger id={categorySelectId} className="w-full text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Monument">Monument</SelectItem>
                        <SelectItem value="Triumphal Arch">Triumphal Arch</SelectItem>
                        <SelectItem value="Amphitheatre">Amphitheatre</SelectItem>
                        <SelectItem value="Temple">Temple</SelectItem>
                        <SelectItem value="Gladiator Barracks">Gladiator Barracks</SelectItem>
                        <SelectItem value="Ruins">Ruins / Arena</SelectItem>
                      </SelectContent>
                    </Select>
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
                        className="size-8 rounded-md border border-border cursor-pointer bg-transparent shrink-0"
                      />
                      <input
                        type="text"
                        value={colorHex}
                        onChange={(e) => setColorHex(e.target.value)}
                        className="w-full px-2 py-1.5 bg-background border border-border rounded-md text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor={iconSelectId}
                      className="block text-xs font-medium text-foreground mb-1"
                    >
                      Marker Icon
                    </label>
                    <Select value={iconSymbol} onValueChange={setIconSymbol}>
                      <SelectTrigger id={iconSelectId} className="w-full text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="🏛️">🏛️ Arch / Monument</SelectItem>
                        <SelectItem value="🏟️">🏟️ Stadium / Arena</SelectItem>
                        <SelectItem value="⛩️">⛩️ Ancient Temple</SelectItem>
                        <SelectItem value="⚔️">⚔️ Gladiator School</SelectItem>
                        <SelectItem value="📍">📍 Waypoint Pin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
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
                  <div className="p-4 space-y-4 border-t border-border bg-background/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Rotation Angle */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                          <Compass className="size-3.5 text-primary" />
                          <span>Rotation Angle</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={rotationDegrees}
                            onChange={(e) => setRotationDegrees(Number(e.target.value))}
                            step="0.5"
                            className="w-full h-9 pl-3 pr-12 bg-background border border-border rounded-lg text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                          />
                          <span className="absolute right-3 top-2 text-xs text-muted-foreground font-mono select-none">
                            deg
                          </span>
                        </div>
                      </div>

                      {/* Stacking Z-Index */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                          <Layers className="size-3.5 text-primary" />
                          <span>Stacking Z-Index</span>
                        </label>
                        <input
                          type="number"
                          value={zIndex}
                          onChange={(e) => setZIndex(Number(e.target.value))}
                          className="w-full h-9 px-3 bg-background border border-border rounded-lg text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        />
                      </div>

                      {/* Pivot Anchors (X, Y) */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground flex items-center justify-between">
                          <span>Anchor Pivot (X, Y)</span>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            0.0 - 1.0
                          </span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="relative">
                            <input
                              type="number"
                              step="0.05"
                              min="0"
                              max="1"
                              value={anchorX}
                              onChange={(e) => setAnchorX(Number(e.target.value))}
                              className="w-full h-9 pl-7 pr-2 bg-background border border-border rounded-lg text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                            />
                            <span className="absolute left-2.5 top-2 text-xs font-semibold text-muted-foreground select-none">
                              X:
                            </span>
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.05"
                              min="0"
                              max="1"
                              value={anchorY}
                              onChange={(e) => setAnchorY(Number(e.target.value))}
                              className="w-full h-9 pl-7 pr-2 bg-background border border-border rounded-lg text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                            />
                            <span className="absolute left-2.5 top-2 text-xs font-semibold text-muted-foreground select-none">
                              Y:
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Zoom Visibility Range */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground flex items-center justify-between">
                          <span>Zoom Visibility Range</span>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            Min - Max
                          </span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="relative">
                            <input
                              type="number"
                              step="0.5"
                              value={minZoom}
                              onChange={(e) => setMinZoom(Number(e.target.value))}
                              className="w-full h-9 pl-9 pr-2 bg-background border border-border rounded-lg text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                            />
                            <span className="absolute left-2.5 top-2 text-xs font-semibold text-muted-foreground select-none">
                              Min:
                            </span>
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.5"
                              value={maxZoom}
                              onChange={(e) => setMaxZoom(Number(e.target.value))}
                              className="w-full h-9 pl-9 pr-2 bg-background border border-border rounded-lg text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                            />
                            <span className="absolute left-2.5 top-2 text-xs font-semibold text-muted-foreground select-none">
                              Max:
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 06 VISITOR ONBOARDING & ORIENTATION BRIEFING (POP-UP CARD) */}
          <div className="pt-6 border-t border-border space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                <BookOpen className="size-3.5 text-primary" />
                <span>06 Visitor Briefing & Entry Onboarding Card</span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Configures the proximity pop-up card & automatic audio orientation
              </span>
            </div>

            {/* Historical Summary */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <span>Historical Summary (Onboarding Card)</span>
                </label>
                <span className="text-[10px] text-muted-foreground">
                  Displays in the expandable story card on approach
                </span>
              </div>
              <textarea
                rows={3}
                value={historicalSummary}
                onChange={(e) => setHistoricalSummary(e.target.value)}
                placeholder="Enter rich historical context, architectural significance, construction history, and archaeological importance for visitors..."
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            {/* Era & Builders Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Historical Era / Construction Period
                </label>
                <input
                  type="text"
                  value={era}
                  onChange={(e) => setEra(e.target.value)}
                  placeholder="e.g. 70 – 80 AD (Flavian Dynasty)"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Commissioning Builders / Architects
                </label>
                <input
                  type="text"
                  value={builders}
                  onChange={(e) => setBuilders(e.target.value)}
                  placeholder="e.g. Emperor Vespasian, completed by Titus"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </div>

            {/* Security & Entry Guidelines */}
            <div className="space-y-2 p-3.5 bg-muted/20 border border-border rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground">
                    Security & Entry Guidelines
                  </span>
                  <span className="text-[10px] bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">
                    {securityGuidelines.length} rules
                  </span>
                </div>
                {securityGuidelines.length === 0 && (
                  <button
                    type="button"
                    onClick={handleAddDefaultGuidelines}
                    className="text-[11px] text-primary hover:underline font-medium cursor-pointer flex items-center gap-1"
                  >
                    <span>Load Default Rules</span>
                  </button>
                )}
              </div>

              {/* Guidelines List */}
              {securityGuidelines.length > 0 && (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {securityGuidelines.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between gap-2 p-2 bg-background border border-border rounded-lg text-xs group hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <span className="text-[10px] bg-muted text-muted-foreground font-mono rounded px-1.5 py-0.5 shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        <span className="text-foreground leading-relaxed break-words">{item}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveGuideline(index)}
                        className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors cursor-pointer shrink-0"
                        title="Remove guideline"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Guideline Input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newGuideline}
                  onChange={(e) => setNewGuideline(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddGuideline();
                    }
                  }}
                  placeholder="e.g. Valid ticket and photo ID must be presented together at the turnstile..."
                  className="flex-1 px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddGuideline}
                  disabled={!newGuideline.trim()}
                  className="text-xs h-8 px-3 gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="size-3.5" />
                  <span>Add Rule</span>
                </Button>
              </div>
            </div>

            {/* Accessible Levels & Floor Highlights */}
            <div className="space-y-2 p-3.5 bg-muted/20 border border-border rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="size-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground">
                    Accessible Levels & Highlights
                  </span>
                  <span className="text-[10px] bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">
                    {levelHighlights.length} tiers
                  </span>
                </div>
              </div>

              {/* Levels List */}
              {levelHighlights.length > 0 && (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {levelHighlights.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between gap-2 p-2 bg-background border border-border rounded-lg text-xs group hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <span className="text-[10px] bg-muted text-muted-foreground font-mono rounded px-1.5 py-0.5 shrink-0 mt-0.5">
                          Tier {index + 1}
                        </span>
                        <span className="text-foreground leading-relaxed break-words">{item}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveLevelHighlight(index)}
                        className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors cursor-pointer shrink-0"
                        title="Remove highlight"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Level Input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newLevelHighlight}
                  onChange={(e) => setNewLevelHighlight(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddLevelHighlight();
                    }
                  }}
                  placeholder="e.g. Level 1: Arena Floor & Lower Cavea (Imperial seating tiers)..."
                  className="flex-1 px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddLevelHighlight}
                  disabled={!newLevelHighlight.trim()}
                  className="text-xs h-8 px-3 gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="size-3.5" />
                  <span>Add Level</span>
                </Button>
              </div>
            </div>

            {/* Spoken Audio Intro Script (TTS) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Volume2 className="size-3.5 text-primary" />
                  <span>Spoken Audio Orientation Script (TTS)</span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateAudioScript}
                  className="text-[11px] text-primary hover:underline font-medium cursor-pointer flex items-center gap-1"
                  title="Auto-compose TTS script from identity, era, summary, and security rules"
                >
                  <Sparkles className="size-3" />
                  <span>Generate from Summary</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={audioIntroText}
                onChange={(e) => setAudioIntroText(e.target.value)}
                placeholder="Script narrated automatically to visitors via Text-to-Speech upon approaching within 10 meters of this monument entrance..."
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
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
                disabled={isSubmitting || isUploadingLogo || isUploadingCard}
                size="sm"
                className="bg-primary text-primary-foreground font-semibold gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>{isEditMode ? 'Saving Changes...' : 'Registering...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isEditMode ? 'Save Changes' : 'Create Landmark'}</span>
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

export const LandmarkFormDialog = CreateLandmarkDialog;
export default CreateLandmarkDialog;
