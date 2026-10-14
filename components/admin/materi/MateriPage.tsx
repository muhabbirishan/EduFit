"use client";

import { supabase } from "@/lib/supabase";
import { AlignLeft, ArrowLeft, BookOpen, Edit3, Heading, Image as ImageIcon, Link as LinkIcon, List as ListIcon, Plus, Trash2, UploadCloud, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useTheme } from "next-themes";

type BlockType = 'heading' | 'paragraph' | 'list';
interface ContentBlock { id: string; type: BlockType; value: string; items?: string[]; }

export default function MateriPage() {
    const [materials, setMaterials] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeGrade, setActiveGrade] = useState<number>(10);
    const [viewMode, setViewMode] = useState<'list' | 'form'>('list');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [unitName, setUnitName] = useState("");
    const [triggerQuestion, setTriggerQuestion] = useState("");
    const [mediaUrl, setMediaUrl] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [isUploadingImg, setIsUploadingImg] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);

    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    const isDark = mounted && resolvedTheme === 'dark';

    const fetchMaterials = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.from('master_materials').select('*').eq('grade_level', activeGrade).order('created_at', { ascending: true });
            if (error) throw error;
            setMaterials(data || []);
        } catch (error: any) { toast.error("Gagal menarik data materi"); } finally { setIsLoading(false); }
    };

    useEffect(() => { if (viewMode === 'list') fetchMaterials(); }, [activeGrade, viewMode]);

    const parseHTMLToBlocks = (htmlString: string) => {
        if (!htmlString) return [{ id: crypto.randomUUID(), type: 'paragraph', value: '' } as ContentBlock];
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        const blocks: ContentBlock[] = [];

        doc.body.childNodes.forEach((node) => {
            if (node.nodeName === 'P') {
                const isHeading = (node as HTMLElement).querySelector('strong') !== null;
                if (isHeading) blocks.push({ id: crypto.randomUUID(), type: 'heading', value: node.textContent || '' });
                else blocks.push({ id: crypto.randomUUID(), type: 'paragraph', value: (node as HTMLElement).innerHTML.replace(/<br\s*\/?>/gi, '\n') });
            } else if (node.nodeName === 'UL') {
                const items = Array.from((node as HTMLElement).querySelectorAll('li')).map(li => li.textContent || '');
                blocks.push({ id: crypto.randomUUID(), type: 'list', value: '', items });
            }
        });
        return blocks.length > 0 ? blocks : [{ id: crypto.randomUUID(), type: 'paragraph', value: '' } as ContentBlock];
    };

    const compileBlocksToHTML = (blocks: ContentBlock[]) => {
        let html = '';
        blocks.forEach(b => {
            if (b.type === 'heading' && b.value.trim()) html += `<p><strong>${b.value}</strong></p>`;
            if (b.type === 'paragraph' && b.value.trim()) html += `<p>${b.value.replace(/\n/g, '<br/>')}</p>`;
            if (b.type === 'list' && b.items && b.items.length > 0) {
                const listItems = b.items.filter(i => i.trim() !== '').map(i => `<li>${i}</li>`).join('');
                if (listItems) html += `<ul>${listItems}</ul>`;
            }
        });
        return html;
    };

    const resetForm = () => {
        setEditingId(null); setUnitName(""); setTriggerQuestion(""); setMediaUrl(""); setImageUrl("");
        setContentBlocks([{ id: crypto.randomUUID(), type: 'paragraph', value: '' }]);
    };

    const openAddForm = () => { resetForm(); setViewMode('form'); };
    const openEditForm = (mat: any) => {
        setEditingId(mat.id); setUnitName(mat.unit_name); setTriggerQuestion(mat.trigger_question || ""); setMediaUrl(mat.media_url || "");
        setImageUrl(mat.image_url || ""); setContentBlocks(parseHTMLToBlocks(mat.content_text || "")); setViewMode('form');
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingImg(true);
        const toastId = toast.loading('Mengunggah gambar ke Supabase...');
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `materi/${fileName}`;
            const { error: uploadError } = await supabase.storage.from('edufit_media').upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('edufit_media').getPublicUrl(filePath);
            setImageUrl(data.publicUrl);
            toast.success('Gambar berhasil diunggah!', { id: toastId });
        } catch (error: any) { toast.error('Gagal mengunggah gambar', { id: toastId }); } finally { setIsUploadingImg(false); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const payload = { grade_level: activeGrade, unit_name: unitName, trigger_question: triggerQuestion, content_text: compileBlocksToHTML(contentBlocks), media_url: mediaUrl, image_url: imageUrl, updated_at: new Date().toISOString() };
        try {
            if (editingId) await supabase.from('master_materials').update(payload).eq('id', editingId);
            else await supabase.from('master_materials').insert([payload]);
            toast.success("Materi berhasil disimpan!");
            setViewMode('list');
        } catch (err: any) { toast.error("Gagal menyimpan materi"); } finally { setIsSubmitting(false); }
    };

    const handleDelete = (id: string, name: string) => {
        toast('Hapus Materi', {
            description: `Yakin hapus materi "${name}"?`,
            action: { label: 'Hapus', onClick: async () => { await supabase.from('master_materials').delete().eq('id', id); toast.success("Materi dihapus"); fetchMaterials(); } },
            cancel: { label: 'Batal' }
        });
    };

    const addBlock = (type: BlockType) => setContentBlocks([...contentBlocks, { id: crypto.randomUUID(), type, value: '', items: type === 'list' ? [''] : undefined }]);
    const updateBlockValue = (id: string, val: string) => setContentBlocks(contentBlocks.map(b => b.id === id ? { ...b, value: val } : b));
    const updateListItem = (blockId: string, index: number, val: string) => setContentBlocks(contentBlocks.map(b => { if (b.id === blockId && b.items) { const newItems = [...b.items]; newItems[index] = val; return { ...b, items: newItems }; } return b; }));
    const addListItem = (blockId: string) => setContentBlocks(contentBlocks.map(b => { if (b.id === blockId && b.items) return { ...b, items: [...b.items, ''] }; return b; }));
    const removeListItem = (blockId: string, index: number) => setContentBlocks(contentBlocks.map(b => { if (b.id === blockId && b.items) { const newItems = b.items.filter((_, i) => i !== index); return { ...b, items: newItems.length > 0 ? newItems : [''] }; } return b; }));
    const removeBlock = (id: string) => { if (contentBlocks.length === 1) return toast.error("Modul minimal harus memiliki 1 bagian konten."); setContentBlocks(contentBlocks.filter(b => b.id !== id)); };

    if (!mounted) return null;

    // ======================================================================
    // VIEW MODE: FORM (FULL PAGE BUILDER)
    // ======================================================================
    if (viewMode === 'form') {
        return (
            <div className="w-full max-w-[900px] mx-auto animate-in fade-in slide-in-from-right-8 duration-500 pb-16">
                <header className="flex items-start gap-4 mb-10 sticky top-0 z-20 pt-4 pb-4 backdrop-blur-md border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                    <button type="button" onClick={() => setViewMode('list')} className="mt-1 p-3 rounded-full border shadow-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ backgroundColor: isDark ? '#1a1a1a' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', color: isDark ? '#ffffff' : '#000000' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest mb-1 opacity-50" style={{ color: isDark ? '#ffffff' : '#000000' }}>
                            Draf Kelas {activeGrade}
                        </div>
                        <h1 className="text-3xl font-light tracking-tight leading-tight" style={{ color: isDark ? '#ffffff' : '#000000' }}>
                            {editingId ? "Edit" : "Buat"} <span className="font-semibold">Modul Pembelajaran</span>
                        </h1>
                    </div>
                </header>

                <form onSubmit={handleSubmit} className="rounded-[2.5rem] p-8 md:p-12 shadow-sm border space-y-12" style={{ backgroundColor: isDark ? '#111111' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>

                    {/* INFO DASAR */}
                    <div className="space-y-6">
                        <h3 className="font-semibold text-xl border-b pb-4 opacity-80" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>Informasi Modul</h3>
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block">Judul Unit Materi</label>
                            <input required value={unitName} onChange={(e) => setUnitName(e.target.value)} type="text" placeholder="Cth: Daya Tahan Jantung-Paru"
                                className="w-full bg-transparent border-b-2 py-3 text-3xl font-light tracking-tight focus:outline-none transition-colors"
                                style={{ borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', color: isDark ? '#fff' : '#000' }} />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block mt-6">Pertanyaan Pemantik</label>
                            <textarea value={triggerQuestion} onChange={(e) => setTriggerQuestion(e.target.value)} placeholder="Tuliskan pertanyaan pemantik untuk memicu pemikiran siswa..." rows={2}
                                className="w-full p-5 rounded-2xl text-sm focus:outline-none resize-none border transition-colors"
                                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', color: isDark ? '#fff' : '#000' }}></textarea>
                        </div>
                    </div>

                    {/* MEDIA */}
                    <div className="space-y-6">
                        <h3 className="font-semibold text-xl border-b pb-4 opacity-80" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>Media Pendukung</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block">Gambar Ilustrasi</label>
                                <div className="w-full relative">
                                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                                    {imageUrl ? (
                                        <div className="relative w-full aspect-video rounded-2xl border overflow-hidden group" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                                            <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                                                <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-white text-black rounded-lg text-xs font-bold shadow-md hover:scale-105">Ganti Gambar</button>
                                                <button type="button" onClick={() => setImageUrl("")} className="px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-bold shadow-md hover:scale-105">Hapus Gambar</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploadingImg}
                                            className="w-full aspect-video flex flex-col items-center justify-center border-2 border-dashed rounded-2xl transition-colors disabled:opacity-50"
                                            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}>
                                            <UploadCloud className="w-10 h-10 mb-3 opacity-50" />
                                            <span className="text-sm font-bold opacity-80">{isUploadingImg ? 'Mengunggah...' : 'Pilih Gambar'}</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 block">Tautan Video Tambahan</label>
                                <input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} type="url" placeholder="https://youtube.com/..."
                                    className="w-full p-5 rounded-2xl text-sm focus:outline-none border transition-colors"
                                    style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', color: isDark ? '#fff' : '#000' }} />
                                <p className="text-[10px] uppercase tracking-widest font-bold opacity-40 mt-3 p-4 rounded-xl" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                                    URL YouTube/TikTok akan otomatis menjadi player di aplikasi siswa.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* DYNAMIC BUILDER */}
                    <div className="space-y-6">
                        <div className="border-b pb-4 flex justify-between items-center" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                            <h3 className="font-semibold text-xl opacity-80">Bahan Ajar (Otomatis HTML)</h3>
                        </div>

                        <div className="space-y-4">
                            {contentBlocks.map((block, index) => (
                                <div key={block.id} className="relative group rounded-2xl p-6 transition-all border" style={{ backgroundColor: isDark ? '#1a1a1a' : '#f8fafc', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                                    <button type="button" onClick={() => removeBlock(block.id)} className="absolute top-4 right-4 p-2 opacity-0 group-hover:opacity-100 transition-all rounded-full hover:bg-red-500 hover:text-white"><X size={16} /></button>

                                    {block.type === 'heading' && (
                                        <div className="pr-8">
                                            <label className="text-[10px] font-bold opacity-50 mb-2 flex items-center gap-2 uppercase tracking-widest"><Heading size={14} /> Sub-Judul</label>
                                            <input type="text" required value={block.value} onChange={(e) => updateBlockValue(block.id, e.target.value)} placeholder="Ketik sub-judul..."
                                                className="w-full bg-transparent text-2xl font-light focus:outline-none pb-2 transition-colors border-b"
                                                style={{ borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', color: isDark ? '#fff' : '#000' }} />
                                        </div>
                                    )}

                                    {block.type === 'paragraph' && (
                                        <div className="pr-8">
                                            <label className="text-[10px] font-bold opacity-50 mb-2 flex items-center gap-2 uppercase tracking-widest"><AlignLeft size={14} /> Teks Paragraf</label>
                                            <textarea required value={block.value} onChange={(e) => updateBlockValue(block.id, e.target.value)} placeholder="Ketik isi penjelasan..." rows={4}
                                                className="w-full p-4 rounded-xl text-sm focus:outline-none resize-y leading-relaxed border"
                                                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', color: isDark ? '#fff' : '#000' }}></textarea>
                                        </div>
                                    )}

                                    {block.type === 'list' && (
                                        <div className="pr-8">
                                            <label className="text-[10px] font-bold opacity-50 mb-3 flex items-center gap-2 uppercase tracking-widest"><ListIcon size={14} /> Daftar Poin</label>
                                            <div className="space-y-3">
                                                {block.items?.map((item, i) => (
                                                    <div key={i} className="flex items-start gap-3">
                                                        <div className="mt-2.5 w-1.5 h-1.5 rounded-full bg-[#89f9b5] shrink-0"></div>
                                                        <input type="text" value={item} onChange={(e) => updateListItem(block.id, i, e.target.value)} placeholder={`Poin ke-${i + 1}...`}
                                                            className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none border"
                                                            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', color: isDark ? '#fff' : '#000' }} />
                                                        <button type="button" onClick={() => removeListItem(block.id, i)} className="p-2.5 opacity-50 hover:opacity-100 hover:text-red-500"><X size={16} /></button>
                                                    </div>
                                                ))}
                                                <button type="button" onClick={() => addListItem(block.id)} className="text-[10px] font-bold uppercase tracking-widest mt-3 opacity-60 hover:opacity-100 ml-5 flex items-center gap-1"><Plus size={12} /> Tambah Poin</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 pt-4">
                            <span className="text-xs font-bold uppercase tracking-widest opacity-50 mr-2">Tambahkan:</span>
                            <button type="button" onClick={() => addBlock('heading')} className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-transform hover:scale-105" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}><Heading size={14} /> Sub-Judul</button>
                            <button type="button" onClick={() => addBlock('paragraph')} className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-transform hover:scale-105" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}><AlignLeft size={14} /> Paragraf</button>
                            <button type="button" onClick={() => addBlock('list')} className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-transform hover:scale-105" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}><ListIcon size={14} /> List</button>
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end gap-4 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                        <button type="submit" disabled={isSubmitting} className="px-10 py-4 font-bold text-sm uppercase tracking-widest rounded-full transition-opacity shadow-md disabled:opacity-50 hover:opacity-80"
                            style={{ backgroundColor: '#89f9b5', color: '#002110' }}>
                            {isSubmitting ? 'Menyimpan...' : 'Simpan Modul Materi'}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    // ======================================================================
    // VIEW MODE: LIST (GRID MATERI)
    // ======================================================================
    return (
        <div className="w-full animate-in fade-in duration-700 pb-10">

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 relative z-10">
                <div>
                    <h1 className="text-4xl md:text-5xl font-light tracking-tighter leading-tight" style={{ color: isDark ? '#ffffff' : '#000000' }}>
                        Materi & <span className="font-semibold">Refleksi</span>
                    </h1>
                    <p className="text-sm font-medium uppercase tracking-widest mt-2 opacity-50" style={{ color: isDark ? '#ffffff' : '#000000' }}>
                        Kelola Konten Bahan Ajar dan Pertanyaan Pemantik
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
                    <div className="flex p-1.5 rounded-full shadow-sm border" style={{ backgroundColor: isDark ? '#1a1a1a' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
                        {[10, 11, 12].map((grade) => (
                            <button key={grade} onClick={() => setActiveGrade(grade)}
                                className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors"
                                style={{ backgroundColor: activeGrade === grade ? '#89f9b5' : 'transparent', color: activeGrade === grade ? '#000' : (isDark ? '#fff' : '#000'), opacity: activeGrade === grade ? 1 : 0.5 }}>
                                Kelas {grade}
                            </button>
                        ))}
                    </div>
                    <button onClick={openAddForm} className="px-6 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 hover:opacity-80 shadow-md shrink-0" style={{ backgroundColor: '#89f9b5', color: '#002110' }}>
                        <Plus size={18} /> Tambah Materi
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-6 relative z-10">
                {isLoading ? (
                    <div className="h-64 rounded-[2.5rem] animate-pulse" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}></div>
                ) : materials.length === 0 ? (
                    <div className="col-span-full py-20 text-center flex flex-col items-center justify-center rounded-[2.5rem] border border-dashed opacity-50" style={{ borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}>
                        <BookOpen className="w-16 h-16 mb-4 opacity-50" />
                        <h3 className="text-2xl font-light tracking-tight mb-2">Belum ada materi Kelas {activeGrade}</h3>
                    </div>
                ) : (
                    materials.map((mat) => (
                        <div key={mat.id} className="rounded-[2.5rem] p-8 md:p-10 shadow-sm flex flex-col lg:flex-row gap-10 relative group border transition-transform hover:-translate-y-1"
                            style={{ backgroundColor: isDark ? '#111111' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: isDark ? '#fff' : '#000' }}>
                            <div className="absolute inset-0 pointer-events-none transition-opacity opacity-[0.03] dark:opacity-[0.05] group-hover:opacity-[0.08]" style={{ backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

                            <div className="shrink-0 flex lg:flex-col justify-between items-start relative z-10">
                                <div className="w-20 h-20 rounded-[1.5rem] flex items-center justify-center mb-4 transition-colors" style={{ backgroundColor: isDark ? 'rgba(137,249,181,0.1)' : '#dcfce7' }}>
                                    <BookOpen className="w-10 h-10" style={{ color: isDark ? '#89f9b5' : '#166534' }} />
                                </div>
                                <div className="flex lg:flex-col gap-3">
                                    <button onClick={() => openEditForm(mat)} className="p-3 rounded-full transition-colors hover:bg-blue-500 hover:text-white" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }} title="Edit"><Edit3 size={18} /></button>
                                    <button onClick={() => handleDelete(mat.id, mat.unit_name)} className="p-3 rounded-full transition-colors hover:bg-red-500 hover:text-white" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }} title="Hapus"><Trash2 size={18} /></button>
                                </div>
                            </div>

                            <div className="flex-1 relative z-10">
                                <h3 className="font-light tracking-tighter text-4xl mb-6 leading-none group-hover:text-[#89f9b5] transition-colors">{mat.unit_name}</h3>

                                <div className="border rounded-2xl p-6 mb-8 relative mt-8" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                                    <div className="absolute -top-3 left-6 px-3 text-[10px] font-bold uppercase tracking-widest" style={{ backgroundColor: isDark ? '#111' : '#fff', color: '#89f9b5' }}>
                                        Pertanyaan Pemantik
                                    </div>
                                    <p className="text-sm font-medium italic opacity-80 leading-relaxed pt-2">
                                        "{mat.trigger_question || "Belum ada pertanyaan pemantik."}"
                                    </p>
                                </div>

                                <div className="text-sm opacity-60 line-clamp-3 mb-8 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: mat.content_text || "Belum ada isi materi." }}></div>

                                <div className="flex flex-wrap items-center gap-3 pt-4 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                                    {mat.image_url && (
                                        <span className="py-2 px-4 font-bold text-[10px] uppercase tracking-widest rounded-full flex items-center gap-2" style={{ backgroundColor: isDark ? 'rgba(168,85,247,0.1)' : '#f3e8ff', color: isDark ? '#c084fc' : '#7e22ce' }}>
                                            <ImageIcon size={14} /> Gambar Ilustrasi
                                        </span>
                                    )}
                                    {mat.media_url && (
                                        <a href={mat.media_url} target="_blank" rel="noopener noreferrer" className="py-2 px-4 font-bold text-[10px] uppercase tracking-widest rounded-full flex items-center gap-2 hover:opacity-80 transition-opacity" style={{ backgroundColor: isDark ? 'rgba(56,189,248,0.1)' : '#e0f2fe', color: isDark ? '#38bdf8' : '#0284c7' }}>
                                            <LinkIcon size={14} /> Video Tersedia
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}