import './ai.css';
import { useState } from 'react';

function Ai() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatLog, setChatLog] = useState([]);

  async function generateAnswer() {
    if (!question.trim()) {
      setAnswer('Please enter a question for Gemini.');
      return;
    }

    setLoading(true);
    setAnswer('');

    const userEntry = { speaker: 'user', text: question.trim() };
    setChatLog((prev) => [...prev, userEntry]);

    try {
      const requestData = {
        contents: [
          {
            parts: [
              {
                text: `You are a friendly agriculture assistant. Answer clearly and respectfully for farmers, shopkeepers, merchants, and workers. Question: ${question.trim()}`,
              },
            ],
          },
        ],
      };

      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyDplmHAXBzIp6txPJAybdUUrPOQ-iLioFs',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Gemini did not return a response. Please try again.';
      setAnswer(reply);
      setChatLog((prev) => [...prev, { speaker: 'ai', text: reply }]);
    } catch (error) {
      console.error('Error generating answer:', error);
      const errorText = 'An error occurred while connecting to Gemini. Please try again.';
      setAnswer(errorText);
      setChatLog((prev) => [...prev, { speaker: 'ai', text: errorText }]);
    } finally {
      setLoading(false);
      setQuestion('');
    }
  }

  return (
    <div className='ai-shell'>
      <div className='ai-panel'>
        <h1>FarmConnect AI Assistant</h1>
        <p>Ask about crops, payments, market prices or farming advice.</p>

        <div className='ai-input-group'>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder='Ask about soil, weather, pricing, or product recommendations...'
          />
          <button onClick={generateAnswer} disabled={loading}>
            {loading ? 'Thinking...' : 'Ask Gemini'}
          </button>
        </div>

        <div className='ai-chat-log'>
          {chatLog.map((entry, index) => (
            <div key={index} className={`chat-entry chat-${entry.speaker}`}>
              <div className='chat-label'>{entry.speaker === 'user' ? 'You' : 'Gemini'}</div>
              <div className='chat-text'>{entry.text}</div>
            </div>
          ))}
        </div>

        {answer && (
          <div className='ai-answer-box'>
            <h2>Latest Response</h2>
            <p>{answer}</p>
          </div>
        )}

        <div className='ai-examples'>
          <h3>Try asking</h3>
          <ul>
            <li>What crops suit my monsoon farm?</li>
            <li>How can I grow tomatoes with low cost?</li>
            <li>Is UPI or cash better for my buyers?</li>
            <li>How do I avoid pests naturally?</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Ai;
