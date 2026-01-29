
import React, { useState } from 'react';
import Header from './components/Header';
import SessionSettings from './components/SessionSettings';
import ConversationInterface from './components/ConversationInterface';
import { SessionConfig, Language, Proficiency, Scenario } from './types';

const App: React.FC = () => {
  const [config, setConfig] = useState<SessionConfig | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);

  const handleStartSession = (newConfig: SessionConfig) => {
    setConfig(newConfig);
    setIsSessionActive(true);
  };

  const handleEndSession = () => {
    setIsSessionActive(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center p-4 md:p-8">
        {!isSessionActive ? (
          <div className="w-full max-w-2xl animate-in fade-in duration-700">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight mb-3">
                Master a New Language
              </h1>
              <p className="text-lg text-slate-600">
                Practice real-time conversations with your AI language coach.
              </p>
            </div>
            <SessionSettings onStart={handleStartSession} />
          </div>
        ) : (
          config && (
            <ConversationInterface 
              config={config} 
              onEnd={handleEndSession} 
            />
          )
        )}
      </main>
      <footer className="p-6 text-center text-slate-400 text-sm">
        &copy; {new Date().getFullYear()} LinguistLive AI. Powered by Gemini 2.5 Flash.
      </footer>
    </div>
  );
};

export default App;
