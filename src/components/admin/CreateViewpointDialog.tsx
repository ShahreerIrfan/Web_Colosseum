import { uploadApi } from '@/apis/upload/uploadApi';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import useToast from '@/hooks/component/useToast';
import type { CreateViewpointInput, ViewpointModel } from '@/types/api/viewpointTypes';
import type { FloorModel } from '@/types/api/floorTypes';
import type { Landmark as LandmarkModel } from '@/types/api/landmarkTypes';
import {
  CheckCircle2,
  Compass,
  Eye,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Radio,
  RotateCcw,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { LocationPickerMap } from './LocationPickerMap';
import { COLOSSEUM_DEFAULT_COORDS } from './mapConstants';

export interface CreateViewpointDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viewpointToEdit?: ViewpointModel | null;
  landmarks?: LandmarkModel[];
  floors?: FloorModel[];
  defaultLandmarkCode?: string;
  defaultFloorId?: string;
  onCreated?: (viewpoint: ViewpointModel) => void;
  onUpdated?: (viewpoint: ViewpointModel) => void;
  onSubmitViewpoint?: (payload: CreateViewpointInput) => Promise<ViewpointModel>;
}

export const CreateViewpointDialog: React.FC<CreateViewpointDialogProps> = ({
  open,
  onOpenChange,
  viewpointToEdit,
  landmarks = [],
  floors = [],
  defaultLandmarkCode,
  defaultFloorId,
  onCreated,
  onUpdated,
  onSubmitViewpoint,
}) => {
  const { showSuccess, showError } = useToast();
  const publishId = useId();
  const isEditMode = Boolean(viewpointToEdit);

  // Normalize helper for landmark codes
  const norm = (str: string) => str.toLowerCase().replace(/[-_]/g, '');

  // Form State
  const [selectedLandmarkCode, setSelectedLandmarkCode] = useState<string>('colosseum');
  const [floorId, setFloorId] = useState('');
  const [viewpointId, setViewpointId] = useState('');
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);
  const [title, setTitle] = useState('');
  const [order, setOrder] = useState<number>(1);
  const [description, setDescription] = useState('');

  // Image Upload State (Cloudinary)
  const [imageAsset, setImageAsset] = useState('');
  const [imageFileName, setImageFileName] = useState('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageProgress, setImageProgress] = useState<number | null>(null);

  // Spatial calibration
  const [triggerRadiusMeters, setTriggerRadiusMeters] = useState<number>(4.0);
  const [targetGazeHeadingDegrees, setTargetGazeHeadingDegrees] = useState<number | string>('');
  const [latitude, setLatitude] = useState<number | string>(
    COLOSSEUM_DEFAULT_COORDS.lat.toFixed(6)
  );
  const [longitude, setLongitude] = useState<number | string>(
    COLOSSEUM_DEFAULT_COORDS.lng.toFixed(6)
  );
  const [isPublished, setIsPublished] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter floors under the selected landmark
  const availableFloorsForLandmark = useMemo(() => {
    if (!selectedLandmarkCode) return floors;
    const targetNorm = norm(selectedLandmarkCode);
    return floors.filter((fl) => norm(fl.landmarkCode || 'colosseum') === targetNorm);
  }, [floors, selectedLandmarkCode]);

  // Fallback landmarks list if landmarks array is empty
  const landmarkOptions = useMemo(() => {
    if (landmarks.length > 0) {
      return landmarks.map((l) => ({ code: l.code, name: l.name }));
    }
    // Extract unique landmarks from floors if landmarks prop hasn't loaded yet
    const codes = Array.from(new Set(floors.map((f) => f.landmarkCode || 'colosseum')));
    if (codes.length > 0) {
      return codes.map((c) => ({
        code: c,
        name: c
          .split(/[-_]/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' '),
      }));
    }
    return [{ code: 'colosseum', name: 'Colosseum (Flavian Amphitheatre)' }];
  }, [landmarks, floors]);

  const slugify = (text: string, ord: number) => {
    const clean = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    return clean ? `vp_${clean}` : `vp_${ord}`;
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isSlugCustomized) {
      setViewpointId(slugify(val, order));
    }
  };

  const handleOrderChange = (val: number) => {
    setOrder(val);
    if (!isSlugCustomized && !title) {
      setViewpointId(`vp_${val}`);
    }
  };

  const handleLandmarkChange = (code: string) => {
    setSelectedLandmarkCode(code);
    const targetNorm = norm(code);
    const matchingFloors = floors.filter(
      (fl) => norm(fl.landmarkCode || 'colosseum') === targetNorm
    );
    if (matchingFloors.length > 0) {
      setFloorId(matchingFloors[0].floorId || matchingFloors[0].id);
      // Automatically center map to the selected floor's anchor if available
      const firstCoord = matchingFloors[0].calibration?.centerCoordinates;
      if (firstCoord) {
        setLatitude(firstCoord.latitude.toFixed(6));
        setLongitude(firstCoord.longitude.toFixed(6));
      }
    } else {
      setFloorId('');
    }
  };

  const handleFloorChange = (selectedFloorId: string) => {
    setFloorId(selectedFloorId);
    const fl = floors.find((f) => (f.floorId || f.id) === selectedFloorId);
    if (fl?.calibration?.centerCoordinates) {
      setLatitude(fl.calibration.centerCoordinates.latitude.toFixed(6));
      setLongitude(fl.calibration.centerCoordinates.longitude.toFixed(6));
    }
  };

  const handleMapLocationChange = useCallback((newLat: number, newLng: number) => {
    setLatitude(newLat.toFixed(6));
    setLongitude(newLng.toFixed(6));
  }, []);

  // Handle Cloudinary image upload
  const handleImageUpload = async (file: File) => {
    const isValidFormat = file.name.match(/\.(png|jpe?g|webp)$/i);
    if (!isValidFormat) {
      showError('Unsupported File', 'Please select a PNG, JPG, or WebP photo.');
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setImagePreviewUrl(localPreview);
    setImageFileName(file.name);

    const targetSlug = (viewpointId.trim() || slugify(title, order) || 'viewpoint').replace(
      /^_+|_+$/g,
      ''
    );

    try {
      setIsUploadingImage(true);
      setImageProgress(0);

      const uploadRes = await uploadApi.uploadFile(file, {
        section: 'viewpoints',
        slug: targetSlug,
        subSection: 'photos',
        onProgress: (pct) => setImageProgress(pct),
      });

      const secureUrl = uploadRes.secureUrl || uploadRes.url;
      setImageAsset(secureUrl);
      showSuccess('Photo Uploaded', `Stored in ${uploadRes.folder || 'viewpoints'}`);
    } catch (err: unknown) {
      console.error('Viewpoint photo upload error:', err);
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        axiosErr?.response?.data?.message ||
        axiosErr.message ||
        'Failed to upload image to Cloudinary.';
      showError('Upload Failed', msg);
    } finally {
      setIsUploadingImage(false);
      setImageProgress(null);
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageFileName('');
    setImageAsset('');
    setImagePreviewUrl((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const handleResetForm = useCallback(() => {
    const initialLandmark = defaultLandmarkCode || (landmarkOptions[0]?.code ?? 'colosseum');
    setSelectedLandmarkCode(initialLandmark);

    const targetNorm = norm(initialLandmark);
    const matching = floors.filter((f) => norm(f.landmarkCode || 'colosseum') === targetNorm);
    const initialFloorId =
      defaultFloorId ||
      (matching.length > 0
        ? matching[0].floorId || matching[0].id
        : (floors[0]?.floorId ?? 'floor_underground'));

    setFloorId(initialFloorId);
    setViewpointId('');
    setIsSlugCustomized(false);
    setTitle('');
    setOrder(1);
    setDescription('');
    setImageAsset('');
    setImageFileName('');
    setImagePreviewUrl((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
      return null;
    });
    setTriggerRadiusMeters(4.0);
    setTargetGazeHeadingDegrees('');
    setLatitude(COLOSSEUM_DEFAULT_COORDS.lat.toFixed(6));
    setLongitude(COLOSSEUM_DEFAULT_COORDS.lng.toFixed(6));
    setIsPublished(true);
  }, [defaultLandmarkCode, defaultFloorId, landmarkOptions, floors]);

  useEffect(() => {
    if (open) {
      if (viewpointToEdit) {
        setViewpointId(viewpointToEdit.id);
        setIsSlugCustomized(true);

        // Find associated floor to determine landmark
        const existingFloor = floors.find((f) => (f.floorId || f.id) === viewpointToEdit.floorId);
        const lmCode = existingFloor?.landmarkCode || defaultLandmarkCode || 'colosseum';
        setSelectedLandmarkCode(lmCode);
        setFloorId(viewpointToEdit.floorId || '');

        setTitle(viewpointToEdit.title || '');
        setOrder(viewpointToEdit.order ?? 1);
        setDescription(viewpointToEdit.description || '');
        setImageAsset(viewpointToEdit.imageAsset || '');
        if (viewpointToEdit.imageAsset) {
          setImageFileName(viewpointToEdit.imageAsset.split('/').pop() || 'Existing Image');
          setImagePreviewUrl(viewpointToEdit.imageAsset);
        } else {
          setImageFileName('');
          setImagePreviewUrl(null);
        }
        setTriggerRadiusMeters(viewpointToEdit.triggerRadiusMeters ?? 4.0);
        setTargetGazeHeadingDegrees(
          viewpointToEdit.targetGazeHeadingDegrees !== null &&
            viewpointToEdit.targetGazeHeadingDegrees !== undefined
            ? viewpointToEdit.targetGazeHeadingDegrees
            : ''
        );
        setLatitude(
          viewpointToEdit.latitude !== null && viewpointToEdit.latitude !== undefined
            ? viewpointToEdit.latitude.toFixed(6)
            : COLOSSEUM_DEFAULT_COORDS.lat.toFixed(6)
        );
        setLongitude(
          viewpointToEdit.longitude !== null && viewpointToEdit.longitude !== undefined
            ? viewpointToEdit.longitude.toFixed(6)
            : COLOSSEUM_DEFAULT_COORDS.lng.toFixed(6)
        );
        setIsPublished(viewpointToEdit.isPublished ?? true);
      } else {
        handleResetForm();
      }
    }
  }, [open, viewpointToEdit, handleResetForm, floors, defaultLandmarkCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showError('Validation Error', 'Viewpoint title is required');
      return;
    }
    const finalVpId = (viewpointId.trim() || slugify(title, order)).replace(/^_+|_+$/g, '');
    if (!finalVpId) {
      showError('Validation Error', 'A unique viewpoint ID is required');
      return;
    }
    if (!floorId) {
      showError('Validation Error', 'Please select an associated floor');
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

    const headingNum =
      targetGazeHeadingDegrees !== '' && !isNaN(Number(targetGazeHeadingDegrees))
        ? Number(targetGazeHeadingDegrees)
        : null;

    const payload: CreateViewpointInput = {
      id: finalVpId,
      floorId,
      title: title.trim(),
      order,
      description: description.trim(),
      latitude: latNum,
      longitude: lngNum,
      normalizedX: 0.5,
      normalizedY: 0.5,
      audioUrl: viewpointToEdit?.audioUrl || '',
      audioDuration: viewpointToEdit?.audioDuration || '2 min',
      imageAsset: imageAsset.trim(),
      triggerRadiusMeters: Number(triggerRadiusMeters) || 4.0,
      targetGazeHeadingDegrees: headingNum,
      isPublished,
    };

    try {
      setIsSubmitting(true);
      if (onSubmitViewpoint) {
        const saved = await onSubmitViewpoint(payload);
        if (isEditMode && onUpdated) {
          onUpdated(saved);
        } else if (onCreated) {
          onCreated(saved);
        }
      } else {
        const fallback: ViewpointModel = {
          ...payload,
          latitude: payload.latitude ?? null,
          longitude: payload.longitude ?? null,
          normalizedX: 0.5,
          normalizedY: 0.5,
          isVisited: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        if (isEditMode && onUpdated) {
          onUpdated(fallback);
        } else if (onCreated) {
          onCreated(fallback);
        }
      }

      showSuccess(
        isEditMode ? 'Viewpoint Updated' : 'Viewpoint Registered',
        `"${payload.title}" saved successfully.`
      );
      handleResetForm();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to save viewpoint.';
      showError(isEditMode ? 'Update Failed' : 'Registration Failed', msg);
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
              <Eye className="size-5" />
            </div>
            <DialogHeader className="space-y-0.5 min-w-0">
              <DialogTitle className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
                {isEditMode
                  ? `Edit Viewpoint: ${viewpointToEdit?.title || title}`
                  : 'Register New Viewpoint'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground truncate">
                Configure GPS hotspot coordinates, text narration for TTS, floor level, and
                geofencing.
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Core Identity & Narration */}
            <div className="space-y-6">
              {/* 01 Spot Identity */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                  <span>01</span>
                  <span>Viewpoint Identity & Floor</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Viewpoint Title <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hypogeum Gladiator Gate"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>

                {/* Two Cascading Dropdowns: Landmark and Floor */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Landmark <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={selectedLandmarkCode}
                      onChange={(e) => handleLandmarkChange(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer"
                    >
                      {landmarkOptions.map((opt) => (
                        <option key={opt.code} value={opt.code}>
                          {opt.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Target Floor <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={floorId}
                      required
                      onChange={(e) => handleFloorChange(e.target.value)}
                      disabled={availableFloorsForLandmark.length === 0}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {availableFloorsForLandmark.length === 0 ? (
                        <option value="">No floors found</option>
                      ) : (
                        availableFloorsForLandmark.map((fl) => (
                          <option key={fl.floorId || fl.id} value={fl.floorId || fl.id}>
                            {fl.displayName} ({fl.floorNumberLabel || `Level ${fl.levelIndex}`})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Tour Order Index <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="1"
                      value={order}
                      onChange={(e) => handleOrderChange(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary font-mono"
                    />
                  </div>

                  {/* ID Slug */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-foreground">
                        Unique ID Slug <span className="text-destructive">*</span>
                      </label>
                      {isSlugCustomized && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsSlugCustomized(false);
                            setViewpointId(slugify(title, order));
                          }}
                          className="text-[10px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="size-2.5" />
                          Auto
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. vp_hypogeum_gate"
                      value={viewpointId}
                      onChange={(e) => {
                        setIsSlugCustomized(true);
                        setViewpointId(e.target.value);
                      }}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Description & Narration (Voiced by TTS)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Enter the historical story and archaeological narration. The on-device TTS engine will voice this text automatically when visitors approach this hotspot..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    This text is spoken aloud by on-device Text-to-Speech (TTS) when visitors
                    arrive.
                  </p>
                </div>
              </div>

              {/* 02 Visual Media (Cloudinary File Upload & Preview) */}
              <div className="space-y-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                    <ImageIcon className="size-3.5" />
                    <span>Visual Photo Media</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Cloudinary CDN
                  </span>
                </div>

                <div>
                  {isUploadingImage ? (
                    <div className="border-2 border-dashed border-primary/50 rounded-xl p-5 text-center bg-primary/5 flex flex-col items-center justify-center space-y-2">
                      <Loader2 className="size-6 text-primary animate-spin" />
                      <p className="text-xs font-medium text-foreground">
                        Uploading photo to Cloudinary...{' '}
                        {imageProgress !== null ? `${imageProgress}%` : ''}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono truncate max-w-xs">
                        colosseum/viewpoints/{viewpointId.trim() || 'spot'}/photos
                      </p>
                    </div>
                  ) : imageFileName || imageAsset ? (
                    <div className="border border-border rounded-xl p-3 bg-card flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        {imagePreviewUrl || imageAsset ? (
                          <img
                            src={imagePreviewUrl || imageAsset}
                            alt="Viewpoint Preview"
                            className="size-12 rounded-lg object-cover border border-border bg-muted/40 shrink-0"
                          />
                        ) : (
                          <div className="size-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                            <ImageIcon className="size-6 text-primary" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {imageFileName || imageAsset.split('/').pop() || 'Uploaded Photo'}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {imageAsset && imageAsset.startsWith('http') ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium font-mono">
                                <CheckCircle2 className="size-3" /> Cloudinary CDN
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[180px]">
                                {imageAsset || 'Local preview'}
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
                              if (file) handleImageUpload(file);
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="p-1 text-muted-foreground hover:text-destructive rounded-md transition-colors cursor-pointer"
                          title="Remove photo"
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
                        if (file) handleImageUpload(file);
                      }}
                      className="border-2 border-dashed border-border hover:border-primary/60 rounded-xl p-5 text-center bg-muted/20 transition-colors flex flex-col items-center justify-center cursor-pointer"
                    >
                      <UploadCloud className="size-7 mb-1.5 text-muted-foreground" />
                      <p className="text-xs text-foreground font-medium">
                        Drop Viewpoint Photo here, or{' '}
                        <span className="text-primary underline">browse</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Supports PNG, JPG, WebP photo displayed on visitor screen
                      </p>
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file);
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: GPS Anchor, Map Picker & Geofencing */}
            <div className="space-y-6">
              {/* Publication Status Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-muted/30 border border-border rounded-xl">
                <div>
                  <label
                    htmlFor={publishId}
                    className="text-xs font-bold text-foreground block cursor-pointer"
                  >
                    Publish Viewpoint
                  </label>
                  <p className="text-[11px] text-muted-foreground">
                    Available immediately for live client app navigation and viewpoint markers.
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

              {/* GPS Coordinates & Interactive Map Picker */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                    <MapPin className="size-3.5" />
                    <span>GPS Location Anchor</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Drag pin to calibrate position
                  </span>
                </div>

                <div className="h-48 rounded-xl overflow-hidden border border-border shadow-xs">
                  <LocationPickerMap
                    latitude={latitude}
                    longitude={longitude}
                    onChange={handleMapLocationChange}
                    className="size-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-foreground mb-1">
                      Latitude <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-foreground mb-1">
                      Longitude <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Geofence & Compass Orientation */}
              <div className="p-3.5 bg-muted/20 border border-border rounded-xl space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-foreground mb-1 flex items-center gap-1">
                      <Radio className="size-3 text-primary" />
                      Trigger Radius (m)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="30"
                      value={triggerRadiusMeters}
                      onChange={(e) => setTriggerRadiusMeters(parseFloat(e.target.value) || 4.0)}
                      className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Indoor trigger threshold
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-foreground mb-1 flex items-center gap-1">
                      <Compass className="size-3 text-primary" />
                      Target Heading (deg)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="360"
                      placeholder="e.g. 180"
                      value={targetGazeHeadingDegrees}
                      onChange={(e) => setTargetGazeHeadingDegrees(e.target.value)}
                      className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      0°-360° visitor gaze angle
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-3 sticky bottom-0 bg-card py-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting || isUploadingImage}
              onClick={() => onOpenChange(false)}
              className="border-border hover:bg-muted cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || isUploadingImage}
              className="gap-2 bg-primary text-primary-foreground font-semibold cursor-pointer shadow-xs hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Saving Viewpoint...</span>
                </>
              ) : (
                <>
                  <Eye className="size-3.5" />
                  <span>{isEditMode ? 'Update Viewpoint' : 'Register Viewpoint'}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateViewpointDialog;
