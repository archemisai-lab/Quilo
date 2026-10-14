import React, { useState } from 'react';
import { PageRoute } from '../types/revision';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User as UserIcon, AlertCircle, CheckCircle, GraduationCap } from 'lucide-react';
import { QuiloMascot } from '../assets/QuiloMascot';

interface RegisterPageProps {
  onNavigate: (page: PageRoute) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [grade, setGrade] = useState('Lycée');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Veuillez indiquer votre prénom ou nom.');
      return;
    }
    if (!email.trim()) {
      setError('Veuillez indiquer votre adresse email.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    try {
      setError(null);
      setLoading(true);
      await signUpWithEmail(email.trim(), password, name.trim(), grade);
      setIsSuccess(true);
    } catch (err: any) {
      console.error('Erreur inscription:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Cette adresse email est déjà associée à un compte.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Format d’adresse email invalide.');
      } else if (err.code === 'auth/weak-password') {
        setError('Le mot de passe est trop faible. Utilisez au moins 6 caractères variés.');
      } else {
        setError(err.message || 'Impossible de créer le compte. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setError(null);
      setLoading(true);
      await signInWithGoogle();
      onNavigate('my-sheets');
    } catch (err: any) {
      console.error('Erreur Google sign up:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Inscription Google interrompue. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-2 mb-3 rounded-2xl bg-white border border-[#E1E7F0] shadow-2xs">
            <QuiloMascot size={36} />
          </div>
          <h1 className="font-heading font-bold text-2xl text-[#1E2A3A] tracking-tight">
            Créer votre compte Quilo
          </h1>
          <p className="text-xs sm:text-sm text-[#4B5A70] mt-1.5">
            Vos fiches sauvegardées, sécurisées et accessibles sur tous vos appareils
          </p>
        </div>

        {/* Card container */}
        <div className="bg-[#FFFFFF] border border-[#E1E7F0] rounded-2xl p-6 sm:p-8 shadow-xs">
          {isSuccess ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#75D6B0]/20 text-[#385DE8] mx-auto flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-[#75D6B0]" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-[#1E2A3A]">
                  Compte créé avec succès !
                </h3>
                <p className="text-xs text-[#4B5A70] mt-2 leading-relaxed">
                  Un email de confirmation vous a été envoyé à <strong>{email}</strong>. Vous pouvez dès à présent accéder à votre espace de révision.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('my-sheets')}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-[#5B8DEF] hover:bg-[#385DE8] text-white text-xs sm:text-sm font-heading font-semibold shadow-2xs transition-all cursor-pointer"
              >
                Accéder à mes fiches
              </button>
            </div>
          ) : (
            <>
              {/* Error Banner */}
              {error && (
                <div className="mb-5 p-3.5 bg-[#FFF0EE] border border-[#E8604C]/30 rounded-xl flex items-start gap-2.5 text-xs text-[#E8604C]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="flex-1 leading-relaxed">{error}</p>
                </div>
              )}

              {/* Google Auth Button */}
              <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={loading}
                className="w-full h-11 flex items-center justify-center gap-3 px-4 rounded-xl border border-[#E1E7F0] bg-white hover:bg-[#F4F6FA] text-xs sm:text-sm font-semibold text-[#1E2A3A] transition-colors cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>S’inscrire avec Google</span>
              </button>

              {/* Subtle Divider */}
              <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E1E7F0]" />
                </div>
                <span className="relative px-3 bg-white text-[11px] font-medium text-[#4B5A70] uppercase tracking-wider">
                  ou avec votre email
                </span>
              </div>

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1E2A3A] mb-1.5">
                    Prénom ou Nom
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alexandre"
                      autoComplete="name"
                      required
                      className="w-full h-10 pl-9 pr-3.5 rounded-xl border border-[#E1E7F0] bg-[#F4F6FA] text-xs sm:text-sm text-[#1E2A3A] placeholder-[#4B5A70]/60 focus:bg-white focus:outline-none focus:border-[#5B8DEF] focus:ring-2 focus:ring-[#5B8DEF]/15 transition-all"
                    />
                    <UserIcon className="w-4 h-4 text-[#4B5A70] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1E2A3A] mb-1.5">
                    Niveau scolaire
                  </label>
                  <div className="relative">
                    <select
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
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

                <div>
                  <label className="block text-xs font-semibold text-[#1E2A3A] mb-1.5">
                    Adresse email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@exemple.fr"
                      autoComplete="email"
                      required
                      className="w-full h-10 pl-9 pr-3.5 rounded-xl border border-[#E1E7F0] bg-[#F4F6FA] text-xs sm:text-sm text-[#1E2A3A] placeholder-[#4B5A70]/60 focus:bg-white focus:outline-none focus:border-[#5B8DEF] focus:ring-2 focus:ring-[#5B8DEF]/15 transition-all"
                    />
                    <Mail className="w-4 h-4 text-[#4B5A70] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1E2A3A] mb-1.5">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 caractères"
                      autoComplete="new-password"
                      required
                      minLength={6}
                      className="w-full h-10 pl-9 pr-3.5 rounded-xl border border-[#E1E7F0] bg-[#F4F6FA] text-xs sm:text-sm text-[#1E2A3A] placeholder-[#4B5A70]/60 focus:bg-white focus:outline-none focus:border-[#5B8DEF] focus:ring-2 focus:ring-[#5B8DEF]/15 transition-all"
                    />
                    <Lock className="w-4 h-4 text-[#4B5A70] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <p className="text-[10px] text-[#4B5A70] mt-1">
                    Un email de vérification vous sera envoyé automatiquement.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#5B8DEF] hover:bg-[#385DE8] text-white text-xs sm:text-sm font-heading font-semibold shadow-2xs hover:shadow-sm transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
                >
                  <span>{loading ? 'Création en cours...' : 'Créer mon compte'}</span>
                </button>
              </form>
            </>
          )}
        </div>

        {/* Footer Link to Login */}
        <p className="text-center text-xs text-[#4B5A70] mt-6">
          Déjà un compte ?{' '}
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="font-semibold text-[#5B8DEF] hover:text-[#385DE8] transition-colors cursor-pointer"
          >
            Se connecter
          </button>
        </p>
      </div>
    </div>
  );
};
