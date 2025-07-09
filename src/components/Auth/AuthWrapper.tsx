import React, { useEffect, useState } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import { LoginForm } from './LoginForm';
import { ChatApp } from '../Chat/ChatApp';

export function AuthWrapper() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      await getCurrentUser();
      setIsAuthenticated(true);
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <ChatApp />;
  }

  return <LoginForm />;
}