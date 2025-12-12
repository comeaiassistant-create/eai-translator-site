import React, { useState } from 'react';
import { Type, Mic, Camera, FileText, Settings as SettingsIcon } from 'lucide-react';
import { AppMode } from './types';
import TextMode from './components/TextMode';
import VoiceMode from './components/VoiceMode';
import CameraMode from './components/CameraMode';
import FileMode from './components/FileMode';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.TEXT);

  const renderContent = () => {
    switch (mode) {
      case AppMode.TEXT:
        return <TextMode />;
      case AppMode.VOICE:
        return <VoiceMode />;
      case AppMode.CAMERA:
        return <CameraMode />;
      case AppMode.FILES:
        return <FileMode />;
      case AppMode.SETTINGS:
        return (
            <div className="p-6 text-center text-gray-500">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Settings</h2>
                <p>App Version: 1.0.0 (Web)</p>
                <p className="mt-4 text-sm">Powered by Google Gemini 2.5</p>
                <div className="mt-8 p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm text-left">
                    <strong>Note:</strong> This is a React Web application simulating the requested Android features.
                    <ul className="list-disc ml-5 mt-2 space-y-1">
                        <li>Camera uses WebRTC (browser webcam).</li>
                        <li>Voice uses MediaRecorder API.</li>
                        <li>Translation uses Google GenAI SDK.</li>
                    </ul>
                </div>
            </div>
        );
      default:
        return <TextMode />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
             S
           </div>
           <h1 className="text-lg font-bold text-gray-800 tracking-tight">Super Translator</h1>
        </div>
        <button onClick={() => setMode(AppMode.SETTINGS)} className="text-gray-400 hover:text-gray-600 transition-colors">
            <SettingsIcon size={20} />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
         <div className="h-full w-full max-w-lg mx-auto md:max-w-4xl p-4 md:p-6">
            {renderContent()}
         </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 pb-safe pt-2 px-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
         <div className="flex justify-around items-center max-w-lg mx-auto">
            <TabButton 
                active={mode === AppMode.TEXT} 
                onClick={() => setMode(AppMode.TEXT)} 
                icon={<Type size={20} />} 
                label="Text" 
            />
            <TabButton 
                active={mode === AppMode.VOICE} 
                onClick={() => setMode(AppMode.VOICE)} 
                icon={<Mic size={20} />} 
                label="Voice" 
            />
            <div className="relative -top-5">
                <button 
                    onClick={() => setMode(AppMode.CAMERA)}
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${mode === AppMode.CAMERA ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' : 'bg-white text-indigo-600 border border-indigo-100'}`}
                >
                    <Camera size={24} />
                </button>
            </div>
            <TabButton 
                active={mode === AppMode.FILES} 
                onClick={() => setMode(AppMode.FILES)} 
                icon={<FileText size={20} />} 
                label="Files" 
            />
         </div>
      </nav>
      
      <style>{`
        .pb-safe {
            padding-bottom: env(safe-area-inset-bottom, 20px);
        }
      `}</style>
    </div>
  );
};

interface TabButtonProps {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon, label }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center gap-1 p-2 w-16 transition-colors ${active ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
    >
        {icon}
        <span className="text-[10px] font-medium">{label}</span>
    </button>
);

export default App;
