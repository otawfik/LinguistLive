
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 glass border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
            <i className="fa-solid fa-microphone-lines text-white text-xl"></i>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            LinguistLive AI
          </span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <a href="#" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Courses</a>
          <a href="#" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Progress</a>
          <a href="#" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Community</a>
          <button className="bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-slate-800 transition-all">
            Get Pro
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
