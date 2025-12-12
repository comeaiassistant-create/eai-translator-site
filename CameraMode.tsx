import React, { useRef, useState, useCallback } from 'react';
import { Camera, Image as ImageIcon, RotateCcw, Check, X } from 'lucide-react';
import { processImageOrFile } from '../services/geminiService';
import LanguageSelector from './LanguageSelector';

const CameraMode: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ original: string; translated: string } | null>(null);
  
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('en');

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera Error:", err);
      alert("Unable to access camera.");
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result as string);
        stopCamera(); // Ensure camera is off if we pick a file
      };
      reader.readAsDataURL(file);
    }
  };

  const processCapturedImage = async () => {
    if (!capturedImage) return;
    setIsProcessing(true);
    try {
      // Remove header "data:image/jpeg;base64,"
      const base64 = capturedImage.split(',')[1];
      const mimeType = capturedImage.split(';')[0].split(':')[1];
      
      const data = await processImageOrFile(base64, mimeType, targetLang);
      setResult({ original: data.originalText, translated: data.translatedText });
    } catch (error) {
      alert("Failed to process image.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setCapturedImage(null);
    setResult(null);
    startCamera();
  };

  // Start camera on mount
  React.useEffect(() => {
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col h-full bg-black relative rounded-xl overflow-hidden">
      
      {/* Top Controls Overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/70 to-transparent">
        <LanguageSelector 
           sourceLang={sourceLang}
           setSourceLang={setSourceLang}
           targetLang={targetLang}
           setTargetLang={setTargetLang}
        />
      </div>

      {/* Main Viewport */}
      <div className="flex-1 relative flex items-center justify-center bg-gray-900 overflow-hidden">
        
        {/* Camera Preview */}
        {!capturedImage && (
             <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
             />
        )}

        {/* Captured Image Preview */}
        {capturedImage && (
            <img 
                src={capturedImage} 
                alt="Captured" 
                className="w-full h-full object-contain bg-black"
            />
        )}
        
        <canvas ref={canvasRef} className="hidden" />

        {/* Scanning Overlay (Animation) */}
        {!capturedImage && stream && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-white/50 rounded-lg relative">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-green-400 shadow-[0_0_10px_#4ade80] animate-[scan_2s_ease-in-out_infinite]"></div>
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-white -mt-1 -ml-1"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-white -mt-1 -mr-1"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-white -mb-1 -ml-1"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-white -mb-1 -mr-1"></div>
                </div>
            </div>
        )}
        
        {/* Style for scan animation */}
        <style>{`
            @keyframes scan {
                0%, 100% { top: 0%; opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { top: 100%; opacity: 0; }
            }
        `}</style>
      </div>

      {/* Bottom Result Sheet */}
      {result && (
         <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 z-30 max-h-[60%] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800">Results</h3>
                <button onClick={() => setResult(null)} className="p-1 hover:bg-gray-100 rounded-full"><X size={20}/></button>
            </div>
            <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase mb-1">Detected Text</p>
                    <p className="text-sm text-gray-800">{result.original}</p>
                </div>
                <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                    <p className="text-xs text-indigo-400 uppercase mb-1">Translation</p>
                    <p className="text-lg text-indigo-900 font-medium">{result.translated}</p>
                </div>
            </div>
         </div>
      )}

      {/* Bottom Controls */}
      <div className="bg-black p-6 pb-24 flex justify-around items-center">
         {capturedImage ? (
            <>
               <button onClick={reset} className="p-4 bg-gray-800 rounded-full text-white hover:bg-gray-700">
                  <RotateCcw />
               </button>
               {!result && (
                   <button 
                    onClick={processCapturedImage} 
                    disabled={isProcessing}
                    className="px-8 py-3 bg-primary rounded-full text-white font-bold hover:bg-indigo-500 flex items-center gap-2"
                   >
                     {isProcessing ? 'Scanning...' : 'Translate'} 
                     {!isProcessing && <Check size={18} />}
                   </button>
               )}
            </>
         ) : (
            <>
               <button 
                onClick={() => fileInputRef.current?.click()} 
                className="p-4 bg-gray-800 rounded-full text-white hover:bg-gray-700"
               >
                 <ImageIcon />
               </button>
               <input 
                 type="file" 
                 accept="image/*" 
                 className="hidden" 
                 ref={fileInputRef}
                 onChange={handleFileUpload}
               />
               
               <button 
                onClick={capturePhoto} 
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/20 active:bg-white/40 transition-colors"
               >
                 <div className="w-16 h-16 bg-white rounded-full"></div>
               </button>

               <div className="w-14"></div> {/* Spacer for symmetry */}
            </>
         )}
      </div>
    </div>
  );
};

export default CameraMode;
