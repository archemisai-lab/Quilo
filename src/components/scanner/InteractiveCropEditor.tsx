import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Check, ArrowLeft, RotateCw } from 'lucide-react';
import { UploadedPhoto } from '../../types/revision';
import { canvasToFile } from '../../services/imageCompression';

interface InteractiveCropEditorProps {
  photo: UploadedPhoto;
  onSave: (updatedPhoto: UploadedPhoto) => void;
  onCancel: () => void;
}

interface CropRect {
  left: number; // percentage (0 - 100)
  top: number; // percentage (0 - 100)
  right: number; // percentage from right edge (0 - 100)
  bottom: number; // percentage from bottom edge (0 - 100)
}

export const InteractiveCropEditor: React.FC<InteractiveCropEditorProps> = ({
  photo: initialPhoto,
  onSave,
  onCancel,
}) => {
  const [currentPhoto, setCurrentPhoto] = useState<UploadedPhoto>(initialPhoto);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Direct DOM references for 0-delay, ultra-fluid 120 FPS dragging without CSS transition lags
  const cropBoxRef = useRef<HTMLDivElement>(null);
  const maskTopRef = useRef<HTMLDivElement>(null);
  const maskBottomRef = useRef<HTMLDivElement>(null);
  const maskLeftRef = useRef<HTMLDivElement>(null);
  const maskRightRef = useRef<HTMLDivElement>(null);

  // Inset percentages from each edge (0 to 100)
  const cropRef = useRef<CropRect>({
    left: 4,
    top: 4,
    right: 4,
    bottom: 4,
  });

  const [crop, setCrop] = useState<CropRect>({
    left: 4,
    top: 4,
    right: 4,
    bottom: 4,
  });

  const [isRotating, setIsRotating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Active drag handle type
  const activeHandleRef = useRef<string | null>(null);
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const dragStartCropRef = useRef<CropRect | null>(null);

  // Instantly apply crop geometry to DOM nodes with 0 latency
  const applyCropToDom = useCallback((c: CropRect) => {
    if (cropBoxRef.current) {
      cropBoxRef.current.style.top = `${c.top}%`;
      cropBoxRef.current.style.left = `${c.left}%`;
      cropBoxRef.current.style.right = `${c.right}%`;
      cropBoxRef.current.style.bottom = `${c.bottom}%`;
    }
    if (maskTopRef.current) {
      maskTopRef.current.style.height = `${c.top}%`;
    }
    if (maskBottomRef.current) {
      maskBottomRef.current.style.height = `${c.bottom}%`;
    }
    if (maskLeftRef.current) {
      maskLeftRef.current.style.top = `${c.top}%`;
      maskLeftRef.current.style.bottom = `${c.bottom}%`;
      maskLeftRef.current.style.width = `${c.left}%`;
    }
    if (maskRightRef.current) {
      maskRightRef.current.style.top = `${c.top}%`;
      maskRightRef.current.style.bottom = `${c.bottom}%`;
      maskRightRef.current.style.width = `${c.right}%`;
    }
  }, []);

  // Sync initial DOM styles on mount or photo change
  useEffect(() => {
    applyCropToDom(cropRef.current);
  }, [applyCropToDom, currentPhoto]);

  // Rotate 90° clockwise in editor
  const handleRotate = async () => {
    if (isRotating || isSaving) return;
    try {
      setIsRotating(true);

      let img: HTMLImageElement;
      if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
        img = imgRef.current;
      } else {
        img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = currentPhoto.previewUrl;
        await new Promise((res, rej) => {
          img.onload = res;
          img.onerror = rej;
        });
      }

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalHeight || img.height;
      canvas.height = img.naturalWidth || img.width;
      const ctx = canvas.getContext('2d')!;

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(img, -(img.naturalWidth || img.width) / 2, -(img.naturalHeight || img.height) / 2);

      const { file, dataUrl, base64Data } = canvasToFile(canvas, currentPhoto.name, 0.88);

      setCurrentPhoto({
        ...currentPhoto,
        file,
        previewUrl: dataUrl,
        compressedBase64: base64Data,
        size: file.size,
      });

      // Reset crop insets on rotation
      const resetCrop = { left: 4, top: 4, right: 4, bottom: 4 };
      cropRef.current = resetCrop;
      setCrop(resetCrop);
      applyCropToDom(resetCrop);
    } catch (err) {
      console.error('Erreur rotation:', err);
    } finally {
      setIsRotating(false);
    }
  };

  // Pointer drag initiation
  const handlePointerDown = (handleType: string, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    activeHandleRef.current = handleType;
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    dragStartCropRef.current = { ...cropRef.current };
  };

  // Window-level pointer movement for 0-delay, 100% fluid freeform dragging
  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (!activeHandleRef.current || !dragStartPosRef.current || !dragStartCropRef.current) return;
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const dxPercent = ((e.clientX - dragStartPosRef.current.x) / rect.width) * 100;
      const dyPercent = ((e.clientY - dragStartPosRef.current.y) / rect.height) * 100;

      const start = dragStartCropRef.current;
      const handle = activeHandleRef.current;
      const MIN_SIZE = 3; // Allows narrow or wide sections freely

      let { left, top, right, bottom } = { ...start };

      if (handle === 'tl') {
        left = Math.min(Math.max(start.left + dxPercent, 0), 100 - start.right - MIN_SIZE);
        top = Math.min(Math.max(start.top + dyPercent, 0), 100 - start.bottom - MIN_SIZE);
      } else if (handle === 'tr') {
        right = Math.min(Math.max(start.right - dxPercent, 0), 100 - start.left - MIN_SIZE);
        top = Math.min(Math.max(start.top + dyPercent, 0), 100 - start.bottom - MIN_SIZE);
      } else if (handle === 'bl') {
        left = Math.min(Math.max(start.left + dxPercent, 0), 100 - start.right - MIN_SIZE);
        bottom = Math.min(Math.max(start.bottom - dyPercent, 0), 100 - start.top - MIN_SIZE);
      } else if (handle === 'br') {
        right = Math.min(Math.max(start.right - dxPercent, 0), 100 - start.left - MIN_SIZE);
        bottom = Math.min(Math.max(start.bottom - dyPercent, 0), 100 - start.top - MIN_SIZE);
      } else if (handle === 't') {
        top = Math.min(Math.max(start.top + dyPercent, 0), 100 - start.bottom - MIN_SIZE);
      } else if (handle === 'b') {
        bottom = Math.min(Math.max(start.bottom - dyPercent, 0), 100 - start.top - MIN_SIZE);
      } else if (handle === 'l') {
        left = Math.min(Math.max(start.left + dxPercent, 0), 100 - start.right - MIN_SIZE);
      } else if (handle === 'r') {
        right = Math.min(Math.max(start.right - dxPercent, 0), 100 - start.left - MIN_SIZE);
      } else if (handle === 'center') {
        const width = 100 - start.left - start.right;
        const height = 100 - start.top - start.bottom;
        const newLeft = Math.max(0, Math.min(start.left + dxPercent, 100 - width));
        const newTop = Math.max(0, Math.min(start.top + dyPercent, 100 - height));
        left = newLeft;
        top = newTop;
        right = 100 - newLeft - width;
        bottom = 100 - newTop - height;
      }

      const nextCrop = { left, top, right, bottom };
      cropRef.current = nextCrop;
      // Direct DOM update: 0ms latency, zero frame lag
      applyCropToDom(nextCrop);
    };

    const handleGlobalPointerUp = () => {
      if (activeHandleRef.current) {
        setCrop({ ...cropRef.current });
        activeHandleRef.current = null;
        dragStartPosRef.current = null;
        dragStartCropRef.current = null;
      }
    };

    window.addEventListener('pointermove', handleGlobalPointerMove, { passive: true });
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, [applyCropToDom]);

  // Full Page Reset with 0 delay
  const handleFullPage = () => {
    const fullCrop = { left: 0, top: 0, right: 0, bottom: 0 };
    cropRef.current = fullCrop;
    setCrop(fullCrop);
    applyCropToDom(fullCrop);
  };

  // Apply crop and output compressed photo
  const handleApplyCrop = async () => {
    if (isSaving) return;
    try {
      setIsSaving(true);
      const activeCrop = cropRef.current;

      // If virtually full (<1% inset on all sides), save directly without re-cropping
      const isVirtuallyFull =
        activeCrop.left < 1 &&
        activeCrop.top < 1 &&
        activeCrop.right < 1 &&
        activeCrop.bottom < 1;

      if (isVirtuallyFull) {
        onSave(currentPhoto);
        return;
      }

      let img: HTMLImageElement;
      if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
        img = imgRef.current;
      } else {
        img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = currentPhoto.previewUrl;
        await new Promise((res, rej) => {
          img.onload = res;
          img.onerror = rej;
        });
      }

      const naturalW = img.naturalWidth || img.width;
      const naturalH = img.naturalHeight || img.height;

      const sx = (activeCrop.left / 100) * naturalW;
      const sy = (activeCrop.top / 100) * naturalH;
      const sWidth = ((100 - activeCrop.left - activeCrop.right) / 100) * naturalW;
      const sHeight = ((100 - activeCrop.top - activeCrop.bottom) / 100) * naturalH;

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(sWidth));
      canvas.height = Math.max(1, Math.round(sHeight));

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D unavailable');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

      const { file, dataUrl, base64Data } = canvasToFile(canvas, currentPhoto.name, 0.88);

      onSave({
        ...currentPhoto,
        file,
        previewUrl: dataUrl,
        compressedBase64: base64Data,
        size: file.size,
      });
    } catch (err) {
      console.error('Erreur application recadrage:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-[#070A11] flex flex-col justify-between text-white select-none animate-in fade-in duration-150">
      {/* Top Header: Exactly 1 Clean, Airy, Uncluttered Line */}
      <header className="flex items-center justify-between h-14 sm:h-16 px-4 sm:px-8 border-b border-white/10 bg-black/40 backdrop-blur-md">
        {/* Left: Reprendre / Retake */}
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white/90 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          title="Reprendre la photo"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Reprendre</span>
        </button>

        {/* Center: Clean, Single-Line Title */}
        <h2 className="font-heading font-semibold text-sm sm:text-base text-white tracking-wide">
          Ajuster la photo
        </h2>

        {/* Right: Pivoter 90° */}
        <button
          onClick={handleRotate}
          disabled={isRotating || isSaving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white/90 hover:text-white text-xs font-semibold transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
          title="Faire pivoter de 90°"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
          <span>Pivoter</span>
        </button>
      </header>

      {/* Main Interactive Canvas: Freeform Drag on Corners & Sides with ZERO DELAY */}
      <main className="relative flex-1 flex items-center justify-center p-4 sm:p-6 overflow-hidden touch-none">
        <div
          ref={containerRef}
          className="relative max-h-[70vh] max-w-[92vw] aspect-auto inline-block shadow-2xl rounded-lg overflow-hidden border border-white/20 select-none touch-none"
        >
          {/* Base Image */}
          <img
            ref={imgRef}
            src={currentPhoto.previewUrl}
            alt="Page à ajuster"
            className="max-h-[70vh] max-w-[92vw] object-contain block pointer-events-none select-none"
          />

          {/* Dark Scrim Mask Outside Crop Box: Pure DOM styles, no CSS animation delay */}
          <div
            ref={maskTopRef}
            className="absolute top-0 left-0 right-0 bg-black/70 pointer-events-none"
            style={{ height: `${crop.top}%` }}
          />
          <div
            ref={maskBottomRef}
            className="absolute bottom-0 left-0 right-0 bg-black/70 pointer-events-none"
            style={{ height: `${crop.bottom}%` }}
          />
          <div
            ref={maskLeftRef}
            className="absolute left-0 bg-black/70 pointer-events-none"
            style={{
              top: `${crop.top}%`,
              bottom: `${crop.bottom}%`,
              width: `${crop.left}%`,
            }}
          />
          <div
            ref={maskRightRef}
            className="absolute right-0 bg-black/70 pointer-events-none"
            style={{
              top: `${crop.top}%`,
              bottom: `${crop.bottom}%`,
              width: `${crop.right}%`,
            }}
          />

          {/* Interactive Freeform Crop Box: 0 latency, direct tracking */}
          <div
            ref={cropBoxRef}
            className="absolute border border-white shadow-[0_0_0_1px_rgba(0,0,0,0.6)] cursor-move select-none touch-none"
            style={{
              top: `${crop.top}%`,
              left: `${crop.left}%`,
              right: `${crop.right}%`,
              bottom: `${crop.bottom}%`,
            }}
            onPointerDown={(e) => handlePointerDown('center', e)}
          >
            {/* Subtle Rule of Thirds Grid for precise alignment */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-25">
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div />
            </div>

            {/* --- 4 SIDE HANDLES (Directly grab & drag sides) --- */}
            {/* Top Side */}
            <div
              className="absolute -top-3.5 left-6 right-6 h-7 cursor-ns-resize flex items-center justify-center touch-none group"
              onPointerDown={(e) => handlePointerDown('t', e)}
            >
              <div className="w-12 h-1.5 bg-white rounded-full shadow-lg border border-black/30 group-hover:scale-110" />
            </div>

            {/* Bottom Side */}
            <div
              className="absolute -bottom-3.5 left-6 right-6 h-7 cursor-ns-resize flex items-center justify-center touch-none group"
              onPointerDown={(e) => handlePointerDown('b', e)}
            >
              <div className="w-12 h-1.5 bg-white rounded-full shadow-lg border border-black/30 group-hover:scale-110" />
            </div>

            {/* Left Side */}
            <div
              className="absolute -left-3.5 top-6 bottom-6 w-7 cursor-ew-resize flex items-center justify-center touch-none group"
              onPointerDown={(e) => handlePointerDown('l', e)}
            >
              <div className="h-12 w-1.5 bg-white rounded-full shadow-lg border border-black/30 group-hover:scale-110" />
            </div>

            {/* Right Side */}
            <div
              className="absolute -right-3.5 top-6 bottom-6 w-7 cursor-ew-resize flex items-center justify-center touch-none group"
              onPointerDown={(e) => handlePointerDown('r', e)}
            >
              <div className="h-12 w-1.5 bg-white rounded-full shadow-lg border border-black/30 group-hover:scale-110" />
            </div>

            {/* --- 4 CORNER HANDLES --- */}
            {/* Top-Left */}
            <div
              className="absolute -top-3.5 -left-3.5 w-8 h-8 cursor-nwse-resize flex items-center justify-center touch-none group"
              onPointerDown={(e) => handlePointerDown('tl', e)}
            >
              <div className="w-5.5 h-5.5 border-t-3 border-l-3 border-white rounded-tl-md shadow-lg group-hover:scale-110" />
            </div>

            {/* Top-Right */}
            <div
              className="absolute -top-3.5 -right-3.5 w-8 h-8 cursor-nesw-resize flex items-center justify-center touch-none group"
              onPointerDown={(e) => handlePointerDown('tr', e)}
            >
              <div className="w-5.5 h-5.5 border-t-3 border-r-3 border-white rounded-tr-md shadow-lg group-hover:scale-110" />
            </div>

            {/* Bottom-Left */}
            <div
              className="absolute -bottom-3.5 -left-3.5 w-8 h-8 cursor-nesw-resize flex items-center justify-center touch-none group"
              onPointerDown={(e) => handlePointerDown('bl', e)}
            >
              <div className="w-5.5 h-5.5 border-b-3 border-l-3 border-white rounded-bl-md shadow-lg group-hover:scale-110" />
            </div>

            {/* Bottom-Right */}
            <div
              className="absolute -bottom-3.5 -right-3.5 w-8 h-8 cursor-nwse-resize flex items-center justify-center touch-none group"
              onPointerDown={(e) => handlePointerDown('br', e)}
            >
              <div className="w-5.5 h-5.5 border-b-3 border-r-3 border-white rounded-br-md shadow-lg group-hover:scale-110" />
            </div>
          </div>
        </div>
      </main>

      {/* Clean Bottom Footer: Pleine page + Bouton Valider rien de plus */}
      <footer className="px-5 sm:px-8 py-4 bg-black/60 border-t border-white/10 backdrop-blur-md flex items-center justify-between gap-4">
        <button
          onClick={handleFullPage}
          className="text-xs font-semibold text-white/70 hover:text-white transition-colors cursor-pointer px-3.5 py-2 rounded-xl hover:bg-white/10 border border-white/10"
        >
          Pleine page
        </button>

        {/* Validate Button */}
        <button
          onClick={handleApplyCrop}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 sm:py-3 rounded-full bg-[#75D6B0] hover:bg-[#5EC49D] text-[#0A0E17] font-heading font-bold text-xs sm:text-sm shadow-lg shadow-[#75D6B0]/25 hover:shadow-xl hover:shadow-[#75D6B0]/35 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{isSaving ? 'Validation...' : 'Valider'}</span>
        </button>
      </footer>
    </div>
  );
};
