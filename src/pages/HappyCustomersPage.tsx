import { useEffect, useRef, useState } from 'react';
import {
    getHappyCustomerAvatars, createHappyCustomerAvatar, deleteHappyCustomerAvatar,
    getHappyCustomerTestimonials, createHappyCustomerTestimonial, updateHappyCustomerTestimonial, deleteHappyCustomerTestimonial,
} from '../apis/adminStoreApi';

interface Avatar { id: number; image_url: string; }
interface Testimonial { id: number; avatar_id: number; avatar_url: string | null; quote: string; person_name: string; designation: string | null; sort_order: number; is_active: boolean; }

const emptyForm = { avatar_id: 0, quote: '', person_name: '', designation: '', sort_order: 0, is_active: true };

function HappyCustomersPage() {
    const [avatars, setAvatars] = useState<Avatar[]>([]);
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [form, setForm] = useState(emptyForm);
    const [editing, setEditing] = useState<Testimonial | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const avatarFileRef = useRef<HTMLInputElement>(null);

    const load = async () => {
        const [a, t] = await Promise.all([getHappyCustomerAvatars(), getHappyCustomerTestimonials()]);
        setAvatars(a.data || []);
        setTestimonials(t.data || []);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingAvatar(true);
        try {
            const fd = new FormData();
            fd.append('image', file);
            const r = await createHappyCustomerAvatar(fd);
            setAvatars(prev => [...prev, r.data]);
        } finally {
            setUploadingAvatar(false);
            if (avatarFileRef.current) avatarFileRef.current.value = '';
        }
    };

    const handleDeleteAvatar = async (id: number) => {
        if (!confirm('Delete this avatar? Testimonials using it will lose their avatar.')) return;
        await deleteHappyCustomerAvatar(id);
        setAvatars(prev => prev.filter(a => a.id !== id));
    };

    const handleEdit = (t: Testimonial) => {
        setEditing(t);
        setForm({ avatar_id: t.avatar_id, quote: t.quote, person_name: t.person_name, designation: t.designation || '', sort_order: t.sort_order, is_active: t.is_active });
        setError('');
    };

    const handleCancel = () => { setEditing(null); setForm(emptyForm); setError(''); };

    const handleSave = async () => {
        if (!form.avatar_id) { setError('Select an avatar'); return; }
        if (!form.quote.trim()) { setError('Quote is required'); return; }
        if (!form.person_name.trim()) { setError('Person name is required'); return; }
        setSaving(true); setError('');
        try {
            const payload = { ...form, designation: form.designation || null };
            if (editing) {
                const r = await updateHappyCustomerTestimonial(editing.id, payload);
                setTestimonials(prev => prev.map(t => t.id === editing.id ? { ...r.data, avatar_url: avatars.find(a => a.id === r.data.avatar_id)?.image_url ?? null } : t));
            } else {
                const r = await createHappyCustomerTestimonial(payload);
                setTestimonials(prev => [...prev, { ...r.data, avatar_url: avatars.find(a => a.id === r.data.avatar_id)?.image_url ?? null }]);
            }
            handleCancel();
        } catch (e: any) {
            setError(e?.response?.data?.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this testimonial?')) return;
        await deleteHappyCustomerTestimonial(id);
        setTestimonials(prev => prev.filter(t => t.id !== id));
    };

    const card: React.CSSProperties = { background: 'var(--card-background)', borderRadius: 12, padding: 24, border: '1px solid var(--border-color)' };
    const label: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' };
    const input: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14, background: 'var(--input-background)', color: 'var(--text-primary)', boxSizing: 'border-box' };
    const btn = (variant: 'primary' | 'danger' | 'ghost'): React.CSSProperties => ({
        padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
        ...(variant === 'primary' && { background: 'var(--primary-color)', color: 'white' }),
        ...(variant === 'danger'  && { background: '#fee2e2', color: '#dc2626' }),
        ...(variant === 'ghost'   && { background: 'var(--border-color)', color: 'var(--text-primary)' }),
    });

    if (loading) return <div style={{ padding: 32, color: 'var(--text-secondary)' }}>Loading…</div>;

    return (
        <div style={{ padding: 32, maxWidth: 960 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>Happy Customers</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 32 }}>
                Manage customer avatars and testimonials shown on the landing page.
            </p>

            {/* ── AVATARS ── */}
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>Avatars</h2>
            <div style={{ ...card, marginBottom: 32 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
                    {avatars.map(a => (
                        <div key={a.id} style={{ position: 'relative' }}>
                            <img src={a.image_url} alt="avatar" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-color)' }} />
                            <button
                                onClick={() => handleDeleteAvatar(a.id)}
                                style={{ position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: '50%', background: '#dc2626', color: 'white', border: 'none', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >✕</button>
                        </div>
                    ))}
                    <div>
                        <input ref={avatarFileRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                        <button style={{ ...btn('ghost'), opacity: uploadingAvatar ? 0.6 : 1 }} onClick={() => avatarFileRef.current?.click()} disabled={uploadingAvatar}>
                            {uploadingAvatar ? 'Uploading…' : '+ Upload Avatar'}
                        </button>
                        <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>Square image recommended</p>
                    </div>
                </div>
            </div>

            {/* ── TESTIMONIAL FORM ── */}
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>Testimonials</h2>
            <div style={{ ...card, marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>
                    {editing ? 'Edit Testimonial' : 'Add Testimonial'}
                </h3>
                {error && <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#dc2626', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}

                {/* Avatar picker */}
                <div style={{ marginBottom: 16 }}>
                    <label style={label}>Select Avatar *</label>
                    {avatars.length === 0 ? (
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Upload avatars above first.</p>
                    ) : (
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            {avatars.map(a => (
                                <div
                                    key={a.id}
                                    onClick={() => setForm(f => ({ ...f, avatar_id: a.id }))}
                                    style={{ cursor: 'pointer', borderRadius: '50%', padding: 3, border: `3px solid ${form.avatar_id === a.id ? 'var(--primary-color)' : 'transparent'}` }}
                                >
                                    <img src={a.image_url} alt="avatar" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                        <label style={label}>Person Name *</label>
                        <input style={input} value={form.person_name} onChange={e => setForm(f => ({ ...f, person_name: e.target.value }))} placeholder="Jamie L." />
                    </div>
                    <div>
                        <label style={label}>Designation</label>
                        <input style={input} value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} placeholder="Tea Lover (optional)" />
                    </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                    <label style={label}>Quote *</label>
                    <textarea
                        style={{ ...input, minHeight: 100, resize: 'vertical' }}
                        value={form.quote}
                        onChange={e => setForm(f => ({ ...f, quote: e.target.value }))}
                        placeholder="Their testimonial…"
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 16, marginBottom: 20, alignItems: 'center' }}>
                    <div>
                        <label style={label}>Sort Order</label>
                        <input style={input} type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20 }}>
                        <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                        <label htmlFor="is_active" style={{ fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer' }}>Active</label>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                    <button style={btn('primary')} onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving…' : editing ? 'Update' : 'Add Testimonial'}
                    </button>
                    {editing && <button style={btn('ghost')} onClick={handleCancel}>Cancel</button>}
                </div>
            </div>

            {/* ── TESTIMONIALS LIST ── */}
            {testimonials.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No testimonials yet.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {testimonials.map(t => (
                        <div key={t.id} style={{ ...card, display: 'flex', alignItems: 'flex-start', gap: 16, padding: 16 }}>
                            {t.avatar_url ? (
                                <img src={t.avatar_url} alt={t.person_name} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border-color)' }} />
                            ) : (
                                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--border-color)', flexShrink: 0 }} />
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                                    <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{t.person_name}</p>
                                    {t.designation && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t.designation}</span>}
                                    <span style={{ fontSize: 11, color: t.is_active ? '#16a34a' : '#dc2626', background: t.is_active ? '#dcfce7' : '#fee2e2', padding: '2px 8px', borderRadius: 99 }}>
                                        {t.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                    "{t.quote}"
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                <button style={btn('ghost')} onClick={() => handleEdit(t)}>Edit</button>
                                <button style={btn('danger')} onClick={() => handleDelete(t.id)}>Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default HappyCustomersPage;
