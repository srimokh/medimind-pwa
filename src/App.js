import { useState, useRef, useEffect } from "react";
import axios from "axios";

function App() {
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState([]);
  const [typingMsg, setTypingMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    const userMsg = query;
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
        await new Promise((res) => setTimeout(res, 15));
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, typingMsg]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-white flex items-center justify-center font-sans">
      <div className="w-full max-w-2xl bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col h-[90vh]">
        <header className="p-6 bg-white border-b text-indigo-700 text-2xl font-semibold tracking-tight text-center">
          MediMind 🧠
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {history.map((msg, idx) => (
            <div
              key={idx}
              className={`max-w-xl px-4 py-3 rounded-xl shadow-sm ${
                msg.sender === "user"
                  ? "ml-auto bg-indigo-600 text-white"
                  : "mr-auto bg-gray-100 text-gray-800"
              }`}
            >
              {msg.text}
            </div>
          ))}
          {typingMsg && (
            <div className="mr-auto bg-gray-100 text-gray-700 px-4 py-3 rounded-xl shadow-sm italic">
              {typingMsg}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="p-4 bg-white border-t flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything about your mind, meds, or mood..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
