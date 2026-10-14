import React, { useState, useEffect } from 'react';
import { PageRoute, RevisionSheet, UploadedPhoto } from './types/revision';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './pages/LandingPage';
import { UploadPage } from './pages/UploadPage';
import { PromptPage } from './pages/PromptPage';
import { GeneratingPage } from './pages/GeneratingPage';
import { ResultPage } from './pages/ResultPage';
import { MySheetsPage } from './pages/MySheetsPage';
import { LegalPage } from './pages/LegalPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ProfilePage } from './pages/ProfilePage';
import { SharedSheetPage } from './pages/SharedSheetPage';
import { sampleRevisionSheet } from './services/db';
import {
  subscribeToUserSheets,
  saveSheetToFirestore,
  getSheetById,
} from './services/sheetsFirestore';
import { migrateIndexedDBToFirestore } from './services/migration';
import { testConnection } from './services/firebase';
import { generateRevisionSheet, fetchDynamicSteps } from './services/gemini';
import { decodeSharedSheet } from './services/share';
import { AlertCircle } from 'lucide-react';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageRoute>('landing');
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [prompt, setPrompt] = useState<string>(
    'Toutes les définitions clés et les repères essentiels pour le contrôle'
  );
  const [subjectHint, setSubjectHint] = useState<string>('');
  const [currentSheet, setCurrentSheet] = useState<RevisionSheet>(sampleRevisionSheet);
  const [savedSheets, setSavedSheets] = useState<RevisionSheet[]>([]);
  const [generationSteps, setGenerationSteps] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sharedSheetId, setSharedSheetId] = useState<string | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Test Firebase connection on initial boot
  useEffect(() => {
    testConnection();
  }, []);

  // Handle URL parameters for shared sheets (?sheetId=... or ?shared=...)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const firestoreSheetId = urlParams.get('sheetId');
    const sharedParam = urlParams.get('shared');

    if (firestoreSheetId) {
      setSharedSheetId(firestoreSheetId);
      setCurrentPage('shared-sheet');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (sharedParam) {
      const decoded = decodeSharedSheet(sharedParam);
      if (decoded) {
        setCurrentSheet(decoded);
        setCurrentPage('result');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // Real-time synchronization of revision sheets with Firestore for logged-in user
  // Also runs migration from legacy IndexedDB once on login
  useEffect(() => {
    if (!user) {
      setSavedSheets([]);
      return;
    }

    // Automatically migrate legacy IndexedDB sheets to Firebase Cloud
    migrateIndexedDBToFirestore(user.uid).then((count) => {
      if (count > 0) {
        console.log(`${count} fiche(s) migrées depuis IndexedDB vers Firebase.`);
      }
    });

    // Real-time subscription to user sheets in Cloud Firestore
    const unsubscribe = subscribeToUserSheets(user.uid, (sheets) => {
      setSavedSheets(sheets);
    });

    return () => unsubscribe();
  }, [user]);

  const handleStartGeneration = async () => {
    if (photos.length === 0) {
      setErrorMessage('Veuillez ajouter au moins une photo de cours.');
      setCurrentPage('upload');
      return;
    }

    setErrorMessage(null);
    setCurrentPage('generating');

    // Dynamically request AI steps tailored to the subject, prompt and photos (max 6 steps)
    fetchDynamicSteps({
      prompt: prompt || 'Toutes les notions importantes',
      subjectHint,
      photoCount: photos.length,
    }).then((steps) => {
      setGenerationSteps(steps);
    });

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const newSheet = await generateRevisionSheet({
        photos,
        prompt: prompt || 'Toutes les définitions et points clés',
        subjectHint,
        signal: controller.signal,
      });

      // If user is authenticated, save directly into Cloud Firestore
      if (user) {
        await saveSheetToFirestore(newSheet, user.uid, user.displayName || undefined);
      }

      setCurrentSheet(newSheet);
      setCurrentPage('result');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User explicitly cancelled, silently return
        return;
      }
      console.error('Erreur lors de la génération:', err);
      setErrorMessage(
        err.message || 'Une erreur est survenue lors de l’analyse. Veuillez réessayer.'
      );
      setCurrentPage('prompt');
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setErrorMessage(null);
    setCurrentPage('prompt');
  };

  const handleResetNewSheet = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setPhotos([]);
    setPrompt('Toutes les définitions clés et les repères essentiels pour le contrôle');
    setSubjectHint('');
    setErrorMessage(null);
    setCurrentPage('upload');
  };

  // Check if a sheet is already saved in My Sheets
  const isSheetInMySheets = (sheet: RevisionSheet | null | undefined): boolean => {
    if (!sheet) return false;
    return savedSheets.some((s) => {
      if (s.id && sheet.id && s.id === sheet.id) return true;
      const titleMatch = s.title?.trim().toLowerCase() === sheet.title?.trim().toLowerCase();
      const subjectMatch = s.subject?.trim().toLowerCase() === sheet.subject?.trim().toLowerCase();
      return titleMatch && subjectMatch;
    });
  };

  // Save sheet to Firebase Cloud Firestore
  const handleSaveToMySheets = async (sheetToSave: RevisionSheet) => {
    if (!user) {
      // Prompt user to connect
      setCurrentPage('login');
      return;
    }

    try {
      const sheetWithId: RevisionSheet = {
        ...sheetToSave,
        id: sheetToSave.id && !sheetToSave.id.startsWith('shared_')
          ? sheetToSave.id
          : `sheet_${Date.now()}`,
        userId: user.uid,
        createdAt: sheetToSave.createdAt || new Date().toISOString(),
      };
      await saveSheetToFirestore(sheetWithId, user.uid, user.displayName || undefined);
      setCurrentSheet(sheetWithId);
    } catch (err) {
      console.error('Erreur sauvegarde dans Firebase:', err);
      throw err;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6FA] text-[#1E2A3A]">
      {/* Header (hidden during generation screen to keep focus) */}
      {currentPage !== 'generating' && (
        <Header
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          savedCount={savedSheets.length}
        />
      )}

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="max-w-2xl mx-auto px-4 mt-6 w-full no-print">
          <div className="p-4 bg-[#FFF0EE] border border-[#E8604C]/30 rounded-xl flex items-start gap-3 text-sm text-[#E8604C]">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Une attention est requise</p>
              <p className="text-xs mt-0.5 text-[#1E2A3A]">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs font-bold text-[#E8604C] hover:underline cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Main Page Routing */}
      <main className="flex-1">
        {currentPage === 'landing' && (
          <LandingPage
            onNavigate={setCurrentPage}
            onSelectSheet={(sheet) => {
              setCurrentSheet(sheet);
            }}
          />
        )}

        {currentPage === 'upload' && (
          <UploadPage
            photos={photos}
            onPhotosChange={setPhotos}
            onNavigate={setCurrentPage}
          />
        )}

        {currentPage === 'prompt' && (
          <PromptPage
            photos={photos}
            prompt={prompt}
            onPromptChange={setPrompt}
            subjectHint={subjectHint}
            onSubjectHintChange={setSubjectHint}
            onNavigate={setCurrentPage}
            onStartGeneration={handleStartGeneration}
            onCancel={handleResetNewSheet}
          />
        )}

        {currentPage === 'generating' && (
          <GeneratingPage
            steps={generationSteps}
            photoCount={photos.length}
            onCancel={handleCancelGeneration}
          />
        )}

        {currentPage === 'result' && (
          <ResultPage
            sheet={currentSheet}
            onNavigate={setCurrentPage}
            onResetNewSheet={handleResetNewSheet}
            isSaved={isSheetInMySheets(currentSheet)}
            onSaveToMySheets={handleSaveToMySheets}
          />
        )}

        {currentPage === 'my-sheets' && (
          <MySheetsPage
            sheets={savedSheets}
            onSelectSheet={(sheet) => {
              setCurrentSheet(sheet);
            }}
            onRefreshSheets={() => {}}
            onNavigate={setCurrentPage}
          />
        )}

        {currentPage === 'login' && (
          <LoginPage onNavigate={setCurrentPage} />
        )}

        {currentPage === 'register' && (
          <RegisterPage onNavigate={setCurrentPage} />
        )}

        {currentPage === 'forgot-password' && (
          <ForgotPasswordPage onNavigate={setCurrentPage} />
        )}

        {currentPage === 'profile' && (
          <ProfilePage
            onNavigate={setCurrentPage}
            savedSheetsCount={savedSheets.length}
          />
        )}

        {currentPage === 'shared-sheet' && sharedSheetId && (
          <SharedSheetPage
            sheetId={sharedSheetId}
            onNavigate={setCurrentPage}
            onSelectSheet={(sheet) => {
              setCurrentSheet(sheet);
            }}
          />
        )}

        {currentPage === 'legal' && <LegalPage onNavigate={setCurrentPage} />}

        {currentPage === 'privacy' && <PrivacyPage onNavigate={setCurrentPage} />}
      </main>

      {/* Footer */}
      {currentPage !== 'generating' && <Footer onNavigate={setCurrentPage} />}

      {/* PWA Offline indicator */}
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
