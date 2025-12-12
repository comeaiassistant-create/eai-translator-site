import React, { useState } from 'react';
import { Copy, Volume2, X } from 'lucide-react';
import { translateText, generateSpeech } from '../services/geminiService';
import LanguageSelector from './LanguageSelector';
import { SUPPORTED_LANGUAGES } from '../constants';

const TextMode: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<{ text: string; lang: string } | null>(null);
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('en');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    try {
      const data = await translateText(inputText, targetLang, sourceLang);
      setResult({ text: data.translatedText, lang: data.detectedLanguage });
    } catch (error) {
      alert("Translation failed. Please check your API key or connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = async (text: string) => {
    if (isPlaying || !text) return;
    try {
      setIsPlaying(true);
      const audioBuffer = await generateSpeech(text);
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createBufferSource();
      audioContext.decodeAudioData(audioBuffer, (buffer) => {
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start(0);
        source.onended = () => setIsPlaying(false);
      });
    } catch (e) {
      console.error(e);
      setIsPlaying(false);
      // Fallback to browser TTS
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full">
      <LanguageSelector 
        sourceLang={sourceLang} 
        setSourceLang={setSourceLang} 
        targetLang={targetLang} 
        setTargetLang={setTargetLang} 
      />

      <div className="flex-1 flex flex-col gap-4 overflow-y-auto no-scrollbar pb-24">
        {/* Input Card */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100 relative group">
           <textarea
            className="w-full h-32 md:h-40 resize-none outline-none text-lg text-gray-800 placeholder-gray-400 bg-transparent"
            placeholder="Enter text to translate..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          {inputText && (
            <button 
              onClick={() => setInputText('')}
              className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full"
            >
              <X size={16} />
            </button>
          )}
          <div className="flex justify-between items-center mt-2 border-t pt-2 border-gray-50">
             <span className="text-xs text-gray-400">{inputText.length} chars</span>
             <button
                onClick={handleTranslate}
                disabled={!inputText.trim() || isLoading}
                className="bg-primary text-white px-6 py-2 rounded-full font-medium shadow-lg shadow-indigo-200 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none"
             >
               {isLoading ? 'Translating...' : 'Translate'}
             </button>
          </div>
        </div>

        {/* Result Card */}
        {result && (
           <div className="bg-indigo-50 rounded-2xl shadow-inner p-5 border border-indigo-100">
             <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">
                  {SUPPORTED_LANGUAGES.find(l => l.code === targetLang)?.name}
                </span>
                <div className="flex gap-2">
                   <button 
                    onClick={() => handleSpeak(result.text)}
                    className={`p-2 rounded-full ${isPlaying ? 'bg-indigo-200 text-indigo-700' : 'bg-white text-gray-500 hover:text-indigo-600'} transition-colors shadow-sm`}
                   >
                     <Volume2 size={18} />
                   </button>
                   <button 
                    onClick={() => navigator.clipboard.writeText(result.text)}
                    className="p-2 rounded-full bg-white text-gray-500 hover:text-indigo-600 transition-colors shadow-sm"
                   >
                     <Copy size={18} />
                   </button>
                </div>
             </div>
             <p className="text-xl text-indigo-900 leading-relaxed font-medium">
               {result.text}
             </p>
             {result.lang && result.lang !== 'Unknown' && (
                <p className="mt-4 text-xs text-indigo-400">
                   Detected: {result.lang}
                </p>
             )}
           </div>
        )}
      </div>
    </div>
  );
};

export default TextMode;
