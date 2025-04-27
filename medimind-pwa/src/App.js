import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);

    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are MediMind — a supportive AI companion for mental health and medication guidance.",
            },
            { role: "user", content: query },
          ],
          temperature: 0.6,
        },
        {
          headers: {
            Authorization: `Bearer YOUR_OPENAI_API_KEY`,  // replace later
            "Content-Type": "application/json",
          },
        }
      );

      const aiReply = response.data.choices[0].message.content.trim();

      setHistory((prev) => [
        ...prev,
        { sender: "user", text: query },
        { sender: "bot", text: aiReply },
      ]);
    } catch (error) {
      setHistory((prev) => [
        ...prev,
        { sender: "bot", text: "Sorry, something went wrong." },
      ]);
      console.error(error);
    } finally {
      setLoading(false);
      setQuery("");
    }
  };

  return (
    <div className="App">
      <h1>MediMind 🧠</h1>

      <div className="input-section">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask anything about your mind, meds, or mood..."
        />
        <button onClick={handleSearch}>
          {loading ? "..." : "Send"}
        </button>
      </div>

      <div className="history">
        {[...history].reverse().map((msg, idx) => (
          <div key={idx} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
