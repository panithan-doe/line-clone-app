import React, { useEffect, useState } from 'react';
import { fetchUserAttributes, getCurrentUser } from 'aws-amplify/auth';
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

  useEffect(() => {
    // Initialize the client after component mounts (ensuring Amplify is configured)
    if (!client) {
      client = generateClient<Schema>();
    }
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const currentUser = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      
      const mergedUser = {
        ...currentUser,
        attributes,
      };

      // Check if user exists in our database
      await ensureUserExists(mergedUser);

      setUser(mergedUser);
      setIsAuthenticated(true);
    } catch (error) {
      console.log('User not authenticated, showing login form');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const ensureUserExists = async (cognitoUser: any) => {
    try {
      // Make sure client is initialized
      if (!client) {
        client = generateClient<Schema>();
      }

      // Try to get the user from our database
      const { data: users } = await client.models.User.list({
        filter: {
          email: {
            eq: cognitoUser.attributes.email
          }
        }
      });

      // If user doesn't exist in our database, create them
      if (!users || users.length === 0) {
        console.log('User not found in database, creating...');
        await client.models.User.create({
          email: cognitoUser.attributes.email,
          nickname: cognitoUser.attributes.nickname || cognitoUser.attributes.email,
          status: 'online',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        console.log('✅ User created in database');
      } else {
        console.log('✅ User already exists in database');
      }
    } catch (error) {
      console.error('Error ensuring user exists:', error);
      // Don't throw error here to avoid breaking the login flow
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
    return <ChatApp user={user} />;
  }

  return <LoginForm />;
}