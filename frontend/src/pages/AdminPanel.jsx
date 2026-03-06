import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
    LayoutDashboard, UserPlus, FileText, CheckCircle,
    Users, Banknote, Calendar, ClipboardList, Shield,
    Activity, ArrowRight, UserCheck, Inbox,
    Search, Plus, Filter, MoreVertical, Trash2, Edit3, X, Eye, EyeOff, Check, AlertTriangle, RefreshCw, Pencil
} from 'lucide-react';

/* ── helpers ─────────────────────────────────────────── */
const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '—';
const fmtAmt = (a) => `GH₵${parseFloat(a || 0).toFixed(2)} `;

/* ── tiny reusable components ───────────────────────── */
const Badge = ({ label, color }) => {
    const map = {
        green: { bg: '#dcfce7', color: '#15803d' },
        red: { bg: '#fee2e2', color: '#dc2626' },
        orange: { bg: '#fff7ed', color: '#c2560a' },
        blue: { bg: '#dbeafe', color: '#1d4ed8' },
        gray: { bg: '#f3f4f6', color: '#6b7280' },
        teal: { bg: '#ccfbf1', color: '#0f766e' },
        purple: { bg: '#f5f3ff', color: '#7c3aed' },
    };
    const s = map[color] || map.gray;
    return (
        <span style={{
            fontSize: 11.5, padding: '3px 10px', borderRadius: 20,
            fontWeight: 600, background: s.bg, color: s.color,
            textTransform: 'capitalize', display: 'inline-block',
        }}>{label}</span>
    );
};

const Spinner = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60 }}>
        <div style={{
            width: 32, height: 32, borderRadius: '50%',
            border: '3px solid var(--border)', borderTopColor: 'var(--primary)',
            animation: 'spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } } `}</style>
    </div>
);

const Empty = ({ icon, text }) => (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
        <div style={{ marginBottom: 12 }}>{icon}</div>
        <p style={{ margin: 0 }}>{text}</p>
    </div>
);

/* ── Modal wrapper ───────────────────────────────────── */
const Modal = ({ title, onClose, children, wide }) => (
    <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, padding: 20,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div style={{
            background: '#fff', borderRadius: 14, width: '100%',
            maxWidth: wide ? 720 : 480, maxHeight: '90vh',
            overflowY: 'auto', boxShadow: 'var(--shadow-lg)',
        }}>
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '20px 24px', borderBottom: '1px solid var(--border)',
                position: 'sticky', top: 0, background: '#fff', zIndex: 1,
            }}>
                <h3 style={{ margin: 0, fontSize: 16 }}>{title}</h3>
                <button onClick={onClose} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', padding: 4, borderRadius: 6,
                }}>
                    <X size={20} />
                </button>
            </div>
            <div style={{ padding: '20px 24px' }}>{children}</div>
        </div>
    </div>
);

/* ── Field helper ────────────────────────────────────── */
const Field = ({ label, children, required }) => (
    <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
            {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
        </label>
        {children}
    </div>
);

/* ── Confirm dialog ──────────────────────────────────── */
const ConfirmModal = ({ message, onConfirm, onCancel }) => (
    <Modal title="Confirm Action" onClose={onCancel}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 24 }}>
            <AlertTriangle size={24} color="#f97316" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{message}</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button className="btn-secondary" onClick={onCancel}>Cancel</button>
            <button
                onClick={onConfirm}
                style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13.5 }}
            >
                Delete
            </button>
        </div>
    </Modal>
);

