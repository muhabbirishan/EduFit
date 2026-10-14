import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';
import { Providers } from "./providers"; // IMPORT INI

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"], 
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"] 
});

const poppins = Poppins({ 
  subsets: ["latin"], 
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"] 
});

export const metadata: Metadata = {
  title: "EduFit - Kebugaran Jasmani",
  description: "Sistem cerdas pemantauan tes kebugaran jasmani.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Tambahkan suppressHydrationWarning agar next-themes tidak error di server
    <html lang="id" suppressHydrationWarning>
      <body className={`${jakarta.variable} ${poppins.variable} font-poppins antialiased`}>
        <Providers>
          {children}
          <Toaster position="top-center" richColors/>
        </Providers>
      </body>
    </html>
  );
}