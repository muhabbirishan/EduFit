"use client";

import NavbarGuru from "@/components/guru/NavbarGuru";
import { supabase } from "@/lib/supabase";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function GuruLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { resolvedTheme } = useTheme();
    const [isAllowed, setIsAllowed] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const checkAuth = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (!session) return router.replace("/login");
            const { data: profile } = await supabase
                .from("user_profiles")
                .select("role")
                .eq("id", session.user.id)
                .single();
            if (!profile || profile.role !== "guru") {
                router.replace(
                    profile?.role === "admin" ? "/admin" : "/dashboard-siswa"
                );
            } else {
                setIsAllowed(true);
            }
        };
        checkAuth();
    }, [router]);

    if (!isAllowed)
        return <div className="fixed inset-0 bg-[#f7f5f0] dark:bg-[#0c0b09]" />;

    const isDark = mounted && resolvedTheme === "dark";
    const isLiveStudio = pathname?.startsWith("/guru/live-asesmen");

    return (
        <div
            className="min-h-screen font-jakarta transition-colors duration-500 relative overflow-x-hidden"
            style={{
                backgroundColor: isDark ? "#0c0b09" : "#f7f5f0",
                color: isDark ? "#fafaf9" : "#14120e",
            }}
        >
            <NavbarGuru />

            {/* PENTING: Tanpa z-index pada <main> agar modal z-[100] tidak terkurung di bawah Navbar */}
            <main
                className={`max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 pb-16 ${isLiveStudio ? "pt-6 lg:pt-8" : "pt-6 lg:pt-10"
                    }`}
            >
                {children}
            </main>
        </div>
    );
}