/* ══════════════════════════════════════════════════════
   TAB: MEMBERS
══════════════════════════════════════════════════════ */
const MembersTab = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(null); // null | { mode: 'add'|'edit', data }
    const [confirm, setConfirm] = useState(null);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const params = search ? `?search=${encodeURIComponent(search)}` : '';
            const res = await api.get(`members/${params}`);
            setMembers(res.data.results || []);
        } catch { } finally { setLoading(false); }
    }, [search]);

    useEffect(() => { fetch(); }, [fetch]);

    const openAdd = () => {
        setForm({ status: 'active', role: 'member', gender: 'M' });
        setModal({ mode: 'add' });
    };
    const openEdit = (m) => {
        setForm({ ...m });
        setModal({ mode: 'edit', data: m });
    };
    const handleSave = async () => {
        setSaving(true);
        try {
            if (modal.mode === 'add') await api.post('members/', form);
            else await api.patch(`members/${form.id}/`, form);
            setModal(null);
            fetch();
        } catch (e) { alert(e.response?.data ? JSON.stringify(e.response.data) : 'Error saving'); }
        finally { setSaving(false); }
    };
    const handleDelete = async (id) => {
        try { await api.delete(`members/${id}/`); fetch(); }
        catch { alert('Error deleting member'); }
        finally { setConfirm(null); }
    };

    const f = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));
    const roleColor = { admin: 'orange', priest: 'teal', member: 'blue' };
    const statusColor = { active: 'green', inactive: 'gray', deceased: 'red', moved: 'purple' };

    return (
        <div>
            {/* Toolbar */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="input-wrapper" style={{ flex: 1, minWidth: 220 }}>
                    <Search size={15} className="input-icon" />
                    <input className="form-input" placeholder="Search members…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <button className="btn-primary" onClick={openAdd}><Plus size={15} /> Add Member</button>
                <button className="btn-secondary" onClick={fetch}><RefreshCw size={15} /></button>
            </div>

            {/* Table */}
            <div className="card" style={{ overflow: 'hidden' }}>
                <div className="table-container">
                    <table>
                        <thead><tr>
                            <th>Name</th><th>Email</th><th>Phone</th>
                            <th>Role</th><th>Status</th><th>Joined</th><th>Actions</th>
                        </tr></thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7}><Spinner /></td></tr>
                            ) : members.length === 0 ? (
                                <tr><td colSpan={7}><Empty icon={<Users size={36} />} text="No members found" /></td></tr>
                            ) : members.map(m => (
                                <tr key={m.id}>
                                    <td style={{ fontWeight: 600 }}>{m.first_name} {m.last_name}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{m.email || '—'}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{m.phone || '—'}</td>
                                    <td><Badge label={m.role} color={roleColor[m.role] || 'gray'} /></td>
                                    <td><Badge label={m.status} color={statusColor[m.status] || 'gray'} /></td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{formatDate(m.membership_date)}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button onClick={() => openEdit(m)} style={iconBtn('#3b82f6')}><Pencil size={14} /></button>
                                            <button onClick={() => setConfirm({ id: m.id, name: `${m.first_name} ${m.last_name}` })} style={iconBtn('#ef4444')}><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {modal && (
                <Modal title={modal.mode === 'add' ? 'Add Member' : 'Edit Member'} onClose={() => setModal(null)} wide>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                        <Field label="First Name" required><input className="form-input" value={form.first_name || ''} onChange={f('first_name')} /></Field>
                        <Field label="Last Name" required><input className="form-input" value={form.last_name || ''} onChange={f('last_name')} /></Field>
                        <Field label="Email"><input className="form-input" type="email" value={form.email || ''} onChange={f('email')} /></Field>
                        <Field label="Phone"><input className="form-input" value={form.phone || ''} onChange={f('phone')} /></Field>
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
                        <Field label="Role">
                            <select className="form-input" value={form.role || 'member'} onChange={f('role')}>
                                <option value="member">Member</option>
                                <option value="priest">Parish Priest</option>
                                <option value="admin">Admin</option>
                            </select>
                        </Field>
                        <Field label="City"><input className="form-input" value={form.city || ''} onChange={f('city')} /></Field>
                        <Field label="State"><input className="form-input" value={form.state || ''} onChange={f('state')} /></Field>
                        <Field label="Zip Code"><input className="form-input" value={form.zip_code || ''} onChange={f('zip_code')} /></Field>
                    </div>
                    <Field label="Address">
                        <textarea className="form-input" rows={2} value={form.address || ''} onChange={f('address')} style={{ resize: 'vertical' }} />
                    </Field>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                        <button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                        <button className="btn-primary" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving…' : <><Check size={15} /> Save Member</>}
                        </button>
                    </div>
                </Modal>
            )}

            {confirm && (
                <ConfirmModal
                    message={`Are you sure you want to delete ${confirm.name}? This cannot be undone.`}
                    onConfirm={() => handleDelete(confirm.id)}
                    onCancel={() => setConfirm(null)}
                />
            )}
        </div>
    );
};

