import React, { useEffect, useState } from 'react';
import { fetchUserAttributes, getCurrentUser, signOut } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import { LoginForm } from './LoginForm';
import { ChatApp } from '../Chat/ChatApp';
import type { Schema } from '../../../amplify/data/resource';

// Generate the data client (will be initialized after Amplify is configured)
let client: any;

export function AuthWrapper() {
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Initialize the client after component mounts (ensuring Amplify is configured)
    if (!client) {
      client = generateClient<Schema>();
    }
    checkAuthStatus();
  }, [refreshKey]); // Depend on refreshKey to allow manual refresh

  const checkAuthStatus = async () => {
    try {
      // Add a small delay to allow authentication state to stabilize
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const currentUser = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      
      
      const mergedUser = {
        ...currentUser,
        attributes,
      };

      // User should already exist in database (created during sign-up)

      setUser(mergedUser);
      setIsAuthenticated(true);
    } catch (error) {
      // Only sign out if it's not a "user not authenticated" error
      if (error && (error as any).name !== 'UserUnAuthenticatedException') {
        try {
          await signOut();
        } catch (signOutError) {
        }
      }
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };


  const refreshAuth = () => {
    setLoading(true);
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <ChatApp user={user} />;
  }

  return <LoginForm onAuthSuccess={refreshAuth} />;
}