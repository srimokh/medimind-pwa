import React from 'react';

const guides = [
    { label: "The Monk", emoji: "🙏" },
    { label: "The Stoic", emoji: "🪵" },
    { label: "The Visionary", emoji: "🔮" },
    { label: "The Analyst", emoji: "🧠" },
    { label: "The Warrior", emoji: "⚔️" },
    { label: "The Healer", emoji: "💗" },
    { label: "The Seeker", emoji: "🧭" },
    { label: "The Alchemist", emoji: "⚗️" }
  ];
  
  

function AvatarPicker({ onSelect }) {
    return (
        <div className="flex flex-wrap justify-center gap-4">
            {guides.map((guide) => (
                <button
                    key={guide.label}
                    onClick={() => onSelect(guide)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-indigo-100 dark:hover:bg-indigo-700 text-gray-800 dark:text-white rounded-lg shadow-sm text-sm"
                >
                    <span className="text-lg">{guide.emoji}</span>
                    {guide.label}
                </button>
            ))}
        </div>
    );
}

export default AvatarPicker;