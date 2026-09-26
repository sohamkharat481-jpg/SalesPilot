import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { COUNTRIES, Country, searchCountries, findCountryByIso } from '../../utils/countries';

interface CountrySelectorProps {
  selectedDialCode: string;
  selectedIso?: string;
  onSelect: (country: Country) => void;
  className?: string;
  disabled?: boolean;
}

export function CountrySelector({
  selectedDialCode,
  selectedIso,
  onSelect,
  className = '',
  disabled = false
}: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Find currently selected country
  const currentCountry = (selectedIso ? findCountryByIso(selectedIso) : null) ||
    COUNTRIES.find(c => c.dialCode === selectedDialCode) ||
    COUNTRIES[0];

  const filteredCountries = searchCountries(searchQuery);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            setSearchQuery('');
          }
        }}
        className="flex items-center gap-1.5 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
        title={`${currentCountry.name} (${currentCountry.dialCode})`}
      >
        <span className="text-base leading-none">{currentCountry.flag}</span>
        <span className="font-mono">{currentCountry.dialCode}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-72 max-w-[calc(100vw-2rem)] max-h-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95">
          {/* Search Bar */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search country or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* List of Countries */}
          <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 max-h-60">
            {filteredCountries.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No matching country found
              </div>
            ) : (
              filteredCountries.map((c) => {
                const isSelected = c.dialCode === currentCountry.dialCode && c.iso === currentCountry.iso;
                return (
                  <button
                    key={`${c.iso}-${c.dialCode}`}
                    type="button"
                    onClick={() => {
                      onSelect(c);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-blue-50 dark:hover:bg-slate-800/80 transition cursor-pointer text-xs ${
                      isSelected ? 'bg-blue-50/70 dark:bg-blue-900/20 font-semibold' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="text-base shrink-0">{c.flag}</span>
                      <span className="truncate text-slate-800 dark:text-slate-200">{c.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({c.iso})</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{c.dialCode}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
