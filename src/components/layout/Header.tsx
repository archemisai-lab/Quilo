import React, { useState, useRef, useEffect } from 'react';
import { PageRoute } from '../../types/revision';
import { QuiloMascot } from '../../assets/QuiloMascot';
import { BookOpen, Plus, User as UserIcon, LogIn, LogOut, ChevronDown, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  currentPage: PageRoute;
  onNavigate: (page: PageRoute) => void;
  savedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onNavigate,
  savedCount,
}) => {
  const { user, profile, logOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isCreationActive =
    currentPage === 'upload' || currentPage === 'prompt' || currentPage === 'generating';
  const isMySheetsActive = currentPage === 'my-sheets';
  const isProfileActive = currentPage === 'profile';

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [dropdownOpen]);

  const handleLogoutClick = async () => {
    setDropdownOpen(false);
    try {
      await logOut();
      onNavigate('landing');
    } catch (err) {
      console.error('Erreur déconnexion:', err);
    }
  };

  const displayName = profile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Étudiant';
  const userInitial = displayName.charAt(0).toUpperCase() || 'Q';

  return (
    <header className="sticky top-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-xs border-b border-[#E1E7F0] no-print">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-13 flex items-center justify-between">
        {/* Brand identity: compact & sleek */}
        <button
          onClick={() => onNavigate(user ? 'my-sheets' : 'landing')}
          className="flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B8DEF] rounded-md transition-opacity cursor-pointer"
          aria-label="Accueil Quilo"
        >
          <QuiloMascot size={28} />
          <span className="font-heading font-bold text-lg text-[#1E2A3A] group-hover:text-[#385DE8] transition-colors tracking-tight">
            Quilo
          </span>
        </button>

        {/* Navigation & Actions */}
        <nav className="flex items-center gap-1.5 sm:gap-2">
          {user ? (
            <>
              {/* Secondary Nav: Mes fiches (only for logged-in user) */}
              <button
                onClick={() => onNavigate('my-sheets')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#5B8DEF] ${
                  isMySheetsActive
                    ? 'text-[#1E2A3A] bg-[#F4F6FA] font-semibold'
                    : 'text-[#4B5A70] hover:text-[#1E2A3A] hover:bg-[#F4F6FA]'
                }`}
              >
                <BookOpen className={`w-3.5 h-3.5 ${isMySheetsActive ? 'text-[#385DE8]' : 'text-[#4B5A70]'}`} />
                <span className="hidden xs:inline">Mes fiches</span>
                {savedCount > 0 && (
                  <span
                    className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold leading-none ${
                      isMySheetsActive
                        ? 'bg-[#5B8DEF] text-white'
                        : 'bg-[#E1E7F0] text-[#1E2A3A]'
                    }`}
                  >
                    {savedCount}
                  </span>
                )}
              </button>

              {/* Divider */}
              <div className="h-3.5 w-px bg-[#E1E7F0] mx-0.5" />

              {/* User Profile Button */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={`flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-md text-xs font-medium transition-colors cursor-pointer border ${
                    isProfileActive || dropdownOpen
                      ? 'border-[#5B8DEF] bg-[#F4F6FA] text-[#1E2A3A]'
                      : 'border-transparent text-[#4B5A70] hover:text-[#1E2A3A] hover:bg-[#F4F6FA]'
                  }`}
                  title="Mon profil et compte"
                >
                  <div className="w-6 h-6 rounded-full bg-[#5B8DEF] text-white flex items-center justify-center text-[11px] font-bold uppercase shadow-2xs">
                    {userInitial}
                  </div>
                  <span className="hidden sm:inline max-w-[90px] truncate text-xs font-semibold">
                    {displayName}
                  </span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>

                {/* Profile Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-52 bg-white border border-[#E1E7F0] rounded-xl shadow-lg p-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-3 py-2 border-b border-[#E1E7F0] mb-1">
                      <p className="font-heading font-bold text-xs text-[#1E2A3A] truncate">
                        {displayName}
                      </p>
                      <p className="text-[11px] text-[#4B5A70] truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onNavigate('profile');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[#1E2A3A] hover:bg-[#F4F6FA] transition-colors cursor-pointer text-left"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-[#5B8DEF]" />
                      <span>Mon profil</span>
                    </button>

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onNavigate('my-sheets');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[#1E2A3A] hover:bg-[#F4F6FA] transition-colors cursor-pointer text-left"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-[#5B8DEF]" />
                      <span>Mes fiches ({savedCount})</span>
                    </button>

                    <div className="my-1 border-t border-[#E1E7F0]" />

                    <button
                      onClick={handleLogoutClick}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[#E8604C] hover:bg-[#FFF0EE] transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Se déconnecter</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Action Button: Créer une fiche */}
              <button
                onClick={() => onNavigate('upload')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#5B8DEF] ${
                  isCreationActive
                    ? 'bg-[#385DE8] text-white shadow-2xs'
                    : 'bg-[#5B8DEF] hover:bg-[#385DE8] text-white shadow-2xs active:scale-[0.98]'
                }`}
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">Créer une fiche</span>
                <span className="sm:hidden">Créer</span>
              </button>
            </>
          ) : (
            <>
              {/* Not logged in: Show Login & Signup buttons */}
              <button
                onClick={() => onNavigate('login')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  currentPage === 'login'
                    ? 'text-[#1E2A3A] bg-[#F4F6FA] font-semibold'
                    : 'text-[#4B5A70] hover:text-[#1E2A3A] hover:bg-[#F4F6FA]'
                }`}
              >
                <LogIn className="w-3.5 h-3.5 text-[#5B8DEF]" />
                <span>Connexion</span>
              </button>

              <button
                onClick={() => onNavigate('register')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-[#5B8DEF] hover:bg-[#385DE8] text-white shadow-2xs transition-all cursor-pointer active:scale-[0.98]"
              >
                <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>S'inscrire</span>
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
