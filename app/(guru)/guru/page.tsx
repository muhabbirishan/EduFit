import DashboardGuru from "@/components/guru/DashboardGuru";

// Memperbaiki error Turbopack "dropped from rendering"
export const instant = false; 

export const metadata = { title: "Ruang Guru | EduFit" };

export default function Page() { 
  return <DashboardGuru />; 
}