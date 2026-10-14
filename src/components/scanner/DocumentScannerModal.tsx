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
  Layers,
  Sparkles,
} from 'lucide-react';
import { UploadedPhoto } from '../../types/revision';
import { compressImage } from '../../services/imageCompression';
import { ScannerGalleryReview } from './ScannerGalleryReview';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  // Live analyzer metrics
  const [activeAdvice, setActiveAdvice] = useState<{ type: AdviceType; text: string }>({
    type: 'none',
    text: '',
  });

  // Tilt and orientation states
  const [tiltDeviation, setTiltDeviation] = useState(0);
  const [tiltRoll, setTiltRoll] = useState(0);
  const [isProperlyAligned, setIsProperlyAligned] = useState(true);

  const totalPhotos = currentPhotoCount + capturedInSession.length;
  const remainingSlots = maxPhotos - totalPhotos;

  // Stop camera tracks cleanly
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

      // Check if flash/torch is supported
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

  // Flip Camera (environment <-> user)
  const flipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Orientation listener: ONLY show level bar when NOT straight (neither flat, nor upright portrait, nor landscape)
  useEffect(() => {
    if (!isOpen) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null) return;
      const beta = e.beta;
      const gamma = e.gamma;

      // 1. Check if holding phone flat over table/notebook (most common scan position):
      // Beta and gamma are both near 0°
      const isFlatOverDesk = Math.abs(beta) < 14 && Math.abs(gamma) < 14;

      // 2. Check if held upright portrait (e.g. scanning a whiteboard/easel):
      // Beta is near 90°, gamma is near 0°
      const isUprightPortrait = Math.abs(beta - 90) < 16 && Math.abs(gamma) < 12;

      // 3. Check if held upright landscape:
      // Gamma is near 90° or -90°, beta is near 0° or 90°
      const isLandscape =
        (Math.abs(gamma - 90) < 16 || Math.abs(gamma + 90) < 16) && Math.abs(beta) < 18;

      const aligned = isFlatOverDesk || isUprightPortrait || isLandscape;

      // Calculate deviation for visual level indicator if crooked
      const deviation = Math.round(
        Math.min(Math.sqrt(gamma * gamma + (beta > 45 ? (beta - 90) ** 2 : beta ** 2)), 45)
      );

      setTiltDeviation(deviation);
      setTiltRoll(Math.round(gamma));
      setIsProperlyAligned(aligned);
    };

    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [isOpen]);

  // Light and motion analyzer: only advise when an actual problem is detected
  useEffect(() => {
    if (!isOpen || permissionState !== 'granted') return;

    let isMounted = true;
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 64;
    sampleCanvas.height = 48;
    const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });

    const analyzeFrame = () => {
      if (!isMounted) return;

      const video = videoRef.current;
      if (video && video.readyState >= 2 && sampleCtx) {
        try {
          sampleCtx.drawImage(video, 0, 0, 64, 48);
          const imgData = sampleCtx.getImageData(0, 0, 64, 48);
          const data = imgData.data;

          // Average Luminance
          let totalLuminance = 0;
          let count = 0;
          for (let i = 0; i < data.length; i += 16) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            totalLuminance += 0.299 * r + 0.587 * g + 0.114 * b;
            count++;
          }
          const avgLum = Math.round(totalLuminance / (count || 1));

          // Motion Detection
          let motionDiff = 0;
          if (lastFrameDataRef.current && lastFrameDataRef.current.length === data.length) {
            const prev = lastFrameDataRef.current;
            let diffSum = 0;
            let sampleCount = 0;
            for (let i = 0; i < data.length; i += 32) {
              diffSum += Math.abs(data[i] - prev[i]);
              sampleCount++;
            }
            motionDiff = diffSum / (sampleCount || 1);
          }
          lastFrameDataRef.current = new Uint8ClampedArray(data);

          // Discreet advice only if an anomaly is present
          if (avgLum < 55) {
            setActiveAdvice({
              type: 'low-light',
              text: 'Lumière faible — Allumez une lampe',
            });
          } else if (avgLum > 225) {
            setActiveAdvice({
              type: 'overexposed',
              text: 'Reflets intenses sur la page',
            });
          } else if (motionDiff > 16) {
            setActiveAdvice({
              type: 'moving',
              text: 'Stabilisez votre appareil',
            });
          } else {
            setActiveAdvice({ type: 'none', text: '' });
          }
        } catch {
          // ignore
        }
      }

      setTimeout(() => {
        if (isMounted) {
          animFrameRef.current = requestAnimationFrame(analyzeFrame);
        }
      }, 250);
    };

    animFrameRef.current = requestAnimationFrame(analyzeFrame);

    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, permissionState]);

  // Start or stop on open/close
  useEffect(() => {
    if (isOpen) {
      startCamera();
      setCapturedInSession([]);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  // Capture Photo Handler
  const capturePhoto = async () => {
    if (!videoRef.current || isCapturing || remainingSlots <= 0) return;

    try {
      setIsCapturing(true);
      setShutterFlash(true);
      setTimeout(() => setShutterFlash(false), 180);

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(35);
        } catch {
          // ignore
        }
      }

      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Erreur canvas');

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.92)
      );

      if (!blob) throw new Error('Échec capture');

      const photoIndex = currentPhotoCount + capturedInSession.length + 1;
      const file = new File([blob], `cahier_page_${photoIndex}.jpg`, { type: 'image/jpeg' });

      const { base64Data, dataUrl } = await compressImage(file);

      const newPhoto: UploadedPhoto = {
        id: `camera_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        file,
        previewUrl: dataUrl,
        compressedBase64: base64Data,
        name: `Page ${photoIndex}`,
        size: file.size,
      };

      setCapturedInSession((prev) => [...prev, newPhoto]);
    } catch (err) {
      console.error('Erreur capture photo:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  // Finish session and commit photos
  const handleDone = () => {
    if (capturedInSession.length > 0) {
      onAddPhotos(capturedInSession);
    }
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0B1120] flex flex-col justify-between overflow-hidden select-none">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Shutter White Flash Effect */}
      {shutterFlash && (
        <div className="absolute inset-0 z-50 bg-white pointer-events-none transition-opacity duration-150" />
      )}

      {/* Clean Top Bar: Minimalist & Airy */}
      <header className="relative z-20 flex items-center justify-between px-4 sm:px-6 pt-4 pb-2">
        <button
          onClick={handleDone}
          className="p-2.5 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-md transition-colors cursor-pointer border border-white/10"
          title="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Discreet Page Counter */}
        <div className="px-3.5 py-1 rounded-full bg-black/30 border border-white/10 backdrop-blur-md text-xs font-semibold text-white/90">
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
                  : 'bg-black/30 hover:bg-black/50 text-white border-white/10'
              }`}
              title={torchOn ? 'Désactiver le flash' : 'Activer le flash'}
            >
              {torchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={flipCamera}
            className="p-2.5 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-md transition-colors cursor-pointer border border-white/10"
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
              {/* Sleek L-Corner Brackets in Quilo Blue */}
              {/* Top-Left */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-[#5B8DEF] rounded-tl-lg" />
              {/* Top-Right */}
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-[#5B8DEF] rounded-tr-lg" />
              {/* Bottom-Left */}
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-[#5B8DEF] rounded-bl-lg" />
              {/* Bottom-Right */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-[#5B8DEF] rounded-br-lg" />

              {/* Discreet Border */}
              <div className="absolute inset-0 rounded-xl border border-white/15" />

              {/* Floating Real-Time Advice: ONLY appears if an issue is detected */}
              {activeAdvice.type !== 'none' && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-11/12 max-w-[300px] animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-3 py-1.5 rounded-full text-center text-xs font-medium backdrop-blur-md bg-black/75 border border-white/20 text-[#FFC04D] flex items-center justify-center gap-1.5 shadow-md">
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

              {/* Tilting / Level Bar: ONLY APPEARS WHEN NOT STRAIGHT (not flat, not upright portrait, not landscape) */}
              {!isProperlyAligned && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-[#FFC04D]/40 text-[11px] text-[#FFC04D] shadow-lg">
                    <span>Incliné :</span>
                    <div className="w-18 h-1.5 bg-white/20 rounded-full relative overflow-hidden">
                      <div
                        className="absolute top-0 bottom-0 w-2.5 bg-[#FFC04D] rounded-full transition-all duration-100"
                        style={{
                          left: `${Math.min(Math.max(50 + (tiltRoll / 25) * 45 - 5, 0), 85)}%`,
                        }}
                      />
                    </div>
                    <span className="font-semibold">{tiltDeviation}°</span>
                  </div>
                  <span className="text-[10px] text-white/60 tracking-tight">
                    Tenez l'appareil droit
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Controls Bar: Stylish & Modern Review Preview + Shutter */}
      <footer className="relative z-20 px-6 pt-3 pb-8 bg-gradient-to-t from-black/95 via-black/60 to-transparent">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          {/* Left: STYLISH & MODERN IMAGE PREVIEW (Tap opens full review/delete/crop) */}
          <div className="w-20 flex flex-col items-start">
            {capturedInSession.length > 0 ? (
              <button
                type="button"
                onClick={() => setIsReviewOpen(true)}
                className="group relative cursor-pointer active:scale-95 transition-all duration-200"
                title="Gérer les photos scannées"
              >
                {/* Layered Card 2 (Stack effect behind) */}
                {capturedInSession.length > 1 && (
                  <div className="absolute -top-1 -right-1 w-13 h-13 rounded-xl bg-white/20 border border-white/20 rotate-4 transition-transform group-hover:rotate-6" />
                )}

                {/* Layered Card 1 (Main front card) */}
                <div className="relative w-13 h-13 rounded-xl overflow-hidden border-2 border-[#5B8DEF] shadow-lg group-hover:border-[#75D6B0] transition-colors">
                  <img
                    src={capturedInSession[capturedInSession.length - 1].previewUrl}
                    alt="Dernière photo"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  {/* Floating count pill */}
                  <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-[#385DE8] text-white text-[10px] font-extrabold rounded-full flex items-center gap-0.5 border border-white shadow-sm">
                    <Layers className="w-2.5 h-2.5" />
                    <span>{capturedInSession.length}</span>
                  </span>
                </div>

                <span className="block text-[10px] font-semibold text-white/80 group-hover:text-white mt-1 text-center w-13 transition-colors">
                  Gérer
                </span>
              </button>
            ) : (
              <div className="w-13 h-13 rounded-xl border border-white/10 bg-white/5 flex flex-col items-center justify-center text-white/30 text-[10px] text-center">
                <Layers className="w-4 h-4 mb-0.5 opacity-40" />
                <span>0</span>
              </div>
            )}
          </div>

          {/* Center: Ergonomic Shutter Button */}
          <div className="flex flex-col items-center">
            <button
              onClick={capturePhoto}
              disabled={isCapturing || remainingSlots <= 0 || permissionState !== 'granted'}
              className="relative flex items-center justify-center w-18 h-18 rounded-full border-4 border-[#5B8DEF] shadow-[0_0_16px_rgba(91,141,239,0.3)] transition-all duration-150 cursor-pointer active:scale-92 disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#75D6B0] hover:shadow-[0_0_20px_rgba(117,214,176,0.3)]"
              title="Prendre la photo"
            >
              <div
                className={`w-14 h-14 rounded-full transition-all duration-150 ${
                  isCapturing ? 'bg-white/50 scale-90' : 'bg-white hover:bg-white/95'
                }`}
              />
            </button>
          </div>

          {/* Right: Validation / Finish Check Button */}
          <div className="w-20 flex flex-col items-end">
            {capturedInSession.length > 0 ? (
              <button
                onClick={handleDone}
                className="group flex flex-col items-center gap-1 p-2 rounded-xl bg-[#75D6B0] hover:bg-[#5EC49D] text-[#1E2A3A] transition-all shadow-md active:scale-95 cursor-pointer"
                title="Valider et continuer"
              >
                <Check className="w-5 h-5 stroke-[2.5]" />
                <span className="text-[10px] font-bold">Valider</span>
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                Annuler
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Dedicated Full Review / Crop / Delete Modal (Opened by tapping the modern thumbnail stack) */}
      <ScannerGalleryReview
        isOpen={isReviewOpen}
        photos={capturedInSession}
        onClose={() => setIsReviewOpen(false)}
        onUpdatePhotos={(updated) => setCapturedInSession(updated)}
        onValidate={() => {
          setIsReviewOpen(false);
          handleDone();
        }}
      />
    </div>
  );
};
