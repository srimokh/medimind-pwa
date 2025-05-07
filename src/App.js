import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import JourneyIntro from './components/JourneyIntro';
import AvatarPicker from './components/AvatarPicker';
import JourneyMap from './components/JourneyMap';


const moodSound = new Audio("https://raw.githubusercontent.com/srimokh/MOOD-SOUND/main/confirm.mp3");

const zonePrompts = {
  "Forest of Overthinking": [
    "🌲 What thoughts keep looping without resolution?",
    "🧠 How can I untangle one worry at a time?",
    "🗺️ What’s the story behind my mental noise?",
    "🍃 What would happen if I stopped thinking and just felt?"
  ],
  "Sea of Uncertainty": [
    "🌊 What am I afraid will never become clear?",
    "🧭 How do I trust myself when I don’t know the way?",
    "🎣 What can I anchor to in this ocean of questions?",
    "🚢 What if drifting is exactly what I need right now?"
  ],
  "Volcano of Emotion": [
    "🔥 What’s rising in me that I keep suppressing?",
    "🌋 What would I scream if I wasn’t afraid?",
    "💥 What’s waiting to erupt into truth?",
    "🌪️ What would it feel like to release it all safely?"
  ],
  "Glacier of Stillness": [
    "❄️ What part of me just wants to be still?",
    "🌙 What am I noticing in the silence?",
    "🧊 What feels frozen but quietly alive?",
    "🫗 What truth melts through stillness alone?"
  ],
  "Cosmic Reflection Zone": [
    "🌌 What bigger pattern am I part of?",
    "🌠 What if I’m exactly where I need to be?",
    "🪞 What reflection is the universe sending me?",
    "🌐 What would my life look like from the stars?"
  ],
  "Temple of Insight": [
    "🏛️ What truth have I always known, deep down?",
    "🔔 What insight is whispering from within?",
    "🧘 What wisdom feels ready to rise?",
    "📜 What have my past selves been trying to teach me?"
  ]
};


