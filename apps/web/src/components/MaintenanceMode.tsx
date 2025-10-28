'use client';

import { useState, useEffect } from 'react';

interface MaintenanceStatus {
  maintenance: boolean;
  message: string;
  timestamp: string;
}

export function MaintenanceMode() {
  const [maintenanceStatus, setMaintenanceStatus] = useState<MaintenanceStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkMaintenanceStatus = async () => {
      try {
        // Check maintenance status from the WebSocket server
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://chess960-ws.fly.dev';
        const httpUrl = wsUrl.replace('wss://', 'https://').replace('ws://', 'http://');
        
        const response = await fetch(`${httpUrl}/maintenance`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
          const data = await response.json();
          setMaintenanceStatus(data);
        }
      } catch (error) {
        console.warn('Could not check maintenance status:', error);
        // If we can't check, assume no maintenance mode
        setMaintenanceStatus({ maintenance: false, message: 'Server is operational.', timestamp: new Date().toISOString() });
      } finally {
        setIsLoading(false);
      }
    };

    checkMaintenanceStatus();
  }, []);

  if (isLoading) {
    return null; // Don't show anything while loading
  }

  if (!maintenanceStatus?.maintenance) {
    return null; // Don't show maintenance mode if not in maintenance
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1f1d1a] light:bg-[#f5f1ea] border-2 border-orange-300 rounded-lg p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-orange-300/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white light:text-black mb-2">
            Server Maintenance
          </h2>
          <p className="text-[#b6aea2] light:text-[#5a5449]">
            {maintenanceStatus.message}
          </p>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-[#8a8275] light:text-[#7a7368]">
            We're currently preparing for our official launch. Games will be available soon!
          </p>
          
          <div className="bg-[#2a2722] light:bg-[#e8e2d8] rounded-lg p-4">
            <h3 className="font-semibold text-white light:text-black mb-2">
              What's Coming:
            </h3>
            <ul className="text-sm text-[#b6aea2] light:text-[#5a5449] space-y-1 text-left">
              <li>• Real-time multiplayer chess</li>
              <li>• Chess960 (Fischer Random) support</li>
              <li>• Tournament system</li>
              <li>• Rating system</li>
              <li>• And much more!</li>
            </ul>
          </div>
          
          <p className="text-xs text-[#8a8275] light:text-[#7a7368]">
            Check back tomorrow for the full experience!
          </p>
        </div>
      </div>
    </div>
  );
}
