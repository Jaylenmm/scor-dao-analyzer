import React, { useState } from 'react';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { storeEmailSignup } from '../services/database';

const EmailSignup = ({ 
  onSuccess, 
  className = '', 
  source = 'landing_page',
  showSkipOption = true 
}) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const result = await storeEmailSignup(email, source);
      
      if (result.success) {
        setSubmitted(true);
        
        // Analytics tracking (optional)
        if (window.gtag) {
          window.gtag('event', 'email_signup', {
            'source': source,
            'email_domain': email.split('@')[1]
          });
        }

        // Call success callback after delay
        setTimeout(() => {
          if (onSuccess) onSuccess(result);
        }, 2000);
        
      } else {
        setError(result.message || 'Failed to store email');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Email submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={`text-center space-y-4 ${className}`}>
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Thanks for joining!</h3>
        <p className="text-gray-600">
          We'll keep you updated on scor's progress. Redirecting to the demo...
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-gray-900">Get Early Access Updates</h2>
        <p className="text-gray-600">
          Be the first to know when new features launch. No spam, just product updates.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg disabled:opacity-50"
            required
          />
          <button
            type="submit"
            disabled={isSubmitting || !email.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Joining...
              </>
            ) : (
              <>
                <Mail className="w-5 h-5" />
                Join Waitlist
              </>
            )}
          </button>
        </div>
        
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </form>
      
      {showSkipOption && (
        <div className="text-center">
          <button
            onClick={() => onSuccess && onSuccess({ skipped: true })}
            className="text-blue-600 hover:text-blue-500 font-medium transition-colors duration-300"
          >
            Skip and try the demo →
          </button>
        </div>
      )}
    </div>
  );
};

export default EmailSignup;