// @ts-nocheck
"use client";

import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ChevronLeft, ChevronRight, Edit3, Filter, Trash2, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const getPhaseColor = (phase: string, isDark: boolean) => {
    const p = phase.toLowerCase();
    if (p.includes('1') || p.includes('adaptasi')) return isDark ? 'bg-blue-900/30 text-blue-300 border border-blue-800/50' : 'bg-blue-100 text-blue-700 border border-blue-200';
    if (p.includes('2') || p.includes('kembang')) return isDark ? 'bg-purple-900/30 text-purple-300 border border-purple-800/50' : 'bg-purple-100 text-purple-700 border border-purple-200';
    if (p.includes('3') || p.includes('lanjut')) return isDark ? 'bg-pink-900/30 text-pink-300 border border-pink-800/50' : 'bg-pink-100 text-pink-700 border border-pink-200';
    if (p.includes('4') || p.includes('akhir')) return isDark ? 'bg-orange-900/30 text-orange-300 border border-orange-800/50' : 'bg-orange-100 text-orange-700 border border-orange-200';
    return isDark ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-800/50' : 'bg-emerald-100 text-emerald-700 border border-emerald-200';
};

export default function ProgramPage() {
    const [algorithms, setAlgorithms] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterGender, setFilterGender] = useState<string>("all");
    const [filterTkji, setFilterTkji] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editData, setEditData] = useState<any>(null);

    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    const isDark = mounted && resolvedTheme === 'dark';

    const fetchAlgorithms = async () => {
        setIsLoading(true);
        try {
            let query = supabase.from('fitness_algorithms').select('*').limit(10000).order('week', { ascending: true }).order('meeting', { ascending: true });
            if (filterGender !== 'all') query = query.eq('gender', filterGender);
            if (filterTkji !== 'all') query = query.eq('tkji_category', filterTkji);
            const { data, error } = await query;
            if (error) throw error;
            setAlgorithms(data || []);
            setCurrentPage(1);
        } catch (error: any) { toast.error("Gagal memuat matriks program"); } finally { setIsLoading(false); }
    };

    useEffect(() => { fetchAlgorithms(); }, [filterGender, filterTkji]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = algorithms.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(algorithms.length / itemsPerPage);

    const handleDelete = (id: string) => {
        toast('Hapus Algoritma', {
            description: 'Yakin hapus data ini?',
            action: { label: 'Hapus', onClick: async () => { await supabase.from('fitness_algorithms').delete().eq('id', id); toast.success("Dihapus!"); fetchAlgorithms(); } },
            cancel: { label: 'Batal' }
        });
    };

    const openEditModal = (row: any) => { setEditData({ ...row }); setIsEditModalOpen(true); };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await supabase.from('fitness_algorithms').update({ program_name: editData.program_name, phase: editData.phase, duration_min: editData.duration_min, instruction_id: editData.instruction_id }).eq('id', editData.id);
            toast.success("Algoritma diperbarui!");
            setIsEditModalOpen(false);
            setAlgorithms(prev => prev.map(alg => alg.id === editData.id ? { ...alg, ...editData } : alg));
        } catch (err: any) { toast.error("Gagal memperbarui"); } finally { setIsSubmitting(false); }
    };

    if (!mounted) return null;

    return (
        <div className="w-full animate-in fade-in duration-700 pb-10">

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative z-10">
                <div>
                    <h1 className="text-4xl md:text-5xl font-light tracking-tighter leading-tight" style={{ color: isDark ? '#ffffff' : '#000000' }}>
                        Program <span className="font-semibold">Kebugaran</span>
                    </h1>
                    <p className="text-sm font-medium uppercase tracking-widest mt-2 opacity-50" style={{ color: isDark ? '#ffffff' : '#000000' }}>
                        Matriks Algoritma 8 Minggu (Database Utama)
                    </p>
                </div>
            </header>

            <div className="rounded-[2.5rem] p-6 mb-10 flex items-start gap-4 shadow-sm border relative overflow-hidden group" style={{ backgroundColor: isDark ? '#022c22' : '#f0fdf4', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#bbf7d0' }}>
                <div className="absolute inset-0 pointer-events-none transition-opacity opacity-[0.05] group-hover:opacity-[0.1]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, currentColor, currentColor 2px, transparent 2px, transparent 16px)', color: isDark ? '#89f9b5' : '#166534' }}></div>
                <AlertCircle className="w-8 h-8 shrink-0 relative z-10" style={{ color: isDark ? '#89f9b5' : '#166534' }} />
                <div className="relative z-10">
                    <h3 className="font-bold text-lg mb-1" style={{ color: isDark ? '#fff' : '#064e3b' }}>Informasi Kurikulum</h3>
                    <p className="text-sm font-medium leading-relaxed opacity-80" style={{ color: isDark ? '#fff' : '#064e3b' }}>
                        Program 8 minggu ini adalah logika inti yang mengatur kebugaran siswa Kelas XII. Tabel di bawah ini berisi +4800 baris kombinasi IMT & TKJI yang akan ditarik secara otomatis oleh aplikasi siswa.
                    </p>
                </div>
            </div>

            <div className="rounded-[2.5rem] shadow-sm flex flex-col relative z-10 overflow-hidden border" style={{ backgroundColor: isDark ? '#111111' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: isDark ? '#fff' : '#000' }}>

                <div className="p-8 border-b flex flex-col md:flex-row justify-between gap-6 items-start md:items-center" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                    <div className="flex flex-wrap items-center gap-3">
                        <Filter size={20} className="opacity-50" />
                        <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)} className="text-xs font-bold uppercase px-5 py-3 rounded-full outline-none cursor-pointer border" style={{ backgroundColor: isDark ? '#1a1a1a' : '#f8fafc', color: isDark ? '#fff' : '#000', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                            <option value="all">Semua Gender</option><option value="L">Laki-Laki (L)</option><option value="P">Perempuan (P)</option>
                        </select>
                        <select value={filterTkji} onChange={(e) => setFilterTkji(e.target.value)} className="text-xs font-bold uppercase px-5 py-3 rounded-full outline-none cursor-pointer border" style={{ backgroundColor: isDark ? '#1a1a1a' : '#f8fafc', color: isDark ? '#fff' : '#000', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                            <option value="all">Semua TKJI</option><option value="Baik Sekali">Baik Sekali</option><option value="Baik">Baik</option><option value="Sedang">Sedang</option><option value="Kurang">Kurang</option>
                        </select>
                    </div>
                    <button onClick={() => toast.info('Import CSV via dashboard Supabase')} className="px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm hover:opacity-80 transition-opacity whitespace-nowrap" style={{ backgroundColor: '#89f9b5', color: '#002110' }}>
                        Import Database Master
                    </button>
                </div>

                <div className="overflow-x-auto no-scrollbar flex-1 relative">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="border-b text-[10px] uppercase tracking-widest font-bold opacity-60" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                                <th className="py-6 px-8">Sesi</th>
                                <th className="py-6 px-6">Kriteria (IMT / TKJI)</th>
                                <th className="py-6 px-6">Nama Program Utama</th>
                                <th className="py-6 px-6 text-center">Fase</th>
                                <th className="py-6 px-6 text-center">Durasi</th>
                                <th className="py-6 px-8 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm font-medium">
                            {isLoading ? (
                                <tr><td colSpan={6} className="py-20 text-center opacity-50 animate-pulse text-lg font-light">Menarik ribuan data algoritma...</td></tr>
                            ) : currentItems.length === 0 ? (
                                <tr><td colSpan={6} className="py-20 text-center opacity-50 font-light text-lg">Data kosong untuk filter ini.</td></tr>
                            ) : (
                                currentItems.map((row) => (
                                    <tr key={row.id} className="border-b transition-colors hover:bg-black/5 dark:hover:bg-white/5 group" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                                        <td className="py-5 px-8 font-bold text-lg">W{row.week} / M{row.meeting}</td>
                                        <td className="py-5 px-6">
                                            <span className="font-bold mr-2 text-blue-500">{row.gender}</span>
                                            <span className="opacity-70">{row.bmi_category} • {row.tkji_category}</span>
                                        </td>
                                        <td className="py-5 px-6 font-semibold truncate max-w-[250px] opacity-90">{row.program_name}</td>
                                        <td className="py-5 px-6 text-center">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${getPhaseColor(row.phase || '', isDark)}`}>
                                                {row.phase}
                                            </span>
                                        </td>
                                        <td className="py-5 px-6 text-center font-bebas text-2xl">{row.duration_min}</td>
                                        <td className="py-5 px-8 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => openEditModal(row)} className="p-2 rounded-full transition-colors hover:bg-blue-500 hover:text-white" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}><Edit3 size={16} /></button>
                                                <button onClick={() => handleDelete(row.id)} className="p-2 rounded-full transition-colors hover:bg-red-500 hover:text-white" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {!isLoading && totalPages > 1 && (
                    <div className="p-6 border-t flex flex-col md:flex-row items-center justify-between gap-4" style={{ backgroundColor: isDark ? '#1a1a1a' : '#f8fafc', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                        <p className="text-xs font-bold opacity-50 uppercase tracking-widest">
                            {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, algorithms.length)} dari {algorithms.length.toLocaleString('id-ID')} Data
                        </p>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-3 rounded-full border transition-colors disabled:opacity-30" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}><ChevronLeft size={18} /></button>
                            <span className="text-sm font-bold w-16 text-center">{currentPage} / {totalPages}</span>
                            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-3 rounded-full border transition-colors disabled:opacity-30" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}><ChevronRight size={18} /></button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL EDIT */}
            <AnimatePresence>
                {isEditModalOpen && editData && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
                        <motion.div initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }}
                            className="w-full max-w-2xl rounded-[2.5rem] p-8 md:p-10 relative z-10 shadow-2xl border"
                            style={{ backgroundColor: isDark ? '#1a1a1a' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: isDark ? '#fff' : '#000' }}>
                            <button onClick={() => setIsEditModalOpen(false)} className="absolute top-6 right-6 p-2 rounded-full transition-colors hover:bg-red-500 hover:text-white" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}><X size={20} /></button>

                            <h2 className="text-3xl font-light tracking-tight mb-2">Edit <span className="font-semibold">Algoritma</span></h2>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-8 border border-current px-3 py-1.5 rounded-full w-fit">
                                W{editData.week} / M{editData.meeting} • {editData.gender} • {editData.bmi_category} • {editData.tkji_category}
                            </p>

                            <form onSubmit={handleUpdate} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block">Nama Program (Instruksi)</label>
                                        <textarea required rows={3} value={editData.program_name} onChange={e => setEditData({ ...editData, program_name: e.target.value })}
                                            className="w-full p-4 rounded-xl text-sm focus:outline-none resize-none border transition-colors"
                                            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}></textarea>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block">Durasi (Menit)</label>
                                        <input required type="number" value={editData.duration_min || ''} onChange={e => setEditData({ ...editData, duration_min: parseInt(e.target.value) })}
                                            className="w-full p-4 rounded-xl text-2xl font-light focus:outline-none border transition-colors text-center"
                                            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block">Fase Program</label>
                                        <input required type="text" value={editData.phase || ''} onChange={e => setEditData({ ...editData, phase: e.target.value })}
                                            className="w-full p-4 rounded-xl text-sm focus:outline-none border transition-colors"
                                            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block">ID Detail Latihan</label>
                                        <input type="text" value={editData.instruction_id || ''} onChange={e => setEditData({ ...editData, instruction_id: e.target.value })}
                                            className="w-full p-4 rounded-xl text-sm focus:outline-none border transition-colors"
                                            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
                                    </div>
                                </div>
                                <div className="pt-6 flex justify-end">
                                    <button type="submit" disabled={isSubmitting} className="w-full md:w-auto px-10 py-4 font-bold text-sm uppercase tracking-widest rounded-full transition-opacity shadow-md disabled:opacity-50 hover:opacity-80"
                                        style={{ backgroundColor: '#89f9b5', color: '#002110' }}>
                                        {isSubmitting ? 'Menyimpan...' : 'Update Algoritma'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}