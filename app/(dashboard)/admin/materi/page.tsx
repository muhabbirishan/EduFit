// app/(dashboard)/admin/materi/page.tsx
import MateriPage from "@/components/admin/materi/MateriPage";

export const instant = false;

export const metadata = {
  title: "Materi & Refleksi | EduFit Admin",
  description: "Kelola konten bahan ajar dan pertanyaan pemantik untuk refleksi.",
};

export default function Page() {
  return <MateriPage />;
}