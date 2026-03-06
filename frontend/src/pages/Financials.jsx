import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    Banknote, TrendingUp, History, Download, Plus,
    ArrowUpRight, Pencil, Trash2, X, Check, AlertTriangle,
    Eye, EyeOff,
} from 'lucide-react';

const PAYMENT_COLORS = {
    cash: { bg: '#f0fdf4', color: '#15803d' },
    check: { bg: '#eff6ff', color: '#1d4ed8' },
    momo: { bg: '#fdf4ff', color: '#9333ea' },
    bank: { bg: '#fff7ed', color: '#c2560a' },
};

/* ── helpers ──────────────────────────────── */
const Modal = ({ title, onClose, children }) => (
    <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, padding: 20,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
        <div style={{
            background: '#fff', borderRadius: 14, width: '100%',
            maxWidth: 500, maxHeight: '90vh', overflowY: 'auto',
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
const Financials = () => {
    const { user } = useAuth();
    const canManage = user?.role === 'admin' || user?.role === 'priest';

    const [donations, setDonations] = useState([]);
    const [funds, setFunds] = useState([]);
    const [members, setMembers] = useState([]);
    const [stats, setStats] = useState({ total: 0, count: 0 });
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('donations'); // 'donations' | 'funds'
    const [modal, setModal] = useState(null);
    const [confirm, setConfirm] = useState(null);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [dRes, fRes, mRes] = await Promise.allSettled([
                api.get('donations/?page_size=100'),
                api.get('funds/?page_size=100'),
                api.get('members/?page_size=200'),
            ]);
            if (dRes.status === 'fulfilled') {
                const data = dRes.value.data.results || [];
                setDonations(data);
                const total = data.reduce((s, d) => s + parseFloat(d.amount || 0), 0);
                setStats({ total, count: dRes.value.data.count || data.length });
            }
            if (fRes.status === 'fulfilled') setFunds(fRes.value.data.results || []);
            if (mRes.status === 'fulfilled') setMembers(mRes.value.data.results || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const f = key => e => setForm(p => ({ ...p, [key]: e.target.value }));

    /* ─ Donation CRUD ─ */
    const openAddDonation = () => {
        setForm({ date: new Date().toISOString().slice(0, 10), payment_method: 'cash' });
        setError(''); setModal({ mode: 'add', type: 'donation' });
    };
    const openEditDonation = d => {
        setForm({ ...d }); setError(''); setModal({ mode: 'edit', type: 'donation' });
    };
    const saveDonation = async () => {
        if (!form.fund || !form.amount || !form.date) { setError('Fund, amount and date are required.'); return; }
        setSaving(true); setError('');
        try {
            if (modal.mode === 'add') await api.post('donations/', form);
            else await api.patch(`donations/${form.id}/`, form);
            setModal(null); fetchData();
        } catch (e) {
            const msg = e.response?.data;
            setError(typeof msg === 'object' ? Object.values(msg).flat().join(' ') : 'Error saving.');
        } finally { setSaving(false); }
    };
    const deleteDonation = async id => {
        try { await api.delete(`donations/${id}/`); fetchData(); }
        catch { alert('Error deleting.'); } finally { setConfirm(null); }
    };

    /* ─ Fund CRUD ─ */
    const openAddFund = () => {
        setForm({ is_active: true }); setError(''); setModal({ mode: 'add', type: 'fund' });
    };
    const openEditFund = fd => {
        setForm({ ...fd }); setError(''); setModal({ mode: 'edit', type: 'fund' });
    };
    const saveFund = async () => {
        if (!form.name) { setError('Fund name is required.'); return; }
        setSaving(true); setError('');
        try {
            if (modal.mode === 'add') await api.post('funds/', form);
            else await api.patch(`funds/${form.id}/`, form);
            setModal(null); fetchData();
        } catch (e) {
            const msg = e.response?.data;
            setError(typeof msg === 'object' ? Object.values(msg).flat().join(' ') : 'Error saving.');
        } finally { setSaving(false); }
    };
    const toggleFund = async fd => {
        try { await api.patch(`funds/${fd.id}/`, { is_active: !fd.is_active }); fetchData(); }
        catch { alert('Error updating fund.'); }
    };
    const deleteFund = async id => {
        try { await api.delete(`funds/${id}/`); fetchData(); }
        catch { alert('Error deleting fund.'); } finally { setConfirm(null); }
    };

    /* ─ CSV export ─ */
    const exportCSV = () => {
        const header = 'Donor,Fund,Date,Method,Amount';
        const rows = donations.map(d =>
            `"${d.donor_name || 'Anonymous'}","${d.fund_name || ''}","${d.date}","${d.payment_method}","${parseFloat(d.amount).toFixed(2)}"`
        );
        const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = 'donations.csv'; a.click();
    };

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Financial Management</h1>
                    <p className="page-subtitle">Track donations and manage church funds</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn-secondary" onClick={exportCSV}><Download size={15} /> Export CSV</button>
                    {canManage && (
                        <button className="btn-primary" onClick={openAddDonation}><Plus size={15} /> Record Donation</button>
                    )}
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid-cols-3" style={{ marginBottom: 28 }}>
                <div className="stat-card stat-card-orange" style={{ padding: '22px 24px' }}>
                    <div className="stat-card-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><TrendingUp size={14} /> Total Contributions</div>
                    <div className="stat-card-value">GH₵{stats.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <span className="stat-card-badge"><ArrowUpRight size={11} /> All time</span>
                </div>
                <div className="stat-card stat-card-navy" style={{ padding: '22px 24px' }}>
                    <div className="stat-card-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><History size={14} /> Total Transactions</div>
                    <div className="stat-card-value">{stats.count}</div>
                    <span className="stat-card-badge">Consistent giving patterns</span>
                </div>
                <div className="stat-card stat-card-teal" style={{ padding: '22px 24px' }}>
                    <div className="stat-card-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Banknote size={14} /> Active Funds</div>
                    <div className="stat-card-value">{funds.filter(f => f.is_active).length || '—'}</div>
                    <span className="stat-card-badge">{funds.filter(f => f.is_active).map(f => f.name).join(', ') || 'No active funds'}</span>
                </div>
            </div>

            {/* Sub-tabs */}
            {canManage && (
                <div style={{ display: 'flex', gap: 4, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: 3, marginBottom: 20, width: 'fit-content' }}>
                    {[{ id: 'donations', label: 'Donations' }, { id: 'funds', label: 'Manage Funds' }].map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)} style={{
                            padding: '7px 20px', borderRadius: 6, border: 'none', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit',
                            background: tab === t.id ? 'var(--primary)' : 'transparent',
                            color: tab === t.id ? '#fff' : 'var(--text-secondary)', transition: 'all 0.15s',
                        }}>{t.label}</button>
                    ))}
                </div>
            )}

            {/* ─ Donations table ─ */}
            {tab === 'donations' && (
                <div className="card" style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0 }}>Donation Records</h3>
                        {canManage && <button className="btn-primary" style={{ padding: '7px 14px', fontSize: 12.5 }} onClick={openAddDonation}><Plus size={13} /> Add</button>}
                    </div>
                    <div className="table-container">
                        <table>
                            <thead><tr>
                                <th>Donor</th><th>Fund</th><th>Date</th><th>Method</th><th style={{ textAlign: 'right' }}>Amount</th>
                                {canManage && <th>Actions</th>}
                            </tr></thead>
                            <tbody>
                                {loading ? [1, 2, 3, 4].map(i => (
                                    <tr key={i}>{[1, 2, 3, 4, 5].map(j => <td key={j}><div className="skeleton" style={{ height: 14, width: j === 5 ? 60 : '80%' }} /></td>)}</tr>
                                )) : donations.length > 0 ? donations.map(d => {
                                    const pmStyle = PAYMENT_COLORS[d.payment_method] || { bg: '#f3f4f6', color: '#6b7280' };
                                    return (
                                        <tr key={d.id}>
                                            <td style={{ fontWeight: 600 }}>{d.donor_name || 'Anonymous'}</td>
                                            <td><span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: '#fff7ed', color: 'var(--primary)' }}>{d.fund_name}</span></td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{d.date}</td>
                                            <td><span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: pmStyle.bg, color: pmStyle.color, textTransform: 'capitalize' }}>{d.payment_method}</span></td>
                                            <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)', fontSize: 15 }}>GH₵{parseFloat(d.amount).toFixed(2)}</td>
                                            {canManage && (
                                                <td>
                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                        <button onClick={() => openEditDonation(d)} style={{ background: 'none', border: '1px solid #3b82f622', color: '#3b82f6', cursor: 'pointer', borderRadius: 6, padding: '5px 7px', display: 'flex' }}><Pencil size={14} /></button>
                                                        <button onClick={() => setConfirm({ id: d.id, name: `donation #${d.id}`, type: 'donation' })} style={{ background: 'none', border: '1px solid #ef444422', color: '#ef4444', cursor: 'pointer', borderRadius: 6, padding: '5px 7px', display: 'flex' }}><Trash2 size={14} /></button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                }) : (
                                    <tr><td colSpan={canManage ? 6 : 5} style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>No donation records found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ─ Funds tab ─ */}
            {tab === 'funds' && canManage && (
                <div className="card" style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0 }}>Manage Funds</h3>
                        <button className="btn-primary" style={{ padding: '7px 14px', fontSize: 12.5 }} onClick={openAddFund}><Plus size={13} /> New Fund</button>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead><tr><th>Fund Name</th><th>Description</th><th>Status</th><th>Actions</th></tr></thead>
                            <tbody>
                                {funds.length === 0 ? (
                                    <tr><td colSpan={4} style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>No funds created yet.</td></tr>
                                ) : funds.map(fd => (
                                    <tr key={fd.id}>
                                        <td style={{ fontWeight: 600 }}>{fd.name}</td>
                                        <td style={{ color: 'var(--text-secondary)', maxWidth: 260 }}>{fd.description || '—'}</td>
                                        <td>
                                            <span style={{ fontSize: 11.5, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: fd.is_active ? '#dcfce7' : '#f3f4f6', color: fd.is_active ? '#15803d' : '#6b7280' }}>
                                                {fd.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button onClick={() => toggleFund(fd)} title={fd.is_active ? 'Deactivate' : 'Activate'} style={{ background: 'none', border: `1px solid ${fd.is_active ? '#6b728022' : '#10b98122'}`, color: fd.is_active ? '#6b7280' : '#10b981', cursor: 'pointer', borderRadius: 6, padding: '5px 7px', display: 'flex' }}>
                                                    {fd.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                                <button onClick={() => openEditFund(fd)} style={{ background: 'none', border: '1px solid #3b82f622', color: '#3b82f6', cursor: 'pointer', borderRadius: 6, padding: '5px 7px', display: 'flex' }}><Pencil size={14} /></button>
                                                <button onClick={() => setConfirm({ id: fd.id, name: fd.name, type: 'fund' })} style={{ background: 'none', border: '1px solid #ef444422', color: '#ef4444', cursor: 'pointer', borderRadius: 6, padding: '5px 7px', display: 'flex' }}><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Donation modal */}
            {modal?.type === 'donation' && (
                <Modal title={modal.mode === 'add' ? 'Record Donation' : 'Edit Donation'} onClose={() => setModal(null)}>
                    {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13.5 }}>{error}</div>}
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
                    <Field label="Amount (GH₵)" required><input className="form-input" type="number" step="0.01" min="0" value={form.amount || ''} onChange={f('amount')} placeholder="0.00" /></Field>
                    <Field label="Date" required><input className="form-input" type="date" value={form.date || ''} onChange={f('date')} /></Field>
                    <Field label="Payment Method" required>
                        <select className="form-input" value={form.payment_method || 'cash'} onChange={f('payment_method')}>
                            <option value="cash">Cash</option>
                            <option value="check">Check</option>
                            <option value="momo">Mobile Money</option>
                            <option value="bank">Bank Transfer</option>
                        </select>
                    </Field>
                    <Field label="Transaction Reference"><input className="form-input" value={form.transaction_ref || ''} onChange={f('transaction_ref')} placeholder="Optional ref number" /></Field>
                    <Field label="Notes"><textarea className="form-input" rows={2} value={form.notes || ''} onChange={f('notes')} style={{ resize: 'vertical' }} /></Field>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button className="btn-secondary" onClick={() => setModal(null)} disabled={saving}>Cancel</button>
                        <button className="btn-primary" onClick={saveDonation} disabled={saving}>{saving ? 'Saving…' : <><Check size={15} /> Save</>}</button>
                    </div>
                </Modal>
            )}

            {/* Fund modal */}
            {modal?.type === 'fund' && (
                <Modal title={modal.mode === 'add' ? 'New Fund' : 'Edit Fund'} onClose={() => setModal(null)}>
                    {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13.5 }}>{error}</div>}
                    <Field label="Fund Name" required><input className="form-input" value={form.name || ''} onChange={f('name')} placeholder="e.g. Building Fund" /></Field>
                    <Field label="Description"><textarea className="form-input" rows={3} value={form.description || ''} onChange={f('description')} style={{ resize: 'vertical' }} /></Field>
                    <Field label="Active">
                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                            <input type="checkbox" checked={!!form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} style={{ width: 16, height: 16 }} />
                            <span style={{ fontSize: 14 }}>This fund is currently active</span>
                        </label>
                    </Field>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button className="btn-secondary" onClick={() => setModal(null)} disabled={saving}>Cancel</button>
                        <button className="btn-primary" onClick={saveFund} disabled={saving}>{saving ? 'Saving…' : <><Check size={15} /> Save Fund</>}</button>
                    </div>
                </Modal>
            )}

            {/* Confirm delete */}
            {confirm && (
                <Confirm
                    message={`Delete ${confirm.name}? This cannot be undone.`}
                    onConfirm={() => confirm.type === 'donation' ? deleteDonation(confirm.id) : deleteFund(confirm.id)}
                    onCancel={() => setConfirm(null)}
                />
            )}
        </div>
    );
};

export default Financials;
