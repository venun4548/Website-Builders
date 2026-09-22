'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Star, CheckCircle2, ShieldCheck, MessageSquare, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ClientSatisfactionSurveyPage() {
  const params = useParams();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [surveyInfo, setSurveyInfo] = useState<any>(null);
  const [submitted, setSubmitted] = useState(false);

  // Form ratings (1-5)
  const [overall, setOverall] = useState(5);
  const [communication, setCommunication] = useState(5);
  const [quality, setQuality] = useState(5);
  const [timeliness, setTimeliness] = useState(5);
  const [support, setSupport] = useState(5);
  const [recommend, setRecommend] = useState(true);
  const [comments, setComments] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch(`/api/survey/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Survey not found');
        setSurveyInfo(data.survey);
        if (data.survey.isSubmitted) {
          setSubmitted(true);
        }
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/survey/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scoreOverall: overall,
          scoreCommunication: communication,
          scoreQuality: quality,
          scoreTimeliness: timeliness,
          scoreSupport: support,
          recommend: recommend ? 'true' : 'false',
          comments,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit feedback');

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderRatingGroup = (
    label: string,
    value: number,
    onChange: (val: number) => void,
    description: string
  ) => {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-200">{label}</label>
          <span className="text-xs font-bold text-blue-400">{value} / 5</span>
        </div>
        <p className="text-xs text-slate-400">{description}</p>
        <div className="flex items-center gap-2 pt-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className={`p-2 rounded-xl transition-all ${
                star <= value
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-slate-900 text-slate-600 border border-slate-800 hover:text-slate-400'
              }`}
            >
              <Star className="w-5 h-5 fill-current" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2 text-blue-500" /> Loading survey...
      </div>
    );
  }

  if (error && !surveyInfo) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Survey Unavailable</h2>
          <p className="text-xs text-slate-400">{error}</p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
          >
            Go to Website Builders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-md">
        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white">Thank You for Your Feedback!</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              Your feedback directly guides our engineering team as we continue refining our digital deliverables and client support.
            </p>
            <div className="pt-4">
              <Link
                href="/user/dashboard"
                className="inline-block px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
              >
                Return to Client Portal
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
                <ShieldCheck className="w-4 h-4" /> Website Builders Client Satisfaction
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Project Launch Review
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Hello {surveyInfo?.clientName}, please take a moment to evaluate your experience with our team.
              </p>
            </div>

            <div className="space-y-6 divide-y divide-slate-800/80">
              <div className="pt-2">
                {renderRatingGroup(
                  '1. Overall Satisfaction',
                  overall,
                  setOverall,
                  'How satisfied are you with the overall outcome of your project?'
                )}
              </div>

              <div className="pt-6">
                {renderRatingGroup(
                  '2. Communication & Transparency',
                  communication,
                  setCommunication,
                  'How clear, responsive, and transparent was our team during development?'
                )}
              </div>

              <div className="pt-6">
                {renderRatingGroup(
                  '3. Engineering & UI Quality',
                  quality,
                  setQuality,
                  'How would you rate the speed, design aesthetic, and technical reliability?'
                )}
              </div>

              <div className="pt-6">
                {renderRatingGroup(
                  '4. Timeliness & Deadlines',
                  timeliness,
                  setTimeliness,
                  'Were milestones and delivery expectations met predictably?'
                )}
              </div>

              <div className="pt-6">
                {renderRatingGroup(
                  '5. Post-Launch Support & Handover',
                  support,
                  setSupport,
                  'How confident are you with your platform documentation and ongoing support?'
                )}
              </div>

              <div className="pt-6 space-y-2">
                <label className="text-sm font-semibold text-slate-200 block">
                  6. Would you recommend Website Builders to other businesses?
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setRecommend(true)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      recommend
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    Yes, definitely
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecommend(false)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      !recommend
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    No / Not yet
                  </button>
                </div>
              </div>

              <div className="pt-6 space-y-2">
                <label className="text-sm font-semibold text-slate-200 block">
                  7. Additional Comments & Testimonial Remarks
                </label>
                <textarea
                  rows={4}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Share any highlights, suggestions, or comments..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting Review...
                </>
              ) : (
                'Submit Verified Client Review'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