function App() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
  const [query, setQuery] = useState("");
  const bottomRef = useRef(null);
  const [moodConfirmed, setMoodConfirmed] = useState(false);


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
            guide: null,
            journeyZone: null,
            started: false,

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

  useEffect(() => {
    const handler = (e) => {
      const target = e.target.closest(".topic-link");
      if (target) {
        const topic = target.dataset.topic;
        if (topic) {
          handleSearch(`Can you go deeper on "${topic}"?`);
        }
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const samplePrompts = [
    "🗺️ What is the first step on my emotional journey?",
    "🌌 How can I reconnect with something bigger than me?",
    "🔥 What part of me is asking to be felt right now?",
    "🧭 Why do I feel like I'm searching for something unseen?",
    "💫 What message is hidden beneath my restlessness?",
    "🏔️ How do I face an inner storm without running?",
    "🌙 What truth is waiting in the quiet parts of me?",
    "🔮 How do I know if I’m resisting my next chapter?",
    "🌿 What does healing look like for me today?",
    "⚔️ What fear am I being asked to confront gently?",
    "🪞 What’s trying to mirror itself through my emotions?",
    "🚪How do I step through the door that just appeared?",
    "💭 What thoughts are keeping me stuck in a loop?",
    "✨ If my future self could speak now, what would they say?"
  ];



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

    const formatMediMindResponse = (responseText) => {
      const [bodyRaw, questionRaw] = responseText.split(/-{3,}/);
      if (!bodyRaw || !questionRaw) return `<p>${responseText}</p>`;

      let bodyFormatted = bodyRaw.trim();
      bodyFormatted = bodyFormatted
        .split(/\n\s*\n/)
        .map((p) => `<p style="text-indent: 1.5em; margin-bottom: 1em;">${p.trim()}</p>`)
        .join("");
      bodyFormatted = bodyFormatted.replace(
        /\*\*(.+?)\*\*:/g,
        (_, title) =>
          `<span data-topic="${title}" class="topic-link cursor-pointer text-indigo-600 font-semibold hover:underline">${title}</span>:`
      );
      bodyFormatted = bodyFormatted
        .split(/\n\s*\n/)
        .map((para) => `<p>${para.trim()}</p>`)
        .join("");

      const question = questionRaw.trim();

      return `
        <div class="space-y-4">
          ${bodyFormatted}
          <hr class="my-6 border-gray-300 dark:border-gray-600" />
          <p class="text-indigo-500 dark:text-indigo-300 italic text-lg pt-2">${question}</p>
        </div>
      `;
    };

    try {
      const fullConversation = sessionClone.history.map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text,
      }));

      const selectedGuide = activeSession?.guide?.label || "a supportive, structured guide";

      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `
              You are MediMind — a thoughtful, emotionally attuned AI therapist, speaking in the tone of ${selectedGuide}.
              
              This persona speaks from a place of emotional depth and existential awareness, guiding the user through their inner storms with clarity and reverence. It is like walking beside a wise companion who sees both their pain and their power, helping them make meaning of the struggle without ever rushing the process.
              
              - Keep each response under 1500 characters.
              - Break content into clear, natural paragraphs.
              - When listing causes or ideas, use structured formatting:
              - Use structured responses (like bullet points or sequences) only when it feels natural and supportive.
              - Maintain a grounded, emotionally intelligent, and gently encouraging tone.
              - Incorporate a winning, optimistic outlook that affirms the user’s resilience and direction.
              
              Respond with a thoughtful reflection followed by a horizontal break (---), then a single emotionally open-ended question on a new line.

    
              `.trim(),
              
            },
            ...fullConversation,
            { role: "user", content: userMsg },
          ],
          temperature: 0.4,
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

      const typeMessage = (formattedText, rawText) => {
        let current = "";
        let index = 0;

        const typeNextChar = () => {
          if (index < formattedText.length) {
            current += formattedText[index];
            index++;
            setSessions((prev) =>
              prev.map((s) =>
                s.id === activeSessionId ? { ...s, typing: current } : s
              )
            );
            setTimeout(typeNextChar, 1);
          } else {
            setSessions((prev) =>
              prev.map((s) =>
                s.id === activeSessionId
                  ? {
                      ...s,
                      history: [
                        ...s.history,
                        {
                          sender: "bot",
                          text: formattedText,
                          raw: rawText,
                        },
                      ],
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

      typeMessage(fullMsg, rawMsg);
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
      mirrorSummary: null,
      futureEcho: null,
      guide: null,
      journeyZone: null,
      started: false,
    };
  
    let updatedSessions = [...sessions, newSession];
  
    // 🔥 Trim to last 10 if over limit
    if (updatedSessions.length > 10) {
      updatedSessions = updatedSessions.slice(-10);
    }
  
    setSessions(updatedSessions);
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
     <ol className="list-decimal pl-5 space-y-1 leading-snug text-base text-gray-800 dark:text-gray-100">

  {matches.map((item, idx) => {
    const cleaned = item.replace(/^\d+\.\s/, "").trim();
    const titleMatch = cleaned.match(/\*\*(.*?)\*\*/);
    const title = titleMatch ? titleMatch[1] : `Point ${idx + 1}`;
    const body = cleaned.replace(/\*\*(.*?)\*\*:/, ""); // Remove header for body

    return (
      <li key={idx} className="text-base text-gray-800 dark:text-gray-100">
        <strong
          className="text-indigo-800 cursor-pointer hover:underline"
          onClick={() => handleSearch(`Can you go deeper on "${title}"?`)}
        >
          {title}
        </strong>
        : {body.trim()}
      </li>
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
          s.id === activeSessionId ? { ...s, mirrorSummary: reflection, futureEcho: s.futureEcho } : s
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
          s.id === activeSessionId ? { ...s, futureEcho: echo, mirrorSummary: s.mirrorSummary } : s
        )
      );
    } catch (err) {
      console.error("Future Echo error:", err);
    }
  };
  
  const updateActiveSession = (updatedSession) => {
    setSessions((prevSessions) =>
      prevSessions.map((s) =>
        s.id === activeSessionId ? updatedSession : s
      )
    );
  };

  const resetToStart = () => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              moodBefore: null,
              guide: null,
              history: [],
              typing: "",
              loading: false,
              mirrorSummary: null,
              futureEcho: null,
            }
          : s
      )
    );
  };
  
  const deleteSession = (sessionIdToDelete) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== sessionIdToDelete);
  
      // If the deleted session was active, switch to another one (or create new)
      if (activeSessionId === sessionIdToDelete) {
        if (filtered.length > 0) {
          setActiveSessionId(filtered[0].id);
        } else {
          const newSession = {
            id: uuidv4(),
            name: "Session 1",
            history: [],
            typing: "",
            loading: false,
            moodBefore: null,
            moodAfter: null,
            mirrorSummary: null,
            futureEcho: null,
            guide: null,
          };
          setSessions([newSession]);
          setActiveSessionId(newSession.id);
        }
      }
  
      return filtered;
    });
  };

    // State and useEffect hooks...
  
    // ✨ Prompt gradient generator
    const getPromptGradient = (index) => {
      const gradients = [
        "linear-gradient(135deg, #6366f1, #8b5cf6)",
        "linear-gradient(135deg, #10b981, #3b82f6)",
        "linear-gradient(135deg, #ec4899, #f59e0b)",
        "linear-gradient(135deg, #f43f5e, #f97316)",
        "linear-gradient(135deg, #06b6d4, #3b82f6)",
        "linear-gradient(135deg, #9333ea, #e11d48)",
        "linear-gradient(135deg, #4ade80, #22d3ee)",
        "linear-gradient(135deg, #facc15, #f472b6)"
      ];
      return gradients[index % gradients.length];
    };
  

    return (
      <div className="min-h-screen flex text-gray-900 dark:text-gray-100 font-sans transition bg-gradient-to-br from-slate-100 to-white dark:from-gray-900 dark:to-gray-800">
    
        {/* Sidebar */}
        <aside className="w-48 sm:w-56 bg-white dark:bg-gray-900 border-r dark:border-gray-700 p-2 flex flex-col shrink-0">
          <h2 className="text-base font-semibold mb-2">Sessions</h2>
    
          <div className="flex-1 space-y-2 overflow-y-auto">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`flex items-center justify-between group px-2 py-2 rounded-md text-sm font-medium ${
                  session.id === activeSessionId
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                }`}
              >
                <button
                  onClick={() => setActiveSessionId(session.id)}
                  className="flex-1 text-left truncate"
                >
                  {session.name}
                </button>
                <button
                  onClick={() => deleteSession(session.id)}
                  className="ml-2 text-red-500 opacity-0 group-hover:opacity-100 hover:text-red-700 transition"
                  title="Delete session"
                >
                  ❌
                </button>
              </div>
            ))}
          </div>

            {/* Place New Session button inside scroll area */}
   <button
      onClick={createNewSession}
      className="text-lg text-indigo-600 hover:underline block w-full text-center mt-2"
    >
      ➕ New Session
    </button>

        </aside>
    
  
    {/* Main Chat Area */}
    <div className="flex-1 flex items-center justify-center p-4 sm:p-10">
  <div className="w-full max-w-xl bg-white dark:bg-gray-900 shadow-xl rounded-2xl flex flex-col min-h-[90vh] border border-gray-100 dark:border-gray-700">

        {/* Header */}
        <header
  onClick={createNewSession}
  className="p-5 cursor-pointer bg-white dark:bg-gray-900 border-b dark:border-gray-700 text-indigo-700 dark:text-indigo-300 text-xl font-semibold text-center shadow-sm relative"
