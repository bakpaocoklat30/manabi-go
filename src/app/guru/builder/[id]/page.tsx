'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Plus, Edit, Trash2, Loader2, PlaySquare, AlignLeft, Headphones, PenTool, Factory, JapaneseYen, CheckCircle2, AlertCircle, CheckSquare, Clock
, Pencil, Save } from 'lucide-react';
import YoutubeEmbed from '@/components/shared/YoutubeEmbed';

interface ModuleData {
  id: string;
  title: string;
  weekNumber: number;
  quizzes?: { id: string; title: string; timeLimitMinutes: number; orderIndex: number; }[];
}

interface ModuleItemData {
  id: string;
  type: string;
  title: string;
  orderIndex: number;
  bodyText: string | null;
  youtubeUrl: string | null;
  audioUrl: string | null;
  gdrivePrompt: string | null;
  dueHours: number | null;
  delayMinutes: number;
  customTypeLabel: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  MOJI: 'Huruf (Moji)',
  KOTOBA_TEKNIS: 'Kosakata (Kotoba)',
  BUNPOU: 'Tata Bahasa (Bunpou)',
  YOUTUBE_TUTORIAL: 'Video YouTube',
  TUGAS_MENULIS: 'Tugas Praktik',
  CHOUKAI: 'Audio (Choukai)',
  BUDAYA_KERJA: 'Budaya Kerja (5S)',
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'YOUTUBE_TUTORIAL': return <PlaySquare className="w-5 h-5 text-red-500" />;
    case 'CHOUKAI': return <Headphones className="w-5 h-5 text-blue-500" />;
    case 'TUGAS_MENULIS': return <PenTool className="w-5 h-5 text-amber-500" />;
    case 'BUDAYA_KERJA': return <Factory className="w-5 h-5 text-stone-600" />;
    case 'MOJI': return <JapaneseYen className="w-5 h-5 text-indigo-500" />;
    default: return <AlignLeft className="w-5 h-5 text-emerald-600" />;
  }
};

function DelayInputRow({ item, onChangeDelay }: { item: any, onChangeDelay: (id: string, val: number) => void }) {
  const [val, setVal] = React.useState(item.delayMinutes || 0);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = Number(e.target.value);
    setVal(newVal);
    onChangeDelay(item.id, newVal);
  };

  return (
    <div className="flex items-center justify-center -my-3 relative z-10 pb-4">
      <div className="bg-white border border-[#E8E2D2] px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-md">
        <div className="bg-emerald-100 p-1.5 rounded-full">
          <Clock className="w-4 h-4 text-emerald-600" />
        </div>
        <span className="text-stone-600 font-bold text-sm hidden sm:inline">Jeda Penampilan:</span>
        <div className="flex items-center gap-2">
          <input 
            type="number" 
            min="0"
            value={val}
            onChange={handleChange}
            className="w-20 h-9 text-center bg-stone-50 border border-stone-300 rounded-xl outline-none focus:border-emerald-500 font-bold text-stone-800 text-sm"
          />
          <span className="text-xs text-stone-500 font-bold mr-1">Menit</span>
        </div>
      </div>
    </div>
  );
}

