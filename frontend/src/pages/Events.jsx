import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    Calendar as CalendarIcon, List, Plus, MapPin, Clock,
    Users, X, Check, Pencil, Trash2, AlertTriangle, Eye, EyeOff,
} from 'lucide-react';

/* ── helpers ───────────────────────────── */
const Modal = ({ title, onClose, children, wide }) => (
    <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, padding: 20,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
        <div style={{
            background: '#fff', borderRadius: 14, width: '100%',
            maxWidth: wide ? 640 : 500, maxHeight: '90vh', overflowY: 'auto',
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
const Events = () => {
    const { user } = useAuth();
    const canManage = user?.role === 'admin' || user?.role === 'priest';

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('calendar');
    const [modal, setModal] = useState(null);
    const [detailModal, setDetailModal] = useState(null);
    const [confirm, setConfirm] = useState(null);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('events/?page_size=200');
            setEvents(res.data.results || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    const calendarEvents = events.map(e => ({
        id: e.id,
        title: e.title,
        start: e.start_datetime,
        end: e.end_datetime,
        backgroundColor: e.is_published ? '#f97316' : '#9ca3af',
        borderColor: e.is_published ? '#f97316' : '#9ca3af',
        extendedProps: { ...e },
    }));

    const f = key => e => setForm(p => ({ ...p, [key]: e.target.value }));

    const openAdd = () => {
        const now = new Date();
        now.setMinutes(0, 0, 0);
        const pad = n => String(n).padStart(2, '0');
        const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        const end = new Date(now.getTime() + 60 * 60 * 1000);
        setForm({ start_datetime: fmt(now), end_datetime: fmt(end), recurrence: 'none', is_published: false });
        setError('');
        setModal({ mode: 'add' });
    };

    const openEdit = ev => {
        setForm({
            ...ev,
            start_datetime: ev.start_datetime?.slice(0, 16),
            end_datetime: ev.end_datetime?.slice(0, 16),
        });
        setError('');
        setModal({ mode: 'edit' });
    };

    const save = async () => {
        if (!form.title || !form.start_datetime || !form.end_datetime) { setError('Title, start and end date are required.'); return; }
        setSaving(true); setError('');
        try {
            if (modal.mode === 'add') await api.post('events/', form);
            else await api.patch(`events/${form.id}/`, form);
            setModal(null); fetchEvents();
        } catch (e) {
            const msg = e.response?.data;
            setError(typeof msg === 'object' ? Object.values(msg).flat().join(' ') : 'Error saving event.');
        } finally { setSaving(false); }
    };

    const togglePublish = async ev => {
        try { await api.patch(`events/${ev.id}/`, { is_published: !ev.is_published }); fetchEvents(); }
        catch { alert('Error updating event.'); }
    };

    const del = async id => {
        try { await api.delete(`events/${id}/`); fetchEvents(); }
        catch { alert('Error deleting event.'); } finally { setConfirm(null); }
    };

    // Click handler for calendar events
    const handleEventClick = info => {
        setDetailModal(info.event.extendedProps);
    };

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Events & Calendar</h1>
                    <p className="page-subtitle">Manage church events and volunteer scheduling</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    {/* View toggle */}
                    <div style={{ display: 'flex', background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: 3, gap: 3 }}>
                        {[{ id: 'calendar', label: 'Calendar', icon: <CalendarIcon size={14} /> }, { id: 'list', label: 'List', icon: <List size={14} /> }].map(v => (
                            <button key={v.id} onClick={() => setView(v.id)} style={{
                                padding: '7px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit',
                                display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
                                background: view === v.id ? 'var(--primary)' : 'transparent',
                                color: view === v.id ? '#fff' : 'var(--text-secondary)',
                            }}>{v.icon} {v.label}</button>
                        ))}
                    </div>
                    {canManage && (
                        <button className="btn-primary" onClick={openAdd}><Plus size={15} /> Create Event</button>
                    )}
                </div>
            </div>

            <div className="card" style={{ padding: 24, minHeight: 560 }}>
                {view === 'calendar' ? (
                    loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 450 }}>
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading calendar…</div>
                        </div>
                    ) : (
                        <FullCalendar
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
                            events={calendarEvents}
                            height="auto"
                            eventDisplay="block"
                            eventClick={handleEventClick}
                            dateClick={canManage ? info => {
                                const dt = info.dateStr + 'T09:00';
                                const end = info.dateStr + 'T10:00';
                                setForm({ start_datetime: dt, end_datetime: end, recurrence: 'none', is_published: false });
                                setError(''); setModal({ mode: 'add' });
                            } : undefined}
                        />
                    )
                ) : (
                    <div>
                        {loading ? (
                            [1, 2, 3].map(i => (
                                <div key={i} style={{ padding: '16px 0', borderBottom: '1px solid var(--border-light)' }}>
                                    <div className="skeleton" style={{ height: 16, width: '40%', marginBottom: 10 }} />
                                    <div className="skeleton" style={{ height: 12, width: '60%' }} />
                                </div>
                            ))
                        ) : events.length > 0 ? events.map(event => (
                            <div key={event.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px 0', borderBottom: '1px solid var(--border-light)' }}>
                                <div style={{ display: 'flex', gap: 16, flex: 1 }}>
                                    {/* Date chip */}
                                    <div style={{ width: 52, height: 52, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--primary)' }}>
                                        <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1 }}>{new Date(event.start_datetime).getDate()}</div>
                                        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>{new Date(event.start_datetime).toLocaleString('default', { month: 'short' })}</div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: '0 0 6px', fontSize: 15 }}>{event.title}</h4>
                                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                                                <Clock size={13} /> {new Date(event.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            {event.location && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                                                    <MapPin size={13} /> {event.location}
                                                </div>
                                            )}
                                            {event.volunteer_slots?.length > 0 && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                                                    <Users size={13} /> {event.volunteer_slots.length} volunteer slots
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginLeft: 16 }}>
                                    <span style={{ fontSize: 11.5, padding: '4px 12px', borderRadius: 20, fontWeight: 600, background: event.is_published ? '#dcfce7' : '#fef3c7', color: event.is_published ? '#15803d' : '#d97706' }}>
                                        {event.is_published ? 'Published' : 'Draft'}
                                    </span>
                                    {canManage && (
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button onClick={() => togglePublish(event)} title={event.is_published ? 'Unpublish' : 'Publish'} style={{ background: 'none', border: `1px solid ${event.is_published ? '#6b728022' : '#10b98122'}`, color: event.is_published ? '#6b7280' : '#10b981', cursor: 'pointer', borderRadius: 6, padding: '5px 7px', display: 'flex' }}>
                                                {event.is_published ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                            <button onClick={() => openEdit(event)} style={{ background: 'none', border: '1px solid #3b82f622', color: '#3b82f6', cursor: 'pointer', borderRadius: 6, padding: '5px 7px', display: 'flex' }}><Pencil size={14} /></button>
                                            <button onClick={() => setConfirm({ id: event.id, name: event.title })} style={{ background: 'none', border: '1px solid #ef444422', color: '#ef4444', cursor: 'pointer', borderRadius: 6, padding: '5px 7px', display: 'flex' }}><Trash2 size={14} /></button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )) : (
                            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                                <CalendarIcon size={44} style={{ margin: '0 auto 16px', display: 'block', color: 'var(--border)' }} />
                                <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>No events yet</h3>
                                <p style={{ margin: 0 }}>Create your first event to see it here.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Calendar event detail popup */}
            {detailModal && (
                <Modal title={detailModal.title} onClose={() => setDetailModal(null)} wide>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {detailModal.description && <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{detailModal.description}</p>}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            {[
                                ['Start', new Date(detailModal.start_datetime).toLocaleString()],
                                ['End', new Date(detailModal.end_datetime).toLocaleString()],
                                ['Location', detailModal.location || '—'],
                                ['Recurrence', detailModal.recurrence || 'none'],
                            ].map(([k, v]) => (
                                <div key={k}>
                                    <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{k}</div>
                                    <div style={{ fontSize: 14, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{v}</div>
                                </div>
                            ))}
                        </div>
                        <div>
                            <span style={{ fontSize: 11.5, padding: '4px 12px', borderRadius: 20, fontWeight: 600, background: detailModal.is_published ? '#dcfce7' : '#fef3c7', color: detailModal.is_published ? '#15803d' : '#d97706' }}>
                                {detailModal.is_published ? '✓ Published' : '✎ Draft'}
                            </span>
                        </div>
                        {canManage && (
                            <div style={{ display: 'flex', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border-light)' }}>
                                <button className="btn-primary" onClick={() => { setDetailModal(null); openEdit(detailModal); }}><Pencil size={14} /> Edit Event</button>
                                <button onClick={() => { togglePublish(detailModal); setDetailModal(null); }} className="btn-secondary">
                                    {detailModal.is_published ? <><EyeOff size={14} /> Unpublish</> : <><Eye size={14} /> Publish</>}
                                </button>
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            {/* Add / Edit modal */}
            {modal && (
                <Modal title={modal.mode === 'add' ? 'Create Event' : 'Edit Event'} onClose={() => setModal(null)} wide>
                    {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13.5 }}>{error}</div>}
                    <Field label="Event Title" required><input className="form-input" value={form.title || ''} onChange={f('title')} placeholder="e.g. Sunday Service" /></Field>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                        <Field label="Start Date & Time" required><input className="form-input" type="datetime-local" value={form.start_datetime || ''} onChange={f('start_datetime')} /></Field>
                        <Field label="End Date & Time" required><input className="form-input" type="datetime-local" value={form.end_datetime || ''} onChange={f('end_datetime')} /></Field>
                    </div>
                    <Field label="Location"><input className="form-input" value={form.location || ''} onChange={f('location')} placeholder="Church Main Hall" /></Field>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                        <Field label="Recurrence">
                            <select className="form-input" value={form.recurrence || 'none'} onChange={f('recurrence')}>
                                <option value="none">None (one-time)</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </Field>
                        <Field label="Visibility">
                            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginTop: 10 }}>
                                <input type="checkbox" checked={!!form.is_published} onChange={e => setForm(p => ({ ...p, is_published: e.target.checked }))} style={{ width: 16, height: 16 }} />
                                <span style={{ fontSize: 14 }}>Publish immediately</span>
                            </label>
                        </Field>
                    </div>
                    <Field label="Description">
                        <textarea className="form-input" rows={3} value={form.description || ''} onChange={f('description')} placeholder="Optional event details…" style={{ resize: 'vertical' }} />
                    </Field>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button className="btn-secondary" onClick={() => setModal(null)} disabled={saving}>Cancel</button>
                        <button className="btn-primary" onClick={save} disabled={saving}>
                            {saving ? 'Saving…' : <><Check size={15} /> {modal.mode === 'add' ? 'Create Event' : 'Save Changes'}</>}
                        </button>
                    </div>
                </Modal>
            )}

            {confirm && (
                <Confirm
                    message={`Delete event "${confirm.name}"? This cannot be undone.`}
                    onConfirm={() => del(confirm.id)}
                    onCancel={() => setConfirm(null)}
                />
            )}
        </div>
    );
};

export default Events;
