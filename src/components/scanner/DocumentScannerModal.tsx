import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  X,
  RotateCcw,
  Zap,
  ZapOff,
  Sun,
  SunMedium,
  Check,
  AlertTriangle,
  Compass,
  CheckCircle2,
  Maximize2,
  RefreshCw,
} from 'lucide-react';
import { UploadedPhoto } from '../../types/revision';
import { compressImage } from '../../services/imageCompression';

interface DocumentScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPhotos: (newPhotos: UploadedPhoto[]) => void;
  currentPhotoCount: number;
  maxPhotos?: number;
}

type AdviceType = 'good' | 'low-light' | 'overexposed' | 'tilted' | 'moving';

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

  // Live analyzer metrics
  const [advice, setAdvice] = useState<{ type: AdviceType; text: string }>({
    type: 'good',
    text: 'Cadrez la page de votre cahier',
  });
  const [tiltAngle, setTiltAngle] = useState<{ beta: number; gamma: number; deviation: number }>({
    beta: 0,
    gamma: 0,
    deviation: 0,
  });
  const [isLevel, setIsLevel] = useState(true);

  const remainingSlots = maxPhotos - (currentPhotoCount + capturedInSession.length);

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
        // Fallback with looser constraints
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

  // Device orientation / level listener
  useEffect(() => {
    if (!isOpen) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null) return;
      // Normal flat position holding phone horizontally over notebook:
      // beta is around 0° (pitch flat) or 90° if held vertically.
      // Deviation from perpendicular to surface:
      const beta = Math.round(e.beta);
      const gamma = Math.round(e.gamma);

      // Compute deviation from horizontal plane
      // When looking down at a desk, phone is roughly parallel to floor (beta ~ 0, gamma ~ 0)
      const absGamma = Math.abs(gamma);
      const absBeta = Math.abs(beta);
      const deviation = Math.min(Math.sqrt(absGamma * absGamma + absBeta * absBeta), 45);

      const level = deviation < 12;
      setTiltAngle({ beta, gamma, deviation: Math.round(deviation) });
      setIsLevel(level);
    };

    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [isOpen]);

  // Light and motion analyzer loop
  useEffect(() => {
    if (!isOpen || permissionState !== 'granted') return;

    let isMounted = true;
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 80;
    sampleCanvas.height = 60;
    const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });

    const analyzeFrame = () => {
      if (!isMounted) return;

      const video = videoRef.current;
      if (video && video.readyState >= 2 && sampleCtx) {
        try {
          sampleCtx.drawImage(video, 0, 0, 80, 60);
          const imgData = sampleCtx.getImageData(0, 0, 80, 60);
          const data = imgData.data;

          // 1. Calculate average luminance in the central document area
          let totalLuminance = 0;
          let count = 0;
          for (let i = 0; i < data.length; i += 16) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            // Perceived luminance formula
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            totalLuminance += lum;
            count++;
          }
          const avgLum = Math.round(totalLuminance / (count || 1));

          // 2. Motion / shake detection compared to previous frame
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

          // 3. Formulate smart, prioritized guidance
          if (avgLum < 60) {
            setAdvice({
              type: 'low-light',
              text: 'Lumière faible — Allumez une lampe ou activez le flash',
            });
          } else if (avgLum > 215) {
            setAdvice({
              type: 'overexposed',
              text: 'Trop de reflets — Ajustez l’angle pour éviter les brillances',
            });
          } else if (motionDiff > 14) {
            setAdvice({
              type: 'moving',
              text: 'Stabilisez votre appareil pour un texte bien net',
            });
          } else if (!isLevel && tiltAngle.deviation > 18) {
            setAdvice({
              type: 'tilted',
              text: 'Tenez l’appareil bien à plat au-dessus de la page',
            });
          } else {
            setAdvice({
              type: 'good',
              text: 'Cadrage net et stable • Prêt à photographier',
            });
          }
        } catch {
          // ignore canvas sampling glitches
        }
      }

      // Sample every ~200ms
      setTimeout(() => {
        if (isMounted) {
          animFrameRef.current = requestAnimationFrame(analyzeFrame);
        }
      }, 200);
    };

    animFrameRef.current = requestAnimationFrame(analyzeFrame);

    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, permissionState, isLevel, tiltAngle.deviation]);

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
      setTimeout(() => setShutterFlash(false), 200);

      // Light haptic feedback if available on mobile
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(40);
        } catch {
          // ignore
        }
      }

      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Impossible d’initialiser le canvas de capture');

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to blob then file
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.92)
      );

      if (!blob) throw new Error('Échec de la capture');

      const photoIndex = currentPhotoCount + capturedInSession.length + 1;
      const file = new File([blob], `cahier_page_${photoIndex}.jpg`, { type: 'image/jpeg' });

      // Run through our standard fast compression
      const { base64Data, dataUrl } = await compressImage(file);

      const newPhoto: UploadedPhoto = {
        id: `camera_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        file,
        previewUrl: dataUrl,
        compressedBase64: base64Data,
        name: `Page de cahier ${photoIndex}`,
        size: file.size,
      };

      setCapturedInSession((prev) => [...prev, newPhoto]);
    } catch (err) {
      console.error('Erreur lors de la capture photo:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  // Finish session and add photos to the main form
  const handleDone = () => {
    if (capturedInSession.length > 0) {
      onAddPhotos(capturedInSession);
    }
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A] flex flex-col justify-between overflow-hidden select-none">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Shutter White Flash Effect */}
      {shutterFlash && (
        <div className="absolute inset-0 z-50 bg-white pointer-events-none transition-opacity duration-200" />
      )}

      {/* Top Controls Bar */}
      <header className="relative z-20 flex items-center justify-between px-4 pt-4 pb-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <button
          onClick={handleDone}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white text-xs font-semibold transition-colors cursor-pointer border border-white/10"
        >
          <X className="w-4 h-4" />
          <span>Fermer</span>
        </button>

        {/* Counter Badge */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full bg-[#5B8DEF]/30 border border-[#5B8DEF]/50 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-[#5B8DEF]" />
            <span>
              {currentPhotoCount + capturedInSession.length} / {maxPhotos} photos
            </span>
          </div>
        </div>

        {/* Flash & Flip actions */}
        <div className="flex items-center gap-2">
          {torchAvailable && (
            <button
              onClick={toggleTorch}
              className={`p-2 rounded-full backdrop-blur-md transition-colors cursor-pointer border ${
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
            className="p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white transition-colors cursor-pointer border border-white/10"
            title="Changer de caméra"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Viewfinder Area */}
      <main className="relative flex-1 flex items-center justify-center overflow-hidden">
        {/* Permission Request State */}
        {permissionState === 'requesting' && (
          <div className="relative z-10 text-center p-6 max-w-sm mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-[#5B8DEF]/20 border border-[#5B8DEF]/40 text-[#5B8DEF] mx-auto flex items-center justify-center mb-4 animate-pulse">
              <Camera className="w-7 h-7" />
            </div>
            <h3 className="font-heading font-bold text-lg text-white mb-1">
              Connexion à l'appareil photo...
            </h3>
            <p className="text-xs text-white/70">
              Veuillez autoriser l'accès à la caméra pour scanner votre cahier.
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
              Accès à la caméra refusé
            </h3>
            <p className="text-xs text-white/70 leading-relaxed mb-4">
              Pour scanner votre cahier directement, activez l'autorisation appareil photo dans les paramètres de votre navigateur (icône cadenas ou paramètres du site).
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

        {/* Unsupported State */}
        {permissionState === 'unsupported' && (
          <div className="relative z-10 text-center p-6 max-w-sm mx-auto bg-black/60 backdrop-blur-md rounded-2xl border border-white/10">
            <p className="text-sm text-white mb-3">
              Votre navigateur ne supporte pas l'accès direct à la caméra. Utilisez le sélecteur de fichiers habituel.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#5B8DEF] text-white text-xs font-semibold rounded-xl"
            >
              Retour
            </button>
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

        {/* Gauth/CamScanner Document Mask Overlay */}
        {permissionState === 'granted' && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4 sm:p-8">
            {/* Dark Mask Surrounding the Notebook Viewfinder */}
            <div className="relative w-full max-w-[340px] sm:max-w-[420px] aspect-[3/4] max-h-[68vh] flex items-center justify-center">
              {/* Outer Bounding Box with Quilo Colors */}
              <div
                className={`absolute inset-0 rounded-2xl border-2 transition-all duration-300 ${
                  advice.type === 'good'
                    ? 'border-[#75D6B0] shadow-[0_0_24px_rgba(117,214,176,0.25)]'
                    : 'border-[#5B8DEF]/70 shadow-[0_0_20px_rgba(91,141,239,0.2)]'
                }`}
              />

              {/* 4 Professional L-Shaped Corner Brackets */}
              {/* Top-Left */}
              <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-[#5B8DEF] rounded-tl-xl" />
              {/* Top-Right */}
              <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-[#5B8DEF] rounded-tr-xl" />
              {/* Bottom-Left */}
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-[#5B8DEF] rounded-bl-xl" />
              {/* Bottom-Right */}
              <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-[#5B8DEF] rounded-br-xl" />

              {/* Subtle Document Grid Lines */}
              <div className="absolute inset-4 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20">
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-white" />
                <div className="border-r border-white" />
                <div />
              </div>

              {/* Subtle Center Document Target */}
              <div className="absolute inset-0 flex items-center justify-center opacity-30">
                <div className="w-8 h-8 border border-white/60 rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-[#5B8DEF] rounded-full" />
                </div>
              </div>

              {/* Floating Real-Time Advice Pill */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-11/12 max-w-[320px]">
                <div
                  className={`px-3.5 py-1.5 rounded-full text-center text-xs font-medium backdrop-blur-md border shadow-md flex items-center justify-center gap-2 transition-all duration-200 ${
                    advice.type === 'good'
                      ? 'bg-[#0F172A]/85 text-[#75D6B0] border-[#75D6B0]/50'
                      : advice.type === 'low-light'
                      ? 'bg-[#0F172A]/90 text-[#FFC04D] border-[#FFC04D]/50'
                      : advice.type === 'tilted' || advice.type === 'moving'
                      ? 'bg-[#0F172A]/90 text-[#5B8DEF] border-[#5B8DEF]/50'
                      : 'bg-[#0F172A]/90 text-white border-white/20'
                  }`}
                >
                  {advice.type === 'good' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#75D6B0] shrink-0" />
                  ) : advice.type === 'low-light' ? (
                    <Sun className="w-3.5 h-3.5 text-[#FFC04D] shrink-0" />
                  ) : advice.type === 'overexposed' ? (
                    <SunMedium className="w-3.5 h-3.5 text-[#FFC04D] shrink-0" />
                  ) : (
                    <Compass className="w-3.5 h-3.5 text-[#5B8DEF] shrink-0" />
                  )}
                  <span className="truncate">{advice.text}</span>
                </div>
              </div>

              {/* Professional Horizon Stabilization Bar (Like Gauth / CamScanner) */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px]">
                  <span className="text-white/70">Niveau :</span>
                  <div className="w-20 h-2 bg-white/20 rounded-full relative overflow-hidden">
                    <div
                      className={`absolute top-0 bottom-0 w-3 rounded-full transition-all duration-150 ${
                        isLevel ? 'bg-[#75D6B0] shadow-[0_0_8px_#75D6B0]' : 'bg-[#FFC04D]'
                      }`}
                      style={{
                        left: `${Math.min(
                          Math.max(50 + (tiltAngle.gamma / 30) * 40 - 7, 0),
                          85
                        )}%`,
                      }}
                    />
                  </div>
                  <span
                    className={`font-semibold ${
                      isLevel ? 'text-[#75D6B0]' : 'text-white/80'
                    }`}
                  >
                    {isLevel ? 'À plat' : `${tiltAngle.deviation}°`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Shutter & Session Gallery Controls */}
      <footer className="relative z-20 px-6 pt-3 pb-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          {/* Left: Thumbnail of last captured photo in this session */}
          <div className="w-16 flex items-center justify-start">
            {capturedInSession.length > 0 ? (
              <div className="relative group">
                <img
                  src={capturedInSession[capturedInSession.length - 1].previewUrl}
                  alt="Dernière capture"
                  className="w-12 h-12 object-cover rounded-xl border-2 border-[#5B8DEF] shadow-md"
                />
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#385DE8] text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white">
                  {capturedInSession.length}
                </span>
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-white/30 text-[10px] text-center p-1">
                0 photo
              </div>
            )}
          </div>

          {/* Center: Ergonomic Shutter Button */}
          <div className="flex flex-col items-center">
            <button
              onClick={capturePhoto}
              disabled={isCapturing || remainingSlots <= 0 || permissionState !== 'granted'}
              className={`relative flex items-center justify-center w-18 h-18 rounded-full border-4 transition-all duration-150 cursor-pointer active:scale-92 disabled:opacity-40 disabled:cursor-not-allowed ${
                advice.type === 'good'
                  ? 'border-[#75D6B0] shadow-[0_0_20px_rgba(117,214,176,0.4)]'
                  : 'border-[#5B8DEF] shadow-[0_0_16px_rgba(91,141,239,0.3)]'
              }`}
              title="Prendre la photo"
            >
              {/* Inner Circle */}
              <div
                className={`w-14 h-14 rounded-full transition-all duration-150 ${
                  isCapturing ? 'bg-white/50 scale-90' : 'bg-white hover:bg-white/95'
                }`}
              />
            </button>
            <span className="text-[11px] text-white/70 mt-1.5 font-medium">
              {remainingSlots <= 0
                ? 'Limite atteinte (13)'
                : 'Prendre la photo'}
            </span>
          </div>

          {/* Right: Done Button */}
          <div className="w-16 flex items-center justify-end">
            {capturedInSession.length > 0 ? (
              <button
                onClick={handleDone}
                className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-[#75D6B0] hover:bg-[#5EC49D] text-[#1E2A3A] text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <span>Terminé</span>
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
    </div>
  );
};
