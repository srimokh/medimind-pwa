import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

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
  const [typingMsg, setTypingMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // 🧠 Sessions logic
  const [sessions, setSessions] = useState(() => {
    const stored = localStorage.getItem("medimind_sessions");
    return stored ? JSON.parse(stored) : [{ id: uuidv4(), name: "Session 1", history: [] }];
  });
  const [activeSessionId, setActiveSessionId] = useState(sessions[0].id);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const setHistory = (newHistory) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId ? { ...s, history: newHistory } : s
      )
    );
  };

  // 💾 Save sessions to localStorage
  useEffect(() => {
    localStorage.setItem("medimind_sessions", JSON.stringify(sessions));
  }, [sessions]);

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

    setSessions((prevSessions) =>
      prevSessions.map((session) =>
        session.id === activeSessionId
          ? {
              ...session,
              history: [...session.history, { sender: "user", text: userMsg }],
            }
          : session
      )
    );

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

      setSessions((prevSessions) =>
        prevSessions.map((session) =>
          session.id === activeSessionId
            ? {
                ...session,
                history: [...session.history, { sender: "bot", text: fullMsg }],
              }
            : session
        )
      );
      setTypingMsg("");
    } catch (error) {
      setTypingMsg("");
      setSessions((prevSessions) =>
        prevSessions.map((session) =>
          session.id === activeSessionId
            ? {
                ...session,
                history: [
                  ...session.history,
                  { sender: "bot", text: "⚠️ Something went wrong. Please try again." },
                ],
              }
            : session
        )
      );
      console.error("API Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setSessions((prevSessions) =>
      prevSessions.map((session) =>
        session.id === activeSessionId ? { ...session, history: [] } : session
      )
    );
    setTypingMsg("");
  };

  const createNewSession = () => {
    const newSession = {
      id: uuidv4(),
      name: `Session ${sessions.length + 1}`,
      history: [],
    };
    setSessions([...sessions, newSession]);
    setActiveSessionId(newSession.id);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession.history, typingMsg]);

  const renderMessageText = (text) => {
    const numberedRegex = /(\d+\.\s\*\*.*?\*\*:.*?)(?=(\s\d+\.\s|\n|$))/gs;
    const matches = text.match(numberedRegex);
  
    if (matches && matches.length >= 2) {
      return (
        <ol className="list-decimal pl-5 space-y-2">
          {matches.map((item, idx) => {
            const cleaned = item.replace(/^\d+\.\s/, "").trim(); // Remove leading "1. ", "2. ", etc.
            return (
              <li
                key={idx}
                dangerouslySetInnerHTML={{
                  __html: cleaned.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                }}
              />
            );
          })}
        </ol>
      );
    }
  
    const fallbackFormatted = text
      .replace(/(\d+\.\s)/g, "<br /><br />$1")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  
    return <span dangerouslySetInnerHTML={{ __html: fallbackFormatted }} />;
  };
  

  return (
    <div className="min-h-screen flex text-gray-900 dark:text-gray-100 font-sans transition bg-gradient-to-br from-slate-100 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-900 border-r dark:border-gray-700 p-4 flex flex-col">
        <h2 className="text-lg font-semibold mb-4">Sessions</h2>
        <div className="flex-1 space-y-2 overflow-y-auto">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => setActiveSessionId(session.id)}
              className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                session.id === activeSessionId
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {session.name}
            </button>
          ))}
        </div>
        <button
          onClick={createNewSession}
          className="mt-4 text-sm text-indigo-600 hover:underline"
        >
          ➕ New Session
        </button>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-2xl bg-white dark:bg-gray-900 shadow-xl rounded-2xl flex flex-col h-[90vh] border border-gray-100 dark:border-gray-700 relative">
          <header className="p-5 bg-white dark:bg-gray-900 border-b dark:border-gray-700 text-indigo-700 dark:text-indigo-300 text-xl font-semibold text-center shadow-sm relative">
            MediMind 🧠
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="absolute right-4 top-5 text-sm text-indigo-600 hover:underline"
            >
              {darkMode ? "☀️ Light" : "🌙 Dark"}
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            {activeSession.history.length === 0 && !typingMsg && (
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

            {activeSession.history.map((msg, idx) => (
              <div
                key={idx}
                className={`max-w-xl px-4 py-3 rounded-xl shadow-sm ${
                  msg.sender === "user"
                    ? "ml-auto bg-indigo-600 text-white"
                    : "mr-auto bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                }`}
              >
                {renderMessageText(msg.text)}
              </div>
            ))}

            {typingMsg && (
              <div className="mr-auto bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 px-4 py-3 rounded-xl shadow-sm italic">
                {renderMessageText(typingMsg)}
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
            {activeSession.history.length > 0 && (
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
    </div>
  );
}

export default App;
