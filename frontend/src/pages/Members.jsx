import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    Search, Plus, User as UserIcon, Mail, Phone, MapPin,
    Filter, Pencil, Trash2, X, Check, AlertTriangle, Eye,
} from 'lucide-react';

/* ── shared helpers ─────────────────────── */
const Modal = ({ title, onClose, children, wide }) => (
    <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, padding: 20,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
        <div style={{
            background: '#fff', borderRadius: 14, width: '100%',
            maxWidth: wide ? 720 : 480, maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 16px 40px rgba(0,0,0,0.18)',
        }}>
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '20px 24px', borderBottom: '1px solid var(--border)',
                position: 'sticky', top: 0, background: '#fff', zIndex: 1,
            }}>
                <h3 style={{ margin: 0, fontSize: 16 }}>{title}</h3>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}><X size={20} /></button>
            </div>
            <div style={{ padding: '20px 24px' }}>{children}</div>
        </div>
    </div>
);

const Field = ({ label, children, required }) => (
    <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
            {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
        </label>
        {children}
    </div>
);

const Confirm = ({ message, onConfirm, onCancel }) => (
    <Modal title="Confirm Delete" onClose={onCancel}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 24 }}>
            <AlertTriangle size={24} color="#f97316" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{message}</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button className="btn-secondary" onClick={onCancel}>Cancel</button>
            <button onClick={onConfirm} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13.5 }}>Delete</button>
        </div>
    </Modal>
);

