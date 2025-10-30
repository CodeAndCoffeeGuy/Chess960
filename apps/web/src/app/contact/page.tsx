'use client';

// import { Metadata } from 'next';
import { useState } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setSubmitStatus('error');
      }
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-[#1f1d1a] light:bg-[#f5f1ea] text-white light:text-black">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-300 to-orange-400 bg-clip-text text-transparent mb-4">
            Contact Us
          </h1>
          <p className="text-xl text-[#b6aea2] light:text-[#5a5449] max-w-2xl mx-auto">
            We&apos;d love to hear from you. Get in touch with any questions, feedback, or suggestions.
          </p>
        </div>

        {/* Contact Form */}
        <div className="mb-16">
          <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-white light:text-black mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-[#2a2926] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-lg text-white light:text-black placeholder-[#6b6560] light:placeholder-[#a0958a] focus:outline-none focus:border-orange-300 transition-colors"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-[#2a2926] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-lg text-white light:text-black placeholder-[#6b6560] light:placeholder-[#a0958a] focus:outline-none focus:border-orange-300 transition-colors"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-white mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-[#2a2926] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-lg text-white light:text-black placeholder-[#6b6560] light:placeholder-[#a0958a] focus:outline-none focus:border-orange-300 transition-colors"
                  placeholder="What is this about?"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-white mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 bg-[#2a2926] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-lg text-white light:text-black placeholder-[#6b6560] light:placeholder-[#a0958a] focus:outline-none focus:border-orange-300 transition-colors resize-none"
                  placeholder="Your message..."
                />
              </div>

              {submitStatus === 'success' && (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                  Thank you for your message! We&apos;ll get back to you soon.
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  Something went wrong. Please try again or email us directly at support@chess960.game
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-orange-300 to-orange-400 hover:from-orange-600 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>

        {/* What to Contact Us About */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white light:text-black mb-6 text-center">What Can We Help You With?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-white light:text-black mb-3">Bug Reports</h3>
              <p className="text-[#a0958a] light:text-[#5a5449] text-sm">
                Encountered a technical issue? Let us know with details about what happened and we&apos;ll investigate.
              </p>
            </div>

            <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-white light:text-black mb-3">Feature Requests</h3>
              <p className="text-[#a0958a] light:text-[#5a5449] text-sm">
                Have an idea to improve Chess960? We&apos;re always looking for ways to enhance the platform.
              </p>
            </div>

            <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-white light:text-black mb-3">Account Issues</h3>
              <p className="text-[#a0958a] light:text-[#5a5449] text-sm">
                Problems with your account, rating, or game history? We&apos;re here to help resolve any issues.
              </p>
            </div>

            <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-white light:text-black mb-3">Fair Play</h3>
              <p className="text-[#a0958a] light:text-[#5a5449] text-sm">
                Suspect cheating or unfair play? Report it to us with game details for investigation.
              </p>
            </div>

            <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-white light:text-black mb-3">Partnerships</h3>
              <p className="text-[#a0958a] light:text-[#5a5449] text-sm">
                Interested in partnering or collaborating with Chess960? Let&apos;s talk.
              </p>
            </div>

            <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-white light:text-black mb-3">General Feedback</h3>
              <p className="text-[#a0958a] light:text-[#5a5449] text-sm">
                We value your opinion. Share your thoughts, suggestions, or just say hello!
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-[#35322e] light:bg-white border border-[#474239] light:border-[#d4caba] rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white light:text-black mb-4">Before You Contact Us</h2>
          <p className="text-[#a0958a] light:text-[#5a5449] mb-4">
            Please check our <a href="/faq" className="text-orange-300 hover:text-orange-400 transition-colors">FAQ page</a> first - you might find the answer to your question there.
          </p>
          <p className="text-[#b6aea2] light:text-[#5a5449] text-sm">
            When reporting bugs or issues, please include as much detail as possible: browser, device, steps to reproduce, and any error messages.
          </p>
        </div>
      </div>
    </div>
  );
}
