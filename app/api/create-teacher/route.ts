import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Inisialisasi Supabase Admin Client menggunakan Service Role Key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password, full_name, school_id } = body;

        // 1. Buat user di Auth Supabase secara paksa (tanpa verifikasi email)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true, // Bypass konfirmasi email
        });

        if (authError) throw new Error(`Auth Error: ${authError.message}`);
        if (!authData.user) throw new Error("Gagal membuat user di sistem autentikasi.");

        // 2. Masukkan data ke tabel public.user_profiles
        const { error: profileError } = await supabaseAdmin.from('user_profiles').insert([{
            id: authData.user.id,
            school_id: school_id,
            full_name: full_name,
            email: email,
            role: 'guru'
        }]);

        // Jika insert profil gagal, hapus kembali user auth yang baru dibuat (Rollback)
        if (profileError) {
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            throw new Error(`Profile Error: ${profileError.message}`);
        }

        return NextResponse.json({ message: 'Akun guru berhasil dibuat!' }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}