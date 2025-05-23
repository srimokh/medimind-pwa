import React from 'react';

const guides = [
    { label: "The Monk", emoji: "🙏", desc: "Grounded in calm and presence" },
    { label: "The Stoic", emoji: "🪵", desc: "Steady, reasoned, and clear" },
    { label: "The Visionary", emoji: "🔮", desc: "Sees beyond what's visible" },
    { label: "The Analyst", emoji: "🧠", desc: "Thinks deeply and logically" },
    { label: "The Warrior", emoji: "⚔️", desc: "Strong, brave, and fierce" },
    { label: "The Healer", emoji: "💗", desc: "Compassionate and nurturing" },
    { label: "The Seeker", emoji: "🧭", desc: "Curious and ever-exploring" },
    { label: "The Alchemist", emoji: "⚗️", desc: "Turns pain into wisdom" },
    { label: "The Oracle", emoji: "🌀", desc: "Speaks from deep intuition" }

  ];
  
  
  

  function AvatarPicker({ onSelect }) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-2 sm:p-4">
        {guides.map((guide) => (
          <button
            key={guide.label}
            onClick={() => onSelect(guide)}
            className="bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800 text-white p-4 rounded-xl shadow-md transform hover:scale-105 transition-all hover:ring-2 hover:ring-indigo-500 group"
          >
            <div className="text-3xl mb-1 group-hover:animate-pulse">{guide.emoji}</div>
            <div className="text-base font-semibold">{guide.label}</div>
            <div className="text-xs text-gray-400 mt-1">{guide.desc}</div>
          </button>
        ))}
      </div>
    );
  }
  
  export default AvatarPicker;
  