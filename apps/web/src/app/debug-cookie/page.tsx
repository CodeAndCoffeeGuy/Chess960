'use client';

import { useEffect, useState } from 'react';

export default function DebugCookiePage() {
  const [cookies, setCookies] = useState<string>('');
  const [authToken, setAuthToken] = useState<string>('');
  const [validationResult, setValidationResult] = useState<any>(null);

  useEffect(() => {
    const checkCookies = () => {
      // Get all cookies
      const allCookies = document.cookie;
      setCookies(allCookies);
      
      // Extract auth token
      const token = allCookies.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1];
      setAuthToken(token || 'No token found');
      
      // Test token validation
      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            setValidationResult({
              success: true,
              payload,
              hasUserId: !!payload.userId,
              hasType: !!payload.type,
              typeValue: payload.type
            });
          } else {
            setValidationResult({
              success: false,
              error: 'Invalid JWT format',
              partsCount: parts.length
            });
          }
        } catch (error) {
          setValidationResult({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      } else {
        setValidationResult({
          success: false,
          error: 'No token found'
        });
      }
    };

    // First check if cookies already exist
    checkCookies();
    
    // If no cookies found, try to set them by calling the API
    if (!document.cookie.includes('auth-token')) {
      fetch('/api/debug-cookie')
        .then(response => response.json())
        .then(data => {
          console.log('Debug cookie API response:', data);
          // Check cookies again after API call
          setTimeout(checkCookies, 100);
        })
        .catch(error => {
          console.error('Failed to set debug cookies:', error);
        });
    }
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Cookie Debug Page</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">All Cookies:</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
            {cookies || 'No cookies found'}
          </pre>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-2">Auth Token:</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
            {authToken}
          </pre>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-2">Validation Result:</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
            {JSON.stringify(validationResult, null, 2)}
          </pre>
        </div>
        
        <div>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
}
