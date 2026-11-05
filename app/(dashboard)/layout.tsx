// @ts-nocheck
"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [isAllowed, setIsAllowed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

    useEffect(() => {
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
                className="edufit-admin-theme fixed top-0 left-0 w-full h-full"
                style={{ backgroundColor: "var(--ref-canvas-bg, #f3f6f4)" }}
            />
        );
    }

    return (
        <div
            className="edufit-admin-theme min-h-screen font-jakarta transition-colors duration-500 relative overflow-x-hidden flex flex-col"
            style={{
                backgroundColor: "var(--ref-canvas-bg)",
                color: "var(--ref-text-primary)"
            }}
        >
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