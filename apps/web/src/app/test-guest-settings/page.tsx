'use client';

import React from 'react';
import { GuestSettings } from '@/components/guest/GuestSettings';

export default function TestGuestSettingsPage() {
  return (
    <div className="min-h-screen bg-[#1f1d1a] light:bg-[#f5f1ea] text-white light:text-black p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Guest Settings Test</h1>
        
        <div className="bg-[#2a2720] light:bg-[#f5f1ea] rounded-xl p-8 border border-[#474239] light:border-[#d4caba]">
          <h2 className="text-xl font-semibold mb-4 text-[#c1b9ad] light:text-[#5a5449]">
            Test Guest Settings Component
          </h2>
          
          <p className="text-[#a0958a] light:text-[#8a7f6f] mb-6">
            Click the settings button below to test the guest settings modal:
          </p>
          
          <div className="flex justify-center">
            <GuestSettings />
          </div>
          
          <div className="mt-8 p-4 bg-[#35322e] light:bg-[#f0ebe0] rounded-lg">
            <h3 className="text-lg font-medium mb-2 text-[#c1b9ad] light:text-[#5a5449]">
              Features to Test:
            </h3>
            <ul className="list-disc list-inside space-y-1 text-[#a0958a] light:text-[#8a7f6f]">
              <li>Light/Dark theme toggle</li>
              <li>Board theme selection (16 themes)</li>
              <li>Live preview of selected theme</li>
              <li>Settings persistence in localStorage</li>
              <li>Modal open/close functionality</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
