import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  X,
  Zap,
  ZapOff,
  Sun,
  SunMedium,
  Check,
  AlertTriangle,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { UploadedPhoto } from '../../types/revision';
import { canvasToFile } from '../../services/imageCompression';
import { InteractiveCropEditor } from './InteractiveCropEditor';

interface DocumentScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPhotos: (newPhotos: UploadedPhoto[]) => void;
  currentPhotoCount: number;
  maxPhotos?: number;
}

type AdviceType = 'none' | 'low-light' | 'overexposed' | 'moving';

export const DocumentScannerModal: React.FC<DocumentScannerModalProps> = ({
  isOpen,
  onClose,
  onAddPhotos,
  currentPhotoCount,
  maxPhotos = 13,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastFrameDataRef = useRef<Uint8ClampedArray | null>(null);

  const [permissionState, setPermissionState] = useState<'requesting' | 'granted' | 'denied' | 'unsupported'>('requesting');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedInSession, setCapturedInSession] = useState<UploadedPhoto[]>([]);
  const [shutterFlash, setShutterFlash] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<UploadedPhoto | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Discreet advice state
  const [activeAdvice, setActiveAdvice] = useState<{ type: AdviceType; text: string }>({
    type: 'none',
    text: '',
  });

  const totalPhotos = currentPhotoCount + capturedInSession.length;
  const remainingSlots = maxPhotos - totalPhotos;

  // Stop camera stream cleanly
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  // Start camera stream
  const startCamera = useCallback(async () => {
    stopCamera();
    setPermissionState('requesting');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionState('unsupported');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setPermissionState('granted');

      // Check flash / torch capability
      const track = stream.getVideoTracks()[0];
      const capabilities = (track as any)?.getCapabilities?.();
      setTorchAvailable(Boolean(capabilities?.torch));
    } catch (err: any) {
      console.warn('Erreur accès caméra:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionState('denied');
      } else {
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true,
          });
          streamRef.current = fallbackStream;
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            await videoRef.current.play();
          }
          setPermissionState('granted');
        } catch {
          setPermissionState('denied');
        }
      }
    }
  }, [facingMode, stopCamera]);

  // Toggle Torch
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const nextTorch = !torchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchOn(nextTorch);
    } catch (e) {
      console.warn('Impossible de modifier le flash:', e);
    }
  };

  // Flip Camera
  const flipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Light and motion analyzer: only advise when an actual problem is detected
  useEffect(() => {
    if (!isOpen || permissionState !== 'granted' || pendingPhoto) return;

    let isMounted = true;
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 64;
    sampleCanvas.height = 48;
    const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });

    let lowLightStreak = 0;
    let glareStreak = 0;
    let motionStreak = 0;

    const analyzeFrame = () => {
      if (!isMounted) return;

      const video = videoRef.current;
      if (video && video.readyState >= 2 && sampleCtx) {
        try {
          sampleCtx.drawImage(video, 0, 0, 64, 48);
          const frame = sampleCtx.getImageData(0, 0, 64, 48);
          const data = frame.data;

          let totalBrightness = 0;
          let diffSum = 0;
          const prevData = lastFrameDataRef.current;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            totalBrightness += lum;

            if (prevData) {
              const prevLum = 0.299 * prevData[i] + 0.587 * prevData[i + 1] + 0.114 * prevData[i + 2];
              diffSum += Math.abs(lum - prevLum);
            }
          }

          const pixelCount = data.length / 4;
          const avgBrightness = totalBrightness / pixelCount;
          const avgDiff = prevData ? diffSum / pixelCount : 0;

          lastFrameDataRef.current = new Uint8ClampedArray(data);

          if (avgBrightness < 45) {
            lowLightStreak++;
          } else {
            lowLightStreak = Math.max(0, lowLightStreak - 1);
          }

          if (avgBrightness > 225) {
            glareStreak++;
          } else {
            glareStreak = Math.max(0, glareStreak - 1);
          }

          if (avgDiff > 28) {
            motionStreak++;
          } else {
            motionStreak = Math.max(0, motionStreak - 1);
          }

          let nextAdvice: { type: AdviceType; text: string } = { type: 'none', text: '' };

          if (lowLightStreak >= 4) {
            nextAdvice = {
              type: 'low-light',
              text: 'Luminosité faible : rapprochez une lumière ou allumez le flash',
            };
          } else if (glareStreak >= 4) {
            nextAdvice = {
              type: 'overexposed',
              text: 'Reflet intense détecté : inclinez légèrement votre page',
            };
          } else if (motionStreak >= 4) {
            nextAdvice = {
              type: 'moving',
              text: 'Appareil en mouvement : stabilisez pour une netteté maximale',
            };
          }

          setActiveAdvice(nextAdvice);
        } catch {
          // ignore frame errors
        }
      }

      animFrameRef.current = requestAnimationFrame(analyzeFrame);
    };

    animFrameRef.current = requestAnimationFrame(analyzeFrame);

    return () => {
      isMounted = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isOpen, permissionState, pendingPhoto]);

  // Lifecycle
  useEffect(() => {
    if (isOpen) {
      startCamera();
      setCapturedInSession([]);
      setPendingPhoto(null);
      setEditingIndex(null);
      setToastMessage(null);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  // Capture Photo Handler: instantly captures and opens the single-photo adjustment screen
  const capturePhoto = () => {
    if (!videoRef.current || isCapturing || remainingSlots <= 0) return;

    try {
      setIsCapturing(true);
      setShutterFlash(true);
      setTimeout(() => setShutterFlash(false), 160);

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(35);
        } catch {
          // ignore
        }
      }

      const video = videoRef.current;
      let width = video.videoWidth || 1920;
      let height = video.videoHeight || 1080;

      // Ensure valid dimensions
      if (width <= 0) width = 1280;
      if (height <= 0) height = 720;

      // Balance clarity and performance on the capture canvas (max 1600px)
      const maxDim = 1600;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Erreur canvas 2D');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const photoIndex = currentPhotoCount + capturedInSession.length + 1;
      const { file, dataUrl, base64Data } = canvasToFile(
        canvas,
        `cahier_page_${photoIndex}.jpg`,
        0.88
      );

      const newPhoto: UploadedPhoto = {
        id: `camera_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        file,
        previewUrl: dataUrl,
        compressedBase64: base64Data,
        name: `Page ${photoIndex}`,
        size: file.size,
      };

      // Immediately display the adjustment screen for this photo
      setEditingIndex(null);
      setPendingPhoto(newPhoto);
    } catch (err) {
      console.error('Erreur capture photo:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  // Called when user validates the crop & rotation
  const handleSaveAdjustedPhoto = (savedPhoto: UploadedPhoto) => {
    if (editingIndex !== null) {
      // Updated an existing page
      setCapturedInSession((prev) => {
        const next = [...prev];
        next[editingIndex] = savedPhoto;
        return next;
      });
      setToastMessage('Page mise à jour');
    } else {
      // Added a new page
      setCapturedInSession((prev) => [...prev, savedPhoto]);
      setToastMessage(`Page ${capturedInSession.length + 1} validée`);
    }

    setPendingPhoto(null);
    setEditingIndex(null);

    // Auto-clear toast after 2.5s
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Cancel adjustment / Retake photo
  const handleCancelAdjust = () => {
    setPendingPhoto(null);
    setEditingIndex(null);
  };

  // Finish session and commit all photos
  const handleDone = () => {
    if (capturedInSession.length > 0) {
      onAddPhotos(capturedInSession);
    }
    stopCamera();
    onClose();
  };

  // Remove the last scanned photo
  const handleRemoveLast = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCapturedInSession((prev) => prev.slice(0, -1));
    setToastMessage('Page supprimée');
    setTimeout(() => setToastMessage(null), 2000);
  };

  // Click on thumbnail to re-edit that photo
  const handleReEditLast = () => {
    if (capturedInSession.length === 0) return;
    const lastIdx = capturedInSession.length - 1;
    setEditingIndex(lastIdx);
    setPendingPhoto(capturedInSession[lastIdx]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#070A11] flex flex-col justify-between overflow-hidden select-none">
      {/* Shutter White Flash Effect */}
      {shutterFlash && (
        <div className="absolute inset-0 z-50 bg-white pointer-events-none transition-opacity duration-150" />
      )}

      {/* Clean Top Bar: Minimalist & Airy */}
      <header className="relative z-20 flex items-center justify-between px-4 sm:px-6 pt-4 pb-2">
        <button
          onClick={handleDone}
          className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors cursor-pointer border border-white/10"
          title="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Discreet Page Counter */}
        <div className="px-3.5 py-1 rounded-full bg-black/40 border border-white/10 backdrop-blur-md text-xs font-semibold text-white/90">
          <span>{totalPhotos} / {maxPhotos} photos</span>
        </div>

        {/* Camera Utilities (Flash & Flip) */}
        <div className="flex items-center gap-2">
          {torchAvailable && (
            <button
              onClick={toggleTorch}
              className={`p-2.5 rounded-full backdrop-blur-md transition-colors cursor-pointer border ${
                torchOn
                  ? 'bg-[#FFC04D] text-[#1E2A3A] border-[#FFC04D]'
                  : 'bg-black/40 hover:bg-black/60 text-white border-white/10'
              }`}
              title={torchOn ? 'Désactiver le flash' : 'Activer le flash'}
            >
              {torchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={flipCamera}
            className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors cursor-pointer border border-white/10"
            title="Inverser la caméra"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Viewfinder Area: Clean & Unobstructed */}
      <main className="relative flex-1 flex items-center justify-center overflow-hidden">
        {/* Permission Request State */}
        {permissionState === 'requesting' && (
          <div className="relative z-10 text-center p-6 max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-[#5B8DEF]/20 border border-[#5B8DEF]/40 text-[#5B8DEF] mx-auto flex items-center justify-center mb-3 animate-pulse">
              <Camera className="w-6 h-6" />
            </div>
            <p className="font-heading font-semibold text-base text-white">
              Connexion à l'appareil photo...
            </p>
          </div>
        )}

        {/* Permission Denied State */}
        {permissionState === 'denied' && (
          <div className="relative z-10 text-center p-6 max-w-sm mx-auto bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 m-4">
            <div className="w-12 h-12 rounded-xl bg-[#E8604C]/20 border border-[#E8604C]/40 text-[#E8604C] mx-auto flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-base text-white mb-1.5">
              Accès à la caméra requis
            </h3>
            <p className="text-xs text-white/70 leading-relaxed mb-4">
              Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur pour photographier vos notes.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-[#5B8DEF] hover:bg-[#385DE8] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Réessayer
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        )}

        {/* The Live Video Element */}
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            permissionState === 'granted' ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Clean, Minimalist Viewfinder Overlay */}
        {permissionState === 'granted' && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4 sm:p-6">
            <div className="relative w-full max-w-[340px] sm:max-w-[400px] aspect-[3/4] max-h-[66vh] flex items-center justify-center">
              {/* Clean White Viewfinder Corner Brackets */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-white/90 rounded-tl-lg shadow-sm" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-white/90 rounded-tr-lg shadow-sm" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-white/90 rounded-bl-lg shadow-sm" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-white/90 rounded-br-lg shadow-sm" />

              {/* Discreet Viewfinder Border */}
              <div className="absolute inset-0 rounded-xl border border-white/20" />

              {/* Subtle Success Toast Notification */}
              {toastMessage && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-1.5 rounded-full bg-[#75D6B0] text-[#0A0E17] text-xs font-heading font-bold flex items-center gap-1.5 shadow-lg shadow-[#75D6B0]/20">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>{toastMessage}</span>
                  </div>
                </div>
              )}

              {/* Floating Real-Time Advice: ONLY appears if an issue is detected */}
              {!toastMessage && activeAdvice.type !== 'none' && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-11/12 max-w-[300px] animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-3.5 py-1.5 rounded-full text-center text-xs font-medium backdrop-blur-md bg-black/80 border border-white/20 text-[#FFC04D] flex items-center justify-center gap-1.5 shadow-md">
                    {activeAdvice.type === 'low-light' ? (
                      <Sun className="w-3.5 h-3.5 shrink-0" />
                    ) : activeAdvice.type === 'overexposed' ? (
                      <SunMedium className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span className="truncate">{activeAdvice.text}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Controls Bar: Thumbnail Preview + Shutter + Clean Validate Button */}
      <footer className="relative z-20 px-6 pt-3 pb-8 bg-gradient-to-t from-black/95 via-black/70 to-transparent">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          {/* Left: Thumbnail Preview of last captured page */}
          <div className="w-24 flex items-center justify-start">
            {capturedInSession.length > 0 ? (
              <div className="relative group">
                <button
                  type="button"
                  onClick={handleReEditLast}
                  className="relative w-12 h-15 rounded-lg overflow-hidden border-2 border-white bg-[#0F172A] shadow-xl transform active:scale-95 transition-all cursor-pointer"
                  title="Réajuster la dernière page"
                >
                  <img
                    src={capturedInSession[capturedInSession.length - 1].previewUrl}
                    alt="Dernière page"
                    className="w-full h-full object-cover"
                  />
                  {/* Badge count */}
                  <div className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-[#0A0E17] text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white/40 shadow-lg">
                    {capturedInSession.length}
                  </div>
                </button>

                {/* Subtle Delete Button */}
                <button
                  type="button"
                  onClick={handleRemoveLast}
                  className="absolute -bottom-1.5 -left-1.5 p-1 rounded-full bg-black/80 hover:bg-[#E8604C] text-white/80 hover:text-white border border-white/20 transition-colors cursor-pointer shadow-md"
                  title="Supprimer la dernière page"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ) : (
              /* Minimalist Empty State Placeholder */
              <div className="w-12 h-15 rounded-lg border border-white/20 bg-white/5 flex flex-col items-center justify-center text-white/40 text-[10px]">
                <Camera className="w-4 h-4 mb-0.5 opacity-60" />
                <span>0</span>
              </div>
            )}
          </div>

          {/* Center: Ergonomic Shutter Button */}
          <div className="flex flex-col items-center">
            <button
              onClick={capturePhoto}
              disabled={isCapturing || remainingSlots <= 0 || permissionState !== 'granted'}
              className="relative flex items-center justify-center w-18 h-18 rounded-full border-4 border-white/90 shadow-[0_0_24px_rgba(255,255,255,0.25)] transition-all duration-150 cursor-pointer active:scale-92 disabled:opacity-40 disabled:cursor-not-allowed hover:border-white hover:scale-102"
              title="Prendre la photo"
            >
              <div
                className={`w-14 h-14 rounded-full transition-all duration-150 ${
                  isCapturing ? 'bg-white/40 scale-90' : 'bg-white hover:bg-white/95'
                }`}
              />
            </button>
          </div>

          {/* Right: Clean Validate Button (Finishes and imports all pages) */}
          <div className="w-24 flex items-center justify-end">
            {capturedInSession.length > 0 ? (
              <button
                onClick={handleDone}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#75D6B0] hover:bg-[#5EC49D] text-[#0A0E17] font-heading font-bold text-xs sm:text-sm shadow-lg shadow-[#75D6B0]/25 hover:shadow-xl hover:shadow-[#75D6B0]/35 border border-[#75D6B0]/40 transition-all active:scale-95 cursor-pointer"
                title="Valider et importer les pages scannées"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Valider</span>
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                Fermer
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Screen that appears immediately after capturing a photo to freely resize, rotate, and validate */}
      {pendingPhoto && (
        <InteractiveCropEditor
          photo={pendingPhoto}
          onSave={handleSaveAdjustedPhoto}
          onCancel={handleCancelAdjust}
        />
      )}
    </div>
  );
};
