import './ai.css';
import { useEffect, useState } from 'react';
import { aiAPI } from '../../services/api';

function Ai() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState('');
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState('');
  const [chatLog, setChatLog] = useState([]);

  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    try {
      setHistoryLoading(true);
      const data = await aiAPI.getConversations();
      const savedConversations = data?.conversations || [];
      setConversations(savedConversations);

      if (savedConversations.length > 0) {
        setActiveConversationId(savedConversations[0].id);
        setChatLog(savedConversations[0].messages || []);
      }
    } catch (loadError) {
      console.error('Error loading AI history:', loadError);
      setError(loadError.message || 'Unable to load chat history.');
    } finally {
      setHistoryLoading(false);
    }
  }

  async function startNewChat() {
    try {
      setError('');
      const data = await aiAPI.createConversation('New farm chat');
      const conversation = data?.conversation;

      if (conversation) {
        setConversations((prev) => [conversation, ...prev]);
        setActiveConversationId(conversation.id);
        setChatLog([]);
      }
    } catch (createError) {
      console.error('Error creating AI chat:', createError);
      setError(createError.message || 'Unable to create a new chat.');
    }
  }

  async function selectConversation(conversationId) {
    if (conversationId === activeConversationId) return;

    try {
      setError('');
      setActiveConversationId(conversationId);
      const data = await aiAPI.getConversation(conversationId);
      setChatLog(data?.conversation?.messages || []);
    } catch (loadError) {
      console.error('Error loading AI chat:', loadError);
      setError(loadError.message || 'Unable to open this chat.');
    }
  }

  function syncConversation(conversation) {
    if (!conversation) return;

    setActiveConversationId(conversation.id);
    setChatLog(conversation.messages || []);
    setConversations((prev) => {
      const withoutCurrent = prev.filter((item) => item.id !== conversation.id);
      return [conversation, ...withoutCurrent];
    });
  }

  async function generateAnswer() {
    if (!question.trim()) {
      setError('Please enter your farming question first.');
      return;
    }

    setLoading(true);
    setError('');

    const userEntry = { speaker: 'user', text: question.trim() };
    setChatLog((prev) => [...prev, userEntry]);

    try {
      const data = await aiAPI.askFarmerAssistant(question.trim(), activeConversationId);
      const reply = data?.answer || 'FarmConnect AI did not return a response. Please try again.';
      const savedConversation = data?.conversation;

      if (savedConversation) {
        syncConversation(savedConversation);
      } else {
        setChatLog((prev) => [...prev, { speaker: 'ai', text: reply }]);
      }
    } catch (error) {
      console.error('Error generating answer:', error);
      const errorText = error.message || 'An error occurred while connecting to FarmConnect AI. Please try again.';
      setError(errorText);
      setChatLog((prev) => [...prev, { speaker: 'ai', text: errorText }]);
    } finally {
      setLoading(false);
      setQuestion('');
    }
  }

  return (
    <div className='ai-shell'>
      <div className='ai-layout'>
        <aside className='ai-history-panel'>
          <div className='ai-history-header'>
            <div>
              <h2>Chat History</h2>
              <span>{conversations.length} chat groups</span>
            </div>
            <button type='button' onClick={startNewChat}>New</button>
          </div>

          <div className='ai-conversation-list'>
            {historyLoading ? (
              <div className='ai-empty-history'>Loading chats...</div>
            ) : conversations.length === 0 ? (
              <div className='ai-empty-history'>
                No saved chats yet. Ask your first farming question.
              </div>
            ) : (
              conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type='button'
                  className={`ai-conversation-item ${conversation.id === activeConversationId ? 'active' : ''}`}
                  onClick={() => selectConversation(conversation.id)}
                >
                  <strong>{conversation.title}</strong>
                  <span>Group {conversation.groupNumber} - {conversation.messageCount}/10 messages</span>
                </button>
              ))
            )}
          </div>
        </aside>

        <div className='ai-panel'>
          <h1>FarmConnect Farmer AI</h1>
          <p>Ask practical questions about crops, soil, irrigation, pests, harvest, storage, selling, payments, and farm planning.</p>

          <div className='ai-message-area'>
            {chatLog.length === 0 ? (
              <div className='ai-empty-chat'>
                Start a farm chat. Every chat group stores up to 10 messages.
              </div>
            ) : (
              chatLog.map((entry, index) => (
                <div key={entry._id || index} className={`chat-entry chat-${entry.speaker}`}>
                  <div className='chat-label'>{entry.speaker === 'user' ? 'You' : 'FarmConnect AI'}</div>
                  <div className='chat-text'>{entry.text}</div>
                </div>
              ))
            )}
          </div>

          {error && (
            <div className='ai-error-box'>{error}</div>
          )}

          <div className='ai-input-group'>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder='Example: My tomato leaves have yellow spots after rain. What should I check first?'
            />
            <button onClick={generateAnswer} disabled={loading}>
              {loading ? 'Thinking...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Ai;
