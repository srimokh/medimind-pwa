import React from "react";

export default function JourneyIntro({ onBegin }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-4 sm:p-10 w-full">

      <h1 className="text-3xl font-bold text-indigo-700 dark:text-indigo-300 mb-4">Welcome to MediMind Journey</h1>
      <p className="text-gray-700 dark:text-gray-300 text-lg mb-6 max-w-md">
        This is your interactive path toward clarity and connection. 
        Step by step, you'll discover tools to support your emotional world, guided by a AI companion.
      </p>

      <ul className="text-left text-gray-600 dark:text-gray-300 mb-6 space-y-2">
        <li>✅ Choose your guide</li>
        <li>✅ Set your starting mood</li>
        <li>✅ Engage in mindful dialogue</li>
        <li>✅ Unlock reflections and future echoes</li>
        <li>✅ Complete your journey for the day</li>
      </ul>

      <button
        onClick={onBegin}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg text-lg font-semibold shadow-md transition"
      >
        Begin Your Journey
      </button>
    </div>
  );
}
