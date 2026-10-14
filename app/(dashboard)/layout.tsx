"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import { supabase } from "@/lib/supabase";
import { Menu } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { resolvedTheme } = useTheme();
    const [isAllowed, setIsAllowed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.replace('/login');
                return;
            }
            const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', session.user.id).single();

            if (!profile || profile.role === 'siswa') {
                await supabase.auth.signOut();
                router.replace('/login');
            } else {
                setIsAllowed(true);
            }
        };
        checkAuth();
    }, [router]);

    if (!isAllowed) return <div className="fixed inset-0 bg-[#fcfcfc] dark:bg-[#050505]" />;

    const isDark = mounted && resolvedTheme === 'dark';

    return (
        <div
            className="min-h-screen font-jakarta transition-colors duration-500 relative overflow-hidden flex flex-col lg:flex-row"
            style={{
                backgroundColor: isDark ? '#050505' : '#fcfcfc',
                color: isDark ? '#ffffff' : '#000000'
            }}
        >
            {/* MESH GRADIENT ADMIN (HIJAU EDUFIT) */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden transition-opacity duration-700">
                <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[#bbf7d0]/40 dark:bg-[#064e3b]/20 blur-[120px]" />
                <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-[#86efac]/30 dark:bg-[#022c22]/30 blur-[150px]" />
            </div>

            {/* NAVBAR MOBILE */}
            <header
                className="lg:hidden fixed top-0 left-0 right-0 w-full h-20 z-40 flex items-center justify-between px-6 shadow-sm border-b backdrop-blur-xl transition-colors"
                style={{
                    backgroundColor: isDark ? 'rgba(5,5,5,0.9)' : 'rgba(255,255,255,0.9)',
                    borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                }}
            >
                {mounted && <img src={isDark ? "/images/logo-putih.png" : "/images/logo-hitam.png"} alt="EduFit" className="h-8 object-contain" />}
                <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 transition-colors" style={{ color: isDark ? '#fff' : '#000' }}>
                    <Menu className="w-8 h-8" />
                </button>
            </header>

            <Sidebar
                isMobileOpen={isMobileMenuOpen}
                closeMobile={() => setIsMobileMenuOpen(false)}
                isCollapsed={isDesktopCollapsed}
                setIsCollapsed={setIsDesktopCollapsed}
            />

            <main className={`flex-1 w-full p-4 lg:p-10 pt-28 lg:pt-10 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] relative z-10 min-h-screen 
        ${isDesktopCollapsed ? 'lg:ml-[88px]' : 'lg:ml-[280px]'}`}>
                {children}
            </main>
        </div>
    );
}