>
🕊️ MediMiiind 🕊️

  <button
    onClick={(e) => {
      e.stopPropagation(); // prevent from triggering parent onClick
      setDarkMode(!darkMode);
    }}
    className="absolute right-4 top-5 text-sm text-indigo-600 hover:underline"
  >
    {darkMode ? "☀️ Light" : "🌙 Dark"}
  </button>
</header>


        



        {/* Chat Area */}
        {activeSession.moodBefore && activeSession.guide && activeSession.journeyZone && (

          <>
            <div className="flex-4 overflow-y-auto px-2 py-4 space-y-4">
              
              {/* Welcome Prompt */}
              {activeSession.history.length === 0 && !activeSession.typing && (
  <div className="text-center text-gray-600 dark:text-gray-300 mt-6 animate-fade-in">
    <h2 className="text-2xl font-semibold mb-2">Welcome to MediMiiind</h2>
    <p>Your supportive space for Peace of Mind.</p>


    {/* Zone Title */}
    {activeSession.journeyZone && (
  <div>
    <h2 className="text-4xl sm:text-5xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-purple-600 mb-6">
      {activeSession.journeyZone.label}
    </h2>
    <p className="text-lg text-indigo-400 dark:text-indigo-300 font-medium text-center mb-8">
      Choose your next path below:
    </p>
  </div>
)}


    {/* Prompt Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
  {(zonePrompts[activeSession.journeyZone?.label] || []).map((prompt, idx) => (
    <button
      key={idx}
      onClick={() => {
        moodSound.play();
        handleSearch(prompt);
      }}
      className="p-6 rounded-2xl text-white font-medium shadow-xl transform hover:scale-105 transition-all duration-300 animate-fade-in"
      style={{
        background: getPromptGradient(idx),
        animationDelay: `${idx * 100}ms`
      }}
    >
      <div className="text-xl">{prompt}</div>
    </button>
  ))}
</div>


  </div>
)}


{/* Messages */}
{activeSession.history.map((msg, idx) => (
  <div
    key={idx}
    className={`w-full flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
  >
    <div
      className={`max-w-xs sm:max-w-md px-4 py-3 rounded-2xl text-base font-medium transition-all shadow-md
        ${msg.sender === "user"
          ? "bg-indigo-100 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-100"
          : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        }`}
    >
      {renderMessageText(msg.text)}
    </div>
  </div>
))}


              {/* Typing Animation */}
              {activeSession.typing && (
                <div className="mr-auto bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 px-4 py-3 rounded-xl shadow-sm italic">
                  {renderMessageText(activeSession.typing)}
                </div>
              )}

              {/* Reflection Buttons */}
              {activeSession.history.length >= 3 && (
                <div className="text-center mt-6 flex justify-center gap-x-12">

                  {!activeSession.mirrorSummary && (
                    <button
                      onClick={handleReflect}
                      className="text-indigo-500 text-lg underline hover:text-indigo-700"
                    >
                      ✨ Reflect on this session
                    </button>
                  )}

                  {activeSession.mirrorSummary && (
                    <div className="bg-green-50 dark:bg-green-900 dark:text-green-100 p-4 rounded-lg shadow-md border border-green-200 dark:border-green-800">
                      <h3 className="font-semibold text-lg mb-2">🪞 Mirror Mode Reflection</h3>
                      <p className="text-base whitespace-pre-wrap">{activeSession.mirrorSummary}</p>
                    </div>
                  )}

                  {!activeSession.futureEcho && (
                    <button
                      onClick={handleFutureEcho}
                      className="text-green-500 text-lg underline hover:text-green-700"
                    >
                      📡 Receive Future Echo
                    </button>
                  )}

                  {activeSession.futureEcho && (
                    <div className="bg-green-100 dark:bg-green-900 dark:text-green-100 p-4 rounded-lg shadow-md border border-green-300 dark:border-green-700">
                      <h3 className="font-semibold text-lg mb-2">🌀 Future Echo</h3>
                      <p className="text-base whitespace-pre-wrap italic">{activeSession.futureEcho}</p>
                    </div>
                  )}
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-white dark:bg-gray-900 border-t dark:border-gray-700 flex gap-2 items-center">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask anything about your mind, meds, or mood..."
                className="flex-1 px-4 py-3 sm:px-6 sm:py-5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                onClick={() => {
                  moodSound.play(); // 🔊 Play sound when user sends message
                  handleSearch();
                }}                
                disabled={activeSession.loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-9 py-5 rounded-lg text-lg font-semibold disabled:opacity-50"
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
          </>
        )}

{/* Guide Picker — After JourneyIntro is started */}
{activeSession.started && !activeSession.guide && (
  <div className="text-center text-gray-600 dark:text-gray-300 mt-8">
    <p className="mb-2 text-lg">Choose your guide:</p>
    <AvatarPicker
      onSelect={(guide) => {
        const updated = { ...activeSession, guide };

        if (!updated.moodBefore) {
          updated.moodBefore = "😊";
        }

        setSessions((prev) =>
          prev.map((s) => (s.id === activeSessionId ? updated : s))
        );

        moodSound.play();

        setTimeout(() => {
          bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 300);
      }}
    />
  </div>
)}


{/* Journey Intro — Show first */}
{!activeSession.started && activeSession.history.length === 0 && (
  <JourneyIntro
  onBegin={() => {
    const updated = { ...activeSession, started: true };
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSessionId ? updated : s))
    );
    moodSound.play(); // 🔊 Add here
  }}
/>
)}

{/* Journey Map — After guide is chosen */}
{activeSession.guide && !activeSession.journeyZone && (
  <JourneyMap
    onSelectZone={(zone) => {
      const updated = { ...activeSession, journeyZone: zone };
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSessionId ? updated : s))
      );

      moodSound.play();

      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }}
  />
)}

{/* Chat UI — only after guide + zone are selected */}
{activeSession.guide && activeSession.journeyZone && (
  <>
    {/* Your full chat area goes here. For now, you can use a placeholder: */}
    <div className="text-center p-10 text-gray-500">
      🔮 Chat experience starts here (replace with chat logic)
    </div>
  </>
)}


      </div> 
    </div>   
  </div>     
);          
}

export default App;
