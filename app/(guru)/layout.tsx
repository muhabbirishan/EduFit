"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import NavbarGuru from "@/components/guru/NavbarGuru";
import { useTheme } from "next-themes"; // Tambahkan useTheme untuk deteksi

export default function GuruLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { resolvedTheme } = useTheme();
    const [isAllowed, setIsAllowed] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return router.replace('/login');
            const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', session.user.id).single();
            if (!profile || profile.role !== 'guru') router.replace(profile?.role === 'admin' ? '/admin' : '/dashboard-siswa');
            else setIsAllowed(true);
        };
        checkAuth();
    }, [router]);

    if (!isAllowed) return <div className="fixed inset-0 bg-white" />;

    const isDark = mounted && resolvedTheme === 'dark';

    return (
        // JURUS PAMUNGKAS: Paksa warna via inline-style agar Tailwind tidak bisa nge-bug!
        <div
            className="min-h-screen font-jakarta transition-colors duration-500 relative overflow-hidden"
            style={{
                backgroundColor: isDark ? '#050505' : '#fcfcfc',
                color: isDark ? '#ffffff' : '#000000'
            }}
        >
            <NavbarGuru />

            <main className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 pt-32 lg:pt-40 pb-16 relative z-10">
                {children}
            </main>
        </div>
    );
}