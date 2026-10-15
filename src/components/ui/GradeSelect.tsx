import React, { useState, useRef, useEffect } from 'react';
import { GraduationCap, ChevronDown, Check } from 'lucide-react';

export interface GradeItem {
  id: string;
  name: string;
  category: 'Collège' | 'Lycée' | 'Supérieur' | 'Autre';
  hint: string;
}

export const GRADE_OPTIONS: GradeItem[] = [
  // Collège
  { id: '6ème', name: '6ème', category: 'Collège', hint: 'Cycle 3' },
  { id: '5ème', name: '5ème', category: 'Collège', hint: 'Cycle 4' },
  { id: '4ème', name: '4ème', category: 'Collège', hint: 'Cycle 4' },
  { id: '3ème', name: '3ème (Brevet)', category: 'Collège', hint: 'Diplôme National du Brevet' },
  // Lycée
  { id: 'Seconde', name: 'Seconde (2nde)', category: 'Lycée', hint: 'Détermination & tronc commun' },
  { id: 'Première', name: 'Première (1ère)', category: 'Lycée', hint: 'Spécialités & Épreuves anticipées' },
  { id: 'Terminale', name: 'Terminale', category: 'Lycée', hint: 'Baccalauréat & Parcoursup' },
  // Supérieur
  { id: 'Prépa (CPGE)', name: 'Prépa (CPGE)', category: 'Supérieur', hint: 'Classes préparatoires aux grandes écoles' },
  { id: 'Université', name: 'Université / Licence / Master', category: 'Supérieur', hint: 'L1, L2, L3, M1, M2' },
  { id: 'BTS / BUT', name: 'BTS / BUT', category: 'Supérieur', hint: 'Filières courtes & technologiques' },
  // Autre
  { id: 'Autre', name: 'Autre / Candidat libre', category: 'Autre', hint: 'Formation continue ou révisions libres' },
];

interface GradeSelectProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
}

export const GradeSelect: React.FC<GradeSelectProps> = ({
  value,
  onChange,
  id = 'grade-select',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

  // Find currently selected item or fallback
  const selectedItem =
    GRADE_OPTIONS.find((opt) => opt.id === value || opt.name === value) ||
    GRADE_OPTIONS.find((opt) => opt.category === value) ||
    GRADE_OPTIONS[6]; // default Terminale

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Group options by category
  const categories: Array<'Collège' | 'Lycée' | 'Supérieur' | 'Autre'> = [
    'Collège',
    'Lycée',
    'Supérieur',
    'Autre',
  ];

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full h-10 pl-9 pr-9 rounded-xl border text-left flex items-center justify-between text-xs sm:text-sm transition-all cursor-pointer select-none ${
          isOpen
            ? 'bg-white border-[#5B8DEF] ring-2 ring-[#5B8DEF]/15 text-[#1E2A3A]'
            : 'bg-[#F4F6FA] border-[#E1E7F0] text-[#1E2A3A] hover:border-[#5B8DEF]/50 hover:bg-white'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <span className="truncate flex items-center gap-2">
          <span className="font-medium text-[#1E2A3A]">{selectedItem.name}</span>
          <span className="hidden sm:inline-block text-[11px] text-[#4B5A70]/80">
            — {selectedItem.category}
          </span>
        </span>
      </button>

      {/* Left Icon */}
      <GraduationCap
        className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
          isOpen ? 'text-[#5B8DEF]' : 'text-[#4B5A70]'
        }`}
      />

      {/* Chevron Icon */}
      <ChevronDown
        className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#4B5A70] pointer-events-none transition-transform duration-200 ${
          isOpen ? 'rotate-180 text-[#5B8DEF]' : ''
        }`}
      />

      {/* Custom Dropdown Panel */}
      {isOpen && (
        <div
          ref={listboxRef}
          role="listbox"
          tabIndex={-1}
          className="absolute z-50 left-0 right-0 mt-1.5 max-h-72 overflow-y-auto rounded-xl bg-white border border-[#E1E7F0] shadow-lg py-1.5 focus:outline-none divide-y divide-[#E1E7F0]/60 animate-in fade-in-50 duration-150"
        >
          {categories.map((category) => {
            const categoryItems = GRADE_OPTIONS.filter((opt) => opt.category === category);
            if (categoryItems.length === 0) return null;

            return (
              <div key={category} className="py-1">
                {/* Section Header */}
                <div className="px-3 py-1 text-[10px] font-semibold tracking-wider text-[#4B5A70]/70 uppercase">
                  {category}
                </div>

                {/* Items */}
                <div className="space-y-0.5 px-1">
                  {categoryItems.map((item) => {
                    const isSelected =
                      selectedItem.id === item.id ||
                      value === item.id ||
                      value === item.name;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          onChange(item.name);
                          setIsOpen(false);
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between transition-colors cursor-pointer group ${
                          isSelected
                            ? 'bg-[#EFF4FE] text-[#1E2A3A] font-semibold'
                            : 'text-[#1E2A3A] hover:bg-[#F4F6FA]'
                        }`}
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="text-xs text-[#1E2A3A] group-hover:text-[#1E2A3A]">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-[#4B5A70] truncate">
                            {item.hint}
                          </span>
                        </div>

                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-[#5B8DEF] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
