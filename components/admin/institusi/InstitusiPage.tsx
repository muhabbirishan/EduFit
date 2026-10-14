"use client";

import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, Check, ChevronDown, MapPin, Plus, UsersRound, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function InstitusiPage() {
    const [schools, setSchools] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
    const [schoolName, setSchoolName] = useState("");
    const [schoolAddress, setSchoolAddress] = useState("");
    const [schoolType, setSchoolType] = useState("SMA"); // Fitur Baru: Tipe Sekolah
    const [isSubmittingSchool, setIsSubmittingSchool] = useState(false);

    const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
    const [teacherName, setTeacherName] = useState("");
    const [teacherEmail, setTeacherEmail] = useState("");
    const [teacherPassword, setTeacherPassword] = useState("");
    const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSubmittingTeacher, setIsSubmittingTeacher] = useState(false);

    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    const isDark = mounted && resolvedTheme === 'dark';

    const fetchAllData = async () => {
        setIsLoading(true);
        try {
            // Ambil field school_type jika sudah di-update di database
            const { data: sData } = await supabase.from('schools').select('*').order('created_at', { ascending: false });
            const { data: tData } = await supabase.from('user_profiles').select('*, schools(name)').eq('role', 'guru').order('created_at', { ascending: false });
            if (sData) setSchools(sData);
            if (tData) setTeachers(tData);
        } catch (error) {
            toast.error("Gagal memuat data dari database.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchAllData(); }, []);

    const handleAddSchool = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingSchool(true);
        try {
            const { error } = await supabase.from('schools').insert([{ name: schoolName, address: schoolAddress, school_type: schoolType }]).select();
            if (error) throw error;
            toast.success(`${schoolName} berhasil ditambahkan!`);
            fetchAllData();
            setIsSchoolModalOpen(false);
            setSchoolName(""); setSchoolAddress(""); setSchoolType("SMA");
        } catch (err: any) {
            toast.error('Gagal menambahkan sekolah', { description: err.message });
        } finally {
            setIsSubmittingSchool(false);
        }
    };

    const handleAddTeacher = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSchoolId) return toast.error("Gagal", { description: "Pilih Asal Sekolah terlebih dahulu." });
        if (teacherPassword.length < 6) return toast.error("Gagal", { description: "Password minimal 6 karakter." });

        setIsSubmittingTeacher(true);
        const promise = fetch('/api/create-teacher', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: teacherEmail, password: teacherPassword, full_name: teacherName, school_id: selectedSchoolId })
        }).then(async (res) => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data;
        });

        toast.promise(promise, {
            loading: 'Meregistrasi akun guru di server...',
            success: () => {
                fetchAllData();
                setIsTeacherModalOpen(false);
                setTeacherName(""); setTeacherEmail(""); setTeacherPassword(""); setSelectedSchoolId(null);
                return `Akun Guru ${teacherName} berhasil dibuat!`;
            },
            error: (err) => `Gagal: ${err.message}`
        });
        setIsSubmittingTeacher(false);
    };

    if (!mounted) return null;

    return (
        <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700 pb-10">

            {/* HEADER */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 relative z-10">
                <div>
                    <h1 className="text-4xl md:text-5xl font-light tracking-tighter leading-tight" style={{ color: isDark ? '#ffffff' : '#000000' }}>
                        Kelola <span className="font-semibold">Institusi</span>
                    </h1>
                    <p className="text-sm font-medium uppercase tracking-widest mt-2 opacity-50" style={{ color: isDark ? '#ffffff' : '#000000' }}>
                        Manajemen Daftar Sekolah dan Pendaftaran Akun Guru
                    </p>
                </div>

                <button onClick={() => setIsSchoolModalOpen(true)} className="px-6 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 hover:opacity-80 shadow-md"
                    style={{ backgroundColor: '#89f9b5', color: '#002110' }}>
                    <Plus size={18} /> Tambah Sekolah
                </button>
            </header>

            {/* DAFTAR SEKOLAH (GRID BENTO) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10 mb-10">
                {isLoading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-40 rounded-[2.5rem] animate-pulse" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}></div>)
                ) : schools.length === 0 ? (
                    <div className="col-span-full p-10 text-center rounded-[2.5rem] border border-dashed opacity-50" style={{ borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}>
                        <p className="text-xl font-light">Belum ada data sekolah terdaftar.</p>
                    </div>
                ) : (
                    schools.map((school) => (
                        <div key={school.id} className="p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden group border transition-transform hover:-translate-y-1"
                            style={{ backgroundColor: isDark ? '#111111' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: isDark ? '#fff' : '#000' }}>
                            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none transition-opacity group-hover:opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(currentColor 2px, transparent 2px)', backgroundSize: '20px 20px' }}></div>

                            <div className="relative z-10 flex justify-between items-start mb-6">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-colors" style={{ backgroundColor: isDark ? 'rgba(137,249,181,0.1)' : '#dcfce7' }}>
                                    <Building2 className="w-7 h-7" style={{ color: isDark ? '#89f9b5' : '#166534' }} />
                                </div>
                                {school.school_type && (
                                    <span className="px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
                                        {school.school_type}
                                    </span>
                                )}
                            </div>

                            <div className="relative z-10">
                                <h3 className="text-2xl font-light tracking-tight mb-3 leading-tight group-hover:text-[#89f9b5] transition-colors">{school.name}</h3>
                                <div className="flex items-start gap-2 opacity-60 text-xs leading-relaxed font-medium">
                                    <MapPin size={16} className="shrink-0 mt-0.5" /> {school.address}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* TABEL GURU */}
            <div className="rounded-[2.5rem] shadow-sm p-8 md:p-10 border relative z-10 overflow-hidden"
                style={{ backgroundColor: isDark ? '#1a1a1a' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: isDark ? '#fff' : '#000' }}>
                <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, currentColor, currentColor 1px, transparent 1px, transparent 16px)' }}></div>

                <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-8 pb-6 border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                    <div>
                        <div className="flex items-center gap-2 opacity-50 text-xs font-bold uppercase tracking-widest mb-2"><UsersRound size={16} /> Manajemen Akun</div>
                        <h2 className="text-3xl font-light tracking-tight">Daftar Guru Terdaftar</h2>
                    </div>
                    <button onClick={() => setIsTeacherModalOpen(true)} className="px-6 py-3 rounded-full text-[11px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2 hover:opacity-80"
                        style={{ backgroundColor: isDark ? '#ffffff' : '#032521', color: isDark ? '#000' : '#fff' }}>
                        <Plus size={16} /> Buat Akun Guru
                    </button>
                </div>

                <div className="relative z-10 overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="border-b text-[10px] uppercase tracking-widest font-bold opacity-50" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                                <th className="pb-4 px-2">Nama Lengkap</th>
                                <th className="pb-4 px-2">Alamat Email</th>
                                <th className="pb-4 px-2">Penempatan Sekolah</th>
                                <th className="pb-4 px-2 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm font-medium">
                            {isLoading ? (
                                <tr><td colSpan={4} className="py-10 text-center opacity-50 animate-pulse">Menarik data guru...</td></tr>
                            ) : teachers.length === 0 ? (
                                <tr><td colSpan={4} className="py-10 text-center opacity-50 font-light">Belum ada akun guru yang terdaftar di sistem.</td></tr>
                            ) : (
                                teachers.map((t) => (
                                    <tr key={t.id} className="border-b transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                                        <td className="py-5 px-2 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
                                                {t.full_name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-bold text-base">{t.full_name}</span>
                                        </td>
                                        <td className="py-5 px-2 opacity-70">{t.email}</td>
                                        <td className="py-5 px-2">
                                            <span className="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest" style={{ backgroundColor: isDark ? 'rgba(137,249,181,0.1)' : '#dcfce7', color: isDark ? '#89f9b5' : '#166534' }}>
                                                {t.schools?.name || "Unassigned"}
                                            </span>
                                        </td>
                                        <td className="py-5 px-2 text-right">
                                            <button className="text-xs font-bold transition-colors hover:underline" style={{ color: isDark ? '#89f9b5' : '#166534' }}>Kelola</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL TAMBAH SEKOLAH */}
            <AnimatePresence>
                {isSchoolModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSchoolModalOpen(false)} />

                        <motion.div initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }}
                            className="w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 relative z-10 shadow-2xl border"
                            style={{ backgroundColor: isDark ? '#111111' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: isDark ? '#fff' : '#000' }}>
                            <button onClick={() => setIsSchoolModalOpen(false)} className="absolute top-6 right-6 p-2 rounded-full transition-colors hover:bg-red-500 hover:text-white" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}><X size={20} /></button>

                            <h2 className="text-3xl font-light tracking-tight mb-8">Tambah <span className="font-semibold">Sekolah</span></h2>

                            <form onSubmit={handleAddSchool} className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block">Jenis Institusi</label>
                                    <div className="flex gap-2 p-1.5 rounded-full" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                                        {['SMA', 'SMK'].map(type => (
                                            <button key={type} type="button" onClick={() => setSchoolType(type)}
                                                className="flex-1 py-3 rounded-full text-xs font-bold transition-all"
                                                style={{ backgroundColor: schoolType === type ? '#89f9b5' : 'transparent', color: schoolType === type ? '#002110' : 'inherit', opacity: schoolType === type ? 1 : 0.5 }}>
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block">Nama Resmi</label>
                                    <input required value={schoolName} onChange={(e) => setSchoolName(e.target.value)} type="text" placeholder="Contoh: SMAN 8 Pekanbaru"
                                        className="w-full bg-transparent border-b-2 py-3 text-2xl font-light tracking-tight focus:outline-none transition-colors"
                                        style={{ borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block">Alamat Lengkap</label>
                                    <textarea required value={schoolAddress} onChange={(e) => setSchoolAddress(e.target.value)} placeholder="Alamat detail..." rows={3}
                                        className="w-full p-4 rounded-xl text-sm focus:outline-none resize-none border transition-colors"
                                        style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}></textarea>
                                </div>
                                <button type="submit" disabled={isSubmittingSchool} className="w-full py-4 rounded-full font-bold text-xs uppercase tracking-widest transition-opacity hover:opacity-80 shadow-md"
                                    style={{ backgroundColor: '#89f9b5', color: '#002110' }}>
                                    {isSubmittingSchool ? 'Menyimpan...' : 'Simpan ke Database'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL TAMBAH GURU */}
            <AnimatePresence>
                {isTeacherModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsTeacherModalOpen(false)} />

                        <motion.div initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }}
                            className="w-full max-w-2xl rounded-[2.5rem] p-8 md:p-10 relative z-10 shadow-2xl border"
                            style={{ backgroundColor: isDark ? '#1a1a1a' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: isDark ? '#fff' : '#000' }}>
                            <button onClick={() => setIsTeacherModalOpen(false)} className="absolute top-6 right-6 p-2 rounded-full transition-colors hover:bg-red-500 hover:text-white" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}><X size={20} /></button>

                            <h2 className="text-3xl font-light tracking-tight mb-2">Registrasi <span className="font-semibold">Guru</span></h2>
                            <p className="text-sm opacity-50 mb-8 font-medium">Sistem akan otomatis mendaftarkan otentikasi login sekaligus memprofilkan data guru.</p>

                            <form onSubmit={handleAddTeacher} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block">Nama Lengkap (Beserta Gelar)</label>
                                        <input required value={teacherName} onChange={(e) => setTeacherName(e.target.value)} type="text" placeholder="Budi Santoso, S.Pd"
                                            className="w-full bg-transparent border-b-2 py-3 text-2xl font-light tracking-tight focus:outline-none transition-colors"
                                            style={{ borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block">Email Login</label>
                                        <input required value={teacherEmail} onChange={(e) => setTeacherEmail(e.target.value)} type="email" placeholder="budi@sekolah.edu"
                                            className="w-full p-4 rounded-xl text-sm focus:outline-none border"
                                            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block">Password Akses</label>
                                        <input required minLength={6} value={teacherPassword} onChange={(e) => setTeacherPassword(e.target.value)} type="text" placeholder="Minimal 6 karakter"
                                            className="w-full p-4 rounded-xl text-sm focus:outline-none border"
                                            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
                                    </div>
                                </div>

                                <div className="relative pt-4">
                                    <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-3 block">Penempatan Institusi</label>
                                    <div onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full p-4 rounded-xl flex items-center justify-between cursor-pointer border transition-colors"
                                        style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                                        <span className={selectedSchoolId ? "font-bold" : "opacity-50 text-sm"}>
                                            {selectedSchoolId ? schools.find(s => s.id === selectedSchoolId)?.name : "Pilih sekolah penempatan..."}
                                        </span>
                                        <ChevronDown size={20} className={`opacity-50 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                                    </div>

                                    <AnimatePresence>
                                        {isDropdownOpen && (
                                            <motion.ul initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                                className="absolute left-0 right-0 top-full mt-2 rounded-xl shadow-2xl z-[150] max-h-60 overflow-y-auto no-scrollbar p-2 border"
                                                style={{ backgroundColor: isDark ? '#222222' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                                                {schools.map(school => (
                                                    <li key={school.id} onClick={() => { setSelectedSchoolId(school.id); setIsDropdownOpen(false); }}
                                                        className="px-4 py-3 rounded-lg cursor-pointer flex justify-between items-center text-sm font-bold transition-colors"
                                                        style={{ backgroundColor: selectedSchoolId === school.id ? (isDark ? 'rgba(137,249,181,0.1)' : '#dcfce7') : 'transparent', color: selectedSchoolId === school.id ? (isDark ? '#89f9b5' : '#166534') : 'inherit' }}>
                                                        {school.name}
                                                        {selectedSchoolId === school.id && <Check size={16} />}
                                                    </li>
                                                ))}
                                                {schools.length === 0 && <li className="p-4 text-center text-sm opacity-50">Belum ada sekolah terdaftar.</li>}
                                            </motion.ul>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <button type="submit" disabled={isSubmittingTeacher} className="w-full py-4 mt-8 rounded-full font-bold text-xs uppercase tracking-widest transition-opacity shadow-md disabled:opacity-50 hover:opacity-80"
                                    style={{ backgroundColor: '#89f9b5', color: '#002110' }}>
                                    {isSubmittingTeacher ? 'Memproses ke Server...' : 'Buat Akun Guru'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}