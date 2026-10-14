import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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
        const { email, password, full_name, school_id, class_id } = body;

        // Validasi kelengkapan data
        if (!email || !password || !full_name || !class_id) {
            return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
        }

        // 1. Buat User di sistem Autentikasi (Supabase Auth)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Langsung konfirmasi agar bisa langsung login
        });

        if (authError) throw authError;
        const userId = authData.user.id;

        // 2. Simpan Profil Siswa di tabel user_profiles
        const { error: profileError } = await supabaseAdmin.from('user_profiles').upsert({
            id: userId,
            full_name: full_name,
            email: email,        // <--- INI BARIS YANG KETINGGALAN TADI!
            school_id: school_id,
            role: 'siswa'
        });

        if (profileError) throw profileError;

        // 3. Masukkan Siswa tersebut ke dalam Kelas yang dipilih Guru
        const { error: classError } = await supabaseAdmin.from('student_classes').insert({
            student_id: userId,
            class_id: class_id
        });

        if (classError) throw classError;

        return NextResponse.json({ success: true, user: authData.user });

    } catch (error: any) {
        console.error("API Error (create-student):", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}