import AdminDashboard from "@/components/admin/AdminDashboard";
export const instant = false;

export const metadata = {
  title: "Dashboard Admin | EduFit",
  description: "Pantau pemahaman dan rancangan siswa.",
};

export default function AdminPage() {
  return <AdminDashboard />;
}