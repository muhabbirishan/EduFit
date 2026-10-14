"use client";

import { supabase } from "@/lib/supabase";
import { BrainCircuit, ChevronDown, Download, Search, Users } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function TeoriPage() {
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>("");
    const [studentsData, setStudentsData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    const isDark = mounted && resolvedTheme === 'dark';

    // 1. Ambil daftar kelas milik guru
    useEffect(() => {
        async function fetchClasses() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const { data } = await supabase.from('classes').select('id, name, grade_level').eq('guru_id', session.user.id).order('created_at', { ascending: false });
            if (data && data.length > 0) {
                setClasses(data);
                setSelectedClass(data[0].id);
            }
        }
        fetchClasses();
    }, []);

    // 2. Ambil data siswa dan nilai teorinya berdasarkan kelas yang dipilih
    useEffect(() => {
        async function fetchScores() {
            if (!selectedClass) return;
            setIsLoading(true);
            try {
                const { data: stdClass, error: errStd } = await supabase.from('student_classes').select('student_id, user_profiles(full_name)').eq('class_id', selectedClass);
                if (errStd) throw errStd;

                if (!stdClass || stdClass.length === 0) {
                    setStudentsData([]); setIsLoading(false); return;
                }

                const studentIds = stdClass.map((sc: any) => sc.student_id);
                const { data: scores, error: errScores } = await supabase.from('student_evaluation_scores').select('student_id, score, master_evaluations(type)').in('student_id', studentIds);
                if (errScores) throw errScores;

                const formattedData = stdClass.map((sc: any) => {
                    const studentScores = scores?.filter((s: any) => s.student_id === sc.student_id) || [];
                    let pre = null, post = null;
                    studentScores.forEach((s: any) => {
                        if (s.master_evaluations?.type === 'pretest') pre = s.score;
                        if (s.master_evaluations?.type === 'posttest') post = s.score;
                    });
                    return {
                        id: sc.student_id,
                        name: sc.user_profiles?.full_name || "Siswa Tidak Diketahui",
                        pretest: pre, posttest: post, selisih: (pre !== null && post !== null) ? post - pre : null
                    };
                });

                formattedData.sort((a, b) => a.name.localeCompare(b.name));
                setStudentsData(formattedData);
            } catch (error: any) {
                toast.error("Gagal memuat data nilai", { description: error.message });
            } finally {
                setIsLoading(false);
            }
        }
        fetchScores();
    }, [selectedClass]);

    const filteredData = studentsData.filter(row => row.name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!mounted) return null;

    return (
        <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700">

            {/* HEADER SECTION */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 relative z-10">
                <div>
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest mb-4 opacity-50">
                        <BrainCircuit size={16} /> Evaluasi Kognitif
                    </div>
                    <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-tight">
                        Pantau <span className="font-semibold">Teori</span>
                    </h1>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto shrink-0">
                    <div className="relative w-full sm:w-auto">
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="w-full sm:w-72 appearance-none px-6 py-4 rounded-full font-bold text-sm outline-none transition-colors cursor-pointer border"
                            style={{ backgroundColor: isDark ? '#1a1a1a' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: isDark ? '#ffffff' : '#000000' }}
                        >
                            {classes.length === 0 ? <option value="">Belum ada kelas</option> : classes.map(cls => (
                                <option key={cls.id} value={cls.id}>{cls.name} (Kelas {cls.grade_level})</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none w-5 h-5" />
                    </div>

                    <button className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-sm tracking-widest uppercase transition-colors flex items-center justify-center gap-2 hover:opacity-80"
                        style={{ backgroundColor: '#facc15', color: '#000' }}>
                        <Download size={18} /> Ekspor
                    </button>
                </div>
            </div>

            {/* CARD TABEL */}
            <div className="rounded-[2.5rem] shadow-xl border overflow-hidden flex flex-col relative z-10"
                style={{ backgroundColor: isDark ? '#111111' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>

                {/* Header Tabel */}
                <div className="p-8 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                    <h2 className="text-2xl font-light tracking-tight">Rekapitulasi Nilai Kelas</h2>
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 opacity-50 w-4 h-4" />
                        <input
                            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nama siswa..."
                            className="w-full pl-12 pr-5 py-3 rounded-full text-sm outline-none transition-colors border"
                            style={{ backgroundColor: isDark ? '#1a1a1a' : '#f8fafc', color: isDark ? '#ffffff' : '#000000', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
                        />
                    </div>
                </div>

                {/* Isi Tabel */}
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="text-[11px] uppercase tracking-widest font-bold border-b opacity-60" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                                <th className="py-6 px-8 sticky left-0 z-10 border-r" style={{ backgroundColor: isDark ? '#111111' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>Nama Siswa</th>
                                <th className="py-6 px-8 text-center">Pretest</th>
                                <th className="py-6 px-8 text-center">Posttest</th>
                                <th className="py-6 px-8 text-center">Progres (Selisih)</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm font-medium">
                            {classes.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center opacity-50">
                                        <Users className="w-12 h-12 mx-auto mb-4" />
                                        <p className="font-bold text-lg mb-1">Belum Ada Kelas</p>
                                        <p className="text-sm font-normal">Buat kelas di Dashboard terlebih dahulu.</p>
                                    </td>
                                </tr>
                            ) : isLoading ? (
                                <tr><td colSpan={4} className="py-16 text-center opacity-50 animate-pulse text-lg font-light">Menarik data dari server...</td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan={4} className="py-16 text-center opacity-50 font-light text-lg">Belum ada siswa yang bergabung di kelas ini.</td></tr>
                            ) : (
                                filteredData.map((row) => (
                                    <tr key={row.id} className="border-b transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                                        <td className="py-5 px-8 font-bold sticky left-0 z-10 border-r transition-colors" style={{ backgroundColor: isDark ? '#111111' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                                            {row.name}
                                        </td>

                                        {/* Pretest Badge (Merah Muda Halus) */}
                                        <td className="py-5 px-8 text-center">
                                            {row.pretest === null ? <span className="opacity-30">—</span> : (
                                                <span className="px-4 py-1.5 rounded-lg font-bebas text-xl tracking-wider inline-block min-w-[60px]" style={{ backgroundColor: isDark ? 'rgba(244,63,94,0.1)' : '#ffe4e6', color: isDark ? '#fb7185' : '#e11d48' }}>
                                                    {row.pretest}
                                                </span>
                                            )}
                                        </td>

                                        {/* Posttest Badge (Biru Halus) */}
                                        <td className="py-5 px-8 text-center">
                                            {row.posttest === null ? <span className="opacity-30">—</span> : (
                                                <span className="px-4 py-1.5 rounded-lg font-bebas text-xl tracking-wider inline-block min-w-[60px]" style={{ backgroundColor: isDark ? 'rgba(56,189,248,0.1)' : '#e0f2fe', color: isDark ? '#38bdf8' : '#0284c7' }}>
                                                    {row.posttest}
                                                </span>
                                            )}
                                        </td>

                                        {/* Progres Badge (Kuning Guru jika +, Merah jika -) */}
                                        <td className="py-5 px-8 text-center">
                                            {row.selisih === null ? <span className="opacity-30">—</span> : (
                                                <div className="flex justify-center">
                                                    <span className={`font-bebas text-2xl px-5 py-1 rounded-full shadow-sm ${row.selisih > 0 ? '' : ''}`}
                                                        style={row.selisih > 0
                                                            ? { backgroundColor: '#facc15', color: '#000' } // Positif: Kuning Guru!
                                                            : row.selisih < 0
                                                                ? { backgroundColor: isDark ? 'rgba(239,68,68,0.2)' : '#fee2e2', color: isDark ? '#f87171' : '#dc2626' } // Negatif: Merah
                                                                : { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' } // Nol: Abu-abu
                                                        }
                                                    >
                                                        {row.selisih > 0 ? `+${row.selisih}` : row.selisih}
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}