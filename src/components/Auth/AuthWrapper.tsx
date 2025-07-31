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

      // Check if user exists in our database
      await ensureUserExists(mergedUser);

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

  const ensureUserExists = async (cognitoUser: any) => {
    try {
      // Make sure client is initialized
      if (!client) {
        client = generateClient<Schema>();
      }

      // Try to get or create the user in our database
      try {
        
        // Try Lambda first for user verification (more reliable for user creation flow)
        let existingUser = null;
        try {
          const userResponse = await client.queries.verifyUser({
            email: cognitoUser.attributes.email
          });
          existingUser = userResponse?.data;
        } catch (lambdaError) {
          // If Lambda fails, try direct access
          try {
            const { data: directUser } = await client.models.User.get({
              email: cognitoUser.attributes.email
            });
            existingUser = directUser;
          } catch (directError) {
            // Continue with creation flow
          }
        }

        if (!existingUser) {
          
          // Try Lambda first as primary method
          try {
            const createResult = await client.mutations.createUserAfterAuth({
              email: cognitoUser.attributes.email,
              nickname: cognitoUser.attributes.email,
              
            });
          } catch (lambdaError) {
            // If Lambda fails, try direct model creation as fallback
            try {
              const { data: newUser } = await client.models.User.create({
                email: cognitoUser.attributes.email,
                nickname: cognitoUser.attributes.email,
                
                owner: cognitoUser.attributes.email, // Set owner for authorization
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
            } catch (directError) {
              throw directError;
            }
          }
        } else {
        }
      } catch (getUserError: any) {
        // If get fails, try to create - this handles the case where user might not exist
        if (getUserError.message && getUserError.message.includes('not found')) {
          try {
            const fallbackResult = await client.mutations.createUserAfterAuth({
              email: cognitoUser.attributes.email,
              nickname: cognitoUser.attributes.email, // Use email as default nickname
              description: ''
            });
          } catch (createError: any) {
            // If creation fails due to duplicate, that's fine - user already exists
            if (createError.message && createError.message.includes('duplicate')) {
            } else {
            }
          }
        } else {
        }
      }
      
    } catch (error) {
      // Don't throw error here to avoid breaking the login flow
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