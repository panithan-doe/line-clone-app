import React, { useState } from 'react';
import { signIn, signOut } from 'aws-amplify/auth';
import { MessageCircle, Mail, Lock } from 'lucide-react';
import { SignUpForm } from './SignUpForm';

interface LoginFormProps {
  onAuthSuccess?: () => void;
}

export function LoginForm({ onAuthSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showSignUp, setShowSignUp] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    setIsLoading(true);
    setError('');

    try {
      // First, try to sign out any existing session to ensure clean state
      try {
        await signOut();
      } catch (signOutError) {
        // Ignore sign out errors if no user is signed in
      }
      
      // Now attempt to sign in with clean state
      await signIn({ username: email, password });
      // Use callback to refresh auth state instead of page reload
      if (onAuthSuccess) {
        onAuthSuccess();
      } else {
        window.location.reload(); // fallback
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err.message || 'Sign in failed');
      setIsLoading(false);
    }
  };

  // Show sign-up form if toggled
  if (showSignUp) return <SignUpForm goBack={() => setShowSignUp(false)} onAuthSuccess={onAuthSuccess} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-green-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">LINE Clone</h1>
          <p className="text-gray-600">Connect with friends and family</p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 rounded-2xl font-semibold transition-colors transfrom
              ${isLoading
                ? 'bg-green-400 cursor-not-allowed opacity-75 '
                : 'bg-green-500 hover:bg-green-600 hover:scale-105 active:scale-95'
              } text-white`}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>

        </form>
        
        <div className="text-center space-y-2 mt-6">
          <p className="text-gray-600">Don't have an account?</p>
          <button
            type="button"
            onClick={() => setShowSignUp(true)}
            className="text-green-500 font-semibold hover:text-green-600 transition-colors"
          >
            Create Account
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-500">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
