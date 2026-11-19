import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Check,
  RotateCw,
  FlipHorizontal,
  Sliders,
  Crop,
  Sparkles,
  RotateCcw,
  Sun,
  Contrast as ContrastIcon,
  Palette,
  ZoomIn,
  Move,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { convertHeicToJpeg } from '../utils/heicConverter';

export interface ImageEditorModalProps {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
  onApply: (editedFile: File, editedPreviewUrl: string) => void;
}

type AspectRatioPreset = 'original' | '1:1' | '4:5' | '16:9' | '3:4';

interface FilterPreset {
  id: string;
  name: string;
  filterString: string;
  colorPreview: string;
}

const FILTER_PRESETS: FilterPreset[] = [
  { id: 'none', name: 'Normal', filterString: 'none', colorPreview: '#9ca3af' },
  { id: 'warm', name: 'Warm', filterString: 'sepia(0.35) saturate(1.3) brightness(1.05)', colorPreview: '#f59e0b' },
  { id: 'cool', name: 'Cool', filterString: 'hue-rotate(190deg) saturate(1.15) brightness(1.02)', colorPreview: '#38bdf8' },
  { id: 'vivid', name: 'Vivid', filterString: 'saturate(1.75) contrast(1.15) brightness(1.02)', colorPreview: '#ec4899' },
  { id: 'bw', name: 'B&W', filterString: 'grayscale(1) contrast(1.25) brightness(1.05)', colorPreview: '#e5e7eb' },
  { id: 'sepia', name: 'Sepia', filterString: 'sepia(0.9) contrast(1.1) brightness(0.95)', colorPreview: '#d97706' },
  { id: 'dramatic', name: 'Dramatic', filterString: 'contrast(1.5) brightness(0.9) saturate(1.2)', colorPreview: '#a855f7' },
  { id: 'vintage', name: 'Vintage', filterString: 'sepia(0.45) contrast(1.2) brightness(0.95) saturate(1.3)', colorPreview: '#eab308' },
];

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  isOpen,
  imageUrl,
  onClose,
  onApply,
}) => {
  const { theme } = useTheme();

  // Tab State
  const [activeTab, setActiveTab] = useState<'filters' | 'crop' | 'adjust'>('filters');

  // Filter & Color adjustments
  const [selectedFilter, setSelectedFilter] = useState<string>('none');
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);

  // Transform / Crop adjustments
  const [aspectRatio, setAspectRatio] = useState<AspectRatioPreset>('original');
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Pan dragging state
  const isDraggingRef = useRef(false);
  const startDragRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Canvas ref for live rendering
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageObjRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [applying, setApplying] = useState(false);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Load Image
  useEffect(() => {
    if (!isOpen || !imageUrl) return;
    setImageLoaded(false);

    let active = true;

    const setupImage = async () => {
      let finalSrc = imageUrl;
      if (imageUrl.toLowerCase().includes('.heic') || imageUrl.toLowerCase().includes('.heif')) {
        try {
          const res = await fetch(imageUrl);
          const blob = await res.blob();
          const converted = await convertHeicToJpeg(
            new File([blob], 'photo.heic', { type: blob.type || 'image/heic' })
          );
          finalSrc = URL.createObjectURL(converted);
        } catch (err) {
          console.warn('[ImageEditorModal] Could not pre-convert HEIC:', err);
        }
      }

      if (!active) return;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (!active) return;
        imageObjRef.current = img;
        setImageLoaded(true);
        // Reset values when a new image loads
        setSelectedFilter('none');
        setBrightness(100);
        setContrast(100);
        setSaturation(100);
        setAspectRatio('original');
        setRotation(0);
        setFlipH(false);
        setZoom(1);
        setPan({ x: 0, y: 0 });
      };
      img.onerror = () => {
        if (!active) return;
        console.error('[ImageEditorModal] Failed to load image:', finalSrc);
        setImageLoaded(false);
      };
      img.src = finalSrc;
    };

    setupImage();

    return () => {
      active = false;
    };
  }, [isOpen, imageUrl]);

  // Compute CSS filter string
  const getFilterCss = useCallback(() => {
    const parts: string[] = [];
    if (brightness !== 100) parts.push(`brightness(${brightness}%)`);
    if (contrast !== 100) parts.push(`contrast(${contrast}%)`);
    if (saturation !== 100) parts.push(`saturate(${saturation}%)`);

    const preset = FILTER_PRESETS.find((f) => f.id === selectedFilter);
    if (preset && preset.filterString !== 'none') {
      parts.push(preset.filterString);
    }

    return parts.length > 0 ? parts.join(' ') : 'none';
  }, [brightness, contrast, saturation, selectedFilter]);

  // Aspect ratio decimal calculation
  const getAspectRatioDecimal = useCallback((): number => {
    if (!imageObjRef.current) return 1;
    const isRotatedQuarter = rotation === 90 || rotation === 270;
    const naturalW = isRotatedQuarter ? imageObjRef.current.naturalHeight : imageObjRef.current.naturalWidth;
    const naturalH = isRotatedQuarter ? imageObjRef.current.naturalWidth : imageObjRef.current.naturalHeight;

    switch (aspectRatio) {
      case '1:1':
        return 1;
      case '4:5':
        return 4 / 5;
      case '16:9':
        return 16 / 9;
      case '3:4':
        return 3 / 4;
      case 'original':
      default:
        return naturalW / naturalH;
    }
  }, [aspectRatio, rotation]);

  // Draw on Canvas
  const drawCanvas = useCallback(
    (targetCanvas: HTMLCanvasElement, highRes = false) => {
      const img = imageObjRef.current;
      if (!img) return;

      const ctx = targetCanvas.getContext('2d');
      if (!ctx) return;

      const targetRatio = getAspectRatioDecimal();
      const isRotatedQuarter = rotation === 90 || rotation === 270;
      const naturalW = isRotatedQuarter ? img.naturalHeight : img.naturalWidth;
      const naturalH = isRotatedQuarter ? img.naturalWidth : img.naturalHeight;

      // Determine output canvas size
      const maxDimension = highRes ? 1600 : 800;
      let outW: number;
      let outH: number;

      if (targetRatio >= 1) {
        outW = maxDimension;
        outH = Math.round(maxDimension / targetRatio);
      } else {
        outH = maxDimension;
        outW = Math.round(maxDimension * targetRatio);
      }

      targetCanvas.width = outW;
      targetCanvas.height = outH;

      ctx.clearRect(0, 0, outW, outH);

      // Apply filter
      const filterCss = getFilterCss();
      if (filterCss !== 'none') {
        try {
          ctx.filter = filterCss;
        } catch {
          // ignore unsupported filter
        }
      }

      ctx.save();

      // Center transformations
      ctx.translate(outW / 2, outH / 2);

      // Pan (scaled to canvas size)
      const panScale = highRes ? 2 : 1;
      ctx.translate(pan.x * panScale, pan.y * panScale);

      // Rotate
      ctx.rotate((rotation * Math.PI) / 180);

      // Flip
      ctx.scale(flipH ? -1 : 1, 1);

      // Zoom
      ctx.scale(zoom, zoom);

      // Calculate source image draw dimensions to fill the crop box (cover behavior)
      let drawW: number;
      let drawH: number;

      const imgRatio = naturalW / naturalH;
      if (imgRatio > targetRatio) {
        drawH = isRotatedQuarter ? outW : outH;
        drawW = drawH * (img.naturalWidth / img.naturalHeight);
      } else {
        drawW = isRotatedQuarter ? outH : outW;
        drawH = drawW * (img.naturalHeight / img.naturalWidth);
      }

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

      ctx.restore();
    },
    [getAspectRatioDecimal, rotation, getFilterCss, pan, flipH, zoom]
  );

  // Redraw canvas whenever settings change
  useEffect(() => {
    if (imageLoaded && canvasRef.current) {
      drawCanvas(canvasRef.current, false);
    }
  }, [imageLoaded, drawCanvas]);

  // Pan Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    startDragRef.current = { x: e.clientX, y: e.clientY };
    startPanRef.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - startDragRef.current.x;
    const dy = e.clientY - startDragRef.current.y;
    setPan({
      x: startPanRef.current.x + dx,
      y: startPanRef.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Pan Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      startDragRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      startPanRef.current = { ...pan };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - startDragRef.current.x;
    const dy = e.touches[0].clientY - startDragRef.current.y;
    setPan({
      x: startPanRef.current.x + dx,
      y: startPanRef.current.y + dy,
    });
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  // Reset all adjustments
  const handleReset = () => {
    setSelectedFilter('none');
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setAspectRatio('original');
    setRotation(0);
    setFlipH(false);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Apply & Save
  const handleApply = async () => {
    if (!imageObjRef.current) return;
    setApplying(true);

    try {
      const exportCanvas = document.createElement('canvas');
      drawCanvas(exportCanvas, true);

      exportCanvas.toBlob(
        (blob) => {
          if (!blob) {
            setApplying(false);
            return;
          }
          const editedFile = new File([blob], `edited-photo-${Date.now()}.jpg`, {
            type: 'image/jpeg',
          });
          const previewUrl = URL.createObjectURL(blob);
          onApply(editedFile, previewUrl);
          setApplying(false);
          onClose();
        },
        'image/jpeg',
        0.92
      );
    } catch (err) {
      console.error('Failed to export edited image', err);
      setApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 overflow-y-auto overscroll-contain animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl rounded-3xl border shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.border,
          color: theme.primaryText,
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-3.5 border-b flex items-center justify-between flex-shrink-0"
          style={{ borderColor: theme.border }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: theme.accentMuted,
                borderColor: theme.accent,
                color: theme.accent,
              }}
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold" style={{ color: theme.primaryText }}>
                Edit Photo
              </h3>
              <p className="text-[11px]" style={{ color: theme.secondaryText }}>
                Crop, rotate, filter & fine-tune adjustments
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1 transition-all active:scale-95"
              style={{
                backgroundColor: theme.card,
                borderColor: theme.border,
                color: theme.secondaryText,
              }}
              title="Reset all edits"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl border transition-colors"
              style={{
                backgroundColor: theme.card,
                borderColor: theme.border,
                color: theme.secondaryText,
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas Workspace Viewport */}
        <div
          className="relative flex-1 min-h-[260px] sm:min-h-[340px] bg-black/90 flex items-center justify-center p-3 select-none overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {imageLoaded ? (
            <canvas
              ref={canvasRef}
              className="max-h-[50vh] max-w-full rounded-2xl shadow-2xl object-contain transition-transform"
            />
          ) : (
            <div className="flex flex-col items-center gap-2" style={{ color: theme.secondaryText }}>
              <div className="w-8 h-8 rounded-full border-2 border-current border-t-transparent animate-spin" />
              <span className="text-xs">Loading image...</span>
            </div>
          )}

          {/* Drag instruction overlay if zoomed */}
          {zoom > 1 && (
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[11px] font-medium text-white flex items-center gap-1.5 border border-white/10 pointer-events-none">
              <Move className="w-3 h-3 text-pink-400" />
              <span>Drag to reposition</span>
            </div>
          )}
        </div>

        {/* Tool Category Switcher Tabs */}
        <div
          className="flex items-center px-4 pt-3 border-t gap-2 flex-shrink-0"
          style={{ borderColor: theme.border, backgroundColor: theme.surface }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('filters')}
            className="flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border"
            style={{
              backgroundColor: activeTab === 'filters' ? theme.accent : theme.card,
              borderColor: activeTab === 'filters' ? theme.accent : theme.border,
              color: activeTab === 'filters' ? (theme.isDark ? '#000000' : '#ffffff') : theme.secondaryText,
            }}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('crop')}
            className="flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border"
            style={{
              backgroundColor: activeTab === 'crop' ? theme.accent : theme.card,
              borderColor: activeTab === 'crop' ? theme.accent : theme.border,
              color: activeTab === 'crop' ? (theme.isDark ? '#000000' : '#ffffff') : theme.secondaryText,
            }}
          >
            <Crop className="w-3.5 h-3.5" />
            <span>Crop & Rotate</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('adjust')}
            className="flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border"
            style={{
              backgroundColor: activeTab === 'adjust' ? theme.accent : theme.card,
              borderColor: activeTab === 'adjust' ? theme.accent : theme.border,
              color: activeTab === 'adjust' ? (theme.isDark ? '#000000' : '#ffffff') : theme.secondaryText,
            }}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Adjust</span>
          </button>
        </div>

        {/* Tool Controls Drawer */}
        <div
          className="p-4 overflow-y-auto max-h-48 flex-shrink-0"
          style={{ backgroundColor: theme.surface }}
        >
          {/* TAB 1: FILTERS */}
          {activeTab === 'filters' && (
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
              {FILTER_PRESETS.map((filter) => {
                const isSelected = selectedFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setSelectedFilter(filter.id)}
                    className="flex flex-col items-center gap-1.5 flex-shrink-0 p-2 rounded-2xl border transition-all"
                    style={{
                      backgroundColor: isSelected ? theme.accentMuted : theme.card,
                      borderColor: isSelected ? theme.accent : theme.border,
                    }}
                  >
                    <div
                      className="w-11 h-11 rounded-xl shadow-inner border border-white/10 flex items-center justify-center"
                      style={{ backgroundColor: filter.colorPreview }}
                    >
                      {isSelected && <Check className="w-5 h-5 text-black drop-shadow" />}
                    </div>
                    <span
                      className="text-[11px] font-bold"
                      style={{ color: isSelected ? theme.accent : theme.secondaryText }}
                    >
                      {filter.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* TAB 2: CROP & ROTATE */}
          {activeTab === 'crop' && (
            <div className="space-y-3">
              {/* Aspect Ratio Row */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: theme.secondaryText }}>
                  Aspect Ratio
                </label>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {(['original', '1:1', '4:5', '16:9', '3:4'] as AspectRatioPreset[]).map((preset) => {
                    const isSelected = aspectRatio === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAspectRatio(preset)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all"
                        style={{
                          backgroundColor: isSelected ? theme.accent : theme.card,
                          borderColor: isSelected ? theme.accent : theme.border,
                          color: isSelected ? (theme.isDark ? '#000000' : '#ffffff') : theme.secondaryText,
                        }}
                      >
                        {preset === 'original' ? 'Original' : preset}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Transform Actions: Rotate, Flip, Zoom */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  className="py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  style={{
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    color: theme.primaryText,
                  }}
                >
                  <RotateCw className="w-3.5 h-3.5 text-pink-400" />
                  <span>Rotate 90°</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFlipH((prev) => !prev)}
                  className="py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  style={{
                    backgroundColor: flipH ? theme.accentMuted : theme.card,
                    borderColor: flipH ? theme.accent : theme.border,
                    color: theme.primaryText,
                  }}
                >
                  <FlipHorizontal className="w-3.5 h-3.5 text-pink-400" />
                  <span>Flip Horizontal</span>
                </button>

                <div
                  className="col-span-2 sm:col-span-1 p-2 rounded-xl border flex items-center gap-2"
                  style={{ backgroundColor: theme.card, borderColor: theme.border }}
                >
                  <ZoomIn className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full accent-pink-500 cursor-pointer h-1.5 rounded-lg"
                  />
                  <span className="text-[10px] font-bold shrink-0">{zoom.toFixed(1)}x</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ADJUST (Brightness, Contrast, Saturation) */}
          {activeTab === 'adjust' && (
            <div className="space-y-2.5">
              {/* Brightness */}
              <div className="flex items-center gap-3">
                <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs font-bold w-20 shrink-0" style={{ color: theme.primaryText }}>
                  Brightness
                </span>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={brightness}
                  onChange={(e) => setBrightness(parseInt(e.target.value))}
                  className="flex-1 accent-amber-500 cursor-pointer h-1.5 rounded-lg"
                />
                <span className="text-[11px] font-mono w-10 text-right" style={{ color: theme.secondaryText }}>
                  {brightness}%
                </span>
              </div>

              {/* Contrast */}
              <div className="flex items-center gap-3">
                <ContrastIcon className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="text-xs font-bold w-20 shrink-0" style={{ color: theme.primaryText }}>
                  Contrast
                </span>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={contrast}
                  onChange={(e) => setContrast(parseInt(e.target.value))}
                  className="flex-1 accent-purple-500 cursor-pointer h-1.5 rounded-lg"
                />
                <span className="text-[11px] font-mono w-10 text-right" style={{ color: theme.secondaryText }}>
                  {contrast}%
                </span>
              </div>

              {/* Saturation */}
              <div className="flex items-center gap-3">
                <Palette className="w-4 h-4 text-pink-400 shrink-0" />
                <span className="text-xs font-bold w-20 shrink-0" style={{ color: theme.primaryText }}>
                  Saturation
                </span>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={saturation}
                  onChange={(e) => setSaturation(parseInt(e.target.value))}
                  className="flex-1 accent-pink-500 cursor-pointer h-1.5 rounded-lg"
                />
                <span className="text-[11px] font-mono w-10 text-right" style={{ color: theme.secondaryText }}>
                  {saturation}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className="p-4 border-t flex items-center justify-end gap-2.5 flex-shrink-0"
          style={{ borderColor: theme.border, backgroundColor: theme.surface }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl font-bold text-xs border transition-colors"
            style={{
              backgroundColor: theme.card,
              borderColor: theme.border,
              color: theme.secondaryText,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={applying || !imageLoaded}
            className="px-5 py-2.5 rounded-xl font-bold text-xs btn-theme-primary flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {applying ? (
              <span>Saving...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Apply Edits</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
