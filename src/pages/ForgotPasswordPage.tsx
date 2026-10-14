import React, { useState } from 'react';
import { PageRoute } from '../types/revision';
import { useAuth } from '../contexts/AuthContext';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { QuiloMascot } from '../assets/QuiloMascot';

interface ForgotPasswordPageProps {
  onNavigate: (page: PageRoute) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Veuillez renseigner votre adresse email.');
      return;
    }

    try {
      setError(null);
      setLoading(true);
      await sendPasswordReset(email.trim());
      setIsSent(true);
    } catch (err: any) {
      console.error('Erreur réinitialisation:', err);
      if (err.code === 'auth/user-not-found') {
        setError('Aucun compte n’est associé à cette adresse email.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Format d’adresse email invalide.');
      } else {
        setError('Impossible d’envoyer le lien de réinitialisation. Veuillez réessayer.');
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
            Mot de passe oublié ?
          </h1>
          <p className="text-xs sm:text-sm text-[#4B5A70] mt-1.5">
            Entrez votre adresse email pour recevoir un lien de réinitialisation sécurisé
          </p>
        </div>

        {/* Card container */}
        <div className="bg-[#FFFFFF] border border-[#E1E7F0] rounded-2xl p-6 sm:p-8 shadow-xs">
          {isSent ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#75D6B0]/20 text-[#385DE8] mx-auto flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-[#75D6B0]" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-[#1E2A3A]">
                  Email envoyé avec succès !
                </h3>
                <p className="text-xs text-[#4B5A70] mt-2 leading-relaxed">
                  Consultez votre boîte de réception à l’adresse <strong>{email}</strong> et suivez les instructions pour choisir un nouveau mot de passe.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-[#5B8DEF] hover:bg-[#385DE8] text-white text-xs sm:text-sm font-heading font-semibold shadow-2xs transition-all cursor-pointer"
              >
                Retour à la connexion
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 p-3.5 bg-[#FFF0EE] border border-[#E8604C]/30 rounded-xl flex items-start gap-2.5 text-xs text-[#E8604C]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="flex-1 leading-relaxed">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1E2A3A] mb-1.5">
                    Adresse email du compte
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#5B8DEF] hover:bg-[#385DE8] text-white text-xs sm:text-sm font-heading font-semibold shadow-2xs hover:shadow-sm transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
                >
                  <span>{loading ? 'Envoi en cours...' : 'Envoyer le lien'}</span>
                </button>
              </form>
            </>
          )}
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4B5A70] hover:text-[#1E2A3A] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour à la connexion</span>
          </button>
        </div>
      </div>
    </div>
  );
};
