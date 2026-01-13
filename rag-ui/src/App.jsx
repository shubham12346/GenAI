import { useState } from 'react'
import './App.css'

function App() {

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function askQuestion(question) {
  const res = await fetch("http://localhost:3000/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question })
  });
  
  return res.json();
}

 async function sendMessage() {
    if (!input.trim()) return;

    const userMsg = { role: "user", text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const res = await askQuestion(input);

    const botMsg = { role: "assistant", text: res.answer };
    setMessages(prev => [...prev, botMsg]);
    setLoading(false);
  }


  return (
    <>
     <div style={{ maxWidth: 600, margin: "40px auto" }}>
      <h2>Local RAG Chat</h2>

      <div style={{ border: "1px solid #ccc", padding: 10, minHeight: 300 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <b>{m.role === "user" ? "You" : "AI"}:</b> {m.text}
          </div>
        ))}
        {loading && <i>Thinking...</i>}
      </div>

      <div style={{ marginTop: 10 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          style={{ width: "80%" }}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
    </>
  )
}

export default App