/* ══════════════════════════════════════════════════════
   TAB: FINANCIALS
══════════════════════════════════════════════════════ */
const FinancialsTab = () => {
    const [tab, setTab] = useState('donations'); // 'donations' | 'funds'
    const [donations, setDonations] = useState([]);
    const [funds, setFunds] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null);
    const [confirm, setConfirm] = useState(null);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [dRes, fRes, mRes] = await Promise.allSettled([
                api.get('donations/?page_size=100'),
                api.get('funds/?page_size=100'),
                api.get('members/?page_size=200'),
            ]);
            if (dRes.status === 'fulfilled') setDonations(dRes.value.data.results || []);
            if (fRes.status === 'fulfilled') setFunds(fRes.value.data.results || []);
            if (mRes.status === 'fulfilled') setMembers(mRes.value.data.results || []);
        } catch { } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const f = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

    /* Donations */
    const openAddDonation = () => {
        setForm({ date: new Date().toISOString().slice(0, 10), payment_method: 'cash' });
        setModal({ mode: 'add', type: 'donation' });
    };
    const saveDonation = async () => {
        setSaving(true);
        try {
            if (modal.mode === 'add') await api.post('donations/', form);
            else await api.patch(`donations/${form.id}/`, form);
            setModal(null); fetchAll();
        } catch (e) { alert(e.response?.data ? JSON.stringify(e.response.data) : 'Error'); }
        finally { setSaving(false); }
    };
    const deleteDonation = async (id) => {
        try { await api.delete(`donations/${id}/`); fetchAll(); }
        catch { alert('Error'); } finally { setConfirm(null); }
    };

    /* Funds */
    const openAddFund = () => { setForm({ is_active: true }); setModal({ mode: 'add', type: 'fund' }); };
    const openEditFund = (fd) => { setForm({ ...fd }); setModal({ mode: 'edit', type: 'fund' }); };
    const saveFund = async () => {
        setSaving(true);
        try {
            if (modal.mode === 'add') await api.post('funds/', form);
            else await api.patch(`funds/${form.id}/`, form);
            setModal(null); fetchAll();
        } catch (e) { alert(e.response?.data ? JSON.stringify(e.response.data) : 'Error'); }
        finally { setSaving(false); }
    };
    const toggleFund = async (fd) => {
        try { await api.patch(`funds/${fd.id}/`, { is_active: !fd.is_active }); fetchAll(); }
        catch { alert('Error'); }
    };
    const deleteFund = async (id) => {
        try { await api.delete(`funds/${id}/`); fetchAll(); }
        catch { alert('Error'); } finally { setConfirm(null); }
    };

    const pmColor = { cash: 'green', check: 'blue', momo: 'purple', bank: 'orange' };

    return (
        <div>
            {/* Sub-tabs */}
            <div style={{ display: 'flex', gap: 4, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: 3, marginBottom: 20, width: 'fit-content' }}>
                {[{ id: 'donations', label: 'Donations' }, { id: 'funds', label: 'Funds' }].map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} style={{
                        padding: '7px 20px', borderRadius: 6, border: 'none', fontWeight: 600, fontSize: 13.5, cursor: 'pointer',
                        background: tab === t.id ? 'var(--primary)' : 'transparent',
                        color: tab === t.id ? '#fff' : 'var(--text-secondary)', transition: 'all 0.15s',
                    }}>{t.label}</button>
                ))}
            </div>

            {loading ? <Spinner /> : tab === 'donations' ? (
                <>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16, gap: 10 }}>
                        <button className="btn-secondary" onClick={fetchAll}><RefreshCw size={15} /></button>
                        <button className="btn-primary" onClick={openAddDonation}><Plus size={15} /> Record Donation</button>
                    </div>
                    <div className="card" style={{ overflow: 'hidden' }}>
                        <div className="table-container">
                            <table>
                                <thead><tr><th>Donor</th><th>Fund</th><th>Date</th><th>Method</th><th>Ref</th><th style={{ textAlign: 'right' }}>Amount</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {donations.length === 0 ? (
                                        <tr><td colSpan={7}><Empty icon={<Banknote size={36} />} text="No donations yet" /></td></tr>
                                    ) : donations.map(d => (
                                        <tr key={d.id}>
                                            <td style={{ fontWeight: 600 }}>{d.donor_name || 'Anonymous'}</td>
                                            <td>{d.fund_name || '—'}</td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{d.date}</td>
                                            <td><Badge label={d.payment_method} color={pmColor[d.payment_method] || 'gray'} /></td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{d.transaction_ref || '—'}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>{fmtAmt(d.amount)}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button onClick={() => { setForm({ ...d }); setModal({ mode: 'edit', type: 'donation' }); }} style={iconBtn('#3b82f6')}><Pencil size={14} /></button>
                                                    <button onClick={() => setConfirm({ id: d.id, name: `donation #${d.id}`, type: 'donation' })} style={iconBtn('#ef4444')}><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16, gap: 10 }}>
                        <button className="btn-secondary" onClick={fetchAll}><RefreshCw size={15} /></button>
                        <button className="btn-primary" onClick={openAddFund}><Plus size={15} /> Add Fund</button>
                    </div>
                    <div className="card" style={{ overflow: 'hidden' }}>
                        <div className="table-container">
                            <table>
                                <thead><tr><th>Fund Name</th><th>Description</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {funds.length === 0 ? (
                                        <tr><td colSpan={5}><Empty icon={<Banknote size={36} />} text="No funds yet" /></td></tr>
                                    ) : funds.map(fd => (
                                        <tr key={fd.id}>
                                            <td style={{ fontWeight: 600 }}>{fd.name}</td>
                                            <td style={{ color: 'var(--text-secondary)', maxWidth: 220 }}>{fd.description || '—'}</td>
                                            <td><Badge label={fd.is_active ? 'Active' : 'Inactive'} color={fd.is_active ? 'green' : 'gray'} /></td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{formatDate(fd.created_at)}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button onClick={() => toggleFund(fd)} title={fd.is_active ? 'Deactivate' : 'Activate'} style={iconBtn(fd.is_active ? '#6b7280' : '#10b981')}>{fd.is_active ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                                                    <button onClick={() => openEditFund(fd)} style={iconBtn('#3b82f6')}><Pencil size={14} /></button>
                                                    <button onClick={() => setConfirm({ id: fd.id, name: fd.name, type: 'fund' })} style={iconBtn('#ef4444')}><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Donation Modal */}
            {modal?.type === 'donation' && (
                <Modal title={modal.mode === 'add' ? 'Record Donation' : 'Edit Donation'} onClose={() => setModal(null)}>
                    <Field label="Member">
                        <select className="form-input" value={form.member || ''} onChange={f('member')}>
                            <option value="">Guest / Non-Member</option>
                            {members.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
                        </select>
                    </Field>
                    {!form.member && (
                        <Field label="Guest Name (Optional)"><input className="form-input" value={form.guest_name || ''} onChange={f('guest_name')} placeholder="Name of non-member donor" /></Field>
                    )}
                    <Field label="Fund" required>
                        <select className="form-input" value={form.fund || ''} onChange={f('fund')}>
                            <option value="">Select fund…</option>
                            {funds.filter(fd => fd.is_active).map(fd => <option key={fd.id} value={fd.id}>{fd.name}</option>)}
                        </select>
                    </Field>
                    <Field label="Amount (GH₵)" required><input className="form-input" type="number" step="0.01" value={form.amount || ''} onChange={f('amount')} /></Field>
                    <Field label="Date" required><input className="form-input" type="date" value={form.date || ''} onChange={f('date')} /></Field>
                    <Field label="Payment Method" required>
                        <select className="form-input" value={form.payment_method || 'cash'} onChange={f('payment_method')}>
                            <option value="cash">Cash</option>
                            <option value="check">Check</option>
                            <option value="momo">Mobile Money</option>
                            <option value="bank">Bank Transfer</option>
                        </select>
                    </Field>
                    <Field label="Transaction Ref"><input className="form-input" value={form.transaction_ref || ''} onChange={f('transaction_ref')} /></Field>
                    <Field label="Notes"><textarea className="form-input" rows={2} value={form.notes || ''} onChange={f('notes')} style={{ resize: 'vertical' }} /></Field>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                        <button className="btn-primary" onClick={saveDonation} disabled={saving}>{saving ? 'Saving…' : <><Check size={15} /> Save</>}</button>
                    </div>
                </Modal>
            )}

            {/* Fund Modal */}
            {modal?.type === 'fund' && (
                <Modal title={modal.mode === 'add' ? 'Add Fund' : 'Edit Fund'} onClose={() => setModal(null)}>
                    <Field label="Fund Name" required><input className="form-input" value={form.name || ''} onChange={f('name')} /></Field>
                    <Field label="Description"><textarea className="form-input" rows={3} value={form.description || ''} onChange={f('description')} style={{ resize: 'vertical' }} /></Field>
                    <Field label="Status">
                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                            <input type="checkbox" checked={!!form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} style={{ width: 16, height: 16 }} />
                            <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>Active</span>
                        </label>
                    </Field>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                        <button className="btn-primary" onClick={saveFund} disabled={saving}>{saving ? 'Saving…' : <><Check size={15} /> Save</>}</button>
                    </div>
                </Modal>
            )}

            {confirm && (
                <ConfirmModal
                    message={`Delete ${confirm.name}? This cannot be undone.`}
                    onConfirm={() => confirm.type === 'donation' ? deleteDonation(confirm.id) : deleteFund(confirm.id)}
                    onCancel={() => setConfirm(null)}
                />
            )}
        </div>
    );
};

/* ══════════════════════════════════════════════════════
   TAB: EVENTS
══════════════════════════════════════════════════════ */
const EventsTab = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null);
    const [confirm, setConfirm] = useState(null);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);

    const fetch = useCallback(async () => {
        setLoading(true);
        try { const res = await api.get('events/?page_size=100'); setEvents(res.data.results || []); }
        catch { } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetch(); }, [fetch]);

    const f = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

    const openAdd = () => {
        const now = new Date().toISOString().slice(0, 16);
        setForm({ start_datetime: now, end_datetime: now, recurrence: 'none', is_published: false });
        setModal({ mode: 'add' });
    };
    const openEdit = (ev) => {
        setForm({
            ...ev,
            start_datetime: ev.start_datetime?.slice(0, 16),
            end_datetime: ev.end_datetime?.slice(0, 16),
        });
        setModal({ mode: 'edit' });
    };
    const save = async () => {
        setSaving(true);
        try {
            if (modal.mode === 'add') await api.post('events/', form);
            else await api.patch(`events/${form.id}/`, form);
            setModal(null); fetch();
        } catch (e) { alert(e.response?.data ? JSON.stringify(e.response.data) : 'Error'); }
        finally { setSaving(false); }
    };
    const togglePublish = async (ev) => {
        try { await api.patch(`events/${ev.id}/`, { is_published: !ev.is_published }); fetch(); }
        catch { alert('Error'); }
    };
    const del = async (id) => {
        try { await api.delete(`events/${id}/`); fetch(); }
        catch { alert('Error'); } finally { setConfirm(null); }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20, gap: 10 }}>
                <button className="btn-secondary" onClick={fetch}><RefreshCw size={15} /></button>
                <button className="btn-primary" onClick={openAdd}><Plus size={15} /> Create Event</button>
            </div>

            {loading ? <Spinner /> : (
                <div className="card" style={{ overflow: 'hidden' }}>
                    <div className="table-container">
                        <table>
                            <thead><tr><th>Title</th><th>Start</th><th>End</th><th>Location</th><th>Recurrence</th><th>Status</th><th>Actions</th></tr></thead>
                            <tbody>
                                {events.length === 0 ? (
                                    <tr><td colSpan={7}><Empty icon={<Calendar size={36} />} text="No events yet" /></td></tr>
                                ) : events.map(ev => (
                                    <tr key={ev.id}>
                                        <td style={{ fontWeight: 600 }}>{ev.title}</td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{new Date(ev.start_datetime).toLocaleString()}</td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{new Date(ev.end_datetime).toLocaleString()}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{ev.location || '—'}</td>
                                        <td><Badge label={ev.recurrence} color={ev.recurrence === 'none' ? 'gray' : 'blue'} /></td>
                                        <td><Badge label={ev.is_published ? 'Published' : 'Draft'} color={ev.is_published ? 'green' : 'orange'} /></td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button onClick={() => togglePublish(ev)} title={ev.is_published ? 'Unpublish' : 'Publish'} style={iconBtn(ev.is_published ? '#6b7280' : '#10b981')}>
                                                    {ev.is_published ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                                <button onClick={() => openEdit(ev)} style={iconBtn('#3b82f6')}><Pencil size={14} /></button>
                                                <button onClick={() => setConfirm({ id: ev.id, name: ev.title })} style={iconBtn('#ef4444')}><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {modal && (
                <Modal title={modal.mode === 'add' ? 'Create Event' : 'Edit Event'} onClose={() => setModal(null)} wide>
                    <Field label="Title" required><input className="form-input" value={form.title || ''} onChange={f('title')} /></Field>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                        <Field label="Start Date & Time" required><input className="form-input" type="datetime-local" value={form.start_datetime || ''} onChange={f('start_datetime')} /></Field>
                        <Field label="End Date & Time" required><input className="form-input" type="datetime-local" value={form.end_datetime || ''} onChange={f('end_datetime')} /></Field>
                    </div>
                    <Field label="Location"><input className="form-input" value={form.location || ''} onChange={f('location')} /></Field>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                        <Field label="Recurrence">
                            <select className="form-input" value={form.recurrence || 'none'} onChange={f('recurrence')}>
                                <option value="none">None</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </Field>
                        <Field label="Published">
                            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginTop: 10 }}>
                                <input type="checkbox" checked={!!form.is_published} onChange={e => setForm(p => ({ ...p, is_published: e.target.checked }))} style={{ width: 16, height: 16 }} />
                                <span style={{ fontSize: 14 }}>Publish immediately</span>
                            </label>
                        </Field>
                    </div>
                    <Field label="Description">
                        <textarea className="form-input" rows={3} value={form.description || ''} onChange={f('description')} style={{ resize: 'vertical' }} />
                    </Field>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                        <button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : <><Check size={15} /> Save Event</>}</button>
                    </div>
                </Modal>
            )}

            {confirm && (
                <ConfirmModal
                    message={`Delete event "${confirm.name}"? This cannot be undone.`}
                    onConfirm={() => del(confirm.id)}
                    onCancel={() => setConfirm(null)}
                />
            )}
        </div>
    );
};

/* ══════════════════════════════════════════════════════
   TAB: ATTENDANCE
══════════════════════════════════════════════════════ */
const AttendanceTab = () => {
    const [services, setServices] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null);
    const [checkinModal, setCheckinModal] = useState(null);
    const [confirm, setConfirm] = useState(null);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [checkinMember, setCheckinMember] = useState('');
    const [records, setRecords] = useState([]);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const [sRes, mRes] = await Promise.allSettled([
                api.get('services/?page_size=100&ordering=-date'),
                api.get('members/?page_size=200&status=active'),
            ]);
            if (sRes.status === 'fulfilled') setServices(sRes.value.data.results || []);
            if (mRes.status === 'fulfilled') setMembers(mRes.value.data.results || []);
        } catch { } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetch(); }, [fetch]);

    const f = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

    const openAdd = () => {
        setForm({ date: new Date().toISOString().slice(0, 10), start_time: '09:00', service_type: 'sunday_service' });
        setModal({ mode: 'add' });
    };
    const save = async () => {
        setSaving(true);
        try {
            if (modal.mode === 'add') await api.post('services/', form);
            else await api.patch(`services/${form.id}/`, form);
            setModal(null); fetch();
        } catch (e) { alert(e.response?.data ? JSON.stringify(e.response.data) : 'Error'); }
        finally { setSaving(false); }
    };
    const del = async (id) => {
        try { await api.delete(`services/${id}/`); fetch(); }
        catch { alert('Error'); } finally { setConfirm(null); }
    };
    const openCheckin = async (svc) => {
        setCheckinModal(svc);
        setCheckinMember('');
        try {
            const res = await api.get(`attendance/?service=${svc.id}&page_size=100`);
            setRecords(res.data.results || []);
        } catch { setRecords([]); }
    };
    const doCheckin = async () => {
        if (!checkinMember) return;
        try {
            await api.post(`services/${checkinModal.id}/check-in/`, { member_id: checkinMember, check_in_method: 'manual' });
            const res = await api.get(`attendance/?service=${checkinModal.id}&page_size=100`);
            setRecords(res.data.results || []);
            setCheckinMember('');
        } catch (e) { alert(e.response?.data?.message || 'Error'); }
    };

    const typeLabels = { sunday_service: 'Sunday Service', small_group: 'Small Group', special_event: 'Special Event', midweek_service: 'Midweek Service' };
    const typeColor = { sunday_service: 'orange', small_group: 'teal', special_event: 'blue', midweek_service: 'purple' };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20, gap: 10 }}>
                <button className="btn-secondary" onClick={fetch}><RefreshCw size={15} /></button>
                <button className="btn-primary" onClick={openAdd}><Plus size={15} /> Schedule Service</button>
            </div>

            {loading ? <Spinner /> : (
                <div className="card" style={{ overflow: 'hidden' }}>
                    <div className="table-container">
                        <table>
                            <thead><tr><th>Service Name</th><th>Type</th><th>Date</th><th>Time</th><th>Location</th><th>Attendance</th><th>Actions</th></tr></thead>
                            <tbody>
                                {services.length === 0 ? (
                                    <tr><td colSpan={7}><Empty icon={<ClipboardList size={36} />} text="No services scheduled" /></td></tr>
                                ) : services.map(s => (
                                    <tr key={s.id}>
                                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                                        <td><Badge label={typeLabels[s.service_type] || s.service_type} color={typeColor[s.service_type] || 'gray'} /></td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{s.date}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{s.start_time?.slice(0, 5)}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{s.location || '—'}</td>
                                        <td>
                                            <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 15 }}>{s.attendance_count ?? 0}</span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button onClick={() => openCheckin(s)} title="Check-in" style={iconBtn('#10b981')}><UserCheck size={14} /></button>
                                                <button onClick={() => { setForm({ ...s }); setModal({ mode: 'edit' }); }} style={iconBtn('#3b82f6')}><Pencil size={14} /></button>
                                                <button onClick={() => setConfirm({ id: s.id, name: s.name })} style={iconBtn('#ef4444')}><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Service modal */}
            {modal && (
                <Modal title={modal.mode === 'add' ? 'Schedule Service' : 'Edit Service'} onClose={() => setModal(null)} wide>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <Field label="Service Name" required><input className="form-input" value={form.name || ''} onChange={f('name')} /></Field>
                        </div>
                        <Field label="Type" required>
                            <select className="form-input" value={form.service_type || ''} onChange={f('service_type')}>
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
                            <Field label="Location"><input className="form-input" value={form.location || ''} onChange={f('location')} /></Field>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <Field label="Notes"><textarea className="form-input" rows={2} value={form.notes || ''} onChange={f('notes')} style={{ resize: 'vertical' }} /></Field>
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                        <button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : <><Check size={15} /> Save</>}</button>
                    </div>
                </Modal>
            )}

            {/* Check-in modal */}
            {checkinModal && (
                <Modal title={`Check-in: ${checkinModal.name}`} onClose={() => setCheckinModal(null)} wide>
                    <div style={{ marginBottom: 20 }}>
                        <Field label="Select Member to Check In">
                            <div style={{ display: 'flex', gap: 10 }}>
                                <select className="form-input" value={checkinMember} onChange={e => setCheckinMember(e.target.value)}>
                                    <option value="">Choose member…</option>
                                    {members.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
                                </select>
                                <button className="btn-primary" onClick={doCheckin} disabled={!checkinMember} style={{ flexShrink: 0 }}>
                                    <UserCheck size={15} /> Check In
                                </button>
                            </div>
                        </Field>
                    </div>
                    <h4 style={{ marginBottom: 12, color: 'var(--text-secondary)', fontSize: 13 }}>CHECKED IN ({records.length})</h4>
                    {records.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>No one checked in yet.</p>
                    ) : (
                        <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                            {records.map(r => (
                                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                                    <span style={{ fontWeight: 600, fontSize: 14 }}>{r.member_name || `Member #${r.member}`}</span>
                                    <Badge label={r.check_in_method} color="blue" />
                                </div>
                            ))}
                        </div>
                    )}
                </Modal>
            )}

            {confirm && (
                <ConfirmModal
                    message={`Delete service "${confirm.name}" and all its attendance records?`}
                    onConfirm={() => del(confirm.id)}
                    onCancel={() => setConfirm(null)}
                />
            )}
        </div>
    );
};

