import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, Volume2 } from 'lucide-react';
import { processAudio, generateSpeech } from '../services/geminiService';
import { MAX_RECORDING_TIME_MS } from '../constants';
import LanguageSelector from './LanguageSelector';

const VoiceMode: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(MAX_RECORDING_TIME_MS / 1000);
  const [transcription, setTranscription] = useState('');
  const [translation, setTranslation] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('es');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' }); // Chrome default
        handleAudioUpload(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTimeLeft(60);

      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err) {
      console.error("Mic Error:", err);
      alert("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleAudioUpload = async (blob: Blob) => {
    setIsProcessing(true);
    setTranscription('');
    setTranslation('');
    try {
      const result = await processAudio(blob, targetLang);
      setTranscription(result.transcription);
      setTranslation(result.translation);
      
      // Auto-play translation
      if (result.translation) {
         try {
             const audioBuffer = await generateSpeech(result.translation);
             const ctx = new AudioContext();
             const src = ctx.createBufferSource();
             ctx.decodeAudioData(audioBuffer, (decoded) => {
                 src.buffer = decoded;
                 src.connect(ctx.destination);
                 src.start(0);
             });
         } catch(e) {
             console.warn("TTS Failed, using system default");
             const u = new SpeechSynthesisUtterance(result.translation);
             window.speechSynthesis.speak(u);
         }
      }

    } catch (error) {
      alert("Failed to process audio.");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
      return () => {
          if (timerRef.current) clearInterval(timerRef.current);
      }
  }, []);

  return (
    <div className="flex flex-col h-full items-center w-full max-w-2xl mx-auto">
      <LanguageSelector 
        sourceLang={sourceLang} 
        setSourceLang={setSourceLang} 
        targetLang={targetLang} 
        setTargetLang={setTargetLang} 
        disableAuto={true} // Audio usually needs a hint, but Gemini is smart.
      />

      <div className="flex-1 flex flex-col justify-center items-center w-full space-y-8 pb-20">
        
        {/* Visualization / Timer Circle */}
        <div className="relative">
            <div className={`w-40 h-40 rounded-full flex items-center justify-center transition-all duration-500 ${isRecording ? 'bg-red-50 shadow-[0_0_40px_rgba(239,68,68,0.3)]' : 'bg-gray-50'}`}>
                {isRecording ? (
                     <div className="text-4xl font-mono font-bold text-red-500">{timeLeft}s</div>
                ) : (
                    <Mic size={64} className="text-gray-300" />
                )}
            </div>
            {/* Pulse Ring */}
            {isRecording && (
                <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-red-500 animate-ping opacity-20"></div>
            )}
        </div>

        {/* Control Button */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90 ${
              isRecording 
              ? 'bg-red-500 text-white hover:bg-red-600' 
              : 'bg-primary text-white hover:bg-indigo-600'
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isProcessing ? (
              <Loader2 className="animate-spin" />
          ) : isRecording ? (
              <Square fill="currentColor" size={24} />
          ) : (
              <Mic size={32} />
          )}
        </button>

        <p className="text-gray-400 text-sm">
            {isProcessing ? 'Processing audio...' : isRecording ? 'Tap to stop' : 'Tap to start recording (max 60s)'}
        </p>

        {/* Results */}
        {(transcription || translation) && (
            <div className="w-full bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Transcription</h3>
                    <p className="text-gray-700 italic">"{transcription}"</p>
                </div>
                <div className="border-t border-gray-100 pt-4">
                     <div className="flex justify-between items-center mb-1">
                        <h3 className="text-xs font-bold text-primary uppercase">Translation</h3>
                        <Volume2 size={16} className="text-primary cursor-pointer" onClick={() => {
                            const u = new SpeechSynthesisUtterance(translation);
                            window.speechSynthesis.speak(u);
                        }}/>
                     </div>
                    <p className="text-xl text-primary font-medium">{translation}</p>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default VoiceMode;
