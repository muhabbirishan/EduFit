"use client";

import { supabase } from "@/lib/supabase";
import { Archive, Filter, History, Search } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ArsipPage() {
    const [archives, setArchives] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterYear, setFilterYear] = useState<string>("all");
    const [uniqueYears, setUniqueYears] = useState<string[]>([]);

    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    const isDark = mounted && resolvedTheme === 'dark';

    useEffect(() => {
        async function fetchArchives() {
            setIsLoading(true);
            try {
                const { data, error } = await supabase.from('legacy_archives').select('*, user_profiles(full_name)').order('archived_at', { ascending: false });
                if (error) throw error;
                setArchives(data || []);
                const years = Array.from(new Set(data?.map(item => item.academic_year) || []));
                setUniqueYears(years);
            } catch (error: any) { toast.error("Gagal menarik data arsip"); } finally { setIsLoading(false); }
        }
        fetchArchives();
    }, []);

    const filteredArchives = filterYear === "all" ? archives : archives.filter(a => a.academic_year === filterYear);
    if (!mounted) return null;

    return (
        <div className="w-full animate-in fade-in duration-700 pb-10">

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 relative z-10">
                <div>
                    <h1 className="text-4xl md:text-5xl font-light tracking-tighter leading-tight" style={{ color: isDark ? '#ffffff' : '#000000' }}>
                        Arsip <span className="font-semibold">Sistem</span>
                    </h1>
                    <p className="text-sm font-medium uppercase tracking-widest mt-2 opacity-50" style={{ color: isDark ? '#ffffff' : '#000000' }}>
                        Histori Data Kebugaran & Akademik Siswa
                    </p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 mb-10">
                <div className="rounded-[2.5rem] p-8 shadow-sm flex items-center gap-6 border relative overflow-hidden group" style={{ backgroundColor: isDark ? '#111111' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: isDark ? '#fff' : '#000' }}>
                    <div className="absolute inset-0 pointer-events-none transition-opacity opacity-[0.03] dark:opacity-[0.05] group-hover:opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(currentColor 2px, transparent 2px)', backgroundSize: '16px 16px' }}></div>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 transition-colors relative z-10" style={{ backgroundColor: isDark ? 'rgba(56,189,248,0.1)' : '#e0f2fe' }}>
                        <Archive className="w-8 h-8" style={{ color: isDark ? '#38bdf8' : '#0284c7' }} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">Total Arsip Tersimpan</p>
                        <h3 className="text-4xl font-light tracking-tight">{archives.length} <span className="text-xl font-semibold opacity-50">Data</span></h3>
                    </div>
                </div>
                <div className="rounded-[2.5rem] p-8 shadow-sm flex items-center gap-6 border relative overflow-hidden group" style={{ backgroundColor: isDark ? '#111111' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: isDark ? '#fff' : '#000' }}>
                    <div className="absolute inset-0 pointer-events-none transition-opacity opacity-[0.03] dark:opacity-[0.05] group-hover:opacity-[0.08]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, currentColor, currentColor 2px, transparent 2px, transparent 16px)' }}></div>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 transition-colors relative z-10" style={{ backgroundColor: isDark ? 'rgba(168,85,247,0.1)' : '#f3e8ff' }}>
                        <History className="w-8 h-8" style={{ color: isDark ? '#c084fc' : '#7e22ce' }} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">Tahun Ajaran Terakhir</p>
                        <h3 className="text-4xl font-light tracking-tight">{uniqueYears.length > 0 ? Math.max(...uniqueYears.map(y => parseInt(y.split('/')[0]))) + "/" + (Math.max(...uniqueYears.map(y => parseInt(y.split('/')[0]))) + 1) : "-"}</h3>
                    </div>
                </div>
            </div>

            <div className="rounded-[2.5rem] shadow-sm flex flex-col relative z-10 overflow-hidden border" style={{ backgroundColor: isDark ? '#1a1a1a' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: isDark ? '#fff' : '#000' }}>
                <div className="p-8 border-b flex flex-col md:flex-row justify-between gap-4 items-start md:items-center" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                    <div className="flex items-center gap-3">
                        <Filter size={20} className="opacity-50" />
                        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="text-xs font-bold uppercase px-5 py-3.5 rounded-full outline-none cursor-pointer border" style={{ backgroundColor: isDark ? '#222' : '#f8fafc', color: isDark ? '#fff' : '#000', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                            <option value="all">Semua Tahun Ajaran</option>
                            {uniqueYears.map(year => <option key={year} value={year}>{year}</option>)}
                        </select>
                    </div>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 opacity-50 w-4 h-4" />
                        <input type="text" placeholder="Cari arsip siswa..." className="w-full pl-12 pr-5 py-3.5 rounded-full text-sm font-medium outline-none transition-colors border" style={{ backgroundColor: isDark ? '#111' : '#ffffff', color: isDark ? '#ffffff' : '#000000', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
                    </div>
                </div>

                <div className="overflow-x-auto no-scrollbar relative flex-1">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="border-b text-[10px] uppercase tracking-widest font-bold opacity-60" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                                <th className="py-6 px-8">Tahun Ajaran</th>
                                <th className="py-6 px-6">Nama Siswa</th>
                                <th className="py-6 px-6">Data JSON Ringkasan</th>
                                <th className="py-6 px-8 text-right">Tercatat Pada</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm font-medium">
                            {isLoading ? (
                                <tr><td colSpan={4} className="py-20 text-center opacity-50 animate-pulse text-lg font-light">Membuka brankas arsip...</td></tr>
                            ) : filteredArchives.length === 0 ? (
                                <tr><td colSpan={4} className="py-20 text-center opacity-50 font-light text-lg">Brankas arsip kosong.</td></tr>
                            ) : (
                                filteredArchives.map((row) => {
                                    let summaryStr = "N/A";
                                    try {
                                        const parsed = typeof row.summary_data === 'string' ? JSON.parse(row.summary_data) : row.summary_data;
                                        if (parsed) summaryStr = `Pre: ${parsed.pretest_avg || '-'} | Post: ${parsed.posttest_avg || '-'} | TKJI: ${parsed.tkji_category || '-'}`;
                                    } catch (e) { }

                                    return (
                                        <tr key={row.id} className="border-b transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                                            <td className="py-6 px-8">
                                                <span className="px-4 py-1.5 rounded-full text-[11px] font-bold tracking-widest border" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>{row.academic_year}</span>
                                            </td>
                                            <td className="py-6 px-6 font-bold text-base">{row.user_profiles?.full_name || "Unknown"}</td>
                                            <td className="py-6 px-6 font-mono text-[11px] opacity-70">
                                                <div className="bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-lg inline-block">{summaryStr}</div>
                                            </td>
                                            <td className="py-6 px-8 text-right opacity-50 text-xs">{new Date(row.archived_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}