'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User, Bell, Palette, Shield, CreditCard, Key, Check, Eye, EyeOff } from 'lucide-react';
import { ThemeSettings } from '@/components/settings/ThemeSettings';
import { subscribeToPush, unsubscribeFromPush } from '@/lib/push';

// Custom Checkbox Component
const CustomCheckbox = ({ checked, onChange, className = '' }: { checked: boolean; onChange: (checked: boolean) => void; className?: string }) => {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-3 h-3 rounded border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
        checked
          ? 'bg-orange-500/20 border-orange-500 hover:bg-orange-500/30'
          : 'bg-[#2b2824] light:bg-white border-[#4a453e] light:border-[#d4caba] hover:border-[#5a5449] light:hover:border-[#a0958a]'
      } ${className}`}
    >
      {checked && (
        <Check className="absolute inset-0 w-2 h-2 text-orange-500 m-auto" strokeWidth={3} />
      )}
    </button>
  );
};

type SettingsTab = 'account' | 'preferences' | 'privacy' | 'notifications' | 'security' | 'subscription';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');

  // Account settings
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [country] = useState('');
  const [countrySearch, setCountrySearch] = useState<string | null>(null);

  // Privacy settings
  const [allowMessages, setAllowMessages] = useState(true);
  const [allowGameMessages, setAllowGameMessages] = useState(true);
  const [allowChallenges, setAllowChallenges] = useState<'NEVER' | 'RATING_RANGE' | 'FRIENDS_ONLY' | 'REGISTERED' | 'EVERYONE'>('REGISTERED');
  const [allowTakebacks, setAllowTakebacks] = useState(true);

  // Notifications
  const [pushNotifications, setPushNotifications] = useState(true);
  const [pushSyncing, setPushSyncing] = useState(false);
  const [gameNotifications, setGameNotifications] = useState(true);
  const [tournamentNotifications, setTournamentNotifications] = useState(true);

  // Security
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hasPassword] = useState(true);

  // Subscription
  const [hasActiveSubscription] = useState(false);
  
  // Message state
  const [message, setMessage] = useState('');

  // Handle form submissions
  const handleSave = async (type: string) => {
    try {
      setMessage('Saving...');
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage(`${type} saved successfully!`);
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Save error:', error);
      setMessage(`Failed to save ${type}. Please try again.`);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (session?.user) {
      const user = session.user as any;
      setUsername(user.handle || '');
      // Load user data here
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#1f1d1a] light:bg-[#f5f1ea] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'account' as SettingsTab, label: 'Account', icon: User },
    { id: 'preferences' as SettingsTab, label: 'Preferences', icon: Palette },
    { id: 'privacy' as SettingsTab, label: 'Privacy', icon: Shield },
    { id: 'notifications' as SettingsTab, label: 'Notifications', icon: Bell },
    { id: 'security' as SettingsTab, label: 'Security', icon: Key },
    ...(hasActiveSubscription ? [{ id: 'subscription' as SettingsTab, label: 'Subscription', icon: CreditCard }] : []),
  ];

  return (
    <div className="min-h-screen bg-[#1f1d1a] light:bg-[#f5f1ea] text-white light:text-black py-4 sm:py-8 md:py-12">
      <div className="max-w-5xl mx-auto px-3 sm:px-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent mb-4 sm:mb-6 md:mb-8">
          Settings
        </h1>

        {/* Message Display */}
        {message && (
          <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg border ${
            message.includes('success') || message.includes('Success')
              ? 'bg-green-900/20 border-green-500/50 text-green-300'
              : 'bg-red-900/20 border-red-500/50 text-red-300'
          }`}>
            <div className="flex items-center space-x-2">
              {message.includes('success') || message.includes('Success') ? (
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-sm font-medium">{message}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 sm:space-x-2 mb-4 sm:mb-6 md:mb-8 border-b border-[#3e3a33] light:border-[#d4caba] overflow-x-auto scrollbar-hide pb-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === id
                  ? 'bg-orange-600 text-white'
                  : 'text-[#c1b9ad] light:text-[#4a453e] hover:text-white light:hover:text-black hover:bg-[#33302c] light:hover:bg-[#f0ebe0]'
              }`}
            >
              <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row lg:space-x-8">
          {/* Sidebar Navigation */}
          <aside className="w-full lg:w-64 mb-8 lg:mb-0">
            <nav className="bg-[#2a2723] light:bg-white rounded-xl p-4 shadow-lg border border-[#3e3a33] light:border-[#d4caba]">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center space-x-3 px-4 py-3 w-full text-left rounded-lg transition-colors ${
                    activeTab === id
                      ? 'bg-orange-600 text-white'
                      : 'text-[#c1b9ad] light:text-[#4a453e] hover:text-white light:hover:text-black hover:bg-[#33302c] light:hover:bg-[#f0ebe0]'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 bg-[#2a2723] light:bg-white rounded-xl p-6 sm:p-8 shadow-lg border border-[#3e3a33] light:border-[#d4caba]">
            {activeTab === 'account' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white light:text-black mb-4">Account Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#c1b9ad] light:text-[#5a5449] mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                      className="w-full px-3 py-2 bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-lg text-white light:text-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#c1b9ad] light:text-[#5a5449] mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-lg text-white light:text-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#c1b9ad] light:text-[#5a5449] mb-2">
                      Bio
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-lg text-white light:text-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Tell us about yourself"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#c1b9ad] light:text-[#5a5449] mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      value={countrySearch !== null ? countrySearch : country}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      className="w-full px-3 py-2 bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-lg text-white light:text-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Search for your country"
                    />
                  </div>

                  <button className="w-full sm:w-auto bg-gradient-to-br from-[#35322e] to-[#2a2926] light:from-white light:to-[#faf7f2] border border-[#474239] light:border-[#d4caba] hover:border-orange-300 text-white light:text-black hover:bg-[#3a3632] light:hover:bg-[#f5f1ea] px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base">
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white light:text-black mb-4">Privacy Settings</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-[#c1b9ad] light:text-[#5a5449]">
                        Allow Messages
                      </label>
                      <p className="text-xs text-[#a0958a] light:text-[#6b6460]">
                        Allow other players to send you messages
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={allowMessages}
                      onChange={(e) => setAllowMessages(e.target.checked)}
                      className="w-4 h-4 text-orange-600 bg-[#35322e] light:bg-white border-[#474239] light:border-[#d4caba] rounded focus:ring-orange-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-[#c1b9ad] light:text-[#5a5449]">
                        Allow Game Messages
                      </label>
                      <p className="text-xs text-[#a0958a] light:text-[#6b6460]">
                        Allow messages during games
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={allowGameMessages}
                      onChange={(e) => setAllowGameMessages(e.target.checked)}
                      className="w-4 h-4 text-orange-600 bg-[#35322e] light:bg-white border-[#474239] light:border-[#d4caba] rounded focus:ring-orange-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-[#c1b9ad] light:text-[#5a5449]">
                        Allow Challenges
                      </label>
                      <p className="text-xs text-[#a0958a] light:text-[#6b6460]">
                        Allow other players to challenge you
                      </p>
                    </div>
                    <select
                      value={allowChallenges}
                      onChange={(e) => setAllowChallenges(e.target.value as any)}
                      className="px-3 py-2 bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-lg text-white light:text-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="NEVER">Never</option>
                      <option value="RATING_RANGE">Rating Range</option>
                      <option value="FRIENDS_ONLY">Friends Only</option>
                      <option value="REGISTERED">Registered Users</option>
                      <option value="EVERYONE">Everyone</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-[#c1b9ad] light:text-[#5a5449]">
                        Allow Takebacks
                      </label>
                      <p className="text-xs text-[#a0958a] light:text-[#6b6460]">
                        Allow opponents to request takebacks
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={allowTakebacks}
                      onChange={(e) => setAllowTakebacks(e.target.checked)}
                      className="w-4 h-4 text-orange-600 bg-[#35322e] light:bg-white border-[#474239] light:border-[#d4caba] rounded focus:ring-orange-500"
                    />
                  </div>

                  <button className="w-full sm:w-auto bg-gradient-to-br from-[#35322e] to-[#2a2926] light:from-white light:to-[#faf7f2] border border-[#474239] light:border-[#d4caba] hover:border-orange-300 text-white light:text-black hover:bg-[#3a3632] light:hover:bg-[#f5f1ea] px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base">
                    Save Privacy Settings
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white light:text-black mb-4">Security Settings</h2>
                
                <div className="mb-4 p-3 bg-gray-800 light:bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-300 light:text-gray-600">
                    {hasPassword ? 'You have a password set for your account.' : 'No password is set for your account.'}
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#c1b9ad] light:text-[#5a5449] mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3 py-2 pr-10 bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-lg text-white light:text-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#c1b9ad] light:text-[#5a5449] mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 pr-10 bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-lg text-white light:text-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#c1b9ad] light:text-[#5a5449] mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 pr-10 bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-lg text-white light:text-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button className="w-full sm:w-auto bg-gradient-to-br from-[#35322e] to-[#2a2926] light:from-white light:to-[#faf7f2] border border-[#474239] light:border-[#d4caba] hover:border-orange-300 text-white light:text-black hover:bg-[#3a3632] light:hover:bg-[#f5f1ea] px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base">
                    Change Password
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white light:text-black mb-4">Theme Settings</h2>
                <ThemeSettings className="mt-6" />
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-[#35322e]/50 light:bg-white/50 backdrop-blur-sm rounded-2xl border border-[#474239] light:border-[#d4caba] p-4 sm:p-5 md:p-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-white light:text-black mb-4 sm:mb-6">Notification Settings</h2>

                    <div className="space-y-4 sm:space-y-6">
                    <div>
                      <label className="flex items-center justify-between cursor-pointer group">
                        <div className="flex-1 mr-4">
                          <div className="text-xs sm:text-sm font-medium text-[#c1b9ad] light:text-[#5a5449] mb-1">
                            Push Notifications
                          </div>
                          <div className="text-xs sm:text-sm text-[#a0958a] light:text-[#5a5449]">
                            Receive push notifications in your browser
                          </div>
                        </div>
                        <CustomCheckbox
                          checked={pushNotifications}
                          onChange={setPushNotifications}
                        />
                      </label>
                        <div className="mt-2">
                          <button
                            type="button"
                            disabled={pushSyncing}
                            onClick={async () => {
                              setPushSyncing(true);
                              try {
                                if (pushNotifications) {
                                  await subscribeToPush();
                                } else {
                                  await unsubscribeFromPush();
                                }
                              } finally {
                                setPushSyncing(false);
                              }
                            }}
                            className="px-3 py-1.5 text-xs border border-[#474239] light:border-[#d4caba] rounded hover:bg-[#2a2723] light:hover:bg-[#f5f1ea]"
                          >
                            {pushSyncing ? 'Syncing…' : 'Sync device'}
                          </button>
                        </div>
                    </div>

                    <div className="border-t border-[#3e3a33] light:border-[#d4caba] pt-4 sm:pt-6">
                      <label className="flex items-center justify-between cursor-pointer group">
                        <div className="flex-1 mr-4">
                          <div className="text-xs sm:text-sm font-medium text-[#c1b9ad] light:text-[#5a5449] mb-1">
                            Game Notifications
                          </div>
                          <div className="text-xs sm:text-sm text-[#a0958a] light:text-[#5a5449]">
                            Notifications about your games (moves, results, etc.)
                          </div>
                        </div>
                        <CustomCheckbox
                          checked={gameNotifications}
                          onChange={setGameNotifications}
                        />
                      </label>
                    </div>

                    <div className="border-t border-[#3e3a33] light:border-[#d4caba] pt-4 sm:pt-6">
                      <label className="flex items-center justify-between cursor-pointer group">
                        <div className="flex-1 mr-4">
                          <div className="text-xs sm:text-sm font-medium text-[#c1b9ad] light:text-[#5a5449] mb-1">
                            Tournament Notifications
                          </div>
                          <div className="text-xs sm:text-sm text-[#a0958a] light:text-[#5a5449]">
                            Notifications about tournaments and events
                          </div>
                        </div>
                        <CustomCheckbox
                          checked={tournamentNotifications}
                          onChange={setTournamentNotifications}
                        />
                      </label>
                    </div>

                    <button
                      onClick={() => handleSave('Notification settings')}
                      className="w-full bg-orange-600 text-white py-2.5 sm:py-3 px-4 text-sm sm:text-base rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      Save Notification Settings
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white light:text-black mb-4">Account Settings</h2>
                <div className="text-center">
                  <p className="text-[#a0958a] light:text-[#5a5449]">Account settings coming soon...</p>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white light:text-black mb-4">Privacy Settings</h2>
                <div className="text-center">
                  <p className="text-[#a0958a] light:text-[#5a5449]">Privacy settings coming soon...</p>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white light:text-black mb-4">Security Settings</h2>
                <div className="text-center">
                  <p className="text-[#a0958a] light:text-[#5a5449]">Security settings coming soon...</p>
                </div>
              </div>
            )}

            {activeTab === 'subscription' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white light:text-black mb-4">Subscription</h2>
                <div className="text-center">
                  <p className="text-[#a0958a] light:text-[#5a5449]">Subscription settings coming soon...</p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}