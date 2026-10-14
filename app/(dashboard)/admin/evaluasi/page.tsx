// app/(dashboard)/admin/evaluasi/page.tsx
import EvaluasiPage from "@/components/admin/evaluasi/EvaluasiPage";

export const instant = false;

export const metadata = {
    title: "Kelola Evaluasi | EduFit Admin",
    description: "Manajemen Pretest, Posttest, dan Bank Soal.",
};

export default function Page() {
    return <EvaluasiPage />;
}