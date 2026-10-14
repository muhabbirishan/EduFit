"use client";

import { supabase } from "@/lib/supabase";
import { ArrowLeft, Download, Edit3, FileText, LayoutTemplate, Plus, Target, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function InstrumenPage() {
    const [activeGrade, setActiveGrade] = useState<number>(10);
    const [instrument, setInstrument] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [viewMode, setViewMode] = useState<'view' | 'form'>('view');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({ id: "", fase: "", focus_unit: "", base_rationale: "", instrument_description: "" });
    const [objectives, setObjectives] = useState<{ code: string, text: string }[]>([]);
    const [mappings, setMappings] = useState<{ code: string, desc: string }[]>([]);

    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    const isDark = mounted && resolvedTheme === 'dark';

    const fetchInstrument = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.from('master_instruments').select('*').eq('grade_level', activeGrade).single();
            if (error && error.code !== 'PGRST116') throw error;
            setInstrument(data || null);
        } catch (error: any) { toast.error("Gagal menarik data rancangan"); } finally { setIsLoading(false); }
    };

    useEffect(() => { if (viewMode === 'view') fetchInstrument(); }, [activeGrade, viewMode]);

    const openForm = () => {
        if (instrument) {
            setFormData({ id: instrument.id, fase: instrument.fase, focus_unit: instrument.focus_unit, base_rationale: instrument.base_rationale, instrument_description: instrument.instrument_description });
            setObjectives(instrument.objectives || []);
            setMappings(instrument.mappings || []);
        } else {
            setFormData({ id: "", fase: activeGrade === 10 ? "E" : "F", focus_unit: "", base_rationale: "", instrument_description: "" });
            setObjectives([{ code: "", text: "" }]);
            setMappings([{ code: "", desc: "" }]);
        }
        setViewMode('form');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const payload = { grade_level: activeGrade, fase: formData.fase, focus_unit: formData.focus_unit, base_rationale: formData.base_rationale, instrument_description: formData.instrument_description, objectives: objectives, mappings: mappings, updated_at: new Date().toISOString() };
        try {
            if (formData.id) await supabase.from('master_instruments').update(payload).eq('id', formData.id);
            else await supabase.from('master_instruments').insert([payload]);
            toast.success("Rancangan berhasil disimpan!");
            setViewMode('view');
        } catch (err: any) { toast.error("Gagal menyimpan rancangan"); } finally { setIsSubmitting(false); }
    };

    if (!mounted) return null;

    if (viewMode === 'form') {
        return (
            <div className="w-full max-w-[1000px] mx-auto animate-in fade-in slide-in-from-right-8 duration-500 pb-16">
                <header className="flex items-start gap-4 mb-10 sticky top-0 z-20 pt-4 pb-4 backdrop-blur-md border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                    <button type="button" onClick={() => setViewMode('view')} className="mt-1 p-3 rounded-full border shadow-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ backgroundColor: isDark ? '#1a1a1a' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', color: isDark ? '#ffffff' : '#000000' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest mb-1 opacity-50" style={{ color: isDark ? '#ffffff' : '#000000' }}>
                            Draf Kelas {activeGrade}
                        </div>
                        <h1 className="text-3xl font-light tracking-tight leading-tight" style={{ color: isDark ? '#ffffff' : '#000000' }}>
                            {formData.id ? "Edit" : "Buat"} <span className="font-semibold">Rancangan & Instrumen</span>
                        </h1>
                    </div>
                </header>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* SECTION 1 */}
                    <div className="rounded-[2.5rem] p-8 md:p-10 shadow-sm border" style={{ backgroundColor: isDark ? '#111111' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: isDark ? '#fff' : '#000' }}>
                        <h3 className="font-semibold text-xl border-b pb-4 opacity-80 flex items-center gap-2" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}><LayoutTemplate size={18} /> Info Dasar</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-6">
                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block">Fase</label>
                                <input required value={formData.fase} onChange={(e) => setFormData({ ...formData, fase: e.target.value })} type="text" placeholder="E/F"
                                    className="w-full bg-transparent border-b-2 py-3 text-2xl font-light tracking-tight focus:outline-none transition-colors text-center"
                                    style={{ borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }} />
                            </div>
                            <div className="md:col-span-3">
                                <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block">Fokus Unit</label>
                                <input required value={formData.focus_unit} onChange={(e) => setFormData({ ...formData, focus_unit: e.target.value })} type="text" placeholder="Cth: Fokus unit: mengevaluasi keterampilan..."
                                    className="w-full bg-transparent border-b-2 py-3 text-2xl font-light tracking-tight focus:outline-none transition-colors"
                                    style={{ borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block">Landasan Belajar</label>
                                <textarea required value={formData.base_rationale} onChange={(e) => setFormData({ ...formData, base_rationale: e.target.value })} placeholder="Tuliskan landasan kurikulum..." rows={5}
                                    className="w-full p-5 rounded-2xl text-sm focus:outline-none resize-none border transition-colors leading-relaxed"
                                    style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}></textarea>
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block">Deskripsi Instrumen (Kisi-kisi)</label>
                                <textarea required value={formData.instrument_description} onChange={(e) => setFormData({ ...formData, instrument_description: e.target.value })} placeholder="Format instrumen..." rows={5}
                                    className="w-full p-5 rounded-2xl text-sm focus:outline-none resize-none border transition-colors leading-relaxed"
                                    style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}></textarea>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: TUJUAN BELAJAR */}
                    <div className="rounded-[2.5rem] p-8 md:p-10 shadow-sm border" style={{ backgroundColor: isDark ? '#111111' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: isDark ? '#fff' : '#000' }}>
                        <h3 className="font-semibold text-xl border-b pb-4 opacity-80 flex justify-between items-center" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                            <span className="flex items-center gap-2"><Target size={18} /> Tujuan Belajar (TP)</span>
                            <button type="button" onClick={() => setObjectives([...objectives, { code: '', text: '' }])} className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full" style={{ backgroundColor: isDark ? 'rgba(137,249,181,0.1)' : '#dcfce7', color: isDark ? '#89f9b5' : '#166534' }}>+ Tambah TP</button>
                        </h3>
                        <div className="space-y-4 pt-6">
                            {objectives.map((obj, i) => (
                                <div key={i} className="flex gap-4 items-start">
                                    <input required value={obj.code} onChange={(e) => { const newObj = [...objectives]; newObj[i].code = e.target.value; setObjectives(newObj); }} type="text" placeholder="Kode"
                                        className="w-24 p-4 rounded-xl text-sm font-bold text-center focus:outline-none border transition-colors"
                                        style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
                                    <input required value={obj.text} onChange={(e) => { const newObj = [...objectives]; newObj[i].text = e.target.value; setObjectives(newObj); }} type="text" placeholder="Deskripsi Tujuan..."
                                        className="flex-1 p-4 rounded-xl text-sm focus:outline-none border transition-colors"
                                        style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
                                    <button type="button" onClick={() => setObjectives(objectives.filter((_, idx) => idx !== i))} className="p-4 opacity-50 hover:opacity-100 hover:text-red-500 rounded-xl border transition-colors" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}><X size={18} /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end gap-4 sticky bottom-0 z-20 pb-4">
                        <button type="submit" disabled={isSubmitting} className="w-full md:w-auto px-10 py-4 font-bold text-sm uppercase tracking-widest rounded-full transition-opacity shadow-md disabled:opacity-50 hover:opacity-80"
                            style={{ backgroundColor: '#89f9b5', color: '#002110' }}>
                            {isSubmitting ? 'Menyimpan...' : 'Simpan Rancangan'}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="w-full animate-in fade-in duration-700 pb-10">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 relative z-10">
                <div>
                    <h1 className="text-4xl md:text-5xl font-light tracking-tighter leading-tight" style={{ color: isDark ? '#ffffff' : '#000000' }}>
                        Rancangan & <span className="font-semibold">Instrumen</span>
                    </h1>
                    <p className="text-sm font-medium uppercase tracking-widest mt-2 opacity-50" style={{ color: isDark ? '#ffffff' : '#000000' }}>
                        Tujuan Belajar, Landasan, dan Kisi-kisi Soal
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
                    <div className="flex p-1.5 rounded-full shadow-sm border" style={{ backgroundColor: isDark ? '#1a1a1a' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
                        {[10, 11, 12].map((grade) => (
                            <button key={grade} onClick={() => setActiveGrade(grade)}
                                className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors"
                                style={{ backgroundColor: activeGrade === grade ? '#89f9b5' : 'transparent', color: activeGrade === grade ? '#000' : (isDark ? '#fff' : '#000'), opacity: activeGrade === grade ? 1 : 0.5 }}>
                                Kelas {grade}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => toast.success("Menyiapkan PDF Instrumen...")} className="px-6 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 border hover:bg-black/5 dark:hover:bg-white/5 shadow-sm"
                        style={{ borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', color: isDark ? '#fff' : '#000' }}>
                        <Download size={16} /> Unduh Data
                    </button>
                </div>
            </header>

            {isLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-96 rounded-[2.5rem] animate-pulse" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}></div>
                    <div className="h-96 rounded-[2.5rem] animate-pulse" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}></div>
                </div>
            ) : !instrument ? (
                <div className="py-20 text-center flex flex-col items-center justify-center rounded-[2.5rem] border border-dashed opacity-50" style={{ borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}>
                    <Target className="w-16 h-16 mb-4 opacity-50" style={{ color: isDark ? '#fff' : '#000' }} />
                    <h3 className="text-2xl font-light tracking-tight mb-2" style={{ color: isDark ? '#fff' : '#000' }}>Belum ada Rancangan Kelas {activeGrade}</h3>
                    <button onClick={openForm} className="mt-6 px-6 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest transition-opacity flex items-center gap-2 hover:opacity-80 shadow-md" style={{ backgroundColor: '#89f9b5', color: '#002110' }}>
                        <Plus size={18} /> Buat Rancangan
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
                    <button onClick={openForm} className="absolute -top-14 right-0 px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm transition-colors z-10 hidden md:flex"
                        style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f8fafc', color: isDark ? '#fff' : '#000', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>
                        <Edit3 size={16} /> Edit Rancangan
                    </button>

                    {/* KIRI */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="rounded-[2.5rem] p-8 md:p-10 shadow-sm border relative overflow-hidden group" style={{ backgroundColor: isDark ? '#111111' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: isDark ? '#fff' : '#000' }}>
                            <div className="absolute inset-0 pointer-events-none transition-opacity opacity-[0.03] dark:opacity-[0.05] group-hover:opacity-[0.08]" style={{ backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors" style={{ backgroundColor: isDark ? 'rgba(137,249,181,0.1)' : '#dcfce7' }}>
                                        <Target className="w-8 h-8" style={{ color: isDark ? '#89f9b5' : '#166534' }} />
                                    </div>
                                    <span className="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                                        Fase {instrument.fase}
                                    </span>
                                </div>
                                <h2 className="text-3xl font-light tracking-tight mb-4">Tujuan Belajar Kelas {activeGrade}</h2>
                                <p className="text-sm font-medium opacity-70 leading-relaxed mb-8 border-l-4 pl-4" style={{ borderColor: '#89f9b5' }}>
                                    {instrument.focus_unit}
                                </p>
                                <div className="space-y-4">
                                    {instrument.objectives?.map((obj: any, i: number) => (
                                        <div key={i} className="flex gap-4 items-start p-5 rounded-2xl border transition-colors hover:border-[#89f9b5]" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                                            <div className="font-bold text-sm px-3 py-1 rounded-lg shrink-0" style={{ backgroundColor: isDark ? '#222' : '#fff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>{obj.code}</div>
                                            <p className="text-sm font-medium leading-relaxed opacity-90 pt-1">{obj.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* KANAN */}
                    <div className="space-y-6">
                        <div className="rounded-[2.5rem] p-8 md:p-10 shadow-xl relative overflow-hidden text-white" style={{ backgroundColor: isDark ? '#022c22' : '#032521' }}>
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
                            <FileText size={40} className="text-[#89f9b5] mb-6" />
                            <h2 className="text-3xl font-light tracking-tight mb-4">Kisi-Kisi</h2>
                            <div className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                {instrument.instrument_description}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}