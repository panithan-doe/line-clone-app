import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { signIn, getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { ChatApp } from '../Chat/ChatApp';
import { MessageCircle, Mail, Lock } from 'lucide-react';
import type { Schema } from '../../../amplify/data/resource';

interface MockAuthWrapperProps {
  onUserSelected?: () => void;
}

export function MockAuthWrapper({ onUserSelected }: MockAuthWrapperProps) {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authStep, setAuthStep] = useState<'cognito' | 'mock'>('cognito');
  const client = generateClient<Schema>();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      await getCurrentUser();
      await fetchUserAttributes();
      setIsAuthenticated(true);
      setAuthStep('mock');
    } catch (error) {
      setIsAuthenticated(false);
      setAuthStep('cognito');
    }
  };

  const handleCognitoLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    setIsLoading(true);
    setError('');

    try {
      await signIn({ 
        username: 'testuser@loadtest.com', 
        password: 'LoadTest123!' 
      });
      setIsAuthenticated(true);
      setAuthStep('mock');
    } catch (err: any) {
      console.error('Cognito login error:', err);
      setError('Failed to authenticate with Cognito. Make sure the test user exists.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMockLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    setIsLoading(true);
    setError('');

    try {
      // Query for user with the provided email and owner = testuser@loadtest.com
      const response = await client.models.User.list({
        filter: {
          and: [
            { email: { eq: email } },
            { owner: { eq: 'testuser@loadtest.com' } }
          ]
        }
      });
      
      const users = response.data || [];
      
      if (users.length === 0) {
        setError('Test user not found. Please check the email address.');
        return;
      }
      
      const user = users[0];
      console.log(`🔐 Mock login as: ${user.email} (${user.nickname})`);
      setSelectedUser(user);
      
      // Notify parent component that user has been selected
      if (onUserSelected) {
        onUserSelected();
      }
      
    } catch (err: any) {
      console.error('Mock login error:', err);
      setError('Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log('🚪 Mock logout');
    setSelectedUser(null);
    setEmail('');
    setError('');
  };

  if (!selectedUser) {
    if (authStep === 'cognito') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-green-600 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Cognito Auth Required</h1>
              <p className="text-gray-600">First, authenticate with Cognito to access DynamoDB</p>
            </div>

            <form onSubmit={handleCognitoLogin} className="space-y-6">
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 rounded-2xl font-semibold transition-colors transform
                  ${isLoading
                    ? 'bg-green-400 cursor-not-allowed opacity-75'
                    : 'bg-green-500 hover:bg-green-600 hover:scale-105 active:scale-95'
                  } text-white`}
              >
                {isLoading ? 'Authenticating...' : 'Authenticate with Cognito'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">
                  🔐 Using testuser@loadtest.com
                </p>
                <p className="text-xs text-gray-400">
                  This provides the authentication token needed to access DynamoDB
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-green-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Load Test Login</h1>
            <p className="text-gray-600">Enter test user email to continue</p>
          </div>

          <form onSubmit={handleMockLogin} className="space-y-6">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                placeholder="Test user email (e.g., testuser1@loadtest.com)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                disabled={isLoading}
                required
              />
            </div>

            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

            <button
              type="submit"
              disabled={isLoading || !email}
              className={`w-full py-3 rounded-2xl font-semibold transition-colors transform
                ${isLoading || !email
                  ? 'bg-green-400 cursor-not-allowed opacity-75'
                  : 'bg-green-500 hover:bg-green-600 hover:scale-105 active:scale-95'
                } text-white`}
            >
              {isLoading ? 'Signing In...' : 'Mock Sign In'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">
                💡 Mock authentication for load testing
              </p>
              <p className="text-xs text-gray-400">
                Valid emails: testuser1@loadtest.com to testuser100@loadtest.com
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Create a mock user object that mimics Cognito user structure
  const mockUser = {
    username: selectedUser.email,
    attributes: {
      email: selectedUser.email,
      nickname: selectedUser.nickname,
    },
    // Add mock Cognito properties that ChatApp might expect
    userId: selectedUser.email,
    signInDetails: {
      loginId: selectedUser.email,
    },
    // Add logout function for testing
    mockLogout: logout
  };

  return <ChatApp user={mockUser} />;
}