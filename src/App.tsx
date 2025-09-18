import React, { useState } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import { AuthWrapper } from './components/Auth/AuthWrapper';
import { MockAuthWrapper } from './components/Auth/MockAuthWrapper';
import { FlaskConical } from 'lucide-react';
import './lib/amplify';

function App() {
  const [isLoadTestMode, setIsLoadTestMode] = useState(false);
  const [showLoadTestButton, setShowLoadTestButton] = useState(true);

  if (isLoadTestMode) {
    return (
      <div className="relative">
        <MockAuthWrapper onUserSelected={() => setShowLoadTestButton(false)} />
        {showLoadTestButton && (
          <button
            onClick={() => {
              setIsLoadTestMode(false);
              setShowLoadTestButton(true); // Reset button visibility when exiting
            }}
            className="fixed bottom-4 right-4 bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg transition-colors z-50"
            title="Exit Load Test Mode"
          >
            <p>Working on Load Testing Mode</p>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <Authenticator.Provider>
        <AuthWrapper />
      </Authenticator.Provider>
      
      {/* Load Test Button */}
      <button
        onClick={() => setIsLoadTestMode(true)}
        className="fixed bottom-4 right-4 bg-green-500 hover:bg-green-600 text-white p-3 rounded-full shadow-lg transition-colors z-50"
        title="Enter Load Test Mode"
      >
        <p>Load Testing</p>
      </button>
    </div>
  );
}

export default App;