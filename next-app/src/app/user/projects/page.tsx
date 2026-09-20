'use client';

import React, { useState, useEffect } from 'react';
import Pusher from 'pusher-js';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  Download,
  Upload,
  FileText,
  Loader2,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';

interface Project {
  id: string;
  name: string;
  tier: string;
  stage: string;
  progress: number;
  estimatedLaunch?: string;
  createdAt: string;
}

interface ProjectFile {
  id: string;
  projectId: string;
  fileName: string;
  fileUrl: string;
  fileSize: string;
  category: 'Deliverable' | 'Asset';
  uploadedAt: string;
}

interface StageHistory {
  id: string;
  stage: string;
  changedBy: string;
  notes?: string;
  timestamp: string;
}

const STAGES = ['Discovery', 'Design', 'Development', 'Testing', 'Review', 'Launched'];

export default function UserProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [stageHistory, setStageHistory] = useState<StageHistory[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileUrl, setNewFileUrl] = useState('');
  const [newCategory, setNewCategory] = useState<'Asset' | 'Deliverable'>('Asset');
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await fetch('/api/user/projects');
        if (res.ok) {
          const data = await res.json();
          setProjects(data.projects || []);
          if (data.projects && data.projects.length > 0) {
            loadProjectDetails(data.projects[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load projects:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, []);

  const loadProjectDetails = async (projectId: string) => {
    try {
      const res = await fetch(`/api/user/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedProject(data.project);
        setStageHistory(data.stageHistory || []);
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error('Failed to load project details:', err);
    }
  };

  // Realtime Pusher subscription on selected project
  useEffect(() => {
    if (!selectedProject) return;

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2';

    if (pusherKey && !pusherKey.includes('mock')) {
      try {
        const pusher = new Pusher(pusherKey, { cluster });
        const channel = pusher.subscribe(`project-${selectedProject.id}`);

        channel.bind('stage-update', (data: { stage: string; progress: number }) => {
          setSelectedProject((prev) => (prev ? { ...prev, stage: data.stage, progress: data.progress } : null));
          setProjects((prev) =>
            prev.map((p) => (p.id === selectedProject.id ? { ...p, stage: data.stage, progress: data.progress } : p))
          );
        });

        channel.bind('file-uploaded', (newFile: ProjectFile) => {
          setFiles((prev) => [newFile, ...prev]);
        });

        return () => {
          channel.unbind_all();
          channel.unsubscribe();
        };
      } catch (err) {
        console.warn('Pusher client error:', err);
      }
    }
  }, [selectedProject?.id]);

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newFileName || !newFileUrl) return;

    try {
      setUploading(true);
      const res = await fetch(`/api/projects/${selectedProject.id}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: newFileName,
          fileUrl: newFileUrl,
          fileSize: '1.2 MB',
          fileType: 'document',
          category: newCategory,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setFiles((prev) => [data.file, ...prev]);
        setNewFileName('');
        setNewFileUrl('');
        setShowUploadModal(false);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const deliverables = files.filter((f) => f.category === 'Deliverable');
  const assets = files.filter((f) => f.category === 'Asset');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              WEBSITE BUILDERS
            </span>
            <div className="hidden sm:flex items-center gap-4 text-xs font-semibold">
              <a href="/user/projects" className="text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg">
                Projects
              </a>
              <a href="/user/invoices" className="text-slate-400 hover:text-white transition-colors">
                Invoices
              </a>
              <a href="/user/tickets" className="text-slate-400 hover:text-white transition-colors">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {projects.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-slate-800">
            <FolderKanban className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No active projects found</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
              You don&apos;t have any active projects yet. Get in touch with our team or complete onboarding to get started.
            </p>
            <a
              href="/user/onboarding"
              className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all"
            >
              Start Onboarding <Sparkles className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Project Switcher */}
            {projects.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => loadProjectDetails(p.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                      selectedProject?.id === p.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}

            {selectedProject && (
              <>
                {/* Project Header Banner */}
                <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-900/30 via-slate-900 to-indigo-900/20 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {selectedProject.tier} Tier
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Started {new Date(selectedProject.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
                      {selectedProject.name}
                    </h1>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                    >
                      <Upload className="w-4 h-4" /> Share Asset
                    </button>
                    <a
                      href="/user/tickets"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors"
                    >
                      Engineering Support
                    </a>
                  </div>
                </div>

                {/* Visual Stage Progress Tracker */}
                <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-slate-800">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-white">Development Pipeline</h2>
                      <p className="text-xs text-slate-400">Live synchronization with our engineering sprints</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-extrabold text-blue-400">{selectedProject.progress}%</span>
                      <span className="text-xs text-slate-500 block">Overall Progress</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden mb-8 border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 transition-all duration-500 rounded-full"
                      style={{ width: `${selectedProject.progress}%` }}
                    />
                  </div>

                  {/* Stage Stepper */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    {STAGES.map((s, idx) => {
                      const currentIdx = STAGES.indexOf(selectedProject.stage);
                      const isPast = idx < currentIdx;
                      const isCurrent = idx === currentIdx;

                      return (
                        <div
                          key={s}
                          className={`p-3.5 rounded-2xl border transition-all ${
                            isCurrent
                              ? 'bg-blue-600/15 border-blue-500/50 shadow-lg shadow-blue-500/10'
                              : isPast
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : 'bg-slate-950/60 border-slate-800/80 text-slate-500'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider">Step 0{idx + 1}</span>
                            {isPast ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : isCurrent ? (
                              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                            ) : null}
                          </div>
                          <p className={`text-xs font-bold ${isCurrent ? 'text-blue-400' : isPast ? 'text-white' : 'text-slate-400'}`}>
                            {s}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Deliverables & Assets Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Final Deliverables */}
                  <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Layers className="w-4 h-4 text-emerald-400" /> Deliverables
                      </h3>
                      <span className="text-xs text-slate-500">{deliverables.length} files</span>
                    </div>

                    {deliverables.length === 0 ? (
                      <p className="text-xs text-slate-500 py-8 text-center">Deliverables will appear here once released.</p>
                    ) : (
                      <div className="space-y-2">
                        {deliverables.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="w-4 h-4 text-emerald-400" />
                              <div>
                                <p className="text-xs font-semibold text-white">{file.fileName}</p>
                                <span className="text-[10px] text-slate-500">{file.fileSize}</span>
                              </div>
                            </div>
                            <a
                              href={file.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Shared Assets */}
                  <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <FolderKanban className="w-4 h-4 text-blue-400" /> Project Assets
                      </h3>
                      <span className="text-xs text-slate-500">{assets.length} files</span>
                    </div>

                    {assets.length === 0 ? (
                      <p className="text-xs text-slate-500 py-8 text-center">No assets uploaded yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {assets.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="w-4 h-4 text-blue-400" />
                              <div>
                                <p className="text-xs font-semibold text-white">{file.fileName}</p>
                                <span className="text-[10px] text-slate-500">{file.fileSize}</span>
                              </div>
                            </div>
                            <a
                              href={file.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                              title="Open"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Engineering Stage History Log */}
                {stageHistory.length > 0 && (
                  <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800">
                    <h3 className="text-sm font-bold text-white mb-4">Audit Timeline</h3>
                    <div className="divide-y divide-slate-800/60">
                      {stageHistory.map((h) => (
                        <div key={h.id} className="py-3 flex items-start justify-between text-xs">
                          <div>
                            <span className="font-semibold text-white">{h.stage}</span>
                            <p className="text-slate-400 mt-0.5">{h.notes}</p>
                          </div>
                          <span className="text-slate-500 text-[10px] shrink-0 ml-4">
                            {new Date(h.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Upload Asset Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-white mb-1">Share Project Asset</h3>
            <p className="text-xs text-slate-400 mb-6">Upload or link brand guidelines, logos, or copy.</p>

            <form onSubmit={handleUploadFile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">File Name</label>
                <input
                  type="text"
                  required
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="e.g. Brand_Logo_Vector.svg"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Asset URL (Cloudinary / Drive)</label>
                <input
                  type="url"
                  required
                  value={newFileUrl}
                  onChange={(e) => setNewFileUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                >
                  <option value="Asset">Asset</option>
                  <option value="Deliverable">Deliverable</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-md disabled:opacity-50"
                >
                  {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Submit Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