/* ══════════════════════════════════════════════════════
   TAB: USERS
══════════════════════════════════════════════════════ */
const UsersTab = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('members/?page_size=200');
            setMembers((res.data.results || []).filter(m => m.user));
        } catch { } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetch(); }, [fetch]);

    const changeRole = async (m, role) => {
        try { await api.patch(`members/${m.id}/`, { role }); fetch(); }
        catch { alert('Error updating role'); }
    };

    const roleColor = { admin: 'orange', priest: 'teal', member: 'blue' };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                <button className="btn-secondary" onClick={fetch}><RefreshCw size={15} /> Refresh</button>
            </div>
            {loading ? <Spinner /> : (
                <div className="card" style={{ overflow: 'hidden' }}>
                    <div className="table-container">
                        <table>
                            <thead><tr><th>Member</th><th>Email</th><th>Current Role</th><th>Status</th><th>Change Role</th></tr></thead>
                            <tbody>
                                {members.length === 0 ? (
                                    <tr><td colSpan={5}><Empty icon={<Shield size={36} />} text="No users with accounts found" /></td></tr>
                                ) : members.map(m => (
                                    <tr key={m.id}>
                                        <td style={{ fontWeight: 600 }}>{m.first_name} {m.last_name}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{m.email || '—'}</td>
                                        <td><Badge label={m.role} color={roleColor[m.role] || 'gray'} /></td>
                                        <td><Badge label={m.status} color={m.status === 'active' ? 'green' : 'gray'} /></td>
                                        <td>
                                            <select
                                                value={m.role}
                                                onChange={e => changeRole(m, e.target.value)}
                                                className="form-input"
                                                style={{ width: 'auto', minWidth: 130, padding: '6px 10px', fontSize: 13 }}
                                            >
                                                <option value="member">Member</option>
                                                <option value="priest">Parish Priest</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ══════════════════════════════════════════════════════
   ICON BUTTON STYLE HELPER
══════════════════════════════════════════════════════ */
function iconBtn(color) {
    return {
        background: 'none', border: `1px solid ${color}22`,
        color, cursor: 'pointer', borderRadius: 6, padding: '5px 7px',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
    };
}

/* ══════════════════════════════════════════════════════
   MAIN: AdminPanel
══════════════════════════════════════════════════════ */
const TABS = [
    { id: 'members', label: 'Members', icon: <Users size={16} /> },
    { id: 'financials', label: 'Financials', icon: <Banknote size={16} /> },
    { id: 'events', label: 'Events', icon: <Calendar size={16} /> },
    { id: 'attendance', label: 'Attendance', icon: <ClipboardList size={16} /> },
    { id: 'users', label: 'User Roles', icon: <Shield size={16} /> },
];

const AdminPanel = () => {
    const [activeTab, setActiveTab] = useState('members');

    return (
        <div>
            {/* Page header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Shield size={26} color="var(--primary)" /> Admin Panel
                    </h1>
                    <p className="page-subtitle">Full management access for all application features.</p>
                </div>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex', gap: 4, marginBottom: 28,
                background: '#fff', border: '1px solid var(--border)',
                borderRadius: 10, padding: 4, width: 'fit-content',
                boxShadow: 'var(--shadow-sm)',
            }}>
                {TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 7,
                            padding: '9px 18px', borderRadius: 7, border: 'none',
                            fontWeight: 600, fontSize: 13.5, cursor: 'pointer',
                            fontFamily: 'inherit',
                            background: activeTab === t.id
                                ? 'linear-gradient(135deg, var(--primary), #fb923c)'
                                : 'transparent',
                            color: activeTab === t.id ? '#fff' : 'var(--text-secondary)',
                            boxShadow: activeTab === t.id ? '0 2px 8px rgba(249,115,22,0.35)' : 'none',
                            transition: 'all 0.18s ease',
                        }}
                    >
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            {activeTab === 'members' && <MembersTab />}
            {activeTab === 'financials' && <FinancialsTab />}
            {activeTab === 'events' && <EventsTab />}
            {activeTab === 'attendance' && <AttendanceTab />}
            {activeTab === 'users' && <UsersTab />}
        </div>
    );
};

export default AdminPanel;
