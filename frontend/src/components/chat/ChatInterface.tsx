import React, { useState, useRef, useEffect } from 'react';
import { chatService, ChatResponseData } from '../../services/chat.service';
import { useAuth } from '../../contexts/AuthContext';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: ChatResponseData['type'];
  provider?: string;
  model?: string;
}

interface ChatInterfaceProps {
  onBack: () => void;
}

const LLM_OPTIONS = [
  { provider: 'groq', model: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (Groq)', icon: '🏎️' },
  { provider: 'google', model: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Fast)', icon: '⚡' },
  { provider: 'google', model: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Brainy)', icon: '🧠' },
  { provider: 'openai', model: 'gpt-4o', label: 'GPT-4o', icon: '🤖' },
  { provider: 'openai', model: 'gpt-4o-mini', label: 'GPT-4o Mini', icon: '🔋' },
  { provider: 'anthropic', model: 'claude-3-5-sonnet-20240620', label: 'Claude 3.5 Sonnet', icon: '🎭' },
];

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: `Hello ${user?.name || 'there'}! I am your AI healthcare assistant. How can I help you today?`,
      sender: 'bot',
      timestamp: new Date(),
      type: 'general'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLLM, setSelectedLLM] = useState(LLM_OPTIONS[0]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await chatService.getHistory();
        if (history && history.length > 0) {
          const formattedHistory: Message[] = history.flatMap((item: any) => {
            const userMsg: Message = {
              id: `user-${item.id}`,
              text: item.message,
              sender: 'user',
              timestamp: new Date(item.createdAt),
            };
            const botMsg: Message = {
              id: `bot-${item.id}`,
              text: item.response,
              sender: 'bot',
              timestamp: new Date(item.createdAt),
              type: item.type as ChatResponseData['type'],
              provider: item.provider,
              model: item.model,
            };
            return [userMsg, botMsg];
          });
          setMessages(formattedHistory);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    };
    loadHistory();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage({
        message: userMessage.text,
        provider: selectedLLM.provider,
        model: selectedLLM.model
      });

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.responseText,
        sender: 'bot',
        timestamp: new Date(),
        type: response.type,
        provider: selectedLLM.provider,
        model: selectedLLM.model,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Error: ${error.message || 'Failed to connect to the server.'}`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'blocked',
      };
      setMessages((prev) => [...prev, errorMessage]);

      // If it's a guardrail block, the error message is already shown in the chat
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'symptom': return 'bg-yellow-50 border-yellow-200 text-yellow-900 shadow-yellow-100/50';
      case 'medicine': return 'bg-purple-50 border-purple-200 text-purple-900 shadow-purple-100/50';
      case 'document': return 'bg-blue-50 border-blue-200 text-blue-900 shadow-blue-100/50';
      case 'blocked': return 'bg-red-50 border-red-200 text-red-900 shadow-red-100/50';
      default: return 'bg-slate-50 border-slate-200 text-slate-900 shadow-slate-100/50';
    }
  };

  return (
    <div className="flex flex-col h-[85vh] bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white shadow-lg z-10">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2.5 hover:bg-white/20 rounded-full transition-all active:scale-90 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Go back"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <div>
            <h2 className="text-xl font-bold tracking-tight">HealthAI Studio</h2>
            <p className="text-[11px] text-blue-100 opacity-90 flex items-center mt-0.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
              Pulse Active
            </p>
          </div>
        </div>

        {/* LLM Selector Dropdown */}
        <div className="relative group">
          <select
            value={LLM_OPTIONS.indexOf(selectedLLM)}
            onChange={(e) => setSelectedLLM(LLM_OPTIONS[parseInt(e.target.value)])}
            className="bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-semibold py-2 px-3 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/40 cursor-pointer transition-all appearance-none"
          >
            {LLM_OPTIONS.map((opt, index) => (
              <option key={index} value={index} className="text-gray-900 bg-white">
                {opt.icon} {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 backdrop-blur-sm">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div
              className={`max-w-[85%] md:max-w-[80%] rounded-2xl p-4.5 shadow-sm border
                ${msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm border-blue-500 shadow-blue-100'
                  : `${getTypeColor(msg.type)} rounded-bl-sm prose prose-slate max-w-none`
                }
              `}
            >
              {msg.sender === 'bot' ? (
                <div className="leading-relaxed text-[15px] font-medium bot-markdown-container">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed text-[15px] font-medium">{msg.text}</p>
              )}

              {msg.sender === 'bot' && msg.type && msg.type !== 'general' && (
                <div className="mt-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-70 border-t border-black/5 pt-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${msg.type === 'blocked' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                  Type: {msg.type}
                  {msg.provider && msg.model && (
                    <span className="ml-auto opacity-60">LLM: {msg.provider.toUpperCase()} / {msg.model.split('-').slice(0, 2).join('-')}</span>
                  )}
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-400 mt-1.5 mx-1 font-semibold opacity-70">
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start animate-pulse">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm p-5 shadow-sm">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <form onSubmit={handleSendMessage} className="flex flex-col gap-4">
          <div className="flex-1 relative group">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder={`Ask ${selectedLLM.label.split(' ')[0]} about symptoms...`}
              className="w-full max-h-40 min-h-[60px] p-4 pr-16 bg-slate-50 border border-slate-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all text-sm md:text-base font-medium placeholder:text-slate-400"
              disabled={isLoading}
              rows={1}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-3 bottom-3 p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:grayscale transition-all shadow-md active:scale-90"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform rotate-90" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
        </form>
        <div className="flex items-center justify-center gap-1.5 mt-4 opacity-50 hover:opacity-100 transition-opacity">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Medical Advisor Policy Restricted</span>
          <svg className="h-3 w-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" /></svg>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
