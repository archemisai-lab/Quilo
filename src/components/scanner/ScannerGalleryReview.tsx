import React, { useState } from 'react';
import {
  X,
  Check,
  Trash2,
  RotateCw,
  Crop,
  ZoomIn,
  Camera,
  ArrowLeft,
  Sliders,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { UploadedPhoto } from '../../types/revision';
import { compressImage } from '../../services/imageCompression';

interface ScannerGalleryReviewProps {
  isOpen: boolean;
  photos: UploadedPhoto[];
  onClose: () => void;
  onUpdatePhotos: (updated: UploadedPhoto[]) => void;
  onValidate: () => void;
}

export const ScannerGalleryReview: React.FC<ScannerGalleryReviewProps> = ({
  isOpen,
  photos,
  onClose,
  onUpdatePhotos,
  onValidate,
}) => {
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cropMarginPercent, setCropMarginPercent] = useState<number>(0);
  const [aspectLock, setAspectLock] = useState<'original' | '3:4' | '4:3'>('original');

  if (!isOpen) return null;

  // 1. Rotate a photo 90° clockwise and re-compress
  const handleRotate = async (index: number) => {
    const photo = photos[index];
    if (!photo || isProcessing) return;

    try {
      setIsProcessing(true);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = photo.previewUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.height;
      canvas.height = img.width;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.92)
      );
      if (!blob) return;

      const updatedFile = new File([blob], photo.name, { type: 'image/jpeg' });
      const { base64Data, dataUrl } = await compressImage(updatedFile);

      const updatedList = [...photos];
      updatedList[index] = {
        ...photo,
        file: updatedFile,
        previewUrl: dataUrl,
        compressedBase64: base64Data,
        size: updatedFile.size,
      };

      onUpdatePhotos(updatedList);
    } catch (err) {
      console.error('Erreur rotation image:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Crop / resize margins of a photo
  const handleApplyCrop = async (index: number) => {
    const photo = photos[index];
    if (!photo || isProcessing) return;

    try {
      setIsProcessing(true);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = photo.previewUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const marginRatio = cropMarginPercent / 100;
      const cropX = img.width * marginRatio;
      const cropY = img.height * marginRatio;
      const cropW = img.width * (1 - 2 * marginRatio);
      const cropH = img.height * (1 - 2 * marginRatio);

      const canvas = document.createElement('canvas');
      canvas.width = Math.round(cropW);
      canvas.height = Math.round(cropH);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.92)
      );
      if (!blob) return;

      const updatedFile = new File([blob], photo.name, { type: 'image/jpeg' });
      const { base64Data, dataUrl } = await compressImage(updatedFile);

      const updatedList = [...photos];
      updatedList[index] = {
        ...photo,
        file: updatedFile,
        previewUrl: dataUrl,
        compressedBase64: base64Data,
        size: updatedFile.size,
      };

      onUpdatePhotos(updatedList);
      setEditingPhotoIndex(null);
      setCropMarginPercent(0);
    } catch (err) {
      console.error('Erreur recadrage image:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Delete a photo from session
  const handleDelete = (index: number) => {
    const updated = photos.filter((_, i) => i !== index);
    onUpdatePhotos(updated);
    if (editingPhotoIndex === index) {
      setEditingPhotoIndex(null);
    } else if (editingPhotoIndex !== null && editingPhotoIndex > index) {
      setEditingPhotoIndex(editingPhotoIndex - 1);
    }
  };

  const editingPhoto = editingPhotoIndex !== null ? photos[editingPhotoIndex] : null;

  return (
    <div className="fixed inset-0 z-60 bg-[#0F172A]/95 backdrop-blur-xl flex flex-col justify-between text-white animate-in fade-in duration-200 select-none">
      {/* Top Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/10 bg-black/40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (editingPhotoIndex !== null) {
                setEditingPhotoIndex(null);
              } else {
                onClose();
              }
            }}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Retour au scanner"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <h2 className="font-heading font-bold text-base sm:text-lg text-white">
              {editingPhotoIndex !== null
                ? `Redimensionner • Page ${editingPhotoIndex + 1}`
                : `Pages scannées (${photos.length})`}
            </h2>
            <p className="text-[11px] text-white/60">
              {editingPhotoIndex !== null
                ? 'Ajustez les bords et l’orientation de la page'
                : 'Vérifiez, pivotez ou supprimez les pages capturées'}
            </p>
          </div>
        </div>

        {/* Small Validate Checkmark Icon Button */}
        <button
          onClick={onValidate}
          disabled={photos.length === 0}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-[#75D6B0] hover:bg-[#5EC49D] text-[#1E2A3A] transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Valider et continuer"
        >
          <Check className="w-5 h-5 stroke-[2.5]" />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* Editor View if a photo is being resized/cropped */}
        {editingPhotoIndex !== null && editingPhoto ? (
          <div className="max-w-2xl mx-auto flex flex-col items-center justify-center gap-5">
            {/* Large Preview with Visual Margin Indicator */}
            <div className="relative max-w-full max-h-[55vh] rounded-2xl overflow-hidden border border-white/20 bg-black/60 shadow-xl flex items-center justify-center p-2">
              <div className="relative inline-block overflow-hidden rounded-xl">
                <img
                  src={editingPhoto.previewUrl}
                  alt={`Aperçu page ${editingPhotoIndex + 1}`}
                  className="max-h-[50vh] max-w-full object-contain rounded-lg"
                  style={{
                    transform: `scale(${1 - (cropMarginPercent / 100) * 0.4})`,
                    transition: 'transform 0.15s ease-out',
                  }}
                />

                {/* Subtle crop overlay guide */}
                {cropMarginPercent > 0 && (
                  <div
                    className="absolute inset-0 border-2 border-dashed border-[#75D6B0] pointer-events-none rounded-lg"
                    style={{
                      margin: `${cropMarginPercent * 1.5}px`,
                    }}
                  />
                )}
              </div>
            </div>

            {/* Resize & Crop Controls Toolbar */}
            <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Crop className="w-4 h-4 text-[#75D6B0]" />
                    <span>Rogner les marges (enlever la table / les doigts) :</span>
                  </span>
                  <span className="text-[#75D6B0] font-bold">-{cropMarginPercent}%</span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={cropMarginPercent}
                    onChange={(e) => setCropMarginPercent(Number(e.target.value))}
                    className="w-full accent-[#75D6B0] cursor-pointer"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {[0, 5, 10, 15].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setCropMarginPercent(preset)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        cropMarginPercent === preset
                          ? 'bg-[#75D6B0] text-[#1E2A3A]'
                          : 'bg-white/10 hover:bg-white/20 text-white/80'
                      }`}
                    >
                      {preset === 0 ? 'Original (0%)' : `-${preset}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action buttons inside editor */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <button
                  onClick={() => handleRotate(editingPhotoIndex)}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>Pivoter 90°</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingPhotoIndex(null);
                      setCropMarginPercent(0);
                    }}
                    className="px-3.5 py-2 text-xs font-semibold text-white/70 hover:text-white transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>

                  <button
                    onClick={() => handleApplyCrop(editingPhotoIndex)}
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#75D6B0] hover:bg-[#5EC49D] text-[#1E2A3A] text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Appliquer</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Grid View of all captured photos */
          <div className="max-w-4xl mx-auto">
            {photos.length === 0 ? (
              <div className="text-center py-16 text-white/60">
                <p className="text-sm">Aucune photo scannée pour l’instant.</p>
                <button
                  onClick={onClose}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#5B8DEF] text-white text-xs font-semibold cursor-pointer"
                >
                  Retourner à l'appareil photo
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {photos.map((photo, idx) => (
                  <div
                    key={photo.id}
                    className="group relative bg-white/5 border border-white/10 hover:border-[#5B8DEF]/60 rounded-2xl overflow-hidden transition-all shadow-md flex flex-col"
                  >
                    {/* Top index badge */}
                    <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-white border border-white/10">
                      Page {idx + 1}
                    </div>

                    {/* Quick Delete button (top right) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(idx);
                      }}
                      className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/60 hover:bg-[#E8604C] text-white/80 hover:text-white backdrop-blur-md transition-colors cursor-pointer border border-white/10"
                      title="Supprimer cette page"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Image Thumbnail */}
                    <div
                      onClick={() => setEditingPhotoIndex(idx)}
                      className="aspect-[3/4] w-full bg-black/40 overflow-hidden cursor-pointer flex items-center justify-center p-1"
                    >
                      <img
                        src={photo.previewUrl}
                        alt={`Page ${idx + 1}`}
                        className="w-full h-full object-contain rounded-lg group-hover:scale-102 transition-transform duration-200"
                      />
                    </div>

                    {/* Quick Actions Bar */}
                    <div className="p-2 border-t border-white/10 bg-black/40 flex items-center justify-between gap-1">
                      <button
                        onClick={() => handleRotate(idx)}
                        disabled={isProcessing}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium transition-colors cursor-pointer"
                        title="Pivoter de 90°"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>Pivoter</span>
                      </button>

                      <button
                        onClick={() => setEditingPhotoIndex(idx)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-[#5B8DEF]/20 hover:bg-[#5B8DEF]/30 text-[#5B8DEF] text-[11px] font-semibold transition-colors cursor-pointer"
                        title="Redimensionner ou rogner les marges"
                      >
                        <Crop className="w-3 h-3" />
                        <span>Recadrer</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Actions Bar */}
      <footer className="px-4 sm:px-6 py-4 border-t border-white/10 bg-black/60 backdrop-blur-md flex items-center justify-between gap-4">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          <Camera className="w-4 h-4" />
          <span>Continuer à scanner</span>
        </button>

        <button
          onClick={onValidate}
          disabled={photos.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#75D6B0] hover:bg-[#5EC49D] text-[#1E2A3A] font-heading font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Valider ({photos.length} photo{photos.length > 1 ? 's' : ''})</span>
        </button>
      </footer>
    </div>
  );
};
