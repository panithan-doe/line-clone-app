import React from 'react';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import { LoginForm } from './LoginForm';
import { ChatApp } from '../Chat/ChatApp';
import '@aws-amplify/ui-react/styles.css';

export function AuthWrapper() {
  const { authStatus } = useAuthenticator();

  if (authStatus === 'authenticated') {
    return <ChatApp />;
  }

  return (
    <Authenticator
      components={{
        SignIn: LoginForm,
      }}
      hideSignUp={false}
    >
      <ChatApp />
    </Authenticator>
  );
}