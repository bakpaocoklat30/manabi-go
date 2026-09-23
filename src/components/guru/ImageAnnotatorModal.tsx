'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  X, 
  RotateCcw, 
  Download, 
  Save, 
  Check, 
  Circle, 
  XCircle, 
  Pen, 
  Highlighter, 
  Eraser, 
  Type, 
  ZoomIn, 
  ZoomOut, 
  Loader2, 
  Sparkles,
  Maximize2
} from 'lucide-react';

interface ImageAnnotatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  submissionId: string;
  studentName: string;
  taskTitle: string;
  onSaved: (annotatedUrl: string) => void;
}

type ToolType = 'pen' | 'highlighter' | 'eraser' | 'stamp-maru' | 'stamp-check' | 'stamp-batsu' | 'text';

const COLORS = [
  { name: 'Merah Guru', hex: '#EF4444' },
  { name: 'Hijau', hex: '#10B981' },
  { name: 'Kuning', hex: '#F59E0B' },
  { name: 'Biru', hex: '#3B82F6' },
  { name: 'Putih', hex: '#FFFFFF' },
  { name: 'Hitam', hex: '#18181B' },
];

const STROKE_SIZES = [
  { label: 'Tipis', size: 3 },
  { label: 'Sedang', size: 6 },
  { label: 'Tebal', size: 12 },
];