/* ── profile view modal ─────────────────── */
const ProfileModal = ({ member, onClose, onEdit, canEdit }) => (
    <Modal title="Member Profile" onClose={onClose} wide>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--border-light)' }}>
            <div className="avatar-placeholder" style={{ width: 72, height: 72, fontSize: 24 }}>
                {`${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`.toUpperCase()}
            </div>
            <div>
                <h2 style={{ margin: '0 0 6px', fontSize: 20 }}>{member.first_name} {member.last_name}</h2>
                <span className={`badge ${member.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>{member.status}</span>
                <span style={{ marginLeft: 8, fontSize: 12.5, color: 'var(--text-muted)', background: '#f3f4f6', padding: '3px 10px', borderRadius: 20, fontWeight: 600, textTransform: 'capitalize' }}>{member.role}</span>
            </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 32px' }}>
            {[
                ['Email', member.email],
                ['Phone', member.phone],
                ['Gender', member.gender === 'M' ? 'Male' : member.gender === 'F' ? 'Female' : member.gender || '—'],
                ['Date of Birth', member.date_of_birth || '—'],
                ['Baptism Date', member.baptism_date || '—'],
                ['Membership Date', member.membership_date || '—'],
                ['City', member.city],
                ['State', member.state],
                ['Zip Code', member.zip_code],
                ['Address', member.address],
            ].map(([label, value]) => (
                <div key={label}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 14, color: value ? 'var(--text-primary)' : 'var(--text-muted)' }}>{value || '—'}</div>
                </div>
            ))}
        </div>
        {canEdit && (
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-primary" onClick={() => { onClose(); onEdit(member); }}>
                    <Pencil size={14} /> Edit Member
                </button>
            </div>
        )}
    </Modal>
);

/* ══════════════════════════════════════════ */
const Members = () => {
    const { user } = useAuth();
    const canManage = user?.role === 'admin' || user?.role === 'priest';

    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('active');
    const [modal, setModal] = useState(null); // null | { mode: 'add'|'edit'|'view', data? }
    const [confirm, setConfirm] = useState(null);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const fetchMembers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (statusFilter) params.append('status', statusFilter);
            const res = await api.get(`members/?${params.toString()}`);
            setMembers(res.data.results || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter]);

    useEffect(() => { fetchMembers(); }, [fetchMembers]);

    const getInitials = m => `${m.first_name?.[0] || ''}${m.last_name?.[0] || ''}`.toUpperCase();

    const openAdd = () => {
        setForm({ status: 'active', role: 'member', gender: 'M' });
        setError('');
        setModal({ mode: 'add' });
    };
    const openEdit = m => {
        setForm({ ...m });
        setError('');
        setModal({ mode: 'edit', data: m });
    };
    const openView = m => setModal({ mode: 'view', data: m });

    const f = key => e => setForm(p => ({ ...p, [key]: e.target.value }));

    const handleSave = async () => {
        if (!form.first_name || !form.last_name) { setError('First and last name are required.'); return; }
        setSaving(true); setError('');
        try {
            if (modal.mode === 'add') await api.post('members/', form);
            else await api.patch(`members/${form.id}/`, form);
            setModal(null);
            fetchMembers();
        } catch (e) {
            const msg = e.response?.data;
            setError(typeof msg === 'object' ? Object.values(msg).flat().join(' ') : 'Error saving. Please try again.');
        } finally { setSaving(false); }
    };

    const handleDelete = async id => {
        try { await api.delete(`members/${id}/`); fetchMembers(); }
        catch { alert('Error deleting member.'); }
        finally { setConfirm(null); }
    };

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Member Directory</h1>
                    <p className="page-subtitle">View profiles and manage church membership</p>
                </div>
                {canManage && (
                    <button className="btn-primary" onClick={openAdd}>
                        <Plus size={16} /> Add Member
                    </button>
                )}
            </div>

            {/* Filter bar */}
            <div className="card" style={{ marginBottom: 24, padding: '14px 20px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="input-wrapper" style={{ flex: 1, minWidth: 220 }}>
                    <Search size={15} className="input-icon" />
                    <input type="text" className="form-input" placeholder="Search by name, email, or phone…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Filter size={15} style={{ color: 'var(--text-muted)' }} />
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="form-input" style={{ width: 'auto', minWidth: 140 }}>
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="deceased">Deceased</option>
                        <option value="moved">Moved</option>
                    </select>
                </div>
            </div>

            {/* Cards grid */}
            {loading ? (
                <div className="grid-auto">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="card" style={{ padding: 24, height: 200 }}>
                            <div className="skeleton" style={{ height: 16, width: '60%', marginBottom: 12 }} />
                            <div className="skeleton" style={{ height: 12, width: '40%', marginBottom: 20 }} />
                            <div className="skeleton" style={{ height: 12, width: '80%', marginBottom: 8 }} />
                            <div className="skeleton" style={{ height: 12, width: '70%' }} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid-auto">
                    {members.length > 0 ? members.map(member => (
                        <div key={member.id} className="card" style={{ padding: 24, transition: 'box-shadow 0.2s', cursor: 'default' }}
                            onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = ''}>
                            {/* Avatar + name */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                                {member.photo_url ? (
                                    <img src={member.photo_url} alt={member.first_name} className="avatar" style={{ width: 52, height: 52 }} />
                                ) : (
                                    <div className="avatar-placeholder" style={{ width: 52, height: 52, fontSize: 16 }}>{getInitials(member)}</div>
                                )}
                                <div>
                                    <h4 style={{ margin: 0, fontSize: 15, color: 'var(--text-primary)' }}>{member.first_name} {member.last_name}</h4>
                                    <span className={`badge ${member.status === 'active' ? 'badge-active' : 'badge-inactive'}`} style={{ marginTop: 4 }}>{member.status}</span>
                                </div>
                            </div>

                            {/* Details */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                                    <Mail size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.email || 'No email'}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                                    <Phone size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                    {member.phone || 'No phone'}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                                    <MapPin size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                    {member.city ? `${member.city}${member.state ? `, ${member.state}` : ''}` : 'No address'}
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <button onClick={() => openView(member)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, fontSize: 13, padding: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <Eye size={14} /> View Profile
                                </button>
                                {canManage && (
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button onClick={() => openEdit(member)} style={{ background: 'none', border: '1px solid #3b82f622', color: '#3b82f6', cursor: 'pointer', borderRadius: 6, padding: '5px 7px', display: 'flex' }}><Pencil size={14} /></button>
                                        <button onClick={() => setConfirm({ id: member.id, name: `${member.first_name} ${member.last_name}` })} style={{ background: 'none', border: '1px solid #ef444422', color: '#ef4444', cursor: 'pointer', borderRadius: 6, padding: '5px 7px', display: 'flex' }}><Trash2 size={14} /></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )) : (
                        <div className="card" style={{ gridColumn: '1 / -1', padding: 60, textAlign: 'center' }}>
                            <UserIcon size={44} style={{ color: 'var(--border)', margin: '0 auto 16px', display: 'block' }} />
                            <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>No members found</h3>
                            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Try adjusting your search or filters.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Profile view modal */}
            {modal?.mode === 'view' && (
                <ProfileModal member={modal.data} onClose={() => setModal(null)} onEdit={openEdit} canEdit={canManage} />
            )}

            {/* Add / Edit modal */}
            {(modal?.mode === 'add' || modal?.mode === 'edit') && (
                <Modal title={modal.mode === 'add' ? 'Add Member' : 'Edit Member'} onClose={() => setModal(null)} wide>
                    {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13.5 }}>{error}</div>}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                        <Field label="First Name" required><input className="form-input" value={form.first_name || ''} onChange={f('first_name')} placeholder="Hannah" /></Field>
                        <Field label="Last Name" required><input className="form-input" value={form.last_name || ''} onChange={f('last_name')} placeholder="Smith" /></Field>
                        <Field label="Email"><input className="form-input" type="email" value={form.email || ''} onChange={f('email')} placeholder="hannah@email.com" /></Field>
                        <Field label="Phone"><input className="form-input" value={form.phone || ''} onChange={f('phone')} placeholder="+1 555 000 0000" /></Field>
                        <Field label="Date of Birth"><input className="form-input" type="date" value={form.date_of_birth || ''} onChange={f('date_of_birth')} /></Field>
                        <Field label="Membership Date"><input className="form-input" type="date" value={form.membership_date || ''} onChange={f('membership_date')} /></Field>
                        <Field label="Gender">
                            <select className="form-input" value={form.gender || ''} onChange={f('gender')}>
                                <option value="">—</option>
                                <option value="M">Male</option>
                                <option value="F">Female</option>
                                <option value="O">Other</option>
                            </select>
                        </Field>
                        <Field label="Status">
                            <select className="form-input" value={form.status || 'active'} onChange={f('status')}>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="deceased">Deceased</option>
                                <option value="moved">Moved</option>
                            </select>
                        </Field>
                        {user?.role === 'admin' && (
                            <Field label="Role">
                                <select className="form-input" value={form.role || 'member'} onChange={f('role')}>
                                    <option value="member">Member</option>
                                    <option value="priest">Parish Priest</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </Field>
                        )}
                        <Field label="Baptism Date"><input className="form-input" type="date" value={form.baptism_date || ''} onChange={f('baptism_date')} /></Field>
                        <Field label="City"><input className="form-input" value={form.city || ''} onChange={f('city')} /></Field>
                        <Field label="State"><input className="form-input" value={form.state || ''} onChange={f('state')} /></Field>
                        <Field label="Zip Code"><input className="form-input" value={form.zip_code || ''} onChange={f('zip_code')} /></Field>
                    </div>
                    <Field label="Address"><textarea className="form-input" rows={2} value={form.address || ''} onChange={f('address')} style={{ resize: 'vertical' }} /></Field>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                        <button className="btn-secondary" onClick={() => setModal(null)} disabled={saving}>Cancel</button>
                        <button className="btn-primary" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving…' : <><Check size={15} /> {modal.mode === 'add' ? 'Add Member' : 'Save Changes'}</>}
                        </button>
                    </div>
                </Modal>
            )}

            {/* Confirm delete */}
            {confirm && (
                <Confirm
                    message={`Are you sure you want to delete ${confirm.name}? This action cannot be undone.`}
                    onConfirm={() => handleDelete(confirm.id)}
                    onCancel={() => setConfirm(null)}
                />
            )}
        </div>
    );
};

export default Members;
