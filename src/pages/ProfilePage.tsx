import React, { useState } from 'react';
import { PageRoute, RevisionSheet } from '../types/revision';
import { useAuth } from '../contexts/AuthContext';
import {
  User,
  Mail,
  GraduationCap,
  Calendar,
  LogOut,
  CheckCircle,
  AlertCircle,
  BookOpen,
  ArrowLeft,
  Save,
  Send,
} from 'lucide-react';
import { QuiloMascot } from '../assets/QuiloMascot';

interface ProfilePageProps {
  onNavigate: (page: PageRoute) => void;
  savedSheetsCount: number;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  onNavigate,
  savedSheetsCount,
}) => {
  const { user, profile, updateUserProfileData, logOut, resendVerificationEmail } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName || user?.displayName || '');
  const [schoolGrade, setSchoolGrade] = useState(profile?.schoolGrade || 'Lycée');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <QuiloMascot size={48} className="mx-auto mb-4" />
        <h2 className="font-heading font-bold text-lg text-[#1E2A3A] mb-2">
          Vous n’êtes pas connecté
        </h2>
        <p className="text-xs text-[#4B5A70] mb-6">
          Connectez-vous pour accéder à votre profil et synchroniser vos fiches.
        </p>
        <button
          onClick={() => onNavigate('login')}
          className="px-5 py-2.5 rounded-xl bg-[#5B8DEF] hover:bg-[#385DE8] text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
        >
          Se connecter
        </button>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setMessage({ type: 'error', text: 'Le nom ne peut pas être vide.' });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);
      await updateUserProfileData({
        displayName: displayName.trim(),
        schoolGrade,
      });
      setMessage({ type: 'success', text: 'Profil mis à jour avec succès.' });
    } catch (err: any) {
      console.error('Erreur mise à jour profil:', err);
      setMessage({ type: 'error', text: 'Impossible de mettre à jour le profil.' });
    } finally {
      setSaving(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      await resendVerificationEmail();
      setVerificationSent(true);
      setTimeout(() => setVerificationSent(false), 5000);
    } catch (e) {
      console.warn('Erreur renvoi vérification:', e);
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      onNavigate('landing');
    } catch (err) {
      console.error('Erreur déconnexion:', err);
    }
  };

  const joinDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric',
      })
    : 'Récemment';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => onNavigate('my-sheets')}
          className="flex items-center gap-1.5 text-xs font-medium text-[#4B5A70] hover:text-[#1E2A3A] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Mes fiches</span>
        </button>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#E8604C] hover:bg-[#FFF0EE] transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Se déconnecter</span>
        </button>
      </div>

      {/* Main Profile Card */}
      <div className="bg-[#FFFFFF] border border-[#E1E7F0] rounded-2xl p-6 sm:p-8 shadow-xs">
        {/* User Identity Header */}
        <div className="flex items-start sm:items-center gap-4 pb-6 border-b border-[#E1E7F0]">
          <div className="w-14 h-14 rounded-2xl bg-[#5B8DEF]/15 text-[#385DE8] border border-[#5B8DEF]/25 flex items-center justify-center font-heading font-bold text-xl uppercase shrink-0">
            {displayName.charAt(0) || user.email?.charAt(0) || 'Q'}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-heading font-bold text-xl text-[#1E2A3A] truncate">
              {displayName || 'Étudiant Quilo'}
            </h1>
            <p className="text-xs text-[#4B5A70] truncate mt-0.5">{user.email}</p>
            <div className="flex items-center gap-3 mt-2 text-[11px] text-[#4B5A70]">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#5B8DEF]" />
                <span>Membre depuis {joinDate}</span>
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-[#5B8DEF]" />
                <span>{savedSheetsCount} fiche(s)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Email Verification Notice */}
        {!user.emailVerified && (
          <div className="my-5 p-3.5 bg-[#FFF9EC] border border-[#FFC04D]/40 rounded-xl flex items-start justify-between gap-3 text-xs text-[#1E2A3A]">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#FFC04D] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#B37400]">Adresse email non vérifiée</p>
                <p className="text-[#4B5A70] text-[11px] mt-0.5">
                  Vérifiez vos emails pour valider définitivement votre compte.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={verificationSent}
              className="px-2.5 py-1 text-[11px] font-semibold text-[#B37400] hover:text-[#1E2A3A] bg-white rounded-md border border-[#FFC04D]/50 hover:bg-[#FFF4DC] transition-colors shrink-0 cursor-pointer disabled:opacity-50"
            >
              {verificationSent ? 'Lien envoyé !' : 'Renvoyer l’email'}
            </button>
          </div>
        )}

        {/* Feedback message */}
        {message && (
          <div
            className={`my-4 p-3 rounded-xl flex items-center gap-2 text-xs ${
              message.type === 'success'
                ? 'bg-[#EBFBF4] border border-[#75D6B0]/40 text-[#1E2A3A]'
                : 'bg-[#FFF0EE] border border-[#E8604C]/30 text-[#E8604C]'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-[#75D6B0] shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#E8604C] shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Profile Edit Form */}
        <form onSubmit={handleSave} className="mt-6 space-y-4">
          <h2 className="text-xs font-semibold text-[#4B5A70] uppercase tracking-wider mb-2">
            Informations personnelles
          </h2>

          <div>
            <label className="block text-xs font-semibold text-[#1E2A3A] mb-1.5">
              Nom ou Prénom affiché
            </label>
            <div className="relative">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full h-10 pl-9 pr-3.5 rounded-xl border border-[#E1E7F0] bg-[#F4F6FA] text-xs sm:text-sm text-[#1E2A3A] focus:bg-white focus:outline-none focus:border-[#5B8DEF] focus:ring-2 focus:ring-[#5B8DEF]/15 transition-all"
              />
              <User className="w-4 h-4 text-[#4B5A70] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E2A3A] mb-1.5">
              Adresse email associée
            </label>
            <div className="relative">
              <input
                type="email"
                value={user.email || ''}
                disabled
                className="w-full h-10 pl-9 pr-3.5 rounded-xl border border-[#E1E7F0] bg-[#E1E7F0]/40 text-xs sm:text-sm text-[#4B5A70] cursor-not-allowed"
              />
              <Mail className="w-4 h-4 text-[#4B5A70] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="text-[10px] text-[#4B5A70] mt-1">
              L'email est géré de façon sécurisée par Firebase Auth.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E2A3A] mb-1.5">
              Niveau scolaire
            </label>
            <div className="relative">
              <select
                value={schoolGrade}
                onChange={(e) => setSchoolGrade(e.target.value)}
                className="w-full h-10 pl-9 pr-3.5 rounded-xl border border-[#E1E7F0] bg-[#F4F6FA] text-xs sm:text-sm text-[#1E2A3A] focus:bg-white focus:outline-none focus:border-[#5B8DEF] focus:ring-2 focus:ring-[#5B8DEF]/15 transition-all cursor-pointer"
              >
                <option value="Collège">Collège (6e - 3e)</option>
                <option value="Lycée">Lycée (2nde - Terminale)</option>
                <option value="Supérieur">Études supérieures / Prépa</option>
                <option value="Autre">Formation continue / Autre</option>
              </select>
              <GraduationCap className="w-4 h-4 text-[#4B5A70] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#5B8DEF] hover:bg-[#385DE8] text-white text-xs sm:text-sm font-heading font-semibold shadow-2xs hover:shadow-sm transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Enregistrement...' : 'Enregistrer les modifications'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
