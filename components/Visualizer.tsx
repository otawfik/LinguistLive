
import React from 'react';

const Visualizer: React.FC = () => {
  return (
    <div className="flex items-center gap-1 h-8">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div 
          key={i} 
          className="w-1 bg-indigo-500 rounded-full animate-bounce"
          style={{ 
            height: `${Math.random() * 100}%`,
            animationDuration: `${0.5 + Math.random()}s`
          }}
        ></div>
      ))}
    </div>
  );
};

export default Visualizer;
