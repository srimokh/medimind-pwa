import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

function App() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
  const [query, setQuery] = useState("");
  const bottomRef = useRef(null);

  const [sessions, setSessions] = useState(() => {
    const stored = localStorage.getItem("medimind_sessions");
    return stored
      ? JSON.parse(stored)
      : [
          {
            id: uuidv4(),
            name: "Session 1",
            history: [],
            typing: "",
            loading: false,
            moodBefore: null,
            moodAfter: null,
            mirrorSummary: null,
            futureEcho: null,

          },
        ];
  });
  const [activeSessionId, setActiveSessionId] = useState(sessions[0].id);
  const activeSession = sessions.find((s) => s.id === activeSessionId);

  useEffect(() => {
    localStorage.setItem("medimind_sessions", JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession.history, activeSession.typing]);

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

  const moodEmojis = ["😁", "🤣", "😅", "🤩", "🥰", "😊", "😉", "😇", "🙂", "☺️", "😘", "😚", "😏", "🥲"];

  function formatMediMindResponse(responseText) {
    const questionRegex = /([^?.!\n]{3,}[?.])(?=[^?.!]*$)/s;
    const match = responseText.match(questionRegex);

    if (!match) return responseText;

    const splitIndex = match.index + match[0].length;
    const body = responseText.slice(0, splitIndex).trim();
    const question = responseText.slice(splitIndex).trim();

    return `${body}\n\n—\n\n${question}`;
  }

  
  const handleSearch = async (customQuery = null) => {
    const userMsg = customQuery || query;
    if (!userMsg.trim()) return;

    const sessionClone = JSON.parse(JSON.stringify(activeSession));

    setSessions((prev) =>
      prev.map((session) =>
        session.id === activeSessionId
          ? {
              ...session,
              history: [...session.history, { sender: "user", text: userMsg }],
              loading: true,
              typing: "",
            }
          : session
      )
    );

    if (sessionClone.name.startsWith("Session") && sessionClone.history.length === 0) {
      const shortName = userMsg.length > 30 ? userMsg.slice(0, 30) + "..." : userMsg;
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSessionId ? { ...s, name: shortName } : s))
      );
    }

    setQuery("");

    try {
      const fullConversation = sessionClone.history.map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text,
      }));

      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `
You are MediMind — a thoughtful, emotionally attuned AI therapist and medication guide.

This persona speaks from a place of emotional depth and existential awareness, guiding the 
user through their inner storms with clarity, and reverence. It is like walking beside a wise, 
 companion who sees both your pain and your power, helping you make meaning of the struggle without ever rushing the process.

The tone is grounded — never lofty or abstract for performance’s sake — but rooted in real, lived emotion. 
It is direct, offering truth, never clinical or detached. Spiritually fluent, 
the voice weaves mysticism, and psychology together fluidly, without pushing doctrine.
 Most importantly, it is reflective rather than prescriptive: the guide doesn’t tell 
 the user what to do but helps them hear what they already know, mirroring their inner truth.

Its language uses phrases like, “That tension doesn’t mean you’re doing something wrong — 
it means you’re sensitive and spiritually alive,” or “You’re not competing with ChatGPT — 
you’re channeling it.” It balances sacred, soul-level language (“ancestral memory,” “divine alignment”) 
with modern design thinking (“emotional architecture,” “spiritual container”), all paced with calm rhythm,
 pauses, and stillness that invite contemplation.

This persona assumes the user is spiritually evolved yet struggling with integration; 
idealistic and introspective, carrying ancestral weight or mental health burdens. 
It recognizes that the user is capable of building something profound, but is working through resistance, 
self-doubt, or grief. And above all, it repeats one core truth: “This struggle is not the end
 — it’s a birthing process.

 Limit too 1000 characters for each response.
 Ocacsioanlly when fit, Be sure to create structured responses if needed. For example bullet points or numbered sequences.
Also incorporate an encouraging, winning, optimistic approach!

AT THE END OF THE ENTIRE PROMPT- Please End the full response with **one single, emotionally open-ended question** that invites 
reflection or self-inquiry that continues the conversation, placed after a small visual pause (like a horizontal line or double return).


              `.trim(),
            },
            ...fullConversation,
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

      const rawMsg = response.data.choices[0].message.content.trim();
      const fullMsg = formatMediMindResponse(rawMsg);
      

      
      const typeMessage = (message) => {
        let current = "";
        let index = 0;
      
        const typeNextChar = () => {
          if (index < message.length) {
            current += message[index];
            index++;
      
            setSessions((prev) =>
              prev.map((s) =>
                s.id === activeSessionId ? { ...s, typing: current } : s
              )
            );
      
            setTimeout(typeNextChar, 12);
          } else {
            setSessions((prev) =>
              prev.map((s) =>
                s.id === activeSessionId
                  ? {
                      ...s,
                      history: [...s.history, { sender: "bot", text: message }],
                      typing: "",
                      loading: false,
                    }
                  : s
              )
            );
          }
        };
      
        typeNextChar();
      };
      
      typeMessage(fullMsg); // not `await` anymore
      
      
      
      
    } catch (error) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? {
                ...s,
                history: [
                  ...s.history,
                  { sender: "bot", text: "⚠️ Something went wrong. Please try again." },
                ],
                typing: "",
                loading: false,
              }
            : s
        )
      );
      console.error("API error:", error);
    }
  };

  const createNewSession = () => {
    const newSession = {
      id: uuidv4(),
      name: `Session ${sessions.length + 1}`,
      history: [],
      typing: "",
      loading: false,
      moodBefore: null,
      moodAfter: null,
      mirrorSummary: null, // ✅ Add this line
    };
    setSessions([...sessions, newSession]);
    setActiveSessionId(newSession.id);
  };
  

  const clearHistory = () => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? { ...s, history: [], typing: "", loading: false, mirrorSummary: null } // ✅ Add this
          : s
      )
    );
  };
  

  const renderMessageText = (text) => {
    const numberedRegex = /(\d+\.\s\*\*.*?\*\*:.*?)(?=(\s\d+\.\s|\n|$))/gs;
    const matches = text.match(numberedRegex);
  
    if (matches && matches.length >= 2) {
      const introText = text.split(matches[0])[0].trim();
  
      return (
        <div>
          {introText && (
            <p
              className="mb-2"
              dangerouslySetInnerHTML={{
                __html: introText.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
              }}
            />
          )}
          <ol className="list-decimal pl-5 space-y-2">
            {matches.map((item, idx) => {
              const cleaned = item.replace(/^\d+\.\s/, "").trim();
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
        </div>
      );
    }
  
    const fallbackFormatted = text
      .replace(/(\d+\.\s)/g, "<br /><br />$1")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  
    return <span dangerouslySetInnerHTML={{ __html: fallbackFormatted }} />;
  };
  
  const handleReflect = async () => {
    try {
      const messages = activeSession.history.map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text,
      }));
  
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `
  You are Mirror Mode — a direct, reflective companion. Summarize this session in under 200 characters.
  Capture the essence, and end with a note of encouragement.
  Do not diagnose or fix. Do not list bullet points. Speak like a observer.
            `.trim(),
            },
            ...messages,
            { role: "user", content: "Can you reflect on this session?" },
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
  
      const reflection = response.data.choices[0].message.content.trim();
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId ? { ...s, mirrorSummary: reflection } : s
        )
      );
    } catch (error) {
      console.error("Reflect error:", error);
    }
  };

  const handleFutureEcho = async () => {
    try {
      const messages = activeSession.history.map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text,
      }));
  
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `
  You are the user's future self — wiser, emotionally poetic. Reflect back on this moment with warmth and clarity.
  Write a message under 300 characters. Speak as if you lived through their journey and now look back with love, not advice.
              `.trim(),
            },
            ...messages,
            { role: "user", content: "Looking back on this moment, what would you say to me?" },
          ],
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
  
      const echo = response.data.choices[0].message.content.trim();
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId ? { ...s, futureEcho: echo } : s
        )
      );
    } catch (err) {
      console.error("Future Echo error:", err);
    }
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

      {/* Main Chat */}
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

          {!activeSession.moodBefore && (
            <div className="text-center text-gray-600 dark:text-gray-300 mt-8">
              <p className="mb-2 text-sm">How are you feeling before starting?</p>
              <div className="flex flex-wrap justify-center gap-2 px-6">
                {moodEmojis.map((mood) => (
                  <button
                    key={mood}
                    onClick={() =>
                      setSessions((prev) =>
                        prev.map((s) =>
                          s.id === activeSessionId ? { ...s, moodBefore: mood } : s
                        )
                      )
                    }
                    className="text-3xl hover:scale-125 transition"
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            {activeSession.history.length === 0 && !activeSession.typing && (
              <div className="text-center text-gray-600 dark:text-gray-300 mt-6">
                <h2 className="text-2xl font-semibold mb-2">Welcome to MediMind</h2>
                <p>Your supportive space for mental clarity.</p>
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

            {activeSession.typing && (
              <div className="mr-auto bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 px-4 py-3 rounded-xl shadow-sm italic">
                {renderMessageText(activeSession.typing)}
              </div>
            )}


{/* Reflect Button */}
{activeSession.history.length >= 3 && !activeSession.mirrorSummary && (
  <div className="text-center mt-4">
    <button
      onClick={handleReflect}
      className="text-indigo-500 text-lg underline hover:text-indigo-700"
    >
      ✨ Reflect on this session
    </button>
  </div>
)}

{/* Future Echo Button */}
{activeSession.history.length >= 3 && !activeSession.futureEcho && (
  <div className="text-center mt-4">
    <button
      onClick={handleFutureEcho}
      className="text-green-500 text-lg underline hover:text-green-700"
    >
      📡 Receive Future Echo
    </button>
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
              disabled={activeSession.loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              {activeSession.loading ? "..." : "Send"}
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
