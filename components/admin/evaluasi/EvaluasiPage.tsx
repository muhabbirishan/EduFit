"use client";

import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ChevronRight, Database, Edit3, Plus, Trash2, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function EvaluasiPage() {
    const [evaluations, setEvaluations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [activeEval, setActiveEval] = useState<any>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

    const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        learning_objective_code: "", question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_answer: "A"
    });

    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    const isDark = mounted && resolvedTheme === 'dark';

    const fetchEvaluations = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.from('master_evaluations').select(`*, question_bank(count)`).order('grade_level', { ascending: true }).order('type', { ascending: false });
            if (error) throw error;
            setEvaluations(data || []);
        } catch (error: any) {
            toast.error("Gagal menarik data evaluasi");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchEvaluations(); }, []);

    const fetchQuestions = async (evalId: string) => {
        setIsLoadingQuestions(true);
        try {
            const { data, error } = await supabase.from('question_bank').select('*').eq('evaluation_id', evalId).order('created_at', { ascending: true });
            if (error) throw error;
            setQuestions(data || []);
        } catch (error: any) {
            toast.error("Gagal menarik daftar soal");
        } finally {
            setIsLoadingQuestions(false);
        }
    };

    const handleOpenBank = (ev: any) => { setActiveEval(ev); fetchQuestions(ev.id); };
    const handleCloseBank = () => { setActiveEval(null); setQuestions([]); fetchEvaluations(); };

    const openAddModal = () => {
        setEditingId(null);
        setFormData({ learning_objective_code: "X-1", question_text: "", option_a: "akan diisi oleh admin nanti", option_b: "akan diisi oleh admin nanti", option_c: "akan diisi oleh admin nanti", option_d: "akan diisi oleh admin nanti", correct_answer: "A" });
        setIsQuestionModalOpen(true);
    };

    const openEditModal = (q: any) => {
        setEditingId(q.id);
        setFormData({ learning_objective_code: q.learning_objective_code || "", question_text: q.question_text || "", option_a: q.option_a || "", option_b: q.option_b || "", option_c: q.option_c || "", option_d: q.option_d || "", correct_answer: q.correct_answer || "A" });
        setIsQuestionModalOpen(true);
    };

    const handleSaveQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = { ...formData, evaluation_id: activeEval.id };
            if (editingId) {
                await supabase.from('question_bank').update(payload).eq('id', editingId);
                toast.success("Soal berhasil diperbarui!");
            } else {
                await supabase.from('question_bank').insert([payload]);
                toast.success("Soal baru berhasil ditambahkan!");
            }
            fetchQuestions(activeEval.id);
            setIsQuestionModalOpen(false);
        } catch (err: any) { toast.error("Gagal menyimpan soal"); } finally { setIsSubmitting(false); }
    };

    const handleDelete = (id: string) => {
        toast('Hapus Soal', {
            description: 'Yakin ingin menghapus soal ini?',
            action: {
                label: 'Hapus',
                onClick: async () => {
                    await supabase.from('question_bank').delete().eq('id', id);
                    toast.success("Soal dihapus");
                    fetchQuestions(activeEval.id);
                }
            },
            cancel: { label: 'Batal' }
        });
    };

    if (!mounted) return null;

    // ======================================================================
    // VIEW 1: BANK SOAL (MANAJEMEN SOAL DETAIL)
    // ======================================================================
    if (activeEval) {
        return (
            <div className="w-full animate-in fade-in slide-in-from-right-8 duration-500 pb-10">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 relative z-10">
                    <div className="flex items-start gap-4">
                        <button onClick={handleCloseBank} className="mt-2 p-3 rounded-full border shadow-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ backgroundColor: isDark ? '#1a1a1a' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', color: isDark ? '#ffffff' : '#000000' }}>
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest mb-2 opacity-50" style={{ color: isDark ? '#ffffff' : '#000000' }}>
                                <Database size={16} /> Bank Soal Kelas {activeEval.grade_level}
                            </div>
                            <h1 className="text-4xl md:text-5xl font-light tracking-tighter leading-tight" style={{ color: isDark ? '#ffffff' : '#000000' }}>
                                {activeEval.title} <span className="font-semibold">({activeEval.type.toUpperCase()})</span>
                            </h1>
                        </div>
                    </div>
                    <button onClick={openAddModal} className="px-6 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 hover:opacity-80 shadow-md shrink-0" style={{ backgroundColor: '#89f9b5', color: '#002110' }}>
                        <Plus size={18} /> Tambah Soal
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                    {isLoadingQuestions ? (
                        [1, 2, 3].map(i => <div key={i} className="h-64 rounded-[2.5rem] animate-pulse" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}></div>)
                    ) : questions.length === 0 ? (
                        <div className="col-span-full p-16 text-center rounded-[2.5rem] border border-dashed opacity-50" style={{ borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}>
                            <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="text-xl font-light">Bank soal ini masih kosong.</p>
                        </div>
                    ) : (
                        questions.map((q, index) => (
                            <div key={q.id} className="p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-between group transition-transform hover:-translate-y-1 relative overflow-hidden border"
                                style={{ backgroundColor: isDark ? '#111111' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: isDark ? '#ffffff' : '#000000' }}>

                                {/* Pattern Dots Kecil */}
                                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none transition-opacity group-hover:opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(currentColor 2px, transparent 2px)', backgroundSize: '16px 16px' }}></div>

                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-6">
                                        <span className="px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
                                            {q.learning_objective_code || 'UMUM'}
                                        </span>
                                        <div className="flex items-center gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEditModal(q)} className="p-2 rounded-full transition-colors hover:bg-blue-500 hover:text-white" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}><Edit3 size={16} /></button>
                                            <button onClick={() => handleDelete(q.id)} className="p-2 rounded-full transition-colors hover:bg-red-500 hover:text-white" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                    <p className="text-lg font-medium leading-relaxed mb-6">
                                        {index + 1}. {q.question_text}
                                    </p>
                                </div>
                                <div className="relative z-10 text-[11px] font-bold border-t pt-4 flex items-center gap-2" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                                    KUNCI JAWABAN: <span className="px-2 py-1 rounded shadow-sm" style={{ backgroundColor: '#89f9b5', color: '#002110' }}>Opsi {q.correct_answer}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* MODAL FORM SOAL */}
                <AnimatePresence>
                    {isQuestionModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsQuestionModalOpen(false)} />
                            <motion.div initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }}
                                className="w-full max-w-3xl max-h-[90vh] overflow-y-auto no-scrollbar rounded-[2.5rem] p-8 md:p-10 relative z-10 shadow-2xl border"
                                style={{ backgroundColor: isDark ? '#1a1a1a' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: isDark ? '#fff' : '#000' }}>
                                <button onClick={() => setIsQuestionModalOpen(false)} className="absolute top-6 right-6 p-2 rounded-full transition-colors hover:bg-red-500 hover:text-white" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}><X size={20} /></button>

                                <h2 className="text-3xl font-light tracking-tight mb-8">{editingId ? "Edit" : "Tambah"} <span className="font-semibold">Soal</span></h2>

                                <form onSubmit={handleSaveQuestion} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block">Teks Pertanyaan</label>
                                            <textarea required rows={4} value={formData.question_text} onChange={e => setFormData({ ...formData, question_text: e.target.value })}
                                                className="w-full p-5 rounded-2xl text-sm focus:outline-none resize-none border transition-colors"
                                                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}></textarea>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block">Kode TP (Misal: X-1)</label>
                                            <input required type="text" value={formData.learning_objective_code} onChange={e => setFormData({ ...formData, learning_objective_code: e.target.value })}
                                                className="w-full p-5 rounded-2xl text-xl font-light text-center focus:outline-none border transition-colors"
                                                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                        {['a', 'b', 'c', 'd'].map(opt => (
                                            <div key={opt}>
                                                <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-2 block">Opsi {opt}</label>
                                                <input required type="text" value={(formData as any)[`option_${opt}`]} onChange={e => setFormData({ ...formData, [`option_${opt}`]: e.target.value })}
                                                    className="w-full p-4 rounded-xl text-sm focus:outline-none border transition-colors"
                                                    style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-2">
                                        <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block">Kunci Jawaban</label>
                                        <select value={formData.correct_answer} onChange={e => setFormData({ ...formData, correct_answer: e.target.value })}
                                            className="w-full p-4 rounded-xl text-sm font-bold focus:outline-none border cursor-pointer"
                                            style={{ backgroundColor: isDark ? '#222' : '#f8fafc', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                                            <option value="A">Opsi A</option><option value="B">Opsi B</option><option value="C">Opsi C</option><option value="D">Opsi D</option>
                                        </select>
                                    </div>

                                    <button type="submit" disabled={isSubmitting} className="w-full py-4 mt-4 rounded-full font-bold text-xs uppercase tracking-widest transition-opacity hover:opacity-80 shadow-md"
                                        style={{ backgroundColor: '#89f9b5', color: '#002110' }}>
                                        {isSubmitting ? 'Menyimpan...' : 'Simpan Soal ke Bank'}
                                    </button>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // ======================================================================
    // VIEW 2: DAFTAR PROGRAM EVALUASI UTAMA
    // ======================================================================
    return (
        <div className="w-full animate-in fade-in duration-700 pb-10">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 relative z-10">
                <div>
                    <h1 className="text-4xl md:text-5xl font-light tracking-tighter leading-tight" style={{ color: isDark ? '#ffffff' : '#000000' }}>
                        Evaluasi <span className="font-semibold">Sistem</span>
                    </h1>
                    <p className="text-sm font-medium uppercase tracking-widest mt-2 opacity-50" style={{ color: isDark ? '#ffffff' : '#000000' }}>
                        Manajemen Pre/Post Test & Bank Soal
                    </p>
                </div>
                <button onClick={() => toast.info('Fitur pembuatan evaluasi instan sedang dikembangkan.')} className="px-6 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 hover:opacity-80 shadow-md"
                    style={{ backgroundColor: '#89f9b5', color: '#002110' }}>
                    <Plus size={18} /> Buat Evaluasi
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
                {isLoading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-64 rounded-[2.5rem] animate-pulse" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}></div>)
                ) : evaluations.length === 0 ? (
                    <div className="col-span-full p-10 text-center rounded-[2.5rem] border border-dashed opacity-50" style={{ borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}>
                        <p className="text-xl font-light">Belum ada program evaluasi.</p>
                    </div>
                ) : (
                    evaluations.map((ev) => (
                        <div key={ev.id} className="p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-between group hover:-translate-y-1 transition-transform relative overflow-hidden border"
                            style={{ backgroundColor: isDark ? '#111111' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: isDark ? '#ffffff' : '#000000' }}>

                            {/* Pattern Grid Milimeter Blok */}
                            <div className="absolute inset-0 pointer-events-none transition-opacity opacity-[0.03] dark:opacity-[0.05] group-hover:opacity-[0.08]"
                                style={{ backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    {ev.type === 'pretest' ? (
                                        <span className="px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase" style={{ backgroundColor: isDark ? 'rgba(244,63,94,0.1)' : '#ffe4e6', color: isDark ? '#fb7185' : '#e11d48' }}>Pretest</span>
                                    ) : (
                                        <span className="px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase" style={{ backgroundColor: isDark ? 'rgba(56,189,248,0.1)' : '#e0f2fe', color: isDark ? '#38bdf8' : '#0284c7' }}>Posttest</span>
                                    )}
                                    <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
                                        Kelas {ev.grade_level}
                                    </span>
                                </div>
                                <h3 className="text-3xl font-light tracking-tight leading-none mb-6 group-hover:text-[#89f9b5] transition-colors">{ev.title}</h3>
                                <div className="flex items-center gap-2 opacity-60 text-xs font-bold uppercase tracking-widest mb-8">
                                    <Database size={16} /> {ev.question_bank[0]?.count || 0} Soal Tersimpan
                                </div>
                            </div>
                            <button onClick={() => handleOpenBank(ev)} className="relative z-10 w-full py-4 font-bold text-[11px] uppercase tracking-widest rounded-full transition-colors flex justify-center items-center gap-2 border hover:bg-black/5 dark:hover:bg-white/5"
                                style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                                Buka Bank Soal <ChevronRight size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}