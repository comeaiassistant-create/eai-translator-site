import React, { useState } from 'react';
import { FileText, Upload, File as FileIcon, X, CheckCircle } from 'lucide-react';
import { blobToBase64, processImageOrFile } from '../services/geminiService';
import LanguageSelector from './LanguageSelector';

const FileMode: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ original: string; translated: string } | null>(null);
  const [targetLang, setTargetLang] = useState('en');
  // Files don't strictly need source lang setting as the model extracts it, but UI consistency is good.
  const [sourceLang, setSourceLang] = useState('auto'); 

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleTranslate = async () => {
    if (!file) return;
    
    // Check file size (limit to ~4MB for browser safety with base64)
    if (file.size > 4 * 1024 * 1024) {
        alert("File is too large. Please choose a file under 4MB.");
        return;
    }

    setIsProcessing(true);
    try {
      const base64 = await blobToBase64(file);
      const data = await processImageOrFile(base64, file.type, targetLang, true);
      setResult({ original: data.originalText, translated: data.translatedText });
    } catch (error) {
      alert("Failed to process file. Ensure it is a valid PDF or Image.");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full px-4">
      <LanguageSelector 
        sourceLang={sourceLang}
        setSourceLang={setSourceLang}
        targetLang={targetLang}
        setTargetLang={setTargetLang}
        disableAuto={true}
      />

      <div className="flex-1 flex flex-col gap-6 overflow-y-auto no-scrollbar pb-24">
        
        {/* Upload Area */}
        <div className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-colors ${file ? 'border-primary bg-indigo-50/50' : 'border-gray-300 bg-gray-50'}`}>
           {!file ? (
              <>
                <div className="w-16 h-16 bg-indigo-100 text-primary rounded-full flex items-center justify-center mb-4">
                    <Upload size={32} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Upload Document</h3>
                <p className="text-sm text-gray-500 mb-4 text-center">PDF, PNG, JPG supported up to 4MB</p>
                <label className="bg-primary text-white px-6 py-2 rounded-full cursor-pointer hover:bg-indigo-600 transition-colors shadow-sm font-medium">
                    Choose File
                    <input type="file" className="hidden" accept=".pdf,image/png,image/jpeg" onChange={handleFileChange} />
                </label>
              </>
           ) : (
              <div className="w-full flex items-center justify-between p-2">
                  <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-3 bg-white rounded-lg shadow-sm text-primary">
                          <FileIcon size={24} />
                      </div>
                      <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                  </div>
                  <button onClick={() => setFile(null)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                      <X size={20} />
                  </button>
              </div>
           )}
        </div>

        {/* Action Button */}
        {file && !result && (
            <button 
                onClick={handleTranslate}
                disabled={isProcessing}
                className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-200 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
                {isProcessing ? 'Analyzing Document...' : 'Translate File'}
            </button>
        )}

        {/* Results */}
        {result && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-green-50 p-4 border-b border-green-100 flex items-center gap-2 text-green-700">
                    <CheckCircle size={20} />
                    <span className="font-medium">Translation Complete</span>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Original Summary / Content</h4>
                        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto p-2 bg-gray-50 rounded-lg">{result.original}</p>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-primary uppercase mb-2">Translation ({targetLang})</h4>
                        <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">{result.translated}</p>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default FileMode;
