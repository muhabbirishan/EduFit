// @ts-nocheck
"use client";

import { supabase } from "@/lib/supabase";
import { ArrowLeft, ArrowUpRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // 1. Autentikasi dengan Supabase
            const { data: authData, error: authError } =
                await supabase.auth.signInWithPassword({
                    email,
                    password
                });

            if (authError) throw new Error("Email atau password salah.");
            if (!authData.user) throw new Error("User tidak ditemukan.");

            // 2. Cek Role dari tabel user_profiles
            const { data: profile, error: profileError } = await supabase
                .from("user_profiles")
                .select("role")
                .eq("id", authData.user.id)
                .single();

            if (profileError || !profile) {
                throw new Error("Gagal mengambil profil pengguna.");
            }

            // 3. Otorisasi berdasarkan Role
            if (profile.role === "siswa") {
                await supabase.auth.signOut();
                toast.error("Akses Web Ditolak!", {
                    description:
                        "Siswa hanya dapat login melalui Aplikasi Mobile EduFit."
                });
            } else if (profile.role === "admin") {
                toast.success("Login Berhasil!", {
                    description: "Mengarahkan ke Dashboard Admin..."
                });
                router.push("/admin");
            } else if (profile.role === "guru") {
                toast.success("Login Berhasil!", {
                    description: "Mengarahkan ke Dashboard Guru..."
                });
                router.push("/guru");
            }
        } catch (error: any) {
            toast.error("Gagal Login", { description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-screen min-h-screen flex flex-col lg:flex-row overflow-x-hidden bg-[#f4f1ea] text-[#18181b]">
            {/* ==============================================================
                KOLOM KIRI: VISUAL EDITORIAL & LOGO GAMBAR ASLI
               ============================================================== */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-[#141413] overflow-hidden">
                <img
                    src="/images/intro-card.jpg"
                    alt="EduFit Background"
                    className="absolute inset-0 w-full h-full object-cover opacity-65 scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141413] via-[#141413]/70 to-black/40" />

                <div className="relative z-10 flex flex-col justify-between p-14 w-full text-white">
                    {/* LOGO GAMBAR ASLI PENGGANTI TEKS EDUFIT */}
                    <Link
                        href="/"
                        className="inline-flex items-center w-fit hover:scale-105 transition-transform"
                    >
                        <img
                            src="/images/logo-putih.png"
                            alt="EduFit"
                            className="h-20 w-auto object-contain drop-shadow-md"
                        />
                    </Link>

                    <div className="space-y-6">
                        <div className="border-l-2 border-[#f5c84c] pl-4">
                            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#f5c84c] block mb-1">
                                Portal Pendidik & Administrator
                            </span>
                            <p className="text-white/80 max-w-md text-sm leading-relaxed">
                                Mengintegrasikan kurikulum PJOK SMA Indonesia dengan analitik
                                kebugaran jasmani dan manajemen bahan ajar terpadu.
                            </p>
                        </div>

                        <h2 className="text-5xl xl:text-6xl font-bebas leading-[0.9] tracking-tight text-white">
                            SISTEM PEMANTAUAN <br />
                            <span className="text-[#f5c84c]">KEBUGARAN CERDAS</span>
                        </h2>
                    </div>
                </div>
            </div>

            {/* ==============================================================
                KOLOM KANAN: FORM LOGIN BERSIH & RESPONSIF
               ============================================================== */}
            <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-between p-6 sm:p-12 lg:p-16 relative">
                {/* Baris Atas Mobile: Logo Gambar Hitam & Tombol Kembali */}
                <div className="flex items-center justify-between w-full max-w-[400px] mx-auto lg:max-w-none">
                    <Link href="/" className="lg:hidden inline-flex items-center">
                        <img
                            src="/images/logo-hitam.png"
                            alt="EduFit"
                            className="h-14 w-auto object-contain"
                        />
                    </Link>

                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#52525b] hover:text-[#18181b] transition-colors ml-auto"
                    >
                        <ArrowLeft size={15} /> Kembali ke Beranda
                    </Link>
                </div>

                {/* Container Utama Form Login */}
                <div className="w-full max-w-[400px] mx-auto my-auto py-8">
                    <div className="mb-10">
                        <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#71717a] mb-2">
                            Otentikasi Portal Web
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-jakarta font-extrabold text-[#18181b] tracking-tight mb-2">
                            Selamat Datang
                        </h1>
                        <p className="text-[#52525b] text-sm font-medium">
                            Masuk menggunakan akun Guru PJOK atau Administrator Anda.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="w-full space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-[#52525b] block">
                                Email Institusi / Sekolah
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="nama@sekolah.edu"
                                required
                                className="w-full px-5 py-4 bg-white border border-black/10 rounded-2xl text-sm font-medium focus:outline-none focus:border-[#18181b] transition-colors placeholder:text-[#a1a1aa] text-[#18181b]"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold uppercase tracking-wider text-[#52525b]">
                                    Kata Sandi
                                </label>
                                <button
                                    type="button"
                                    onClick={() =>
                                        toast.info(
                                            "Silakan hubungi Administrator Utama untuk mereset kata sandi akun sekolah Anda."
                                        )
                                    }
                                    className="text-xs font-bold text-[#71717a] hover:text-[#18181b] transition-colors cursor-pointer"
                                >
                                    Lupa sandi?
                                </button>
                            </div>
                            <div className="relative flex items-center">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full pl-5 pr-12 py-4 bg-white border border-black/10 rounded-2xl text-sm font-medium focus:outline-none focus:border-[#18181b] transition-colors placeholder:text-[#a1a1aa] text-[#18181b]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 p-1 text-[#71717a] hover:text-[#18181b] transition-colors cursor-pointer"
                                >
                                    {showPassword ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-[#18181b] text-white font-jakarta font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-[#f5c84c] hover:text-[#18181b] transition-all disabled:opacity-60 cursor-pointer mt-4 flex items-center justify-center gap-2 shadow-lg"
                        >
                            <span>
                                {isLoading
                                    ? "Memverifikasi Akses..."
                                    : "Masuk ke Dashboard"}
                            </span>
                            {!isLoading && <ArrowUpRight size={16} />}
                        </button>
                    </form>

                    {/* Catatan Informasi Akses Siswa */}
                    <div className="mt-10 pt-6 border-t border-black/10 flex items-start justify-between gap-4">
                        <div>
                            <span className="text-xs font-bold text-[#18181b] block">
                                Login sebagai Siswa?
                            </span>
                            <p className="text-xs text-[#52525b] mt-0.5 leading-relaxed">
                                Akun siswa dikhususkan pada aplikasi Android EduFit.
                            </p>
                        </div>
                        <Link
                            href="/#download"
                            className="text-xs font-bold uppercase tracking-wider underline text-[#18181b] hover:text-[#c88a04] shrink-0 pt-0.5"
                        >
                            Unduh APK
                        </Link>
                    </div>
                </div>

                {/* Footer Kecil Kolom Kanan */}
                <div className="w-full max-w-[400px] mx-auto lg:max-w-none flex items-center justify-between text-xs text-[#71717a] font-medium">
                    <span>© 2026 EduFit</span>
                    <span>Kurikulum PJOK SMA/SMK</span>
                </div>
            </div>
        </div>
    );
}