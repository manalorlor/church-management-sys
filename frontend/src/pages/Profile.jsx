import React, { useState, useRef, useEffect } from 'react';
import { Camera, Save, User, Mail, Phone, Shield, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Profile = () => {
    const { user, updateUser } = useAuth();
    const fileInputRef = useRef(null);

    const [preview, setPreview] = useState(user?.photo_url || null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [form, setForm] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        email: user?.email || '',
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '...' }

    // Keep form in sync if user context updates
    useEffect(() => {
        setForm({
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            email: user?.email || '',
        });
        setPreview(user?.photo_url || null);
    }, [user]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setMessage({ type: 'error', text: 'Please select an image file.' });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'Image must be smaller than 5 MB.' });
            return;
        }
        setSelectedFile(file);
        setPreview(URL.createObjectURL(file));
        setMessage(null);
    };

    const handleFormChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const formData = new FormData();
            formData.append('first_name', form.first_name);
            formData.append('last_name', form.last_name);
            formData.append('email', form.email);
            if (selectedFile) {
                formData.append('photo', selectedFile);
            }

            const res = await api.patch('auth/profile/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            // Append cache-busting timestamp so browser reloads the new image
            let newPhotoUrl = res.data.photo_url || null;
            if (newPhotoUrl) {
                const separator = newPhotoUrl.includes('?') ? '&' : '?';
                newPhotoUrl = `${newPhotoUrl}${separator}t=${Date.now()}`;
            }

            // Push changes into auth context so sidebar avatar updates instantly
            updateUser({
                first_name: res.data.first_name,
                last_name: res.data.last_name,
                email: res.data.email,
                photo_url: newPhotoUrl,
            });

            setPreview(newPhotoUrl || preview);
            setSelectedFile(null);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (err) {
            const detail = err?.response?.data?.error || err?.response?.data?.detail || 'Failed to save changes.';
            setMessage({ type: 'error', text: detail });
        } finally {
            setSaving(false);
        }
    };

    const userRole = user?.role || 'member';
    const displayName = `${form.first_name} ${form.last_name}`.trim() || user?.username || 'User';
    const initials = (form.first_name?.[0] || '') + (form.last_name?.[0] || '') || (user?.username?.[0] || 'U');

    const roleColor = userRole === 'admin'
        ? { bg: '#fff7ed', color: '#c2560a', gradient: 'linear-gradient(135deg, #f97316, #fb923c)' }
        : userRole === 'priest'
            ? { bg: '#f0fdfa', color: '#0f766e', gradient: 'linear-gradient(135deg, #0d9488, #06b6d4)' }
            : { bg: '#eff6ff', color: '#1d4ed8', gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)' };

    return (
        <div>
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">My Profile</h1>
                    <p className="page-subtitle">Manage your personal information and profile picture.</p>
                </div>
            </div>

            {/* Toast message */}
            {message && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '13px 18px', borderRadius: 10, marginBottom: 24,
                    background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                    color: message.type === 'success' ? '#166534' : '#991b1b',
                    fontSize: 14, fontWeight: 500,
                }}>
                    {message.type === 'success'
                        ? <CheckCircle size={17} />
                        : <AlertCircle size={17} />}
                    {message.text}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'start' }}>

                {/* ─── Left: Avatar Card ─── */}
                <div className="card" style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>

                    {/* Avatar with camera overlay */}
                    <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
                        {preview ? (
                            <img
                                src={preview}
                                alt={displayName}
                                style={{
                                    width: 120, height: 120, borderRadius: '50%',
                                    objectFit: 'cover',
                                    border: '4px solid var(--primary)',
                                    boxShadow: '0 0 0 4px var(--primary-light)',
                                }}
                            />
                        ) : (
                            <div style={{
                                width: 120, height: 120, borderRadius: '50%',
                                background: roleColor.gradient,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 40, fontWeight: 800, color: '#fff',
                                border: '4px solid var(--primary)',
                                boxShadow: '0 0 0 4px var(--primary-light)',
                                userSelect: 'none',
                            }}>
                                {initials.toUpperCase()}
                            </div>
                        )}

                        {/* Camera overlay */}
                        <div style={{
                            position: 'absolute', bottom: 4, right: 4,
                            width: 34, height: 34, borderRadius: '50%',
                            background: 'var(--primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                            border: '2px solid #fff',
                        }}>
                            <Camera size={15} color="#fff" />
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>
                            {displayName}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                            @{user?.username}
                        </div>
                        <div style={{
                            display: 'inline-block', marginTop: 10,
                            background: roleColor.bg, color: roleColor.color,
                            fontSize: 12, fontWeight: 700, padding: '4px 14px',
                            borderRadius: 20, textTransform: 'capitalize',
                        }}>
                            {userRole}
                        </div>
                    </div>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-secondary"
                        style={{ width: '100%', justifyContent: 'center' }}
                    >
                        <Camera size={15} />
                        Change Photo
                    </button>

                    <p style={{ fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
                        JPG, PNG or GIF — max 5 MB.<br />
                        Click the avatar or the button to upload.
                    </p>
                </div>

                {/* ─── Right: Info Form ─── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* Personal Info */}
                    <div className="card" style={{ padding: 28 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 8,
                                background: 'var(--primary-light)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <User size={17} color="var(--primary)" />
                            </div>
                            <div>
                                <h3 style={{ margin: 0 }}>Personal Information</h3>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Update your name and contact details</p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                                    First Name
                                </label>
                                <input
                                    className="form-input"
                                    type="text"
                                    name="first_name"
                                    value={form.first_name}
                                    onChange={handleFormChange}
                                    placeholder="First name"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                                    Last Name
                                </label>
                                <input
                                    className="form-input"
                                    type="text"
                                    name="last_name"
                                    value={form.last_name}
                                    onChange={handleFormChange}
                                    placeholder="Last name"
                                />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                        <Mail size={13} /> Email Address
                                    </span>
                                </label>
                                <input
                                    className="form-input"
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleFormChange}
                                    placeholder="your@email.com"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Account Info (read-only) */}
                    <div className="card" style={{ padding: 28 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 8,
                                background: roleColor.bg,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Shield size={17} color={roleColor.color} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0 }}>Account Details</h3>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Your account credentials (read-only)</p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                                    Username
                                </label>
                                <input
                                    className="form-input"
                                    type="text"
                                    value={user?.username || ''}
                                    readOnly
                                    style={{ background: 'var(--bg)', cursor: 'not-allowed', color: 'var(--text-muted)' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                                    Role
                                </label>
                                <input
                                    className="form-input"
                                    type="text"
                                    value={userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                                    readOnly
                                    style={{ background: 'var(--bg)', cursor: 'not-allowed', color: roleColor.color, fontWeight: 600 }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="btn-primary"
                            style={{ minWidth: 140, justifyContent: 'center' }}
                        >
                            {saving
                                ? <><Loader size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Saving…</>
                                : <><Save size={15} /> Save Changes</>
                            }
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default Profile;
