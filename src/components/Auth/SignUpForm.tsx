import React, { useState } from 'react';
import { signUp, confirmSignUp } from 'aws-amplify/auth';
import { User, Mail, Lock, Key } from 'lucide-react';

export function SignUpForm({ goBack }: { goBack: () => void }) {
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    try {
      await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            nickname,
          },
        },
      });
      setStep('confirm');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleConfirm = async () => {
    try {
      await confirmSignUp({ username: email, confirmationCode: code });
      goBack();
    } catch (err: any) {
      setError(err.message);
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
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
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

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}

              <button
                onClick={handleSignUp}
                className="w-full bg-green-500 text-white py-3 rounded-2xl font-semibold hover:bg-green-600 transition-colors transform hover:scale-105 active:scale-95"
              >
                Sign Up
              </button>
            </>
          ) : (
            <>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Confirmation Code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}

              <button
                onClick={handleConfirm}
                className="w-full bg-green-500 text-white py-3 rounded-2xl font-semibold hover:bg-green-600 transition-colors transform hover:scale-105 active:scale-95"
              >
                Confirm Code
              </button>
            </>
          )}

          <button
            onClick={goBack}
            className="w-full mt-4 text-green-500 font-semibold hover:text-green-600 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
