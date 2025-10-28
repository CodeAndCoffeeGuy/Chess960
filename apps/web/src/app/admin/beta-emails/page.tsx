'use client';

import { useState, useEffect } from 'react';

interface BetaEmail {
  id: string;
  email: string;
  createdAt: string;
  isNotified: boolean;
  notifiedAt: string | null;
}

export default function BetaEmailsPage() {
  const [emails, setEmails] = useState<BetaEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBetaEmails();
  }, []);

  const fetchBetaEmails = async () => {
    try {
      const response = await fetch('/api/admin/beta-emails');
      if (response.ok) {
        const data = await response.json();
        setEmails(data.emails);
      } else {
        const errorData = await response.json();
        setError(`Failed to fetch beta emails: ${errorData.error}`);
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const sendNotifications = async () => {
    if (!confirm('Send notifications to all beta subscribers?')) return;
    
    try {
      const response = await fetch('/api/admin/beta-notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: 'Chess960 Beta is Ready! 🎉',
          htmlContent: `
            <h1>Chess960 Beta is Ready!</h1>
            <p>Thank you for your interest in Chess960! The platform is now ready for beta testing.</p>
            <p>You can now create an account and start playing Chess960 games.</p>
            <a href="https://chess960.game" style="background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Start Playing Now</a>
          `
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Notifications sent to ${result.sentEmails?.length || 0} emails`);
        fetchBetaEmails(); // Refresh the list
      } else {
        const errorData = await response.json();
        alert(`Failed to send notifications: ${errorData.error}`);
      }
    } catch {
      alert('Error sending notifications');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Beta Email Subscribers</h1>
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Beta Email Subscribers</h1>
          <div className="flex gap-4">
            <button
              onClick={fetchBetaEmails}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={sendNotifications}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Send Notifications
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-600/20 border border-red-400/40 text-red-300 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <div className="grid grid-cols-4 gap-4 font-semibold text-sm text-gray-300">
              <div>Email</div>
              <div>Signed Up</div>
              <div>Status</div>
              <div>Notified</div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-700">
            {emails.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-400">
                No beta emails found
              </div>
            ) : (
              emails.map((email) => (
                <div key={email.id} className="px-6 py-4 hover:bg-gray-700/50 transition-colors">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div className="font-mono text-blue-300">{email.email}</div>
                    <div className="text-gray-300">
                      {new Date(email.createdAt).toLocaleDateString()}
                    </div>
                    <div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        email.isNotified 
                          ? 'bg-green-600/20 text-green-300' 
                          : 'bg-yellow-600/20 text-yellow-300'
                      }`}>
                        {email.isNotified ? 'Notified' : 'Pending'}
                      </span>
                    </div>
                    <div className="text-gray-300">
                      {email.notifiedAt 
                        ? new Date(email.notifiedAt).toLocaleDateString()
                        : '-'
                      }
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 text-sm text-gray-400">
          Total subscribers: {emails.length} | 
          Notified: {emails.filter(e => e.isNotified).length} | 
          Pending: {emails.filter(e => !e.isNotified).length}
        </div>
      </div>
    </div>
  );
}
