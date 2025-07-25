import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import LanguageProvider from './providers/LanguageProvider';
import { GoogleOAuthProvider } from '@react-oauth/google';
import AppContent from './AppContent';
import { ChatProvider } from './components/chats/ChatContext';

function App() {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <LanguageProvider>
        <ChatProvider>
          <Router>
            <AppContent />
          </Router>
        </ChatProvider>
      </LanguageProvider>
    </GoogleOAuthProvider>
  );
}

export default App; 