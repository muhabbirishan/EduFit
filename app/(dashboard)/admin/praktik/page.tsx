// app/(dashboard)/admin/praktik/page.tsx
import PraktikPage from "@/components/admin/praktik/PraktikPage";

export const instant = false;

export const metadata = {
    title: "Praktik Opsional | EduFit Admin",
    description: "Rekapitulasi kegiatan praktik lapangan opsional dari seluruh kelas.",
};

export default function Page() {
    return <PraktikPage />;
}