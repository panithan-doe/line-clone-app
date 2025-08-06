import React, { useState } from 'react';
import { signUp, confirmSignUp, signIn } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import { User, Mail, Lock, Key } from 'lucide-react';
import type { Schema } from '../../../amplify/data/resource';

interface SignUpFormProps {
  goBack: () => void;
  onAuthSuccess?: () => void;
}

export function SignUpForm({ goBack, onAuthSuccess }: SignUpFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const client = generateClient<Schema>();

  const handleSignUp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    console.log('client: ', client);

    setIsLoading(true);
    setError('');
    
    try {
      const signUpResult = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
          },
        },
      });
      
      console.log('✅ Sign-up successful:', signUpResult);
      
      setStep('confirm');
    } catch (err: any) {
      console.error('❌ Sign-up failed:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setIsLoading(true);
    setError('');
    
    try {
      // Step 1: Confirm sign up
      console.log('📨 Confirming sign up...');
      await confirmSignUp({ username: email, confirmationCode: code });
      console.log('✅ Confirmation successful!');
      
      // Step 2: Sign in to get authentication token
      console.log('🔐 Signing in...');
      await signIn({ username: email, password });
      console.log('✅ Sign in successful!');
      
      // Step 3: Create user record in DynamoDB (now we have auth token)
      console.log('👤 Creating user record in DynamoDB...');
      try {
        const createUserResult = await client.mutations.createUserAccount({
          email: email,
          nickname: email // Use email as default nickname
        });
        console.log('✅ User created in DynamoDB:', createUserResult);
      } catch (createError) {
        console.error('⚠️ Error creating user in DynamoDB:', createError);
        // Continue with login even if user creation fails
      }
      
      console.log('🔄 Refreshing authentication state...');
      
      // Use callback to refresh auth state instead of page reload
      if (onAuthSuccess) {
        onAuthSuccess();
      } else {
        window.location.reload(); // fallback
      }
      
    } catch (err: any) {
      console.error('❌ Confirmation failed:', err);
      console.error('📋 Error details:', JSON.stringify(err, null, 2));
      setError(err.message || 'An error occurred during confirmation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-green-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h1>
          <p className="text-gray-600">Join the LINE Clone experience</p>
        </div>

        <div className="space-y-6">
          {step === 'form' ? (
            <>
              <form onSubmit={handleSignUp} className="space-y-6">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    disabled={isLoading}
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
                    disabled={isLoading}
                  />
                </div>

                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                <button
                  type='submit'
                  disabled={isLoading}
                  className="w-full bg-green-500 text-white py-3 rounded-2xl font-semibold hover:bg-green-600 transition-colors transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating Account...' : 'Sign Up'}
                </button>
              </form>
            </>
          ) : (
            <>
              <form onSubmit={handleConfirm} className='space-y-6'>
                <div className="text-center mb-4">
                  <p className="text-gray-600">
                    Please check your email for the confirmation code
                  </p>
                </div>

                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Confirmation Code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    disabled={isLoading}
                  />
                </div>

                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                <button
                  type='submit'
                  disabled={isLoading}
                  className="w-full bg-green-500 text-white py-3 rounded-2xl font-semibold hover:bg-green-600 transition-colors transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Confirming...' : 'Confirm Code'}
                </button>
              </form>
            </>
          )}

          <button
            onClick={goBack}
            disabled={isLoading}
            className="w-full mt-4 text-green-500 font-semibold hover:text-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}