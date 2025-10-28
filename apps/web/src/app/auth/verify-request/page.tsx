export default function VerifyRequestPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#1f1d1a] light:bg-[#f5f1ea] text-white light:text-black overflow-hidden">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0">
        {/* Subtle grid */}
        <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px] light:hidden" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.08)_1px,transparent_1px)] bg-[size:40px_40px] hidden light:block" />
        </div>
      </div>

      <div className="relative max-w-md w-full p-8 bg-[#35322e]/50 light:bg-white/90 backdrop-blur-sm rounded-2xl border border-[#474239] light:border-[#d4caba] shadow-[0_12px_34px_rgba(0,0,0,0.45)] light:shadow-[0_12px_34px_rgba(0,0,0,0.1)] text-center space-y-6">
        <div className="w-16 h-16 mx-auto bg-orange-500/20 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent mb-2">
            Check your email
          </h1>
          <p className="text-[#b6aea2] light:text-[#5a5449]">
            A sign-in link has been sent to your email address.
          </p>
        </div>

        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
          <p className="text-sm text-orange-300 light:text-orange-600">
            ✨ Click the magic link in your email to sign in instantly - no password needed!
          </p>
        </div>

        <div className="text-sm text-[#a0958a] light:text-[#5a5449] space-y-2">
          <p>Didn&apos;t receive an email?</p>
          <ul className="space-y-1">
            <li>• Check your spam folder</li>
            <li>• Make sure you entered the correct email</li>
            <li>• Wait a few minutes and try again</li>
          </ul>
        </div>

        <a
          href="/auth/signin"
          className="inline-block text-orange-500 hover:text-orange-400 light:hover:text-orange-600 transition-colors font-medium"
        >
          ← Back to sign in
        </a>
      </div>
    </div>
  );
}
