import React, { useState, useRef, useEffect } from 'react';
import { chatService, ChatResponseData } from '../../services/chat.service';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: ChatResponseData['type'];
}

interface ChatInterfaceProps {
  onBack: () => void;
}

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      const response = await chatService.sendMessage({ message: userMessage.text });
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.responseText,
        sender: 'bot',
        timestamp: new Date(),
        type: response.type,
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
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'symptom': return 'bg-yellow-100 border-yellow-300 text-yellow-900';
      case 'medicine': return 'bg-purple-100 border-purple-300 text-purple-900';
      case 'document': return 'bg-blue-100 border-blue-300 text-blue-900';
      case 'blocked': return 'bg-red-100 border-red-300 text-red-900';
      default: return 'bg-green-50 border-green-200 text-green-900';
    }
  };

  return (
    <div className="flex flex-col h-[75vh] bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/20 rounded-full transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Go back"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <div>
            <h2 className="text-xl font-bold tracking-tight">AI Health Assistant</h2>
            <p className="text-xs text-blue-100 opacity-90 flex items-center mt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-400 mr-1.5 animate-pulse"></span>
              Online
            </p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 bg-opacity-80">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 shadow-sm
                ${msg.sender === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-sm' 
                  : `border ${getTypeColor(msg.type)} rounded-bl-sm`
                }
              `}
            >
              <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.text}</p>
              {msg.sender === 'bot' && msg.type && msg.type !== 'general' && (
                <div className="mt-2.5 text-[10px] font-bold uppercase tracking-wider opacity-60 border-t border-black/10 pt-1.5">
                  Category: {msg.type}
                </div>
              )}
            </div>
            <span className="text-[10px] text-gray-400 mt-1 mx-1 font-medium select-none">
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm p-4 shadow-sm">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-blue-500/70 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-blue-500/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-blue-500/70 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        <form onSubmit={handleSendMessage} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative shadow-sm border border-gray-300 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500 transition-all bg-gray-50">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Ask about symptoms, medicines, or health documents..."
              className="w-full max-h-32 min-h-[56px] p-3.5 pr-12 resize-none focus:outline-none bg-transparent text-sm md:text-base"
              disabled={isLoading}
              rows={1}
            />
          </div>
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="sm:w-auto w-full p-3.5 px-6 rounded-2xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Send</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform rotate-90" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
        <div className="text-center mt-3">
          <p className="text-[10px] text-gray-400">
            AI Assistant can make mistakes. Please consult a professional for medical advice.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
