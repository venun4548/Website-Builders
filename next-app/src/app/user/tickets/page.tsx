'use client';

import React, { useState, useEffect } from 'react';
import Pusher from 'pusher-js';
import {
  LifeBuoy,
  Plus,
  Send,
  Loader2,
  Clock,
  User,
  ShieldCheck,
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';

interface Ticket {
  id: string;
  subject: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  createdAt: string;
  updatedAt: string;
}

interface TicketMessage {
  id: string;
  ticketId: string;
  senderEmail: string;
  senderRole: 'client' | 'admin' | 'staff';
  message: string;
  timestamp: string;
}

export default function UserTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // New ticket modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newPriority, setNewPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [newInitialMessage, setNewInitialMessage] = useState('');
  const [creatingTicket, setCreatingTicket] = useState(false);

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/user/tickets');
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
        if (data.tickets && data.tickets.length > 0 && !selectedTicket) {
          loadTicketThread(data.tickets[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const loadTicketThread = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/user/tickets/${ticketId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedTicket(data.ticket);
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Failed to load ticket thread:', err);
    }
  };

  // Realtime Pusher subscription on open ticket
  useEffect(() => {
    if (!selectedTicket) return;

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2';

    if (pusherKey && !pusherKey.includes('mock')) {
      try {
        const pusher = new Pusher(pusherKey, { cluster });
        const channel = pusher.subscribe(`ticket-${selectedTicket.id}`);

        channel.bind('new-message', (newMsg: TicketMessage) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        });

        return () => {
          channel.unbind_all();
          channel.unsubscribe();
        };
      } catch (err) {
        console.warn('Pusher ticket subscribe error:', err);
      }
    }
  }, [selectedTicket?.id]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newInitialMessage.trim()) return;

    try {
      setCreatingTicket(true);
      const res = await fetch('/api/user/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newSubject.trim(),
          priority: newPriority,
          initialMessage: newInitialMessage.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTickets((prev) => [data.ticket, ...prev]);
        setSelectedTicket(data.ticket);
        setMessages([data.message]);
        setNewSubject('');
        setNewInitialMessage('');
        setShowCreateModal(false);
      }
    } catch (err) {
      console.error('Error creating ticket:', err);
    } finally {
      setCreatingTicket(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    try {
      setSendingReply(true);
      const res = await fetch(`/api/user/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyText.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setReplyText('');
      }
    } catch (err) {
      console.error('Error sending reply:', err);
    } finally {
      setSendingReply(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              WEBSITE BUILDERS
            </span>
            <div className="hidden sm:flex items-center gap-4 text-xs font-semibold">
              <a href="/user/projects" className="text-slate-400 hover:text-white transition-colors">
                Projects
              </a>
              <a href="/user/invoices" className="text-slate-400 hover:text-white transition-colors">
                Invoices
              </a>
              <a href="/user/tickets" className="text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg">
                Support
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <a
              href="/api/auth/logout"
              onClick={async (e) => {
                e.preventDefault();
                await fetch('/api/auth/logout', { method: 'POST' });
                window.location.href = '/user/login';
              }}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors"
            >
              Log Out
            </a>
          </div>
        </div>
      </nav>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Engineering Support Desk</h1>
            <p className="text-xs text-slate-400 mt-1">
              Direct communication thread with our design and development engineers.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> New Ticket
          </button>
        </div>

        {tickets.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 my-auto">
            <LifeBuoy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No tickets opened</h3>
            <p className="text-sm text-slate-400 mt-1">Need assistance or want changes? Open a support ticket anytime.</p>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
            {/* Tickets Sidebar List */}
            <div className="lg:col-span-4 bg-slate-900/70 border border-slate-800 rounded-3xl p-4 overflow-y-auto max-h-[600px] space-y-2">
              {tickets.map((tkt) => {
                const isSelected = selectedTicket?.id === tkt.id;
                return (
                  <button
                    key={tkt.id}
                    onClick={() => loadTicketThread(tkt.id)}
                    className={`w-full text-left p-4 rounded-2xl transition-all border ${
                      isSelected
                        ? 'bg-blue-600/15 border-blue-500/40 shadow-sm'
                        : 'bg-slate-950/40 border-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-blue-400">{tkt.id}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          tkt.status === 'Open'
                            ? 'bg-amber-500/20 text-amber-400'
                            : tkt.status === 'Resolved'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {tkt.status}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-white truncate">{tkt.subject}</p>
                    <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500">
                      <span>Priority: {tkt.priority}</span>
                      <span>{new Date(tkt.createdAt).toLocaleDateString()}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Ticket Chat Thread */}
            <div className="lg:col-span-8 bg-slate-900/70 border border-slate-800 rounded-3xl flex flex-col overflow-hidden">
              {selectedTicket ? (
                <>
                  {/* Thread Header */}
                  <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-400">{selectedTicket.id}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                          {selectedTicket.priority} Priority
                        </span>
                      </div>
                      <h2 className="text-base font-bold text-white mt-1">{selectedTicket.subject}</h2>
                    </div>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {selectedTicket.status}
                    </span>
                  </div>

                  {/* Messages Scroll Area */}
                  <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[420px]">
                    {messages.map((m) => {
                      const isClient = m.senderRole === 'client';
                      return (
                        <div
                          key={m.id}
                          className={`flex gap-3 ${isClient ? 'justify-end' : 'justify-start'}`}
                        >
                          {!isClient && (
                            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
                              <ShieldCheck className="w-4 h-4" />
                            </div>
                          )}
                          <div
                            className={`max-w-md p-4 rounded-2xl text-xs leading-relaxed ${
                              isClient
                                ? 'bg-blue-600 text-white rounded-br-none shadow-md'
                                : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-75">
                              <span className="font-semibold">{isClient ? 'You' : 'Engineering Team'}</span>
                              <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="whitespace-pre-wrap">{m.message}</p>
                          </div>
                          {isClient && (
                            <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 border border-slate-700">
                              <User className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Reply Input Form */}
                  <form onSubmit={handleSendReply} className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center gap-3">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your response to the engineering team..."
                      className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={sendingReply || !replyText.trim()}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-colors disabled:opacity-50"
                    >
                      {sendingReply ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      Send
                    </button>
                  </form>
                </>
              ) : (
                <div className="m-auto text-xs text-slate-500">Select a ticket to view conversation</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* New Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-white mb-1">Open Support Ticket</h3>
            <p className="text-xs text-slate-400 mb-6">Describe your query, feedback, or requested adjustments.</p>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. Header styling adjustment on mobile"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Details & Message</label>
                <textarea
                  required
                  rows={4}
                  value={newInitialMessage}
                  onChange={(e) => setNewInitialMessage(e.target.value)}
                  placeholder="Please provide full details or steps to reproduce..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTicket}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-md disabled:opacity-50"
                >
                  {creatingTicket && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
