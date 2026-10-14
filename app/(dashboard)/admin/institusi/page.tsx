// app/(dashboard)/admin/institusi/page.tsx
import InstitusiPage from "@/components/admin/institusi/InstitusiPage";

// Mematikan validasi Turbopack untuk instant navigation
export const instant = false;

export const metadata = {
    title: "Kelola Institusi | EduFit Admin",
    description: "Manajemen sekolah, tingkatan, dan pendaftaran akun guru.",
};

export default function Page() {
    return <InstitusiPage />;
}