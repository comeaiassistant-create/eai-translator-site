import React from 'react';
import { SUPPORTED_LANGUAGES } from '../constants';
import { ArrowRightLeft } from 'lucide-react';

interface LanguageSelectorProps {
  sourceLang: string;
  targetLang: string;
  setSourceLang: (lang: string) => void;
  setTargetLang: (lang: string) => void;
  disableAuto?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  sourceLang,
  targetLang,
  setSourceLang,
  setTargetLang,
  disableAuto = false,
}) => {
  
  const swapLanguages = () => {
    if (sourceLang === 'auto') return;
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
  };

  return (
    <div className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-4">
      <select
        value={sourceLang}
        onChange={(e) => setSourceLang(e.target.value)}
        className="bg-transparent font-medium text-gray-700 outline-none max-w-[40%] text-sm truncate"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option 
            key={`source-${lang.code}`} 
            value={lang.code}
            disabled={disableAuto && lang.code === 'auto'}
          >
            {lang.name}
          </option>
        ))}
      </select>

      <button 
        onClick={swapLanguages}
        disabled={sourceLang === 'auto'}
        className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${sourceLang === 'auto' ? 'opacity-30 cursor-not-allowed' : 'text-primary'}`}
      >
        <ArrowRightLeft size={18} />
      </button>

      <select
        value={targetLang}
        onChange={(e) => setTargetLang(e.target.value)}
        className="bg-transparent font-medium text-primary outline-none max-w-[40%] text-sm truncate text-right"
      >
        {SUPPORTED_LANGUAGES.filter(l => l.code !== 'auto').map((lang) => (
          <option key={`target-${lang.code}`} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;
