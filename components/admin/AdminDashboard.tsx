"use client";

import { supabase } from "@/lib/supabase";
import { ArrowUpRight, BookOpen, Download, TrendingUp, Users, BrainCircuit } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTheme } from "next-themes";

export default function AdminDashboard() {
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>("all");

    const [stats, setStats] = useState({ totalSiswa: 0, avgPre: 0, avgPost: 0 });
    const [chartData, setChartData] = useState<any[]>([]);
    const [tpData, setTpData] = useState<any>({
        "X-1": { pre: 0, post: 0, title: "Komponen Kebugaran" },
        "X-2": { pre: 0, post: 0, title: "Tafsir IMT & Kebugaran" },
        "X-3": { pre: 0, post: 0, title: "Analisis Bentuk Latihan" },
        "X-4": { pre: 0, post: 0, title: "Refleksi Respons Tubuh" }
    });

    const [isLoading, setIsLoading] = useState(true);
    
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    const isDark = mounted && resolvedTheme === 'dark';

    useEffect(() => {
        async function fetchDashboardData() {
            setIsLoading(true);
            try {
                const { data: classData } = await supabase.from('classes').select('id, name');
                if (classData) setClasses(classData);

                let querySiswa = supabase.from('user_profiles').select('id', { count: 'exact' }).eq('role', 'siswa');
                if (selectedClass !== "all") {
                    querySiswa = supabase.from('student_classes').select('student_id', { count: 'exact' }).eq('class_id', selectedClass);
                }
                const { count: countSiswa } = await querySiswa;

                const { data: evals } = await supabase.from('student_evaluation_scores').select('score, submitted_at, master_evaluations(type)');

                let totalPre = 0, countPre = 0, totalPost = 0, countPost = 0;
                const trendData: any = {};

                evals?.forEach((ev: any) => {
                    const type = ev.master_evaluations?.type;
                    const score = Number(ev.score) || 0;
                    if (type === 'pretest') { totalPre += score; countPre++; }
                    else if (type === 'posttest') { totalPost += score; countPost++; }
                });

                const { data: answers } = await supabase.from('student_answers').select(`is_correct, question_bank!inner(learning_objective_code), student_evaluation_scores!inner(master_evaluations!inner(type))`);

                let newTp = { ...tpData };
                let tpCounts: any = { "X-1": { preT: 0, preC: 0, postT: 0, postC: 0 }, "X-2": { preT: 0, preC: 0, postT: 0, postC: 0 }, "X-3": { preT: 0, preC: 0, postT: 0, postC: 0 }, "X-4": { preT: 0, preC: 0, postT: 0, postC: 0 } };

                answers?.forEach((ans: any) => {
                    const code = ans.question_bank.learning_objective_code;
                    const type = ans.student_evaluation_scores.master_evaluations.type;
                    if (tpCounts[code]) {
                        if (type === 'pretest') { tpCounts[code].preT++; if (ans.is_correct) tpCounts[code].preC++; }
                        if (type === 'posttest') { tpCounts[code].postT++; if (ans.is_correct) tpCounts[code].postC++; }
                    }
                });

                Object.keys(tpCounts).forEach(code => {
                    if (newTp[code]) {
                        newTp[code].pre = tpCounts[code].preT > 0 ? Math.round((tpCounts[code].preC / tpCounts[code].preT) * 100) : 0;
                        newTp[code].post = tpCounts[code].postT > 0 ? Math.round((tpCounts[code].postC / tpCounts[code].postT) * 100) : 0;
                    }
                });
                setTpData(newTp);

                setStats({
                    totalSiswa: countSiswa || 0,
                    avgPre: countPre > 0 ? Math.round(totalPre / countPre) : 0,
                    avgPost: countPost > 0 ? Math.round(totalPost / countPost) : 0,
                });

            } catch (error: any) {
                toast.error("Gagal memuat data");
            } finally {
                setIsLoading(false);
            }
        }
        fetchDashboardData();
    }, [selectedClass]);

    const kognitifGain = stats.avgPost - stats.avgPre;
    
    // Palet Warna TPU (Hijau Admin)
    const tpColors = [
      "bg-[#bbf7d0] text-black dark:bg-[#064e3b] dark:text-white dark:border dark:border-white/10 dark:hover:border-[#34d399]/50", 
      "bg-[#d9f99d] text-black dark:bg-[#14532d] dark:text-white dark:border dark:border-white/10 dark:hover:border-[#34d399]/50", 
      "bg-[#86efac] text-black dark:bg-[#022c22] dark:text-white dark:border dark:border-white/10 dark:hover:border-[#34d399]/50",
      "bg-[#a7f3d0] text-black dark:bg-[#065f46] dark:text-white dark:border dark:border-white/10 dark:hover:border-[#34d399]/50"
    ];

    if (!mounted) return null;

    return (
        <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700 pb-10">

            {/* FILTER KELAS */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 relative z-10">
                <div>
                    <h1 className="text-4xl md:text-5xl font-light tracking-tighter leading-tight" style={{ color: isDark ? '#ffffff' : '#000000' }}>
                        Dashboard <span className="font-semibold">Sistem</span>
                    </h1>
                    <p className="text-sm font-medium uppercase tracking-widest mt-2 opacity-50" style={{ color: isDark ? '#ffffff' : '#000000' }}>
                        Ringkasan Pemahaman Seluruh Siswa
                    </p>
                </div>

                <div className="flex w-full md:w-auto overflow-x-auto no-scrollbar p-1.5 rounded-full shadow-sm border" style={{ backgroundColor: isDark ? '#1a1a1a' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
                    <button onClick={() => setSelectedClass('all')} 
                        className={`whitespace-nowrap px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${selectedClass === 'all' ? 'bg-[#89f9b5] text-black shadow-md' : 'opacity-50 hover:opacity-100'}`}
                        style={{ color: selectedClass === 'all' ? '#000' : (isDark ? '#fff' : '#000') }}>
                        Semua Kelas
                    </button>
                    {classes.map((cls) => (
                        <button key={cls.id} onClick={() => setSelectedClass(cls.id)} 
                            className={`whitespace-nowrap px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${selectedClass === cls.id ? 'bg-[#89f9b5] text-black shadow-md' : 'opacity-50 hover:opacity-100'}`}
                            style={{ color: selectedClass === cls.id ? '#000' : (isDark ? '#fff' : '#000') }}>
                            {cls.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">

                {/* BENTO 1: TOTAL SISWA (GRID PATTERN) */}
                <div className="lg:col-span-4 p-8 md:p-10 rounded-[2.5rem] shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[320px] border group"
                     style={{ backgroundColor: isDark ? '#022c22' : '#032521', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
                    {/* Variasi: Grid Milimeter Blok */}
                    <div className="absolute inset-0 pointer-events-none transition-opacity opacity-[0.05] group-hover:opacity-[0.1]" 
                         style={{ backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)', backgroundSize: '30px 30px', color: '#ffffff' }}></div>
                    
                    <div className="relative z-10 text-white flex-1 flex flex-col">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-60 mb-6"><Users size={16}/> Populasi Sistem</div>
                        <div className="mt-auto">
                           <div className="text-8xl font-light tracking-tighter leading-none mb-2">{isLoading ? "-" : stats.totalSiswa}</div>
                           <div className="text-sm font-bold uppercase tracking-widest text-[#89f9b5]">Siswa Terdaftar</div>
                        </div>
                    </div>
                </div>

                {/* BENTO 2: KOGNITIF PROGRESS (DIAGONAL STRIPES PATTERN) */}
                <div className="lg:col-span-8 p-8 md:p-10 rounded-[2.5rem] shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[320px] border group"
                     style={{ backgroundColor: isDark ? '#111111' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: isDark ? '#fff' : '#000' }}>
                    {/* Variasi: Garis Diagonal Miring */}
                    <div className="absolute inset-0 pointer-events-none transition-opacity opacity-[0.02] dark:opacity-[0.04] group-hover:opacity-[0.06]" 
                         style={{ backgroundImage: 'repeating-linear-gradient(45deg, currentColor, currentColor 2px, transparent 2px, transparent 16px)' }}></div>

                    <div className="flex justify-between items-start relative z-10">
                        <div className="flex items-center gap-2 opacity-50 text-xs font-bold uppercase tracking-widest"><BrainCircuit size={16}/> Evaluasi Kognitif Rata-Rata</div>
                        <button className="px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2 hover:opacity-80 shadow-sm" style={{ backgroundColor: '#89f9b5', color: '#002110' }}>
                           <Download size={14} /> Ekspor Data
                        </button>
                    </div>
                    
                    <div className="mt-6 flex flex-col justify-center relative z-10">
                        <div className="flex items-end gap-3 mb-2">
                           <div className="text-6xl md:text-7xl font-light tracking-tighter leading-none">{isLoading ? "-" : stats.avgPost}</div>
                           <div className="text-sm font-semibold opacity-50 mb-1">Rata-rata Posttest Keseluruhan</div>
                        </div>
                        
                        <div className="mt-8 space-y-5">
                           <div>
                             <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-2 opacity-60"><span>Pretest</span><span>{stats.avgPre}</span></div>
                             <div className="h-3 w-full rounded-full overflow-hidden" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
                               <div className="h-full bg-blue-400 rounded-full" style={{ width: `${Math.max(0, Math.min(100, stats.avgPre))}%` }}></div>
                             </div>
                           </div>
                           <div>
                             <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-2"><span style={{ color: '#89f9b5' }}>Posttest</span><span style={{ color: '#89f9b5' }}>{stats.avgPost}</span></div>
                             <div className="h-3 w-full rounded-full overflow-hidden" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
                               <div className="h-full rounded-full shadow-[0_0_15px_rgba(137,249,181,0.5)]" style={{ width: `${Math.max(0, Math.min(100, stats.avgPost))}%`, backgroundColor: '#89f9b5' }}></div>
                             </div>
                           </div>
                        </div>
                        {kognitifGain > 0 && <div className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#89f9b5]"><TrendingUp size={16}/> +{kognitifGain} Poin Peningkatan</div>}
                    </div>
                </div>

            </div>

            {/* BENTO GRID: TUJUAN PEMBELAJARAN (POLKADOT KECIL) */}
            <h3 className="text-xl font-light tracking-tight mb-4 mt-10" style={{ color: isDark ? '#ffffff' : '#000000', opacity: 0.5 }}>Capaian Tujuan Pembelajaran</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                {Object.keys(tpData).map((code, index) => {
                    const tp = tpData[code];
                    const colorClass = tpColors[index % tpColors.length];
                    
                    return (
                        <div key={code} className={`${colorClass} p-8 rounded-[2.5rem] shadow-sm transition-transform hover:-translate-y-1 relative overflow-hidden group`}>
                            {/* Variasi: Polkadot Halus (Dots) */}
                            <div className="absolute inset-0 opacity-[0.05] pointer-events-none transition-opacity group-hover:opacity-[0.1]" 
                                 style={{ backgroundImage: 'radial-gradient(currentColor 2px, transparent 2px)', backgroundSize: '16px 16px' }}></div>
                            
                            <div className="flex justify-between items-start relative z-10 mb-8">
                                <span className="px-4 py-1.5 bg-black/10 dark:bg-white/10 rounded-full text-[10px] font-bold tracking-widest uppercase">
                                    {code}
                                </span>
                                <button className="w-10 h-10 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors">
                                    <ArrowUpRight size={20} strokeWidth={1.5} />
                                </button>
                            </div>

                            <div className="relative z-10">
                                <h4 className="text-2xl font-light tracking-tight mb-8 leading-tight min-h-[64px]">{tp.title}</h4>
                                
                                <div className="flex justify-between items-end border-t border-black/10 dark:border-white/10 pt-5">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">Pretest</p>
                                        <p className="text-3xl font-light leading-none">{isLoading ? "-" : `${tp.pre}%`}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">Posttest</p>
                                        <p className="text-4xl font-light leading-none">{isLoading ? "-" : `${tp.post}%`}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
        </div>
    );
}