export default function ImageAnnotatorModal({
  isOpen,
  onClose,
  imageUrl,
  submissionId,
  studentName,
  taskTitle,
  onSaved,
}: ImageAnnotatorModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const baseImageRef = useRef<HTMLImageElement | null>(null);

  const [activeTool, setActiveTool] = useState<ToolType>('pen');
  const [activeColor, setActiveColor] = useState('#EF4444');
  const [strokeSize, setStrokeSize] = useState(6);
  const [isDrawing, setIsDrawing] = useState(false);
  const historyRef = useRef<ImageData[]>([]);
  const [historyCount, setHistoryCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [customText, setCustomText] = useState('✓ Bagus!');
  const [zoomLevel, setZoomLevel] = useState(1);

  // Load and draw image onto canvas
  const initCanvas = useCallback(() => {
    if (!canvasRef.current || !imageUrl) return;
    setIsImageLoading(true);
    setLoadError(null);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      baseImageRef.current = img;

      // Limit max dimension for smooth performance while maintaining high quality
      const maxDim = 1400;
      let w = img.naturalWidth || 800;
      let h = img.naturalHeight || 600;

      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      canvas.width = w;
      canvas.height = h;

      // Draw original image as base
      ctx.drawImage(img, 0, 0, w, h);

      // Save initial state for undo
      const initialState = ctx.getImageData(0, 0, w, h);
      historyRef.current = [initialState];
      setHistoryCount(1);
      setIsImageLoading(false);
    };

    img.onerror = () => {
      setIsImageLoading(false);
      setLoadError('Gagal memuat gambar asli. Pastikan format file didukung (JPG, PNG, WebP).');
    };
  }, [imageUrl]);

  useEffect(() => {
    if (!isOpen) {
      historyRef.current = [];
      setHistoryCount(0);
      return;
    }
    setZoomLevel(1);
    const timer = setTimeout(() => {
      initCanvas();
    }, 50);
    return () => clearTimeout(timer);
  }, [isOpen, initCanvas]);

  // Save current canvas state to history stack
  const pushState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const state = ctx.getImageData(0, 0, canvas.width, canvas.height);
    if (historyRef.current.length >= 10) {
      historyRef.current.shift();
    }
    historyRef.current.push(state);
    setHistoryCount(historyRef.current.length);
  };

  // Undo last action
  const handleUndo = () => {
    if (historyRef.current.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    historyRef.current.pop(); // Remove current state
    const previousState = historyRef.current[historyRef.current.length - 1];

    if (previousState) {
      ctx.putImageData(previousState, 0, 0);
      setHistoryCount(historyRef.current.length);
    }
  };

  // Reset to original image
  const handleReset = () => {
    if (historyRef.current.length === 0) return;
    if (!confirm('Apakah Anda yakin ingin menghapus semua coretan koreksi?')) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const firstState = historyRef.current[0];
    if (firstState) {
      ctx.putImageData(firstState, 0, 0);
      historyRef.current = [firstState];
      setHistoryCount(1);
    }
  };

  // Coordinates helper (translates client coordinates to canvas internal pixel coordinates)
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);

    // If stamp or text mode, apply stamp on single click
    if (activeTool.startsWith('stamp-') || activeTool === 'text') {
      applyStampOrText(x, y);
      pushState();
      return;
    }

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (activeTool === 'pen') {
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = strokeSize;
    } else if (activeTool === 'highlighter') {
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = strokeSize * 2.5;
    } else if (activeTool === 'eraser') {
      // For eraser, redraw base image at this spot or draw white with transparency
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = strokeSize * 2;
    }
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.closePath();
      ctx.globalAlpha = 1.0;
    }
    pushState();
  };

  // Stamp / Text placement
  const applyStampOrText = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.strokeStyle = activeColor;
    ctx.fillStyle = activeColor;
    ctx.lineWidth = strokeSize;

    const scale = Math.max(1, canvas.width / 800);

    if (activeTool === 'stamp-maru') {
      // Japanese Maru ◯ (Lingkaran benar)
      const radius = 26 * scale;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (activeTool === 'stamp-check') {
      // Checkmark ✓
      const s = 24 * scale;
      ctx.beginPath();
      ctx.moveTo(x - s, y);
      ctx.lineTo(x - s / 3, y + s * 0.7);
      ctx.lineTo(x + s, y - s * 0.7);
      ctx.stroke();
    } else if (activeTool === 'stamp-batsu') {
      // Batsu ✕ (Silang salah)
      const s = 20 * scale;
      ctx.beginPath();
      ctx.moveTo(x - s, y - s);
      ctx.lineTo(x + s, y + s);
      ctx.moveTo(x + s, y - s);
      ctx.lineTo(x - s, y + s);
      ctx.stroke();
    } else if (activeTool === 'text') {
      const fontSize = Math.round(18 * scale * (strokeSize / 4));
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillText(customText, x, y);
    }

    ctx.restore();
  };

  // Download locally as PNG
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    const safeStudent = studentName.replace(/\s+/g, '_');
    link.download = `koreksi_${safeStudent}_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Save to server
  const handleSaveToServer = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsSaving(true);
    try {
      // Use native toBlob to avoid creating massive base64 strings and call stack overflow
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/png');
      });

      let res: Response;

      if (blob) {
        const formData = new FormData();
        formData.append('submissionId', submissionId);
        formData.append('image', blob, `annotated_${submissionId}_${Date.now()}.png`);
        formData.append('appendToFeedback', 'true');

        res = await fetch('/api/evaluations/annotate', {
          method: 'POST',
          body: formData,
        });
      } else {
        // Fallback to dataURL if toBlob is not supported
        const dataUrl = canvas.toDataURL('image/png');
        res = await fetch('/api/evaluations/annotate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submissionId,
            imageBase64: dataUrl,
            appendToFeedback: true,
          }),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menyimpan anotasi');

      onSaved(data.url);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan anotasi');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4">
      <div className="relative w-full max-w-6xl h-[95vh] bg-slate-900 border border-slate-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-600/30 flex items-center justify-center text-red-400">
              <Pen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Anotasi & Koreksi Tulisan Siswa
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
                  {studentName}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">{taskTitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={historyCount <= 1}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
              title="Batalkan coretan terakhir (Undo)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Undo</span>
            </button>
            <button
              onClick={handleReset}
              disabled={historyCount <= 1}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition"
              title="Hapus semua coretan dan kembalikan gambar asli"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 bg-slate-950 border-b border-slate-800 text-xs">
          
          {/* Tool Selector */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTool('pen')}
              className={`p-2 rounded-lg font-bold flex items-center gap-1.5 transition ${
                activeTool === 'pen' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
              title="Pena Bebas"
            >
              <Pen className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Pena</span>
            </button>
            <button
              onClick={() => setActiveTool('highlighter')}
              className={`p-2 rounded-lg font-bold flex items-center gap-1.5 transition ${
                activeTool === 'highlighter' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
              title="Stabilo Transparan"
            >
              <Highlighter className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Stabilo</span>
            </button>
            <button
              onClick={() => setActiveTool('stamp-maru')}
              className={`p-2 rounded-lg font-bold flex items-center gap-1.5 transition ${
                activeTool === 'stamp-maru' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
              title="Stempel Lingkaran Benar (Maru ◯)"
            >
              <Circle className="w-3.5 h-3.5" />
              <span className="hidden md:inline">◯ Benar</span>
            </button>
            <button
              onClick={() => setActiveTool('stamp-check')}
              className={`p-2 rounded-lg font-bold flex items-center gap-1.5 transition ${
                activeTool === 'stamp-check' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
              title="Stempel Centang (✓)"
            >
              <Check className="w-3.5 h-3.5" />
              <span className="hidden md:inline">✓ Centang</span>
            </button>
            <button
              onClick={() => setActiveTool('stamp-batsu')}
              className={`p-2 rounded-lg font-bold flex items-center gap-1.5 transition ${
                activeTool === 'stamp-batsu' ? 'bg-rose-700 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
              title="Stempel Silang (✕)"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden md:inline">✕ Salah</span>
            </button>
            <button
              onClick={() => setActiveTool('text')}
              className={`p-2 rounded-lg font-bold flex items-center gap-1.5 transition ${
                activeTool === 'text' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
              title="Tulis Teks Catatan"
            >
              <Type className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Teks</span>
            </button>
          </div>

          {/* Color Palette */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 uppercase font-bold mr-1 hidden sm:inline">Warna:</span>
            {COLORS.map((c) => (
              <button
                key={c.hex}
                onClick={() => setActiveColor(c.hex)}
                style={{ backgroundColor: c.hex }}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${
                  activeColor === c.hex ? 'scale-125 border-white ring-2 ring-blue-500/50' : 'border-slate-700 hover:scale-110'
                }`}
                title={c.name}
              />
            ))}
          </div>

          {/* Stroke Size */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            {STROKE_SIZES.map((s) => (
              <button
                key={s.size}
                onClick={() => setStrokeSize(s.size)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  strokeSize === s.size ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              title="Perkecil Tampilan"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold text-slate-300 px-1">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              title="Perbesar Tampilan"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              title="Kembalikan Ukuran Normal"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Text Tool Quick Input if Text mode selected */}
        {activeTool === 'text' && (
          <div className="px-5 py-2 bg-purple-950/40 border-b border-purple-800/40 flex items-center gap-3 text-xs">
            <span className="text-purple-300 font-bold">Teks untuk ditempel:</span>
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="px-3 py-1 bg-slate-900 border border-purple-700 rounded-lg text-white text-xs flex-1 max-w-sm focus:outline-none"
              placeholder="Contoh: Perbaiki guratan ke-2"
            />
            <span className="text-slate-400 text-[11px] hidden sm:inline">
              *Klik pada gambar di tempat yang ingin ditempelkan teks.
            </span>
          </div>
        )}

        {/* Canvas Area */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-auto bg-slate-950 p-4 flex items-center justify-center select-none relative"
        >
          {isImageLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 bg-slate-950/80 z-10">
              <Loader2 className="w-8 h-8 animate-spin text-red-500" />
              <p className="text-xs text-slate-300 font-mono">Memuat gambar tugas untuk anotasi...</p>
            </div>
          )}

          {loadError ? (
            <div className="text-center p-6 bg-slate-900 border border-red-900/50 rounded-2xl max-w-md">
              <XCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <p className="text-xs text-red-300 mb-4">{loadError}</p>
              <button
                onClick={initCanvas}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition"
              >
                Coba Muat Ulang
              </button>
            </div>
          ) : (
            <div 
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
              className="transition-transform duration-100 ease-out shadow-2xl rounded-lg overflow-hidden border border-slate-800"
            >
              <canvas
                ref={canvasRef}
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerLeave={stopDrawing}
                className={`max-w-full max-h-[70vh] block bg-white ${
                  activeTool === 'text' || activeTool.startsWith('stamp-') ? 'cursor-crosshair' : 'cursor-crosshair'
                }`}
                style={{ touchAction: 'none' }}
              />
            </div>
          )}
        </div>

        {/* Modal Footer / Save Options */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-slate-800 bg-slate-950">
          <p className="text-[11px] text-slate-400">
            💡 <span className="font-semibold text-slate-300">Tips Sensei:</span> Anda dapat mencoret, memberi stempel ◯/✓/✕, atau menulis teks komentar pada lembar tugas siswa.
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleDownload}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700"
              title="Simpan berkas gambar PNG ke komputer Anda"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Unduh PNG</span>
            </button>

            <button
              onClick={handleSaveToServer}
              disabled={isSaving}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-red-900/30 transition"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{isSaving ? 'Menyimpan...' : 'Simpan & Lampirkan ke Evaluasi'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
