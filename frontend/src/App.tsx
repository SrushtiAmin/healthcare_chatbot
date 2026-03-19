import React, { useState } from 'react';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './components/auth/AuthPage';
import ChatInterface from './components/chat/ChatInterface';
import './App.css';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'chat'>('dashboard');

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (currentView === 'chat') {
    return (
      <Layout>
        <div className="container mx-auto px-2 md:px-4 py-6 max-w-4xl">
          <ChatInterface onBack={() => setCurrentView('dashboard')} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow border border-gray-100">
            <div className="mb-8 flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user.name}!</h2>
                <p className="text-gray-600 text-lg">
                  What would you like to do today?
                </p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl shadow-inner border-2 border-white">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div 
                onClick={() => setCurrentView('chat')}
                className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-md cursor-pointer hover:shadow-xl transform hover:-translate-y-1 transition-all group overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
                <div className="flex justify-between items-center mb-4 relative z-10">
                  <h3 className="font-bold text-white text-xl tracking-wide">AI Assistant</h3>
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-md group-hover:bg-white/30 transition-colors shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <p className="text-blue-100 text-sm mb-6 relative z-10 leading-relaxed">
                  Start a secure chat session to check symptoms, ask about medications, or query your health documents.
                </p>
                <div className="text-white font-semibold text-sm flex items-center group-hover:underline relative z-10">
                  Start Chatting 
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 transition-transform group-hover:translate-x-1.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                <h3 className="font-bold text-gray-800 mb-6 flex items-center text-lg relative z-10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  Profile Details
                </h3>
                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                    <span className="text-gray-500 text-sm font-medium tracking-wide">Email Account</span>
                    <span className="text-gray-900 font-semibold text-sm truncate max-w-[150px]" title={user.email}>{user.email}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                    <span className="text-gray-500 text-sm font-medium tracking-wide">Member Since</span>
                    <span className="text-gray-900 font-semibold text-sm bg-white px-2 py-1 rounded-md shadow-sm border border-gray-100">{new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-gray-500 text-sm font-medium tracking-wide">System Status</span>
                    <span className="text-green-700 bg-green-100 px-3 py-1 rounded-full font-bold text-xs flex items-center shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></span> Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-orange-50 border border-orange-100 rounded-xl">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-400 mt-0.5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-orange-800">
                  <strong>Disclaimer:</strong> This AI agent provides general information and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician in case of an emergency.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
