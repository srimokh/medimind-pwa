// components/JourneyMap.js
import React from "react";

const zones = [
  {
    label: "Forest of Overthinking",
    emoji: "🌲",
    desc: "Where thoughts loop and clarity is rare."
  },
  {
    label: "Sea of Uncertainty",
    emoji: "🌊",
    desc: "Where you drift in the unknown."
  },
  {
    label: "Volcano of Emotion",
    emoji: "🔥",
    desc: "Where feelings erupt — intense and raw."
  },
  {
    label: "Glacier of Stillness",
    emoji: "❄️",
    desc: "Where everything slows down to reflect."
  },
  {
    label: "Cosmic Reflection Zone",
    emoji: "🌌",
    desc: "Where you glimpse your bigger truth."
  },
  {
    label: "Temple of Insight",
    emoji: "🏛️",
    desc: "Where wisdom dawns in silence."
  }
];

export default function JourneyMap({ onSelectZone }) {
    return (
      <div className="p-2 sm:p-6 text-center">
        <h2 className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 mb-4">
          Choose Your Next Path
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {zones.map((zone) => (
            <button
              key={zone.label}
              onClick={() => onSelectZone(zone)}
              className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:bg-indigo-50 dark:hover:bg-indigo-700 transition"
            >
              <span className="text-3xl mb-2">{zone.emoji}</span>
              <h3 className="text-base font-semibold">{zone.label}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-300">{zone.desc}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }
  
