import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    Calendar, Clock, MapPin, CheckCircle2, UserCheck,
    Plus, X, Check, Pencil, Trash2, AlertTriangle, Users,
} from 'lucide-react';

const SERVICE_TYPE_COLORS = {
    sunday_service: { bg: '#fff7ed', color: '#f97316' },
    small_group: { bg: '#f0fdfa', color: '#0d9488' },
    special_event: { bg: '#eff6ff', color: '#3b82f6' },
    midweek_service: { bg: '#f5f3ff', color: '#8b5cf6' },
};

/* ── helpers ───────────────────────────── */
const Modal = ({ title, onClose, children, wide }) => (
    <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, padding: 20,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
        <div style={{
            background: '#fff', borderRadius: 14, width: '100%',
            maxWidth: wide ? 640 : 480, maxHeight: '90vh', overflowY: 'auto',
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
            <button onClick={onConfirm} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Delete</button>
        </div>
    </Modal>
);

/* ══════════════════════════════════════════ */
const Attendance = () => {
    const { user } = useAuth();
    const canManage = user?.role === 'admin' || user?.role === 'priest';

    const [services, setServices] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null);       // service add/edit
    const [checkinModal, setCheckinModal] = useState(null); // check-in panel
    const [confirm, setConfirm] = useState(null);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [records, setRecords] = useState([]);
    const [checkinMember, setCheckinMember] = useState('');
    const [checkinLoading, setCheckinLoading] = useState(false);

    const fetchServices = useCallback(async () => {
        setLoading(true);
        try {
            const [sRes, mRes] = await Promise.allSettled([
                api.get('services/?page_size=100&ordering=-date'),
                api.get('members/?page_size=200&status=active'),
            ]);
            if (sRes.status === 'fulfilled') setServices(sRes.value.data.results || []);
            if (mRes.status === 'fulfilled') setMembers(mRes.value.data.results || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchServices(); }, [fetchServices]);

    const f = key => e => setForm(p => ({ ...p, [key]: e.target.value }));
    const formatServiceType = t => t?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || t;

    const openAdd = () => {
        setForm({ date: new Date().toISOString().slice(0, 10), start_time: '09:00', service_type: 'sunday_service' });
        setError(''); setModal({ mode: 'add' });
    };
    const openEdit = s => {
        setForm({ ...s }); setError(''); setModal({ mode: 'edit' });
    };
    const save = async () => {
        if (!form.name || !form.date || !form.start_time) { setError('Service name, date and start time are required.'); return; }
        setSaving(true); setError('');
        try {
            if (modal.mode === 'add') await api.post('services/', form);
            else await api.patch(`services/${form.id}/`, form);
            setModal(null); fetchServices();
        } catch (e) {
            const msg = e.response?.data;
            setError(typeof msg === 'object' ? Object.values(msg).flat().join(' ') : 'Error saving.');
        } finally { setSaving(false); }
    };
    const del = async id => {
        try { await api.delete(`services/${id}/`); fetchServices(); }
        catch { alert('Error deleting service.'); } finally { setConfirm(null); }
    };

    /* ─ Check-in ─ */
    const openCheckin = async svc => {
        setCheckinModal(svc);
        setCheckinMember('');
        setCheckinLoading(true);
        try {
            const res = await api.get(`attendance/?service=${svc.id}&page_size=200`);
            setRecords(res.data.results || []);
        } catch { setRecords([]); } finally { setCheckinLoading(false); }
    };

    const doCheckin = async () => {
        if (!checkinMember) return;
        try {
            await api.post(`services/${checkinModal.id}/check-in/`, { member_id: checkinMember, check_in_method: 'manual' });
            const res = await api.get(`attendance/?service=${checkinModal.id}&page_size=200`);
            setRecords(res.data.results || []);
            setCheckinMember('');
            // Refresh service list to update count
            fetchServices();
        } catch (e) {
            alert(e.response?.data?.message || e.response?.data?.error || 'Check-in failed.');
        }
    };

    const removeCheckin = async recordId => {
        try {
            await api.delete(`attendance/${recordId}/`);
            const res = await api.get(`attendance/?service=${checkinModal.id}&page_size=200`);
            setRecords(res.data.results || []);
            fetchServices();
        } catch { alert('Error removing check-in.'); }
    };

    // Members not yet checked in
    const checkedInIds = new Set(records.map(r => r.member));
    const availableMembers = members.filter(m => !checkedInIds.has(m.id));

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Attendance Tracking</h1>
                    <p className="page-subtitle">Check-in members for services and small groups</p>
                </div>
                {canManage && (
                    <button className="btn-primary" onClick={openAdd}>
                        <Plus size={16} /> Schedule Service
                    </button>
                )}
            </div>

            {loading ? (
                <div className="grid-auto">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="card" style={{ padding: 24, height: 220 }}>
                            <div className="skeleton" style={{ height: 16, width: '60%', marginBottom: 12 }} />
                            <div className="skeleton" style={{ height: 12, width: '35%', marginBottom: 20 }} />
                            <div className="skeleton" style={{ height: 12, width: '75%', marginBottom: 8 }} />
                            <div className="skeleton" style={{ height: 12, width: '55%', marginBottom: 24 }} />
                            <div className="skeleton" style={{ height: 40, width: '100%', borderRadius: 8 }} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid-auto">
                    {services.length > 0 ? services.map(service => {
                        const typeStyle = SERVICE_TYPE_COLORS[service.service_type] || { bg: '#f3f4f6', color: '#6b7280' };
                        return (
                            <div key={service.id} className="card" style={{ padding: 24, transition: 'box-shadow 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                                onMouseLeave={e => e.currentTarget.style.boxShadow = ''}>
                                {/* Title row */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 8px', fontSize: 15 }}>{service.name}</h3>
                                        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: typeStyle.bg, color: typeStyle.color, display: 'inline-block' }}>
                                            {formatServiceType(service.service_type)}
                                        </span>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                                        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>{service.attendance_count ?? 0}</div>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Present</div>
                                    </div>
                                </div>

                                {/* Meta */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                                        <Calendar size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> {service.date}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                                        <Clock size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                        {service.start_time?.substring(0, 5)}{service.end_time ? ` – ${service.end_time.substring(0, 5)}` : ''}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                                        <MapPin size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> {service.location || 'No location set'}
                                    </div>
                                </div>

                                {/* Buttons */}
                                <button onClick={() => openCheckin(service)} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: canManage ? 10 : 0 }}>
                                    <UserCheck size={16} /> {canManage ? 'Manage Check-in' : 'View Attendance'}
                                </button>

                                {canManage && (
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button onClick={() => openEdit(service)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: 13 }}>
                                            <Pencil size={14} /> Edit
                                        </button>
                                        <button onClick={() => setConfirm({ id: service.id, name: service.name })} style={{ background: 'none', border: '1px solid #ef444422', color: '#ef4444', cursor: 'pointer', borderRadius: 6, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    }) : (
                        <div className="card" style={{ gridColumn: '1 / -1', padding: 72, textAlign: 'center' }}>
                            <CheckCircle2 size={48} style={{ color: 'var(--border)', margin: '0 auto 16px', display: 'block' }} />
                            <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>No Services Scheduled</h3>
                            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                                {canManage ? 'Click "Schedule Service" to add your first service.' : 'No services have been scheduled yet.'}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* ─ Schedule Service modal ─ */}
            {modal && (
                <Modal title={modal.mode === 'add' ? 'Schedule Service' : 'Edit Service'} onClose={() => setModal(null)} wide>
                    {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13.5 }}>{error}</div>}
                    <Field label="Service Name" required><input className="form-input" value={form.name || ''} onChange={f('name')} placeholder="e.g. Sunday Service" /></Field>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                        <Field label="Service Type" required>
                            <select className="form-input" value={form.service_type || 'sunday_service'} onChange={f('service_type')}>
                                <option value="sunday_service">Sunday Service</option>
                                <option value="small_group">Small Group</option>
                                <option value="special_event">Special Event</option>
                                <option value="midweek_service">Midweek Service</option>
                            </select>
                        </Field>
                        <Field label="Date" required><input className="form-input" type="date" value={form.date || ''} onChange={f('date')} /></Field>
                        <Field label="Start Time" required><input className="form-input" type="time" value={form.start_time || ''} onChange={f('start_time')} /></Field>
                        <Field label="End Time"><input className="form-input" type="time" value={form.end_time || ''} onChange={f('end_time')} /></Field>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <Field label="Location"><input className="form-input" value={form.location || ''} onChange={f('location')} placeholder="Main Sanctuary" /></Field>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <Field label="Notes"><textarea className="form-input" rows={2} value={form.notes || ''} onChange={f('notes')} style={{ resize: 'vertical' }} /></Field>
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button className="btn-secondary" onClick={() => setModal(null)} disabled={saving}>Cancel</button>
                        <button className="btn-primary" onClick={save} disabled={saving}>
                            {saving ? 'Saving…' : <><Check size={15} /> {modal.mode === 'add' ? 'Schedule' : 'Save Changes'}</>}
                        </button>
                    </div>
                </Modal>
            )}

            {/* ─ Check-in modal ─ */}
            {checkinModal && (
                <Modal title={`Attendance: ${checkinModal.name}`} onClose={() => setCheckinModal(null)} wide>
                    {canManage && (
                        <div style={{ marginBottom: 24 }}>
                            <Field label="Check In a Member">
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <select className="form-input" value={checkinMember} onChange={e => setCheckinMember(e.target.value)}>
                                        <option value="">Select member to check in…</option>
                                        {availableMembers.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
                                    </select>
                                    <button className="btn-primary" onClick={doCheckin} disabled={!checkinMember} style={{ flexShrink: 0 }}>
                                        <UserCheck size={15} /> Check In
                                    </button>
                                </div>
                            </Field>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h4 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                            Checked In
                        </h4>
                        <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>{records.length}</span>
                    </div>

                    {checkinLoading ? (
                        <div style={{ padding: '20px 0' }}>{[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 40, marginBottom: 8, borderRadius: 8 }} />)}</div>
                    ) : records.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
                            <Users size={36} style={{ margin: '0 auto 10px', display: 'block', color: 'var(--border)' }} />
                            <p style={{ margin: 0 }}>No one has been checked in yet.</p>
                        </div>
                    ) : (
                        <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 10 }}>
                            {records.map((r, i) => (
                                <div key={r.id} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '12px 16px', borderBottom: i < records.length - 1 ? '1px solid var(--border-light)' : 'none',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                                            {(r.member_name || '?')[0].toUpperCase()}
                                        </div>
                                        <span style={{ fontWeight: 600, fontSize: 14 }}>{r.member_name || `Member #${r.member}`}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ fontSize: 11.5, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: '#dbeafe', color: '#1d4ed8', textTransform: 'capitalize' }}>{r.check_in_method}</span>
                                        {canManage && (
                                            <button onClick={() => removeCheckin(r.id)} title="Remove check-in" style={{ background: 'none', border: '1px solid #ef444422', color: '#ef4444', cursor: 'pointer', borderRadius: 6, padding: '4px 7px', display: 'flex' }}>
                                                <X size={13} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Modal>
            )}

            {/* Confirm delete */}
            {confirm && (
                <Confirm
                    message={`Delete service "${confirm.name}" and all its attendance records? This cannot be undone.`}
                    onConfirm={() => del(confirm.id)}
                    onCancel={() => setConfirm(null)}
                />
            )}
        </div>
    );
};

export default Attendance;
