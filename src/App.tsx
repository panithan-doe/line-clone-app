import React from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import { AuthWrapper } from './components/Auth/AuthWrapper';
import './lib/amplify';
import { LoginForm } from './components/Auth/LoginForm';

function App() {
  return (
    <Authenticator.Provider>
      <AuthWrapper />
    </Authenticator.Provider>

  );
}

export default App;