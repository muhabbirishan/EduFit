"use client";

import { supabase } from '@/lib/supabase';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // 1. Autentikasi dengan Supabase
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw new Error("Email atau password salah.");
            if (!authData.user) throw new Error("User tidak ditemukan.");

            // 2. Cek Role dari tabel user_profiles
            const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('role')
                .eq('id', authData.user.id)
                .single();

            if (profileError || !profile) throw new Error("Gagal mengambil profil pengguna.");

            // 3. Otorisasi berdasarkan Role
            if (profile.role === 'siswa') {
                await supabase.auth.signOut();
                toast.error('Akses Web Ditolak!', {
                    description: 'Siswa hanya dapat login melalui Aplikasi Mobile EduFit.',
                });
            } else if (profile.role === 'admin') {
                toast.success('Login Berhasil!', { description: 'Mengarahkan ke Dashboard Admin...' });
                router.push('/admin');
            } else if (profile.role === 'guru') {
                toast.success('Login Berhasil!', { description: 'Mengarahkan ke Dashboard Guru...' });
                router.push('/guru');
            }
        } catch (error: any) {
            toast.error('Gagal Login', { description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-screen h-screen flex overflow-hidden bg-white">

            {/* KOLOM KIRI (KOLOM 1): Gambar Background & Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-[#00422b]">
                <img
                    src="/images/intro-card.jpg"
                    alt="EduFit Background"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-[#002b1c]/75 backdrop-blur-[1px]"></div>

                <div className="absolute inset-0 flex flex-col justify-between p-14 text-white z-10">
                    <Link href="/" className="font-bebas text-4xl tracking-widest uppercase text-white hover:text-[#89f9b5] transition-colors w-fit">
                        EduFit
                    </Link>
                    <div>
                        <h2 className="text-5xl xl:text-6xl font-bebas leading-[0.9] tracking-tight mb-4 text-white drop-shadow-md">
                            SISTEM PEMANTAUAN <br /> KEBUGARAN CERDAS
                        </h2>
                        <p className="font-poppins text-white/80 max-w-md text-sm leading-relaxed">
                            Mengintegrasikan kurikulum S3 SMA Indonesia dengan kecerdasan buatan untuk masa depan pendidikan olahraga yang lebih baik.
                        </p>
                    </div>
                </div>
            </div>

            {/* KOLOM KANAN (KOLOM 2): Form Login */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 overflow-y-auto no-scrollbar relative">

                {/* Tombol kembali (Khusus Mobile) */}
                <div className="absolute top-6 left-6 lg:hidden">
                    <Link href="/" className="font-bebas text-3xl tracking-widest text-[#006c49]">EduFit</Link>
                </div>

                <div className="w-full max-w-[380px] mx-auto flex flex-col pt-12 lg:pt-0">

                    <div className="w-full text-left mb-10">
                        <h1 className="text-3xl md:text-4xl font-jakarta font-extrabold text-[#191c1c] tracking-tight mb-2">
                            Selamat Datang
                        </h1>
                        <p className="text-[#717976] font-poppins text-sm font-medium">
                            Silakan masuk ke akun Anda untuk mengakses portal.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="w-full space-y-5 font-poppins">

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-[#414846] ml-1">Email Sekolah</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="nama@sekolah.edu"
                                    required
                                    className="w-full px-5 py-4 bg-[#f8faf9] border border-[#e1e3e2] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#89f9b5] focus:border-[#006c49] transition-all placeholder:text-[#c1c8c5] text-[#191c1c]"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-[#414846] ml-1">Password</label>
                            <div className="relative flex items-center">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full pl-5 pr-12 py-4 bg-[#f8faf9] border border-[#e1e3e2] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#89f9b5] focus:border-[#006c49] transition-all placeholder:text-[#c1c8c5] text-[#191c1c]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 text-[#84a59e] hover:text-[#006c49] transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <div className="w-full flex justify-end mt-2">
                                <Link href="#" className="text-xs font-bold text-[#006c49] hover:underline">
                                    Lupa kata sandi?
                                </Link>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-[#89f9b5] text-[#002110] font-jakarta font-bold text-sm uppercase tracking-widest rounded-full hover:bg-[#6ddc9b] hover:shadow-[0_10px_20px_rgba(137,249,181,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                        >
                            {isLoading ? 'Memverifikasi...' : 'Masuk ke Dashboard'}
                        </button>
                    </form>

                    <div className="w-full flex items-center gap-4 my-10">
                        <div className="h-px bg-[#eceeed] flex-1"></div>
                        <span className="text-[11px] font-poppins font-bold text-[#a0aba8] uppercase tracking-wider">Metode Alternatif</span>
                        <div className="h-px bg-[#eceeed] flex-1"></div>
                    </div>

                    <div className="flex items-center justify-center gap-4 w-full mb-10">
                        <button className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-[#032521] hover:bg-[#89f9b5] hover:text-[#002110] transition-colors border border-[#e1e3e2] hover:border-transparent shadow-sm hover:shadow-md group">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="group-hover:scale-110 transition-transform">
                                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.761H12.545z" />
                            </svg>
                        </button>
                        <button className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-[#032521] hover:bg-[#89f9b5] hover:text-[#002110] transition-colors border border-[#e1e3e2] hover:border-transparent shadow-sm hover:shadow-md group">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="group-hover:scale-110 transition-transform">
                                <path d="M0 0h11v11H0zM13 0h11v11H13zM0 13h11v11H0zM13 13h11v11H13z" />
                            </svg>
                        </button>
                        <button className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-[#032521] hover:bg-[#89f9b5] hover:text-[#002110] transition-colors border border-[#e1e3e2] hover:border-transparent shadow-sm hover:shadow-md group">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="group-hover:scale-110 transition-transform">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                        </button>
                    </div>

                    <div className="mt-auto pt-6 text-center font-poppins text-xs text-[#717976]">
                        Belum memiliki akun?{' '}
                        <Link href="/" className="font-jakarta font-bold text-[#006c49] hover:text-[#00422b]">
                            Hubungi Admin Sekolah
                        </Link>
                    </div>

                </div>
            </div>

        </div>
    );
}