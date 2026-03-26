import React, { useState, useRef, useEffect } from 'react';
import { chatService } from '../../services/chat.service';
import { fileService, UploadedFile } from '../../services/file.service';
import { useAuth } from '../../contexts/AuthContext';
import ReactMarkdown from 'react-markdown';

interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: string;
  provider?: string;
  model?: string;
}

interface LLMOption {
  id: string;
  label: string;
  provider: 'openai' | 'google' | 'anthropic' | 'groq';
  icon: string;
}

const LLM_OPTIONS: LLMOption[] = [
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 (Groq)', provider: 'groq', icon: '⚡' },
  { id: 'gpt-4o', label: 'GPT-4o (OpenAI)', provider: 'openai', icon: '🤖' },
  { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', provider: 'google', icon: '✨' },
  { id: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', provider: 'anthropic', icon: '🧠' },
];

interface ChatInterfaceProps {
  onBack: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedLLM, setSelectedLLM] = useState(LLM_OPTIONS[0]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load data on mount
  useEffect(() => {
    loadSessions();
    if (!currentSessionId) {
      handleNewChat();
    }
  }, []);

  // Load files when session changes
  useEffect(() => {
    if (currentSessionId) {
      loadFiles(currentSessionId);
    } else {
      setFiles([]);
    }
  }, [currentSessionId]);

  const loadSessions = async () => {
    try {
      const data = await chatService.getSessions();
      setSessions(data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const loadFiles = async (sessionId?: string) => {
    try {
      const data = await fileService.getFiles(sessionId);
      setFiles(data);
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploadedFile = await fileService.uploadFile(file, currentSessionId || undefined);
      setFiles(prev => [uploadedFile, ...prev]);

      // Auto-trigger a message confirm
      const botMsg: Message = {
        id: Date.now().toString(),
        text: `Successfully uploaded **${file.name}**. You can now ask questions about its content!`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'document'
      };
      setMessages(prev => [...prev, botMsg]);

    } catch (error: any) {
      const rejectionMsg: Message = {
        id: `reject-${Date.now()}`,
        text: `**File Rejected:** I can only process and analyze documents that are clearly health or medical-related. Please upload medical reports, prescriptions, or symptom images only.`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'blocked'
      };
      setMessages(prev => [...prev, rejectionMsg]);
      console.warn(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setFiles([]);
    setMessages([
      {
        id: 'welcome',
        text: `Hello ${user?.name || 'there'}! I am your AI healthcare assistant. How can I help you today?`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'general'
      }
    ]);
  };

  const handleSelectSession = async (sessionId: string) => {
    setIsLoading(true);
    setCurrentSessionId(sessionId);
    try {
      const dbHistory = await chatService.getMessages(sessionId);
      const formattedMessages: Message[] = [];

      dbHistory.forEach((m: any) => {
        // 1. Add User Message
        formattedMessages.push({
          id: `${m.id}-user`,
          text: m.message,
          sender: 'user',
          timestamp: new Date(m.createdAt),
          type: m.type
        });

        // 2. Add Bot Response
        formattedMessages.push({
          id: `${m.id}-bot`,
          text: m.response,
          sender: 'bot',
          timestamp: new Date(m.createdAt),
          type: m.type,
          provider: m.provider,
          model: m.model
        });
      });

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    const newUserMsg: Message = {
      id: Date.now().toString(),
      text: userMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      const chatData = await chatService.sendMessage({
        message: userMessage,
        provider: selectedLLM.provider,
        model: selectedLLM.id,
        sessionId: currentSessionId || undefined
      });

      if (!currentSessionId && chatData.sessionId) {
        setCurrentSessionId(chatData.sessionId);
        loadSessions();
      }

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: chatData.responseText,
        sender: 'bot',
        timestamp: new Date(),
        type: chatData.type,
      };

      setMessages(prev => [...prev, botResponse]);
    } catch (error: any) {
      console.error('Chat failed:', error);
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        text: `Error: ${error.message || 'Failed to get response'}. Please try again.`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'blocked'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'symptom': return 'bg-emerald-50 text-emerald-900 border-emerald-100';
      case 'medicine': return 'bg-indigo-50 text-indigo-900 border-indigo-100';
      case 'document': return 'bg-amber-50 text-amber-900 border-amber-100';
      case 'blocked': return 'bg-slate-50 text-slate-900 border-slate-200';
      default: return 'bg-white text-slate-900 border-slate-200';
    }
  };

  return (
    <div className="flex bg-slate-100 h-screen overflow-hidden p-3 md:p-6 gap-6">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-80 bg-slate-900 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
          </div>

          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-600/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-6 pt-6">
          <div>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-3">Recent Chats</h3>
            <div className="space-y-1">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleSelectSession(session.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-3 group ${currentSessionId === session.id ? 'bg-slate-800 text-white shadow-inner' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${currentSessionId === session.id ? 'text-blue-500' : 'text-slate-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <span className="truncate text-xs font-medium">{session.title}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-3">Session Documents</h3>
            <div className="space-y-2">
              {!currentSessionId ? (
                <div className="px-3 py-4 text-center">
                  <p className="text-slate-600 text-[10px]">Start a chat to upload docs</p>
                </div>
              ) : files.length === 0 ? (
                <div className="px-3 py-4 text-center">
                  <p className="text-slate-600 text-xs">No documents in this session</p>
                </div>
              ) : (
                files.map((file) => {
                  const isPDF = file.type === 'pdf';
                  const isImage = file.type === 'image';
                  const isDoc = file.type === 'word';
                  const isData = ['csv', 'excel'].includes(file.type as string);

                  return (
                    <div key={file.id} className="group p-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-slate-700/50 transition-all flex items-center gap-3">
                      <div className={`p-2 rounded-lg 
                        ${isPDF ? 'bg-red-500/10 text-red-400' :
                          isImage ? 'bg-blue-500/10 text-blue-400' :
                            isDoc ? 'bg-indigo-500/10 text-indigo-400' :
                              isData ? 'bg-emerald-500/10 text-emerald-400' :
                                'bg-slate-500/10 text-slate-400'
                        }`}>
                        {isPDF && <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>}
                        {isImage && <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>}
                        {isDoc && <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                        {isData && <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        {!isPDF && !isImage && !isDoc && !isData && <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
                      </div>
                      <div className="overflow-hidden">
                        <p className="truncate text-[11px] font-bold text-slate-300">{file.name}</p>
                        <p className="text-[9px] text-slate-500 uppercase tracking-tighter">{file.type} indexed</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900/50">
          <button
            onClick={onBack}
            className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors text-sm font-semibold"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Main Dashboard
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-white rounded-3xl overflow-hidden shadow-2xl relative">
        {/* Chat Header */}
        <div className="p-4 md:p-6 bg-white border-b border-slate-100 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-4">
            <div className="md:hidden p-2 rounded-lg bg-slate-100" onClick={onBack}>
              <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">Welcome</h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">AI Model:</label>
            <div className="relative group">
              <select
                value={selectedLLM.id}
                onChange={(e) => setSelectedLLM(LLM_OPTIONS.find(o => o.id === e.target.value) || LLM_OPTIONS[0])}
                className="appearance-none bg-slate-100 font-bold text-slate-700 text-xs px-4 py-2 rounded-xl pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer border-none"
              >
                {LLM_OPTIONS.map(option => (
                  <option key={option.id} value={option.id}>{option.icon} {option.label}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {messages.length === 0 && !isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-30 select-none">
              <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <p className="text-lg font-bold text-slate-800">Start a conversation</p>
              <p className="text-sm font-medium text-slate-500 mt-2">Ask me anything about healthcare.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div
                  className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4.5 shadow-sm border transition-shadow hover:shadow-md
                    ${msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm border-blue-500'
                      : `${getTypeColor(msg.type)} rounded-bl-sm prose prose-slate max-w-none shadow-sm`
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


                </div>
                <span className="text-[10px] text-slate-400 mt-2 mx-1 font-bold uppercase tracking-tight opacity-70">
                  {msg.sender === 'user' ? 'You' : 'AI Healthcare Chatbot'} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
          {isLoading && !isUploading && (
            <div className="flex items-start animate-pulse">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-bl-sm p-6 shadow-sm">
                <div className="flex space-x-2">
                  <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] rounded-b-3xl">
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
                placeholder={`Query clinical data with ${selectedLLM.label.split(' ')[0]}...`}
                className="w-full max-h-40 min-h-[60px] p-5 pl-14 pr-20 bg-slate-50 border border-slate-200 rounded-2xl resize-none focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 focus:bg-white transition-all text-sm md:text-[15px] font-medium placeholder:text-slate-400 shadow-inner"
                disabled={isLoading}
                rows={1}
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept={".pdf,image/*,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.csv,.txt,.md"}
              />
              <button
                type="button"
                onClick={() => {
                  if (!currentSessionId) {
                    alert('Please select or start a chat session first to attach clinical documents.');
                    return;
                  }
                  fileInputRef.current?.click();
                }}
                disabled={isUploading || isLoading}
                className="absolute left-3.5 bottom-3.5 p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-90"
                title="Attach medical document"
              >
                {isUploading ? (
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                )}
              </button>
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-3.5 bottom-3.5 p-3.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-30 disabled:grayscale transition-all shadow-xl shadow-blue-600/20 active:scale-90"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform rotate-90" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </div>
          </form>
          <div className="flex items-center justify-between mt-5 px-1">
            <div className="flex items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity">
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Protocol Active</span>
              <svg className="h-3 w-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Shift + Enter for new line</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
