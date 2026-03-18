import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center">
          <div className="max-w-2xl">
            <h3 className="text-lg font-semibold mb-3">Healthcare Chatbot</h3>
            <p className="text-gray-300 text-sm">
              Your AI-powered medical assistant for reliable healthcare information and support.
            </p>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-6 pt-4 text-center text-sm text-gray-400">
          <p>&copy; 2026 Healthcare Chatbot. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
