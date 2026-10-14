import React, { useState } from 'react';
import { PageRoute } from '../types/revision';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, ArrowRight, AlertCircle, LogIn, Check } from 'lucide-react';
import { QuiloMascot } from '../assets/QuiloMascot';

interface LoginPageProps {
  onNavigate: (page: PageRoute) => void;
  onSuccessRedirect?: PageRoute;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigate,
  onSuccessRedirect = 'my-sheets',
}) => {
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Veuillez renseigner votre adresse email et votre mot de passe.');
      return;
    }

    try {
      setError(null);
      setLoading(true);
      await signInWithEmail(email.trim(), password);
      onNavigate(onSuccessRedirect);
    } catch (err: any) {
      console.error('Erreur connexion:', err);
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password'
      ) {
        setError('Adresse email ou mot de passe incorrect.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Trop de tentatives infructueuses. Veuillez patienter un instant.');
      } else {
        setError(err.message || 'Impossible de se connecter. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setLoading(true);
      await signInWithGoogle();
      onNavigate(onSuccessRedirect);
    } catch (err: any) {
      console.error('Erreur Google login:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Connexion avec Google interrompue. Veuillez réessayer.');
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
            Bon retour sur Quilo
          </h1>
          <p className="text-xs sm:text-sm text-[#4B5A70] mt-1.5">
            Connectez-vous pour retrouver vos fiches synchronisées partout
          </p>
        </div>

        {/* Card container */}
        <div className="bg-[#FFFFFF] border border-[#E1E7F0] rounded-2xl p-6 sm:p-8 shadow-xs">
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
            onClick={handleGoogleSignIn}
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
            <span>Continuer avec Google</span>
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

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1E2A3A] mb-1.5">
                Adresse email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@exemple.fr"
                  autoComplete="email"
                  required
                  className="w-full h-10 pl-9 pr-3.5 rounded-xl border border-[#E1E7F0] bg-[#F4F6FA] text-xs sm:text-sm text-[#1E2A3A] placeholder-[#4B5A70]/60 focus:bg-white focus:outline-none focus:border-[#5B8DEF] focus:ring-2 focus:ring-[#5B8DEF]/15 transition-all"
                />
                <Mail className="w-4 h-4 text-[#4B5A70] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#1E2A3A]">
                  Mot de passe
                </label>
                <button
                  type="button"
                  onClick={() => onNavigate('forgot-password')}
                  className="text-[11px] font-medium text-[#5B8DEF] hover:text-[#385DE8] transition-colors cursor-pointer"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full h-10 pl-9 pr-3.5 rounded-xl border border-[#E1E7F0] bg-[#F4F6FA] text-xs sm:text-sm text-[#1E2A3A] placeholder-[#4B5A70]/60 focus:bg-white focus:outline-none focus:border-[#5B8DEF] focus:ring-2 focus:ring-[#5B8DEF]/15 transition-all"
                />
                <Lock className="w-4 h-4 text-[#4B5A70] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#5B8DEF] hover:bg-[#385DE8] text-white text-xs sm:text-sm font-heading font-semibold shadow-2xs hover:shadow-sm transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Connexion en cours...' : 'Se connecter'}</span>
            </button>
          </form>
        </div>

        {/* Footer Link to Register */}
        <p className="text-center text-xs text-[#4B5A70] mt-6">
          Pas encore de compte ?{' '}
          <button
            type="button"
            onClick={() => onNavigate('register')}
            className="font-semibold text-[#5B8DEF] hover:text-[#385DE8] transition-colors cursor-pointer"
          >
            Créer un compte gratuitement
          </button>
        </p>
      </div>
    </div>
  );
};
