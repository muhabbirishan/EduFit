"use client";

import { supabase } from "@/lib/supabase";
import { Activity, Download, FileSpreadsheet, Search, UsersRound } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function PraktikPage() {
    const [praktikData, setPraktikData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeGrade, setActiveGrade] = useState<number>(10);
    const [searchQuery, setSearchQuery] = useState("");

    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    const isDark = mounted && resolvedTheme === 'dark';

    // Definisi Unit Praktik (Kolom Dinamis)
    const unitConfig: Record<number, string[]> = {
        10: ["Daya Tahan Jantung-Paru", "Kekuatan Otot", "Kelenturan", "Komposisi Tubuh (IMT)"],
        11: ["Kecepatan", "Kelincahan", "Keseimbangan", "Koordinasi"],
        12: ["Kondisi Kebugaran Awal", "IMT & Profil Awal", "Prinsip Program Latihan", "Membaca Program Pribadi", "Pelaksanaan Program", "Evaluasi Perkembangan"]
    };

    useEffect(() => {
        async function fetchPraktikData() {
            setIsLoading(true);
            try {
                // Tarik data profil siswa
                const { data: students } = await supabase.from('user_profiles').select('id, full_name').eq('role', 'siswa');
                // Tarik data praktik (karena Admin, tarik semua)
                const { data: practices } = await supabase.from('optional_practices').select('student_id, unit_name, score');

                const currentUnits = unitConfig[activeGrade];
                const formattedData = students?.map(student => {
                    const studentPractices = practices?.filter(p => p.student_id === student.id) || [];
                    const record: any = { id: student.id, name: student.full_name || "Tanpa Nama" };
                    currentUnits.forEach(unit => {
                        // Mencocokkan nama unit dengan substring agar lebih robust (karena nama unit di DB bisa panjang)
                        const found = studentPractices.find(p => p.unit_name.includes(unit.split(' ')[0]));
                        record[unit] = found ? found.score : null; // null = Belum ada aksi
                    });
                    return record;
                });

                // Sorting alphabet
                formattedData?.sort((a, b) => a.name.localeCompare(b.name));
                setPraktikData(formattedData || []);
            } catch (error: any) {
                toast.error("Gagal memuat rekap praktik.");
            } finally {
                setIsLoading(false);
            }
        }
        fetchPraktikData();
    }, [activeGrade]);

    const filteredData = praktikData.filter(row => row.name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!mounted) return null;

    return (
        <div className="w-full animate-in fade-in duration-700 pb-10">

            {/* HEADER */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 relative z-10">
                <div>
                    <h1 className="text-4xl md:text-5xl font-light tracking-tighter leading-tight" style={{ color: isDark ? '#ffffff' : '#000000' }}>
                        Praktik <span className="font-semibold">Opsional</span>
                    </h1>
                    <p className="text-sm font-medium uppercase tracking-widest mt-2 opacity-50" style={{ color: isDark ? '#ffffff' : '#000000' }}>
                        Rekapitulasi Pemantauan Lapangan & Jurnal
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
                </div>
            </header>

            {/* CONTAINER TABEL BENTO */}
            <div className="rounded-[2.5rem] shadow-sm border flex flex-col relative overflow-hidden z-10"
                style={{ backgroundColor: isDark ? '#111111' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: isDark ? '#fff' : '#000' }}>

                {/* TOOLBAR BAWAH TABEL */}
                <div className="p-8 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors" style={{ backgroundColor: isDark ? 'rgba(137,249,181,0.1)' : '#dcfce7' }}>
                            <FileSpreadsheet size={20} style={{ color: isDark ? '#89f9b5' : '#166534' }} />
                        </div>
                        <div>
                            <h2 className="text-xl font-light tracking-tight">Rekap Kelas {activeGrade === 10 ? 'X' : activeGrade === 11 ? 'XI' : 'XII'}</h2>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mt-1">{filteredData.length} Siswa Terdaftar</p>
                        </div>
                    </div>

                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 opacity-50 w-4 h-4" />
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari nama siswa..."
                            className="w-full pl-12 pr-5 py-3.5 rounded-full text-sm font-medium outline-none transition-colors border"
                            style={{ backgroundColor: isDark ? '#1a1a1a' : '#f8fafc', color: isDark ? '#ffffff' : '#000000', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }} />
                    </div>
                </div>

                {/* TABEL AREA */}
                <div className="overflow-x-auto no-scrollbar relative">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="border-b text-[10px] uppercase tracking-widest font-bold opacity-60" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                                <th className="py-6 px-8 sticky left-0 z-20 border-r" style={{ backgroundColor: isDark ? '#111111' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>Nama Siswa</th>
                                {unitConfig[activeGrade].map((unit, idx) => (
                                    <th key={idx} className="py-6 px-6 text-center max-w-[150px] truncate" title={unit}>{unit}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {isLoading ? (
                                <tr><td colSpan={unitConfig[activeGrade].length + 1} className="py-20 text-center opacity-50 animate-pulse text-lg font-light">Menarik data jurnal praktik...</td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={unitConfig[activeGrade].length + 1} className="py-20 text-center opacity-50">
                                        <UsersRound className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p className="text-lg font-light">Tidak ada siswa yang cocok.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((row) => (
                                    <tr key={row.id} className="border-b transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                                        <td className="py-5 px-8 font-bold sticky left-0 z-10 border-r transition-colors" style={{ backgroundColor: isDark ? '#111111' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                                            {row.name}
                                        </td>
                                        {unitConfig[activeGrade].map((unit, idx) => (
                                            <StatusCell key={idx} value={row[unit]} isDark={isDark} />
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* FOOTER TABEL */}
                <div className="p-6 border-t flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" style={{ backgroundColor: isDark ? '#1a1a1a' : '#f8fafc', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                    <p className="text-xs font-medium opacity-50 leading-relaxed max-w-xl">
                        Praktik tidak menentukan status selesai belajar. Sesi yang <span className="line-through">Dilewati</span> tidak akan diberikan nilai nol pada rapor evaluasi kognitif akhir.
                    </p>
                    <button onClick={() => toast.success("Menyiapkan dokumen CSV...")} className="px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2 hover:opacity-80 shadow-md shrink-0" style={{ backgroundColor: '#89f9b5', color: '#002110' }}>
                        <Download size={14} /> Ekspor Data
                    </button>
                </div>
            </div>

            {/* INFO PANEL (BENTO CARD) */}
            <div className="mt-8 rounded-[2.5rem] p-8 border flex flex-col md:flex-row gap-6 relative overflow-hidden group"
                style={{ backgroundColor: isDark ? '#022c22' : '#032521', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'transparent', color: '#fff' }}>
                <div className="absolute inset-0 pointer-events-none transition-opacity opacity-[0.05] group-hover:opacity-[0.1]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,1) 2px, transparent 2px)', backgroundSize: '24px 24px' }}></div>

                <div className="shrink-0 relative z-10 w-12 h-12 rounded-full flex items-center justify-center bg-white/10">
                    <Activity className="text-[#89f9b5]" size={24} />
                </div>
                <div className="relative z-10">
                    <h3 className="font-light tracking-tight text-2xl mb-2">Informasi Kebijakan Lapangan</h3>
                    <p className="text-sm font-medium opacity-70 leading-relaxed max-w-4xl">
                        Guru penjas menentukan kegiatan praktik atau tes fisik sesuai dengan fasilitas dan kondisi kelas masing-masing. Mereka akan memberikan penilaian atau umpan balik secara langsung melalui aplikasi (Ruang Guru). Ingat bahwa nilai praktik ini berdiri sendiri dan tidak digabungkan dengan nilai murni *Pretest-Posttest*. Posttest tetap dapat diselesaikan meskipun sesi praktik belum dipilih atau dikerjakan oleh siswa.
                    </p>
                </div>
            </div>

        </div>
    );
}

// Sub-komponen Format Sel (Anti-Bug)
const StatusCell = ({ value, isDark }: { value: any, isDark: boolean }) => (
    <td className="py-5 px-6 text-center">
        {value === null ? (
            <span className="text-[11px] font-bold uppercase tracking-widest opacity-30">Kosong</span>
        ) : value === 'Dilewati' ? (
            <span className="text-[11px] font-bold uppercase tracking-widest opacity-40 line-through">Dilewati</span>
        ) : (
            <span className="px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest border"
                style={{ backgroundColor: isDark ? 'rgba(137,249,181,0.1)' : '#dcfce7', color: isDark ? '#89f9b5' : '#166534', borderColor: isDark ? 'rgba(137,249,181,0.2)' : '#bbf7d0' }}>
                {value}
            </span>
        )}
    </td>
);