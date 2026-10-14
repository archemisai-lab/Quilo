import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Check, ArrowLeft, RotateCw } from 'lucide-react';
import { UploadedPhoto } from '../../types/revision';
import { compressImage } from '../../services/imageCompression';

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

  // Inset percentages from each edge (0 to 100)
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

  // Rotate 90° clockwise in editor
  const handleRotate = async () => {
    if (isRotating || isSaving) return;
    try {
      setIsRotating(true);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = currentPhoto.previewUrl;
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.height;
      canvas.height = img.width;
      const ctx = canvas.getContext('2d')!;

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.92)
      );
      if (!blob) return;

      const file = new File([blob], currentPhoto.name, { type: 'image/jpeg' });
      const { base64Data, dataUrl } = await compressImage(file);

      setCurrentPhoto({
        ...currentPhoto,
        file,
        previewUrl: dataUrl,
        compressedBase64: base64Data,
        size: file.size,
      });
      // Reset crop insets on rotation
      setCrop({ left: 4, top: 4, right: 4, bottom: 4 });
    } catch (err) {
      console.error('Erreur rotation:', err);
    } finally {
      setIsRotating(false);
    }
  };

  // Pointer drag handling for freeform crop handles
  const handlePointerDown = (handleType: string, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    activeHandleRef.current = handleType;
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    dragStartCropRef.current = { ...crop };
  };

  // Window-level pointer movement for smooth, uninterrupted freeform dragging
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
      const MIN_SIZE = 4; // Complete freedom to crop narrow or wide sections

      setCrop(() => {
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

        return { left, top, right, bottom };
      });
    };

    const handleGlobalPointerUp = () => {
      activeHandleRef.current = null;
      dragStartPosRef.current = null;
      dragStartCropRef.current = null;
    };

    window.addEventListener('pointermove', handleGlobalPointerMove, { passive: true });
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, []);

  // Apply crop and output compressed photo
  const handleApplyCrop = async () => {
    if (isSaving) return;
    try {
      setIsSaving(true);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = currentPhoto.previewUrl;
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
      });

      // If barely cropped (<1% inset on all sides), save directly
      const isVirtuallyFull =
        crop.left < 1 && crop.top < 1 && crop.right < 1 && crop.bottom < 1;

      if (isVirtuallyFull) {
        onSave(currentPhoto);
        return;
      }

      const naturalW = img.naturalWidth || img.width;
      const naturalH = img.naturalHeight || img.height;

      const sx = (crop.left / 100) * naturalW;
      const sy = (crop.top / 100) * naturalH;
      const sWidth = ((100 - crop.left - crop.right) / 100) * naturalW;
      const sHeight = ((100 - crop.top - crop.bottom) / 100) * naturalH;

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(sWidth));
      canvas.height = Math.max(1, Math.round(sHeight));

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D unavailable');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.92)
      );

      if (!blob) throw new Error('Blob creation failed');

      const file = new File([blob], currentPhoto.name, { type: 'image/jpeg' });
      const { base64Data, dataUrl } = await compressImage(file);

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
    <div className="fixed inset-0 z-50 bg-[#070A11] flex flex-col justify-between text-white select-none animate-in fade-in duration-200">
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

      {/* Main Interactive Canvas: Freeform Drag on Corners & Sides */}
      <main className="relative flex-1 flex items-center justify-center p-4 sm:p-6 overflow-hidden touch-none">
        <div
          ref={containerRef}
          className="relative max-h-[70vh] max-w-[92vw] aspect-auto inline-block shadow-2xl rounded-lg overflow-hidden border border-white/20"
        >
          {/* Base Image */}
          <img
            ref={imgRef}
            src={currentPhoto.previewUrl}
            alt="Page à ajuster"
            className="max-h-[70vh] max-w-[92vw] object-contain block pointer-events-none"
          />

          {/* Dark Scrim Mask Outside Crop Box */}
          <div
            className="absolute top-0 left-0 right-0 bg-black/70 pointer-events-none transition-all"
            style={{ height: `${crop.top}%` }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 bg-black/70 pointer-events-none transition-all"
            style={{ height: `${crop.bottom}%` }}
          />
          <div
            className="absolute left-0 bg-black/70 pointer-events-none transition-all"
            style={{
              top: `${crop.top}%`,
              bottom: `${crop.bottom}%`,
              width: `${crop.left}%`,
            }}
          />
          <div
            className="absolute right-0 bg-black/70 pointer-events-none transition-all"
            style={{
              top: `${crop.top}%`,
              bottom: `${crop.bottom}%`,
              width: `${crop.right}%`,
            }}
          />

          {/* Interactive Freeform Crop Box */}
          <div
            className="absolute border border-white shadow-[0_0_0_1px_rgba(0,0,0,0.6)] cursor-move transition-all duration-75"
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
              className="absolute -top-4 left-6 right-6 h-8 cursor-ns-resize flex items-center justify-center touch-none group"
              onPointerDown={(e) => handlePointerDown('t', e)}
            >
              <div className="w-12 h-1.5 bg-white rounded-full shadow-lg border border-black/30 group-hover:scale-110 transition-transform" />
            </div>

            {/* Bottom Side */}
            <div
              className="absolute -bottom-4 left-6 right-6 h-8 cursor-ns-resize flex items-center justify-center touch-none group"
              onPointerDown={(e) => handlePointerDown('b', e)}
            >
              <div className="w-12 h-1.5 bg-white rounded-full shadow-lg border border-black/30 group-hover:scale-110 transition-transform" />
            </div>

            {/* Left Side */}
            <div
              className="absolute -left-4 top-6 bottom-6 w-8 cursor-ew-resize flex items-center justify-center touch-none group"
              onPointerDown={(e) => handlePointerDown('l', e)}
            >
              <div className="h-12 w-1.5 bg-white rounded-full shadow-lg border border-black/30 group-hover:scale-110 transition-transform" />
            </div>

            {/* Right Side */}
            <div
              className="absolute -right-4 top-6 bottom-6 w-8 cursor-ew-resize flex items-center justify-center touch-none group"
              onPointerDown={(e) => handlePointerDown('r', e)}
            >
              <div className="h-12 w-1.5 bg-white rounded-full shadow-lg border border-black/30 group-hover:scale-110 transition-transform" />
            </div>

            {/* --- 4 CORNER HANDLES --- */}
            {/* Top-Left */}
            <div
              className="absolute -top-3.5 -left-3.5 w-9 h-9 cursor-nwse-resize flex items-center justify-center touch-none group"
              onPointerDown={(e) => handlePointerDown('tl', e)}
            >
              <div className="w-6 h-6 border-t-3 border-l-3 border-white rounded-tl-md shadow-lg group-hover:scale-115 transition-transform" />
            </div>

            {/* Top-Right */}
            <div
              className="absolute -top-3.5 -right-3.5 w-9 h-9 cursor-nesw-resize flex items-center justify-center touch-none group"
              onPointerDown={(e) => handlePointerDown('tr', e)}
            >
              <div className="w-6 h-6 border-t-3 border-r-3 border-white rounded-tr-md shadow-lg group-hover:scale-115 transition-transform" />
            </div>

            {/* Bottom-Left */}
            <div
              className="absolute -bottom-3.5 -left-3.5 w-9 h-9 cursor-nesw-resize flex items-center justify-center touch-none group"
              onPointerDown={(e) => handlePointerDown('bl', e)}
            >
              <div className="w-6 h-6 border-b-3 border-l-3 border-white rounded-bl-md shadow-lg group-hover:scale-115 transition-transform" />
            </div>

            {/* Bottom-Right */}
            <div
              className="absolute -bottom-3.5 -right-3.5 w-9 h-9 cursor-nwse-resize flex items-center justify-center touch-none group"
              onPointerDown={(e) => handlePointerDown('br', e)}
            >
              <div className="w-6 h-6 border-b-3 border-r-3 border-white rounded-br-md shadow-lg group-hover:scale-115 transition-transform" />
            </div>
          </div>
        </div>
      </main>

      {/* Clean Bottom Footer: Pleine page + Bouton Valider rien de plus */}
      <footer className="px-5 sm:px-8 py-4 bg-black/60 border-t border-white/10 backdrop-blur-md flex items-center justify-between gap-4">
        <button
          onClick={() => setCrop({ left: 0, top: 0, right: 0, bottom: 0 })}
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
