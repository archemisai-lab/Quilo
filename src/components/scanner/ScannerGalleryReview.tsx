import React, { useState } from 'react';
import {
  X,
  Check,
  Trash2,
  RotateCw,
  Crop,
  ArrowLeft,
  Plus,
  Layers,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Maximize2,
  Camera,
} from 'lucide-react';
import { UploadedPhoto } from '../../types/revision';
import { compressImage } from '../../services/imageCompression';
import { InteractiveCropEditor } from './InteractiveCropEditor';

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
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isCroppingIndex, setIsCroppingIndex] = useState<number | null>(null);
  const [isRotating, setIsRotating] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'inspector' | 'grid'>('inspector');

  if (!isOpen) return null;

  const currentIndex = Math.min(Math.max(selectedIndex, 0), Math.max(photos.length - 1, 0));
  const currentPhoto = photos[currentIndex];

  // Rotate a photo 90° clockwise
  const handleRotate = async (index: number) => {
    const photo = photos[index];
    if (!photo || isRotating !== null) return;

    try {
      setIsRotating(index);
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
      console.error('Erreur rotation:', err);
    } finally {
      setIsRotating(null);
    }
  };

  // Delete a photo
  const handleDelete = (index: number) => {
    const updated = photos.filter((_, i) => i !== index);
    onUpdatePhotos(updated);
    if (selectedIndex >= updated.length) {
      setSelectedIndex(Math.max(0, updated.length - 1));
    }
    if (isCroppingIndex === index) {
      setIsCroppingIndex(null);
    }
  };

  // Save cropped photo from InteractiveCropEditor
  const handleSaveCroppedPhoto = (updatedPhoto: UploadedPhoto) => {
    if (isCroppingIndex === null) return;
    const updated = [...photos];
    updated[isCroppingIndex] = updatedPhoto;
    onUpdatePhotos(updated);
    setIsCroppingIndex(null);
  };

  return (
    <div className="fixed inset-0 z-60 bg-[#0B0F19] flex flex-col justify-between text-white animate-in fade-in duration-200 select-none">
      {/* Interactive Freeform Crop Modal */}
      {isCroppingIndex !== null && photos[isCroppingIndex] && (
        <InteractiveCropEditor
          photo={photos[isCroppingIndex]}
          onSave={handleSaveCroppedPhoto}
          onCancel={() => setIsCroppingIndex(null)}
        />
      )}

      {/* Top Header: Minimalist, Airy & Perfectly Balanced */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 bg-black/40 backdrop-blur-md">
        {/* Left: Discreet Back to Camera Arrow */}
        <button
          onClick={onClose}
          className="p-2 -ml-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Retourner à la caméra"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Center: Clean Page Indicator */}
        <div className="text-center">
          <p className="font-heading font-semibold text-sm sm:text-base text-white tracking-wide">
            {viewMode === 'inspector'
              ? `Page ${currentIndex + 1} sur ${photos.length}`
              : `Pages scannées (${photos.length})`}
          </p>
        </div>

        {/* Right: View Mode Toggle Icon */}
        <div className="flex items-center justify-end w-9">
          {photos.length > 1 ? (
            <button
              onClick={() => setViewMode(viewMode === 'inspector' ? 'grid' : 'inspector')}
              className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={viewMode === 'inspector' ? 'Afficher la grille de toutes les pages' : 'Afficher la vue détaillée'}
            >
              {viewMode === 'inspector' ? (
                <LayoutGrid className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </button>
          ) : (
            <div className="w-5" />
          )}
        </div>
      </header>

      {/* Main Review Canvas */}
      <main className="flex-1 overflow-y-auto flex flex-col justify-center p-3 sm:p-6">
        {photos.length === 0 ? (
          <div className="text-center py-20 text-white/60 max-w-sm mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-4">
              <Layers className="w-6 h-6 text-white/40" />
            </div>
            <h3 className="font-heading font-semibold text-base text-white mb-1">
              Aucune photo scannée
            </h3>
            <p className="text-xs text-white/60 mb-5">
              Retournez au viseur pour prendre les pages de votre cours.
            </p>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-full bg-[#5B8DEF] hover:bg-[#385DE8] text-white font-heading font-semibold text-xs transition-colors cursor-pointer"
            >
              Ouvrir l'appareil photo
            </button>
          </div>
        ) : viewMode === 'inspector' && currentPhoto ? (
          /* --- INSPECTOR FOCUS MODE: Large Clean Paper Presentation --- */
          <div className="max-w-3xl w-full mx-auto flex flex-col items-center justify-center flex-1">

            {/* Central High-Resolution Document Canvas with Left/Right Nav */}
            <div className="relative flex items-center justify-center w-full">
              {/* Prev Page Arrow */}
              {photos.length > 1 && (
                <button
                  onClick={() => setSelectedIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="absolute left-1 sm:-left-4 z-20 p-2 sm:p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md transition-all disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                  title="Page précédente"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {/* The Paper Sheet Presentation (Clean crisp white paper border & shadow) */}
              <div
                onClick={() => setIsCroppingIndex(currentIndex)}
                className="group relative max-h-[56vh] aspect-auto rounded-xl overflow-hidden bg-[#111726] border-2 border-white/90 shadow-2xl cursor-pointer hover:border-[#75D6B0] transition-colors"
                title="Cliquer pour recadrer librement"
              >
                <img
                  src={currentPhoto.previewUrl}
                  alt={`Page ${currentIndex + 1}`}
                  className="max-h-[56vh] object-contain block mx-auto"
                />

                {/* Subtle Hover Overlay Hint */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <div className="px-3.5 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-xs font-semibold text-white flex items-center gap-1.5 shadow-lg">
                    <Crop className="w-3.5 h-3.5 text-[#75D6B0]" />
                    <span>Recadrer cette page</span>
                  </div>
                </div>
              </div>

              {/* Next Page Arrow */}
              {photos.length > 1 && (
                <button
                  onClick={() => setSelectedIndex((prev) => Math.min(photos.length - 1, prev + 1))}
                  disabled={currentIndex === photos.length - 1}
                  className="absolute right-1 sm:-right-4 z-20 p-2 sm:p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md transition-all disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                  title="Page suivante"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Direct Tool Bar for the Active Page */}
            <div className="mt-3 flex items-center gap-2 p-1.5 rounded-full bg-black/60 border border-white/15 backdrop-blur-md">
              <button
                onClick={() => setIsCroppingIndex(currentIndex)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
                title="Recadrer librement avec les côtés"
              >
                <Crop className="w-3.5 h-3.5 text-[#75D6B0]" />
                <span>Recadrer</span>
              </button>

              <button
                onClick={() => handleRotate(currentIndex)}
                disabled={isRotating === currentIndex}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                title="Pivoter de 90° dans le sens horaire"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isRotating === currentIndex ? 'animate-spin' : ''}`} />
                <span>Pivoter</span>
              </button>

              <div className="w-px h-4 bg-white/20 mx-0.5" />

              <button
                onClick={() => handleDelete(currentIndex)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-[#E8604C]/20 text-white/70 hover:text-[#E8604C] text-xs font-semibold transition-colors cursor-pointer"
                title="Supprimer cette page"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer</span>
              </button>
            </div>

            {/* Horizontal Filmstrip of Thumbnails */}
            <div className="mt-4 w-full max-w-lg flex items-center justify-center gap-2 overflow-x-auto pb-1">
              {photos.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedIndex(idx)}
                  className={`relative shrink-0 w-12 h-15 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    selectedIndex === idx
                      ? 'border-white scale-105 shadow-md shadow-white/20 ring-1 ring-[#75D6B0]'
                      : 'border-white/30 opacity-60 hover:opacity-100 hover:border-white/60'
                  }`}
                  title={`Page ${idx + 1}`}
                >
                  <img src={p.previewUrl} alt={`Vignette ${idx + 1}`} className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[9px] font-bold text-center text-white py-0.5">
                    {idx + 1}
                  </span>
                </button>
              ))}

              {/* Quick Add Page Thumbnail Card */}
              <button
                onClick={onClose}
                className="shrink-0 w-12 h-15 rounded-lg border-2 border-dashed border-white/30 hover:border-white/70 bg-white/5 flex flex-col items-center justify-center text-white/60 hover:text-white transition-all cursor-pointer"
                title="Ajouter une autre page"
              >
                <Plus className="w-4 h-4" />
                <span className="text-[9px] font-bold mt-0.5">+</span>
              </button>
            </div>
          </div>
        ) : (
          /* --- GRID VIEW MODE: Spacious, Clean Document Cards --- */
          <div className="max-w-4xl w-full mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
              {photos.map((photo, idx) => (
                <div
                  key={photo.id}
                  className="group relative bg-[#121826] border border-white/20 hover:border-white rounded-2xl overflow-hidden transition-all duration-200 shadow-xl flex flex-col"
                >
                  {/* Clean Page Badge */}
                  <div className="absolute top-2.5 left-2.5 z-10 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-bold text-white border border-white/15 shadow-sm">
                    Page {idx + 1}
                  </div>

                  {/* Clean Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(idx);
                    }}
                    className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-black/70 hover:bg-[#E8604C] text-white/80 hover:text-white backdrop-blur-md transition-colors cursor-pointer border border-white/15"
                    title="Supprimer cette page"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Image Canvas (Click opens freeform crop) */}
                  <div
                    onClick={() => setIsCroppingIndex(idx)}
                    className="aspect-[3/4] w-full bg-[#0B0F19] overflow-hidden cursor-pointer flex items-center justify-center p-2.5 group-hover:bg-[#070A11] transition-colors"
                    title="Cliquer pour recadrer librement"
                  >
                    <img
                      src={photo.previewUrl}
                      alt={`Page ${idx + 1}`}
                      className="w-full h-full object-contain rounded-lg border border-white/10 group-hover:scale-102 transition-transform duration-200"
                    />
                  </div>

                  {/* Clean Action Row */}
                  <div className="p-2 border-t border-white/10 bg-black/40 flex items-center justify-between gap-1.5">
                    <button
                      onClick={() => handleRotate(idx)}
                      disabled={isRotating === idx}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
                      title="Pivoter de 90°"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${isRotating === idx ? 'animate-spin' : ''}`} />
                      <span className="text-[11px]">Pivoter</span>
                    </button>

                    <button
                      onClick={() => setIsCroppingIndex(idx)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-white/15 hover:bg-[#75D6B0]/20 text-white hover:text-[#75D6B0] text-xs font-semibold transition-colors cursor-pointer active:scale-95"
                      title="Recadrer librement avec les côtés"
                    >
                      <Crop className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Recadrer</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Bar: Return to Camera + Master Validate Button */}
      <footer className="px-4 sm:px-8 py-4 border-t border-white/10 bg-black/60 backdrop-blur-md flex items-center justify-between gap-4">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
        >
          <Camera className="w-4 h-4" />
          <span>Prendre d'autres pages</span>
        </button>

        {/* Master High-End Validate Button */}
        <button
          onClick={onValidate}
          disabled={photos.length === 0}
          className="flex items-center gap-2 px-6 sm:px-8 py-3 rounded-full bg-[#75D6B0] hover:bg-[#5EC49D] text-[#0A0E17] font-heading font-bold text-xs sm:text-sm shadow-xl shadow-[#75D6B0]/30 hover:shadow-2xl hover:shadow-[#75D6B0]/45 border border-[#75D6B0]/50 transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Check className="w-4.5 h-4.5 stroke-[3]" />
          <span>Valider ({photos.length} page{photos.length > 1 ? 's' : ''})</span>
        </button>
      </footer>
    </div>
  );
};
