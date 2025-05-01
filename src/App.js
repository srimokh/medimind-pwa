import { useState, useRef, useEffect } from "react";
import axios from "axios";

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const [query, setQuery] = useState("");
  const [history, setHistory] = useState([]);
  const [typingMsg, setTypingMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const samplePrompts = [
    "Is it normal to feel more anxious after starting Lexapro?",
    "Can I take Adderall and drink coffee?",
    "Why do I feel numb even though I’m on medication?",
    "How do I talk to my psychiatrist about switching meds?",
    "What’s the difference between burnout and depression?",
    "I want to feel focused without feeling wired. What helps?",
    "How can I tell if therapy is working for me?",
    "What are healthy ways to cope with racing thoughts?",
  ];

  const handleSearch = async (customQuery = null) => {
    const userMsg = customQuery || query;
    if (!userMsg.trim()) return;
    setHistory((prev) => [...prev, { sender: "user", text: userMsg }]);
    setQuery("");
    setTypingMsg("");
    setLoading(true);

    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "You are MediMind — a supportive AI therapist and medication guide. Be calm, clear, insightful, and human.",
            },
            { role: "user", content: userMsg },
          ],
          temperature: 0.6,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const fullMsg = response.data.choices[0].message.content.trim();
      let current = "";

      for (let i = 0; i < fullMsg.length; i++) {
        await new Promise((res) => setTimeout(res, 12));
        current += fullMsg[i];
        setTypingMsg(current);
      }

      setHistory((prev) => [...prev, { sender: "bot", text: fullMsg }]);
      setTypingMsg("");
    } catch (error) {
      setTypingMsg("");
      setHistory((prev) => [
        ...prev,
        { sender: "bot", text: "⚠️ Something went wrong. Please try again." },
      ]);
      console.error("API Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    setTypingMsg("");
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, typingMsg]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 flex items-center justify-center font-sans transition">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 shadow-xl rounded-2xl flex flex-col h-[90vh] border border-gray-100 dark:border-gray-700 relative">
        <header className="p-5 bg-white dark:bg-gray-900 border-b dark:border-gray-700 text-indigo-700 dark:text-indigo-300 text-xl font-semibold text-center shadow-sm relative">
          MediMind 🧠
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="absolute top-5 right-5 text-sm text-gray-500 dark:text-gray-300"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {history.length === 0 && !typingMsg && (
            <div className="text-center text-gray-600 dark:text-gray-300 mt-6">
              <h2 className="text-2xl font-semibold mb-2">Welcome to MediMind</h2>
              <p>Your supportive space for mental health and clarity.</p>
              <p className="text-sm text-gray-400 italic mt-4 mb-2">Try asking:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {samplePrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSearch(prompt)}
                    className="bg-gray-100 dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100 px-3 py-2 rounded-lg shadow-sm text-sm text-left transition w-full"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {history.map((msg, idx) => (
            <div
              key={idx}
              className={`max-w-xl px-4 py-3 rounded-xl shadow-sm ${
                msg.sender === "user"
                  ? "ml-auto bg-indigo-600 text-white"
                  : "mr-auto bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
              }`}
            >
              {msg.text}
            </div>
          ))}

          {typingMsg && (
            <div className="mr-auto bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 px-4 py-3 rounded-xl shadow-sm italic">
              {typingMsg}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="p-4 bg-white dark:bg-gray-900 border-t dark:border-gray-700 flex gap-2 items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything about your mind, meds, or mood..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
          >
            {loading ? "..." : "Send"}
          </button>
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-sm text-gray-400 hover:text-red-500"
              title="Clear conversation"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
