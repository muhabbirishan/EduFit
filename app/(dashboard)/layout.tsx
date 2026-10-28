// @ts-nocheck
"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import { supabase } from "@/lib/supabase";
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
            const {
                data: { session }
            } = await supabase.auth.getSession();
            if (!session) {
                router.replace("/login");
                return;
            }
            const { data: profile } = await supabase
                .from("user_profiles")
                .select("role")
                .eq("id", session.user.id)
                .single();

            if (!profile || profile.role === "siswa") {
                await supabase.auth.signOut();
                router.replace("/login");
            } else {
                setIsAllowed(true);
            }
        };
        checkAuth();
    }, [router]);

    if (!isAllowed) {
        return (
            <div
                className="fixed top-0 left-0 w-full h-full"
                style={{ backgroundColor: "var(--ref-canvas-bg, #f4f1ea)" }}
            />
        );
    }

    const isDark = mounted && resolvedTheme === "dark";

    return (
        <div
            className="min-h-screen font-jakarta transition-colors duration-500 relative overflow-x-hidden flex flex-col"
            style={{
                background: "var(--ref-canvas-gradient)",
                backgroundColor: "var(--ref-canvas-bg)",
                color: "var(--ref-text-primary)"
            }}
        >
            {/* AMBIENT GLOW HANGAT LIGHT & STRONG DARK 
                PERBAIKAN: Mengganti 'inset-0' menjadi 'top-0 left-0 w-full h-full' 
                untuk menghindari konflik penyembunyian Navbar dengan globals.css 
            */}
            <div className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none overflow-hidden transition-opacity duration-700">
                <div
                    className="absolute -top-[10%] right-[5%] w-[460px] h-[460px] rounded-full blur-[140px]"
                    style={{
                        backgroundColor: isDark
                            ? "rgba(245, 200, 76, 0.12)"
                            : "rgba(245, 200, 76, 0.30)"
                    }}
                />
                <div
                    className="absolute bottom-[5%] -left-[8%] w-[500px] h-[500px] rounded-full blur-[150px]"
                    style={{
                        backgroundColor: isDark
                            ? "rgba(56, 189, 248, 0.06)"
                            : "rgba(254, 243, 199, 0.70)"
                    }}
                />
            </div>

            {/* TOP NAVBAR DENGAN CONTAINER IDENTIK */}
            <Sidebar
                isMobileOpen={isMobileMenuOpen}
                closeMobile={() => setIsMobileMenuOpen(false)}
                isCollapsed={isDesktopCollapsed}
                setIsCollapsed={setIsDesktopCollapsed}
            />

            {/* KONTEN UTAMA SEJAJAR 100% DENGAN MARGIN NAVBAR */}
            <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pt-3 pb-16 relative z-10">
                {children}
            </main>
        </div>
    );
}