import React from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
// import { AuthWrapper } from './components/Auth/AuthWrapper';
import './lib/amplify';
import { ChatApp } from './components/Chat/ChatApp';

function App() {
  return (
    // <Authenticator.Provider>
    //   <AuthWrapper />
    // </Authenticator.Provider>
    
    <ChatApp />
  );
}

export default App;