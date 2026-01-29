
import React, { useState } from 'react';
import { SessionConfig, Language, Proficiency, Scenario } from '../types';

interface Props {
  onStart: (config: SessionConfig) => void;
}

const SessionSettings: React.FC<Props> = ({ onStart }) => {
  const [language, setLanguage] = useState<Language>(Language.SPANISH);
  const [proficiency, setProficiency] = useState<Proficiency>(Proficiency.BEGINNER);
  const [scenario, setScenario] = useState<Scenario>(Scenario.CASUAL);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart({ language, proficiency, scenario });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Language Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-700">I want to practice:</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(Language).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`flex items-center justify-center p-3 rounded-xl border-2 transition-all ${
                  language === lang 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' 
                    : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                }`}
              >
                <span className="text-sm font-medium">{lang}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Proficiency Level */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-700">My proficiency level:</label>
          <div className="space-y-2">
            {Object.values(Proficiency).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setProficiency(level)}
                className={`w-full flex items-center justify-between p-3 px-4 rounded-xl border-2 transition-all ${
                  proficiency === level 
                    ? 'border-violet-600 bg-violet-50 text-violet-700 shadow-sm' 
                    : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                }`}
              >
                <span className="text-sm font-medium">{level}</span>
                {proficiency === level && <i className="fa-solid fa-circle-check"></i>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scenario Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-slate-700">Scenario / Context:</label>
        <div className="flex flex-wrap gap-2">
          {Object.values(Scenario).map((scen) => (
            <button
              key={scen}
              type="button"
              onClick={() => setScenario(scen)}
              className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-all ${
                scenario === scen 
                  ? 'border-slate-900 bg-slate-900 text-white' 
                  : 'border-slate-100 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              {scen}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-lg"
      >
        <i className="fa-solid fa-bolt"></i>
        Start Speaking Now
      </button>
    </form>
  );
};

export default SessionSettings;