export default function ModuleEditorPage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = params.id as string;

  const [moduleData, setModuleData] = useState<ModuleData | null>(null);
  const [items, setItems] = useState<ModuleItemData[]>([]);
  const [combinedItems, setCombinedItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
  
  // Form State
  const [formType, setFormType] = useState('MOJI');
  const [formTitle, setFormTitle] = useState('');
  const [maxFiles, setMaxFiles] = useState(1);
  const [formCustomTypeLabel, setFormCustomTypeLabel] = useState('');
  const [formBodyText, setFormBodyText] = useState('');
  const [formYoutubeUrl, setFormYoutubeUrl] = useState('');
  const [formAudioUrl, setFormAudioUrl] = useState('');
  const [formGdrivePrompt, setFormGdrivePrompt] = useState('');
  const [formDueHours, setFormDueHours] = useState('');
  const [formDelayMinutes, setFormDelayMinutes] = useState('');
  const [formOrderIndex, setFormOrderIndex] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    try {
      const res = await fetch(`/api/guru/modules/${moduleId}/items`);
      if (res.ok) {
        const data = await res.json();
        setModuleData(data.module);
        setItems(data.items);
        const merged = [...(data.items || [])];
        if (data.module.quizzes) {
          data.module.quizzes.forEach((q: any) => {
            merged.push({ ...q, type: 'QUIZ' });
          });
        }
        merged.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        setCombinedItems(merged);
      } else {
        router.push('/guru/builder');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [moduleId]);

  const openCreateSpecific = (type: string) => {
    setIsEditing(false);
    setFormType(type);
    setFormTitle('');
    setFormCustomTypeLabel('');
    setFormCustomTypeLabel('');
    setFormBodyText('');
    setFormYoutubeUrl('');
    setFormAudioUrl('');
    setFormGdrivePrompt('');
    setFormDueHours('');
    setFormDelayMinutes('');
    setFormOrderIndex(items.length > 0 ? Math.max(...items.map(i => i.orderIndex)) + 1 : 1);
    setShowModal(true);
  };
  

  
  const [isBatchSaving, setIsBatchSaving] = useState(false);

  const handleDelayChange = (itemId: string, newDelay: number) => {
    setCombinedItems(prev => prev.map(item => item.id === itemId ? { ...item, delayMinutes: newDelay } : item));
  };

  const handleBatchSave = async () => {
    setIsBatchSaving(true);
    try {
      const payload = combinedItems.map(i => ({ id: i.id, type: i.type, orderIndex: i.orderIndex, delayMinutes: i.delayMinutes }));
      const res = await fetch(`/api/guru/modules/${moduleId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'BATCH_UPDATE', items: payload })
      });
      if (res.ok) {
        setNotification({ type: 'success', message: 'Urutan dan Jeda berhasil disimpan!' });
        loadData();
      }
    } catch(e) { console.error(e); }
    setIsBatchSaving(false);
  };

  const handleUpdateDelay = async (itemId: string, type: string, newDelay: number) => {
    try {
      const isQuiz = type === 'QUIZ';
      const endpoint = isQuiz ? `/api/guru/quizzes/${itemId}` : `/api/guru/modules/${moduleId}/items`;
      const body = isQuiz ? { delayMinutes: newDelay } : { action: 'UPDATE', itemId, type, delayMinutes: newDelay };
      
      // We need to fetch current item to keep its other data intact for ModuleItem.
      // Wait, UPDATE action in items route requires all fields if we don't handle partial updates.
      // Let's create a specific QUICK_UPDATE_DELAY action in the items route instead!
      const res = await fetch(`/api/guru/modules/${moduleId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UPDATE_DELAY', itemId, isQuiz, delayMinutes: newDelay })
      });
      if (res.ok) {
        loadData(); // reload
      }
    } catch(e) { console.error(e); }
  };

  const moveItem = async (index: number, direction: 'UP' | 'DOWN') => {
    const newCombined = [...combinedItems];
    if (direction === 'UP' && index > 0) {
      [newCombined[index], newCombined[index - 1]] = [newCombined[index - 1], newCombined[index]];
    } else if (direction === 'DOWN' && index < newCombined.length - 1) {
      [newCombined[index], newCombined[index + 1]] = [newCombined[index + 1], newCombined[index]];
    } else {
      return;
    }
    
    // Update orderIndex
    newCombined.forEach((item, i) => { item.orderIndex = i + 1; });
    setCombinedItems(newCombined);
    
    // Save to DB
    try {
      await fetch(`/api/guru/modules/${moduleId}/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: newCombined.map(i => ({ id: i.id, type: i.type, orderIndex: i.orderIndex })) })
      });
    } catch (e) { console.error(e); }
  };

  const openCreate = () => {
    setIsEditing(false);
    setFormType('MOJI');
    setFormTitle('');
    setFormBodyText('');
    setMaxFiles(1);
    setFormYoutubeUrl('');
    setFormAudioUrl('');
    setFormGdrivePrompt('');
    setFormDelayMinutes('');
    setFormOrderIndex(items.length > 0 ? Math.max(...items.map(i => i.orderIndex)) + 1 : 1);
    setShowModal(true);
  };

  const openEdit = (item: ModuleItemData) => {
    setIsEditing(true);
    setEditId(item.id);
    setFormType(item.type);
    setFormTitle(item.title);
    setFormCustomTypeLabel(item.customTypeLabel || '');
    setFormBodyText(item.bodyText || '');
    setFormDueHours(item.dueHours ? String(item.dueHours) : '');
    setFormDelayMinutes(item.delayMinutes ? String(item.delayMinutes) : '');
    setFormYoutubeUrl(item.youtubeUrl || '');
    setFormAudioUrl(item.audioUrl || '');
    setFormGdrivePrompt(item.gdrivePrompt || '');
    setFormOrderIndex(item.orderIndex);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setNotification(null);
    try {
      const action = isEditing ? 'UPDATE' : 'CREATE';
      const body = {
        action, itemId: editId, type: formType, title: formTitle, customTypeLabel: formCustomTypeLabel,
        bodyText: formBodyText,
          maxFiles: maxFiles, youtubeUrl: formYoutubeUrl, 
        audioUrl: formAudioUrl, gdrivePrompt: formGdrivePrompt,
        orderIndex: formOrderIndex,
        dueHours: formDueHours ? Number(formDueHours) : null,
        delayMinutes: formDelayMinutes ? Number(formDelayMinutes) : 0,
      };
      const res = await fetch(`/api/guru/modules/${moduleId}/items`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message);
      }
      setNotification({ type: 'success', message: `Konten berhasil ${isEditing ? 'diperbarui' : 'ditambahkan'}.` });
      setShowModal(false);
      loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Gagal menyimpan konten.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus item materi ini?')) return;
    try {
      const res = await fetch(`/api/guru/modules/${moduleId}/items`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'DELETE', itemId: id })
      });
      if (res.ok) {
        setNotification({ type: 'success', message: 'Konten berhasil dihapus.' });
        loadData();
      }
    } catch (e) {
      setNotification({ type: 'error', message: 'Gagal menghapus konten.' });
    }
  };


  if (isLoading) {
    return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  // --- SPLIT EDITOR LAYOUT ---
  if (showModal) {
    return (
      <div className="space-y-4 pb-16 max-w-7xl mx-auto">
        <div className="flex items-center justify-between bg-white border border-[#E8E2D2] p-4 rounded-xl shadow-sm">
          <div>
            <h2 className="text-sm font-bold text-stone-900">{isEditing ? 'Edit Konten Materi' : 'Tambah Konten Baru'}</h2>
            <p className="text-[11px] text-stone-500">Anda sedang dalam mode Editor Interaktif.</p>
          </div>
          <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-semibold rounded-xl transition">
            Batal & Kembali
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* KOLOM KIRI: EDITOR (TERANG/GURU) */}
          <div className="bg-white border border-[#E8E2D2] rounded-2xl p-6 shadow-sm sticky top-6">
            <h3 className="text-xs font-bold text-stone-900 mb-4 pb-3 border-b border-[#E8E2D2] uppercase tracking-wider flex items-center gap-2">
              <PenTool className="w-4 h-4 text-blue-600" />
              Panel Editor
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">Tipe Konten</label>
                  <input 
                    type="text" 
                    value={formCustomTypeLabel} 
                    onChange={(e) => setFormCustomTypeLabel(e.target.value)} 
                    placeholder={TYPE_LABELS[formType] || formType}
                    className="w-full px-3 py-2 bg-white border border-[#E8E2D2] rounded-xl text-stone-900 text-xs font-bold focus:outline-none focus:border-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">Urutan Tampil (Ke-)</label>
                  <input type="number" min="1" required value={formOrderIndex} onChange={(e) => setFormOrderIndex(Number(e.target.value))} className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E8E2D2] rounded-xl text-stone-900 text-xs focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">Judul Konten</label>
                <input type="text" required value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Contoh: Pengenalan Dasar" className="w-full px-3 py-2.5 bg-[#FDFBF7] border border-[#E8E2D2] rounded-xl text-stone-900 font-bold text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors" />
              </div>

              {formType === 'YOUTUBE_TUTORIAL' && (
                <div>
                  <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">Tautan / URL YouTube</label>
                  <input type="url" required value={formYoutubeUrl} onChange={(e) => setFormYoutubeUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E8E2D2] rounded-xl text-blue-600 font-mono text-xs focus:outline-none focus:border-blue-500" />
                </div>
              )}

              {formType === 'CHOUKAI' && (
                <div>
                  <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">Tautan / URL Audio (G-Drive / MP3)</label>
                  <input type="url" required value={formAudioUrl} onChange={(e) => setFormAudioUrl(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E8E2D2] rounded-xl text-blue-600 font-mono text-xs focus:outline-none focus:border-blue-500" />
                </div>
              )}

              {formType === 'TUGAS_MENULIS' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-amber-600 uppercase mb-1">Instruksi Tugas Siswa (Prompt)</label>
                    <textarea rows={3} required value={formGdrivePrompt} onChange={(e) => setFormGdrivePrompt(e.target.value)} placeholder="Tuliskan huruf di buku kotak, lalu foto dan unggah..." className="w-full px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-stone-900 text-xs focus:outline-none focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-amber-600 uppercase mb-1">Maksimal Jumlah Foto yang Bisa Diupload</label>
                    <input type="number" min={1} max={10} value={maxFiles} onChange={e => setMaxFiles(Number(e.target.value))} className="w-full pl-3 pr-10 py-2 bg-amber-50 border border-amber-200 rounded-xl text-stone-900 text-xs focus:outline-none focus:border-amber-500" />
                    <p className="text-[10px] text-amber-700/70 mt-1">Siswa akan dipaksa memfoto langsung dari kamera (anti-cheat) sebanyak maksimal batas ini.</p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-amber-600 uppercase mb-1">Durasi Pengerjaan (Opsional)</label>
                    <div className="relative">
                      <input type="number" min="1" value={formDueHours} onChange={(e) => setFormDueHours(e.target.value)} placeholder="Contoh: 24" className="w-full pl-3 pr-10 py-2 bg-amber-50 border border-amber-200 rounded-xl text-stone-900 text-xs focus:outline-none focus:border-amber-500" />
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-[11px] font-bold text-amber-600">
                        Jam
                      </div>
                    </div>
                    <p className="text-[10px] text-amber-700/70 mt-1">Siswa harus mengumpulkan tugas ini dalam X jam sejak modul dirilis untuk kelas mereka.</p>
                  </div>
                </div>
              )}

              {formType !== 'TUGAS_MENULIS' && (
                <div>
                  <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">Penjelasan Teks (Opsional)</label>
                  <div className="border border-[#E8E2D2] rounded-xl overflow-hidden focus-within:border-blue-500 transition-colors">
                    <div className="bg-stone-50 border-b border-[#E8E2D2] px-3 py-2 flex items-center gap-3 text-stone-500">
                      <button type="button" className="hover:text-stone-900 font-serif font-bold text-sm">B</button>
                      <button type="button" className="hover:text-stone-900 font-serif italic text-sm">I</button>
                      <button type="button" className="hover:text-stone-900 underline text-sm">U</button>
                      <div className="w-px h-4 bg-stone-300 mx-1"></div>
                      <button type="button" className="hover:text-stone-900 flex items-center gap-1 text-[10px] uppercase font-bold"><AlignLeft className="w-3 h-3"/> Teks</button>
                    </div>
                    <textarea rows={6} value={formBodyText} onChange={(e) => setFormBodyText(e.target.value)} placeholder="Ketik materi pembelajaran di sini..." className="w-full px-4 py-3 bg-white text-stone-900 text-[13px] focus:outline-none leading-relaxed resize-y" />
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-4 border-t border-[#E8E2D2]">
                <button type="submit" disabled={isSubmitting} className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-md">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{isEditing ? 'Simpan Perubahan Konten' : 'Publikasikan Konten Ini'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* KOLOM KANAN: LIVE PREVIEW (GELAP/SISWA) */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-purple-600 to-blue-600"></div>
            <h3 className="text-xs font-bold text-slate-400 mb-6 pb-3 border-b border-slate-800 uppercase tracking-wider flex items-center gap-2">
              <PlaySquare className="w-4 h-4 text-emerald-400" />
              Live Preview (Tampilan Siswa)
            </h3>
            
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-inner">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <span className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs">
                  {formOrderIndex}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    {formType === 'BUDAYA_KERJA' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800 text-amber-400">Budaya Kerja Industri (5S)</span>
                    )}
                    {formType === 'KOTOBA_TEKNIS' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800 text-blue-400">Kosakata Bengkel / Otomotif</span>
                    )}
                    {formType === 'YOUTUBE_TUTORIAL' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-950/60 border border-red-800 text-red-400">Video Panduan Guratan</span>
                    )}
                    {formType === 'TUGAS_MENULIS' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400">Praktik Tulisan Tangan</span>
                    )}
                    {/* Default fallback for preview badge */}
                    {!['BUDAYA_KERJA','KOTOBA_TEKNIS','YOUTUBE_TUTORIAL','TUGAS_MENULIS'].includes(formType) && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                        {formCustomTypeLabel || TYPE_LABELS[formType]}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white mt-1 break-words">
                    {formTitle || 'Judul Materi Kosong'}
                  </h3>
                </div>
              </div>

              {formType !== 'TUGAS_MENULIS' && (formBodyText || !formYoutubeUrl) && (
                <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed whitespace-pre-line bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 break-words">
                  {formBodyText || <span className="opacity-50 italic">Teks materi pembelajaran akan tampil di sini...</span>}
                </div>
              )}

              {formType === 'YOUTUBE_TUTORIAL' && formYoutubeUrl && (
                <div className="pt-2">
                  <YoutubeEmbed url={formYoutubeUrl} title={formTitle || "Video"} />
                </div>
              )}

              {formType === 'TUGAS_MENULIS' && (
                <div className="pt-2">
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                    <p className="text-sm text-slate-300 mb-4 whitespace-pre-line leading-relaxed">
                      {formGdrivePrompt || <span className="opacity-50 italic">Instruksi tugas akan tampil di sini...</span>}
                    </p>
                    <div className="w-full py-3 rounded-lg border-2 border-dashed border-slate-600 flex flex-col items-center justify-center text-slate-500 gap-2 bg-slate-900/50">
                      <span className="text-xs font-bold">KOTAK UPLOAD FILE LOKAL (SIMULASI)</span>
                    </div>
                    {formDueHours && (
                      <div className="mt-4 flex items-center gap-2 text-[11px] text-amber-400 bg-amber-400/10 p-2 rounded-lg border border-amber-400/20 w-max">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="font-semibold">Batas Waktu: {formDueHours} Jam setelah rilis</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    );
  }

  // --- STANDARD LIST LAYOUT ---
return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E8E2D2] p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/guru/builder" className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
              Isi Materi: {moduleData?.title}
            </h2>
            <p className="text-xs text-stone-500 mt-1">Pekan Pembelajaran ke-{moduleData?.weekNumber}</p>
          </div>
        </div>
        <button
          onClick={handleBatchSave}
          disabled={isBatchSaving}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold text-xs rounded-xl shadow-sm transition-all"
        >
          {isBatchSaving ? <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> : <Save className="w-4 h-4 text-emerald-600" />}
          <span>Simpan Susunan & Jeda</span>
        </button>
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => openCreateSpecific('BUNPOU')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-[11px] font-bold rounded-xl transition-all shadow-sm"
          >
            <AlignLeft className="w-3.5 h-3.5" />
            <span>Tulis Materi Teks</span>
          </button>
          <button
            onClick={() => openCreateSpecific('YOUTUBE_TUTORIAL')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-[11px] font-bold rounded-xl transition-all shadow-sm"
          >
            <PlaySquare className="w-3.5 h-3.5" />
            <span>Sematkan Video</span>
          </button>
          <button
            onClick={() => openCreateSpecific('TUGAS_MENULIS')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 text-[11px] font-bold rounded-xl transition-all shadow-sm"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Buat Tugas Praktik</span>
          </button>
          <Link
            href={`/guru/builder/${moduleId}/quiz?type=MULTIPLE_CHOICE`}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-[11px] font-bold rounded-xl transition-all shadow-sm"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Kelola Kuis Ganda</span>
          </Link>
          <Link
            href={`/guru/builder/${moduleId}/quiz?type=ESSAY`}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[11px] font-bold rounded-xl transition-all shadow-sm"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Buat Kuis Isian (AI)</span>
          </Link>
        </div>

      {notification && (
        <div className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs animate-in fade-in ${
            notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      
      {/* Daftar Konten */}
      {(items.length === 0 && (!moduleData?.quizzes || moduleData.quizzes.length === 0)) ? (
        <div className="bg-white border border-[#E8E2D2] border-dashed rounded-2xl p-12 text-center">
          <AlignLeft className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-stone-900 mb-1">Modul Masih Kosong</h3>
          <p className="text-xs text-stone-500">Klik "Tambah Konten" untuk mulai memasukkan materi pembelajaran.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {combinedItems.map((item, index) => {
            const delayIndicator = index > 0 ? (
              <DelayInputRow item={item} onChangeDelay={handleDelayChange} />
            ) : null;

            if (item.type === 'QUIZ') {
              return (
                <React.Fragment key={item.id}>
                  {delayIndicator}
                  <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 shadow-sm flex items-start gap-4 group">
                  <div className="flex flex-col items-center gap-1">
                    <button onClick={() => moveItem(index, 'UP')} disabled={index === 0} className="text-stone-400 hover:text-stone-700 disabled:opacity-30">▲</button>
                    <div className="w-8 h-8 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-600 font-bold text-xs">
                      {index + 1}
                    </div>
                    <button onClick={() => moveItem(index, 'DOWN')} disabled={index === combinedItems.length - 1} className="text-stone-400 hover:text-stone-700 disabled:opacity-30">▼</button>
                  </div>
                  <div className="flex-1 mt-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${item.quizType === 'ESSAY' ? 'bg-emerald-200 text-emerald-700' : 'bg-purple-200 text-purple-700'}`}>
                        {item.quizType === 'ESSAY' ? 'KUIS ISIAN (AI)' : 'KUIS GANDA'}
                      </span>
                      <span className="text-xs font-bold text-stone-500">Durasi: {item.timeLimitMinutes} Menit</span>
                    </div>
                    <h3 className="text-sm font-bold text-stone-900 leading-snug">{item.title}</h3>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Link href={`/guru/builder/${moduleId}/quiz`} className="p-2 text-stone-400 hover:text-purple-600 hover:bg-purple-100 rounded-lg transition" title="Edit Kuis">
                      <Pencil className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
                </React.Fragment>
              );
            }
            return (
              <React.Fragment key={item.id}>
                {delayIndicator}
                <div className="bg-white border border-[#E8E2D2] rounded-2xl p-5 shadow-sm flex items-start gap-4 group hover:border-blue-300 transition">
                <div className="flex flex-col items-center gap-1">
                  <button onClick={() => moveItem(index, 'UP')} disabled={index === 0} className="text-stone-400 hover:text-stone-700 disabled:opacity-30">▲</button>
                  <div className="w-8 h-8 rounded-full bg-stone-50 border border-[#E8E2D2] flex items-center justify-center font-mono font-bold text-stone-500 text-sm">
                    {index + 1}
                  </div>
                  <button onClick={() => moveItem(index, 'DOWN')} disabled={index === combinedItems.length - 1} className="text-stone-400 hover:text-stone-700 disabled:opacity-30">▼</button>
                </div>
                <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-500 mt-1">
                  {item.type === 'VIDEO' ? <PlaySquare className="w-5 h-5" /> : 
                   item.type === 'TEKS' ? <AlignLeft className="w-5 h-5" /> : 
                   item.type === 'TUGAS_MENULIS' ? <PenTool className="w-5 h-5" /> :
                   <Headphones className="w-5 h-5" />}
                </div>
                <div className="flex-1 mt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      item.type === 'VIDEO' ? 'bg-rose-100 text-rose-700' :
                      item.type === 'TEKS' ? 'bg-blue-100 text-blue-700' :
                      item.type === 'AUDIO' ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {item.type.replace('_', ' ')}
                    </span>
                    {item.dueHours && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                        <Clock className="w-3 h-3" />
                        Tenggat: {item.dueHours} Jam
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-stone-900 leading-snug">{item.title}</h3>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                  <button onClick={() => openEdit(item)} className="p-2 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Hapus">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              </React.Fragment>
            );
          })}
        </div>
      )}


          </div>
  );
}