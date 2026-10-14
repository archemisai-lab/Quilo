import React, { useRef, useState } from 'react';
import { PageRoute, UploadedPhoto } from '../types/revision';
import { Camera, Upload, Trash2, ArrowRight, AlertCircle, Info, Sparkles, ScanLine } from 'lucide-react';
import { compressImage } from '../services/imageCompression';
import { DocumentScannerModal } from '../components/scanner/DocumentScannerModal';

interface UploadPageProps {
  photos: UploadedPhoto[];
  onPhotosChange: (photos: UploadedPhoto[]) => void;
  onNavigate: (page: PageRoute) => void;
}

const MAX_PHOTOS = 13;

export const UploadPage: React.FC<UploadPageProps> = ({
  photos,
  onPhotosChange,
  onNavigate,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFiles = async (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;
    setErrorMessage(null);

    const availableSlots = MAX_PHOTOS - photos.length;
    if (availableSlots <= 0) {
      setErrorMessage(`Limite atteinte : ${MAX_PHOTOS} photos maximum par fiche.`);
      return;
    }

    const filesToProcess = Array.from(filesList)
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, availableSlots);

    if (filesToProcess.length === 0) {
      setErrorMessage('Veuillez sélectionner uniquement des fichiers image (JPG, PNG, HEIC).');
      return;
    }

    if (filesList.length > availableSlots) {
      setErrorMessage(
        `Seules les ${availableSlots} premières photos ont été ajoutées (${MAX_PHOTOS} max).`
      );
    }

    setIsProcessing(true);

    try {
      const newUploadedPhotos: UploadedPhoto[] = [];

      for (const file of filesToProcess) {
        // Compress client-side for immediate fast handling
        const { base64Data, dataUrl } = await compressImage(file);
        newUploadedPhotos.push({
          id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          file,
          previewUrl: dataUrl,
          compressedBase64: base64Data,
          name: file.name,
          size: file.size,
        });
      }

      onPhotosChange([...photos, ...newUploadedPhotos]);
    } catch (err: any) {
      console.error('Erreur compression image:', err);
      setErrorMessage("Une erreur est survenue lors du chargement d'une image.");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removePhoto = (id: string) => {
    onPhotosChange(photos.filter((p) => p.id !== id));
    setErrorMessage(null);
  };

  const handleAddScannedPhotos = (newPhotos: UploadedPhoto[]) => {
    const availableSlots = MAX_PHOTOS - photos.length;
    const added = newPhotos.slice(0, availableSlots);
    onPhotosChange([...photos, ...added]);
    setErrorMessage(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  // Demo sample loader for testing without real camera notes
  const loadDemoPhotos = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    // Create a mock canvas image of a notebook page
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d')!;

    // Page background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 800, 1000);

    // Notebook lines
    ctx.strokeStyle = '#E8EEF5';
    ctx.lineWidth = 1;
    for (let y = 100; y < 980; y += 35) {
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(760, y);
      ctx.stroke();
    }
    // Margin line
    ctx.strokeStyle = '#FAD4D4';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(120, 0);
    ctx.lineTo(120, 1000);
    ctx.stroke();

    // Handwritten-like course title
    ctx.fillStyle = '#1E2A3A';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('Chapitre 3 : La Première Guerre Mondiale', 140, 90);

    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#334455';
    ctx.fillText('I. Les origines et le déclenchement (1914)', 140, 140);
    ctx.fillText('- 28 juin 1914 : attentat de Sarajevo', 140, 175);
    ctx.fillText('- Jeu des alliances : Triple-Entente vs Triple-Alliance', 140, 210);
    ctx.fillText('II. Une guerre totale et industrielle', 140, 280);
    ctx.fillText('- Guerre des tranchées et de position (1915-1917)', 140, 315);
    ctx.fillText('- 1916 : Bataille de Verdun (300 000 morts)', 140, 350);
    ctx.fillText('- Rôle des civils à l’arrière (usines, munitionnettes)', 140, 385);
    ctx.fillText('Définition : Guerre totale = mobilisation de toute la société.', 140, 440);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const base64Data = dataUrl.split(',')[1];

    const demoPhoto: UploadedPhoto = {
      id: `photo_demo_${Date.now()}`,
      file: new File(['demo'], 'cours_histoire_ww1.jpg', { type: 'image/jpeg' }),
      previewUrl: dataUrl,
      compressedBase64: base64Data,
      name: 'page_cours_histoire_demo.jpg',
      size: 154000,
    };

    onPhotosChange([demoPhoto]);
    setIsProcessing(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Progress header */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-semibold text-[#4B5A70] mb-2">
          <span className="text-[#385DE8]">Étape 1 sur 3 • Photos du cours</span>
          <span>
            {photos.length} / {MAX_PHOTOS} photos
          </span>
        </div>
        <div className="w-full h-1.5 bg-[#E1E7F0] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#5B8DEF] transition-all duration-300"
            style={{ width: `${Math.max((photos.length / MAX_PHOTOS) * 100, 10)}%` }}
          />
        </div>
      </div>

      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-[#1E2A3A]">
          Ajoutez les photos de votre cours
        </h1>
        <p className="text-sm text-[#4B5A70] mt-1">
          Pages de cahier manuscrites ou manuel scolaire. Quilo se charge d’extraire l’essentiel.
        </p>
      </div>

      {/* Error / Alert notice if any */}
      {errorMessage && (
        <div className="mb-6 p-3.5 bg-[#FFF0EE] border border-[#E8604C]/30 rounded-xl flex items-center gap-2.5 text-xs text-[#E8604C]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Upload Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-[#5B8DEF] bg-[#5B8DEF]/5'
            : 'border-[#E1E7F0] bg-[#FFFFFF] hover:border-[#5B8DEF]/60 hover:bg-[#F4F6FA]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="w-14 h-14 rounded-full bg-[#5B8DEF]/10 text-[#385DE8] mx-auto flex items-center justify-center mb-4">
          <Camera className="w-7 h-7" />
        </div>

        <p className="font-heading font-semibold text-lg text-[#1E2A3A]">
          Glissez vos photos ici ou cliquez pour choisir
        </p>
        <p className="text-xs text-[#4B5A70] mt-1.5">
          Prenez une photo directe avec votre téléphone ou importez depuis vos fichiers
        </p>
        <p className="text-xs font-medium text-[#385DE8] mt-3">
          Jusqu'à {MAX_PHOTOS} photos au format JPG, PNG ou HEIC
        </p>
      </div>

      {/* Direct In-App Camera Scanner Action (Gauth style) */}
      <div className="mt-4 p-4 sm:p-5 bg-[#FFFFFF] border border-[#E1E7F0] hover:border-[#5B8DEF]/60 rounded-xl transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5B8DEF]/10 text-[#385DE8] flex items-center justify-center shrink-0">
            <Camera className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <p className="font-heading font-semibold text-sm sm:text-base text-[#1E2A3A]">
              Tu veux directement prendre ta photo ?
            </p>
            <p className="text-xs text-[#4B5A70] mt-0.5">
              Scannez vos pages de cahier avec conseils de cadrage, lumière et barre de niveau.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsScannerOpen(true)}
          disabled={photos.length >= MAX_PHOTOS}
          className="group inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#5B8DEF] hover:bg-[#385DE8] text-white font-heading font-semibold text-xs sm:text-sm rounded-lg shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <ScanLine className="w-4 h-4 group-hover:scale-105 transition-transform duration-200" />
          <span>Prendre en photo</span>
        </button>
      </div>

      {/* Quality recommendations tip */}
      <div className="mt-4 flex items-start gap-2.5 p-3.5 bg-[#FFFFFF] border border-[#E1E7F0] rounded-xl text-xs text-[#4B5A70]">
        <Info className="w-4 h-4 text-[#5B8DEF] shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-[#1E2A3A]">Conseil de lisibilité : </span>
          Pour un résultat optimal, photographiez la page bien à plat avec un bon éclairage. Évitez les ombres de vos mains sur le cahier.
        </div>
      </div>

      {/* Quick Demo load button if 0 photos */}
      {photos.length === 0 && (
        <div className="mt-4 text-center">
          <button
            onClick={loadDemoPhotos}
            disabled={isProcessing}
            className="text-xs text-[#385DE8] hover:text-[#5B8DEF] font-medium inline-flex items-center gap-1.5 cursor-pointer underline underline-offset-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FFC04D]" />
            <span>Pas de photo sous la main ? Charger une page de test</span>
          </button>
        </div>
      )}

      {/* Thumbnails list */}
      {photos.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-semibold text-base text-[#1E2A3A]">
              Photos ajoutées ({photos.length})
            </h2>
            <button
              onClick={() => onPhotosChange([])}
              className="text-xs text-[#E8604C] hover:underline cursor-pointer"
            >
              Tout effacer
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="group relative bg-[#FFFFFF] border border-[#E1E7F0] rounded-xl overflow-hidden shadow-2xs aspect-3/4 flex flex-col"
              >
                {/* Index badge */}
                <div className="absolute top-2 left-2 z-10 w-6 h-6 rounded-md bg-[#1E2A3A]/80 backdrop-blur-xs text-white text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removePhoto(photo.id);
                  }}
                  className="absolute top-2 right-2 z-10 w-7 h-7 rounded-md bg-white/90 text-[#E8604C] hover:bg-[#E8604C] hover:text-white transition-colors flex items-center justify-center shadow-xs cursor-pointer"
                  title="Supprimer cette photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {/* Image preview */}
                <img
                  src={photo.previewUrl}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                <div className="p-1.5 bg-white border-t border-[#E1E7F0] text-[10px] text-[#4B5A70] truncate text-center">
                  Photo {index + 1}
                </div>
              </div>
            ))}

            {/* Add more photo card if slots available */}
            {photos.length < MAX_PHOTOS && (
              <div className="border-2 border-dashed border-[#E1E7F0] hover:border-[#5B8DEF] rounded-xl aspect-3/4 flex flex-col items-center justify-center p-3 gap-2 bg-white/50 transition-colors">
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-[#5B8DEF]/10 hover:bg-[#5B8DEF]/20 text-[#385DE8] text-xs font-semibold transition-colors cursor-pointer"
                  title="Scanner une page de cahier"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border border-[#E1E7F0] hover:bg-[#F4F6FA] text-[#4B5A70] hover:text-[#1E2A3A] text-xs font-medium transition-colors cursor-pointer"
                  title="Importer depuis vos fichiers"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Fichier</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Footer Button */}
      <div className="mt-10 pt-6 border-t border-[#E1E7F0] flex items-center justify-end gap-3 sm:gap-4">
        <button
          onClick={() => onNavigate('landing')}
          className="text-xs font-semibold text-[#4B5A70] hover:text-[#1E2A3A] px-3 py-2 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
        >
          Annuler
        </button>

        <button
          onClick={() => onNavigate('prompt')}
          disabled={photos.length === 0 || isProcessing}
          className="flex items-center gap-2 px-6 py-3 bg-[#5B8DEF] hover:bg-[#385DE8] text-white font-heading font-semibold text-sm rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs cursor-pointer"
        >
          <span>Continuer vers la consigne</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Live Document Scanner Modal */}
      <DocumentScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onAddPhotos={handleAddScannedPhotos}
        currentPhotoCount={photos.length}
        maxPhotos={MAX_PHOTOS}
      />
    </div>
  );
};
