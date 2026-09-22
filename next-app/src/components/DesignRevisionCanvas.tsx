'use client';

import React, { useState, useRef } from 'react';
import { MousePointer, Square, Type, Send, X, AlertCircle } from 'lucide-react';

interface AnnotationItem {
  type: 'point' | 'rect' | 'text';
  x: number; // 0-1
  y: number; // 0-1
  width?: number; // 0-1
  height?: number; // 0-1
  text?: string;
}

interface DesignRevisionCanvasProps {
  projectId: string;
  designId?: string;
  designName?: string;
  imageUrl?: string;
  onRevisionSubmitted?: () => void;
  onClose?: () => void;
}

export default function DesignRevisionCanvas({
  projectId,
  designId = 'design_deliverable_01',
  designName = 'Homepage UI Design',
  imageUrl = 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
  onRevisionSubmitted,
  onClose,
}: DesignRevisionCanvasProps) {
  const [tool, setTool] = useState<'point' | 'rect' | 'text'>('point');
  const [annotations, setAnnotations] = useState<AnnotationItem[]>([]);
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [activeComment, setActiveComment] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentBox, setCurrentBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const getRelativeCoords = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    return { x: Number(x.toFixed(4)), y: Number(y.toFixed(4)) };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getRelativeCoords(e);
    if (tool === 'point' || tool === 'text') {
      setAnnotations((prev) => [
        ...prev,
        {
          type: tool,
          x: coords.x,
          y: coords.y,
          text: activeComment || `Revision point ${prev.length + 1}`,
        },
      ]);
      setActiveComment('');
    } else if (tool === 'rect') {
      setIsDrawing(true);
      setStartPos(coords);
      setCurrentBox({ x: coords.x, y: coords.y, w: 0, h: 0 });
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !startPos) return;
    const coords = getRelativeCoords(e);
    const x = Math.min(startPos.x, coords.x);
    const y = Math.min(startPos.y, coords.y);
    const w = Math.abs(coords.x - startPos.x);
    const h = Math.abs(coords.y - startPos.y);
    setCurrentBox({ x, y, w, h });
  };

  const handlePointerUp = () => {
    if (isDrawing && currentBox && currentBox.w > 0.02 && currentBox.h > 0.02) {
      setAnnotations((prev) => [
        ...prev,
        {
          type: 'rect',
          x: currentBox.x,
          y: currentBox.y,
          width: currentBox.w,
          height: currentBox.h,
          text: activeComment || `Area review ${prev.length + 1}`,
        },
      ]);
      setActiveComment('');
    }
    setIsDrawing(false);
    setStartPos(null);
    setCurrentBox(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide a brief description of the requested changes.');
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/revisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          designId,
          designName,
          description,
          priority,
          annotations,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit revision');

      if (onRevisionSubmitted) onRevisionSubmitted();
      if (onClose) onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="revision-canvas-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h3 id="revision-canvas-title" className="text-sm sm:text-base font-bold text-white">
              Visual Revision Annotation — {designName}
            </h3>
            <p className="text-xs text-slate-400">
              Click or drag on the design deliverable to pinpoint exact modifications.
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Toolbar */}
        <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTool('point')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium ${
                tool === 'point' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <MousePointer className="w-3.5 h-3.5" /> Point Marker
            </button>
            <button
              type="button"
              onClick={() => setTool('rect')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium ${
                tool === 'rect' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Square className="w-3.5 h-3.5" /> Draw Box
            </button>
            <button
              type="button"
              onClick={() => setTool('text')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium ${
                tool === 'text' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Type className="w-3.5 h-3.5" /> Note Pin
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Annotations: {annotations.length}</span>
            {annotations.length > 0 && (
              <button
                type="button"
                onClick={() => setAnnotations([])}
                className="text-rose-400 hover:text-rose-300 font-medium"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Canvas & Form Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden">
          {/* Image & Interactive Canvas Viewport */}
          <div className="lg:col-span-2 p-4 bg-slate-950 flex items-center justify-center overflow-auto select-none">
            <div
              ref={containerRef}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
              className="relative max-w-full max-h-[55vh] rounded-xl overflow-hidden border border-slate-800 shadow-2xl cursor-crosshair touch-none"
            >
              <img
                src={imageUrl}
                alt="Design Deliverable"
                className="w-full h-auto object-contain pointer-events-none block max-h-[55vh]"
              />

              {/* Render Existing Annotations */}
              {annotations.map((ann, idx) => (
                <React.Fragment key={idx}>
                  {ann.type === 'rect' ? (
                    <div
                      style={{
                        left: `${ann.x * 100}%`,
                        top: `${ann.y * 100}%`,
                        width: `${(ann.width || 0) * 100}%`,
                        height: `${(ann.height || 0) * 100}%`,
                      }}
                      className="absolute border-2 border-rose-500 bg-rose-500/20 rounded pointer-events-none"
                    >
                      <span className="absolute -top-3.5 -left-1 px-1.5 py-0.5 bg-rose-600 text-white text-[9px] font-bold rounded-full">
                        {idx + 1}
                      </span>
                    </div>
                  ) : (
                    <div
                      style={{
                        left: `${ann.x * 100}%`,
                        top: `${ann.y * 100}%`,
                      }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-[10px] font-bold pointer-events-none"
                    >
                      {idx + 1}
                    </div>
                  )}
                </React.Fragment>
              ))}

              {/* In-progress drawing box */}
              {isDrawing && currentBox && (
                <div
                  style={{
                    left: `${currentBox.x * 100}%`,
                    top: `${currentBox.y * 100}%`,
                    width: `${currentBox.w * 100}%`,
                    height: `${currentBox.h * 100}%`,
                  }}
                  className="absolute border-2 border-dashed border-blue-400 bg-blue-500/20 rounded pointer-events-none"
                />
              )}
            </div>
          </div>

          {/* Submission Form Sidebar */}
          <form
            onSubmit={handleSubmit}
            className="p-5 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col justify-between overflow-y-auto space-y-4"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Revision Summary & Instructions
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what needs modification (e.g., Change hero CTA button to navy, adjust mobile banner height)..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Priority Level
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Low">Low — Minor visual tweak</option>
                  <option value="Medium">Medium — Standard modification</option>
                  <option value="High">High — Important design misalignment</option>
                  <option value="Critical">Critical — Launch blocker</option>
                </select>
              </div>

              {/* Annotation List preview */}
              {annotations.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-300">Marked Pins:</div>
                  <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                    {annotations.map((ann, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between"
                      >
                        <span>
                          <strong>#{i + 1}</strong> {ann.type} ({Math.round(ann.x * 100)}%,{' '}
                          {Math.round(ann.y * 100)}%)
                        </span>
                        <button
                          type="button"
                          onClick={() => setAnnotations(annotations.filter((_, idx) => idx !== i))}
                          className="text-slate-500 hover:text-rose-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 flex gap-2">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? 'Submitting...' : 'Submit Revision Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
