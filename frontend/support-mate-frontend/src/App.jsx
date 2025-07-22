import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import LanguageProvider from './components/LanguageProvider';
import { GoogleOAuthProvider } from '@react-oauth/google';
import AppContent from './AppContent';

function App() {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <LanguageProvider>
        <Router>
          <AppContent />
        </Router>
      </LanguageProvider>
    </GoogleOAuthProvider>
  );
}

export default App; 