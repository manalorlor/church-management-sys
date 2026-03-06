import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, Calendar, Banknote,
    ClipboardList, LogOut, Cross, Shield, UserCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
    { title: 'Dashboard', path: '/', icon: <LayoutDashboard size={18} />, roles: ['admin', 'priest', 'member'] },
    { title: 'Members', path: '/members', icon: <Users size={18} />, roles: ['admin', 'priest'] },
    { title: 'Attendance', path: '/attendance', icon: <ClipboardList size={18} />, roles: ['admin', 'priest'] },
    { title: 'Financials', path: '/financials', icon: <Banknote size={18} />, roles: ['admin', 'priest'] },
    { title: 'Events', path: '/events', icon: <Calendar size={18} />, roles: ['admin', 'priest', 'member'] },
    { title: 'Admin Panel', path: '/admin', icon: <Shield size={18} />, roles: ['admin'] },
];

const Layout = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Safely fallback to 'member' if no role exists
    const userRole = user?.role || 'member';
    const visibleNavItems = NAV_ITEMS.filter(item => item.roles.includes(userRole));

    const displayName = user?.first_name || user?.username || 'User';
    const initials = displayName.slice(0, 2).toUpperCase();

    return (
        <div className="layout-wrapper">
            {/* ── Sidebar ── */}
            <aside className="sidebar">
                {/* Brand */}
                <div className="sidebar-brand">
                    <div style={{
                        width: 52, height: 52, borderRadius: '50%',
                        background: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        border: '1px solid var(--border)',
                        overflow: 'hidden',
                        padding: 0,
                    }}>
                        <img src="/church-logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.2, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                            ST. BAKHITA
                        </div>
                        <div style={{ fontSize: 9.5, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em', marginTop: 1, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                            CATHOLIC CHURCH
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <div style={{ flex: 1, padding: '8px 12px' }}>
                    <div className="sidebar-section-label">Main</div>

                    <nav>
                        {visibleNavItems.map(item => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/'}
                                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                            >
                                <span style={{ flexShrink: 0 }}>{item.icon}</span>
                                <span className="menu-text">{item.title}</span>
                            </NavLink>
                        ))}
                    </nav>

                    {/* Account section */}
                    <div className="sidebar-section-label" style={{ marginTop: 12 }}>Account</div>
                    <NavLink
                        to="/profile"
                        className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                    >
                        <span style={{ flexShrink: 0 }}><UserCircle size={18} /></span>
                        <span className="menu-text">My Profile</span>
                    </NavLink>
                </div>

                {/* Footer / Logout */}
                <div className="sidebar-footer">
                    {/* User avatar + name card */}
                    <NavLink
                        to="/profile"
                        style={{ textDecoration: 'none' }}
                    >
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 12px', borderRadius: 8, marginBottom: 6,
                            background: 'var(--bg)', cursor: 'pointer',
                            transition: 'background 0.15s',
                        }}
                            onMouseEnter={e => e.currentTarget.style.background = '#eef0f5'}
                            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg)'}
                        >
                            {/* Avatar */}
                            {user?.photo_url ? (
                                <img
                                    src={user.photo_url}
                                    alt={displayName}
                                    style={{
                                        width: 34, height: 34, borderRadius: '50%',
                                        objectFit: 'cover', flexShrink: 0,
                                        border: '2px solid var(--primary)',
                                    }}
                                />
                            ) : (
                                <div style={{
                                    width: 34, height: 34, borderRadius: '50%',
                                    background: userRole === 'admin'
                                        ? 'linear-gradient(135deg, #f97316, #fb923c)'
                                        : userRole === 'priest'
                                            ? 'linear-gradient(135deg, #0d9488, #06b6d4)'
                                            : 'linear-gradient(135deg, #3b82f6, #6366f1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0,
                                }}>
                                    {initials}
                                </div>
                            )}

                            <div className="menu-text" style={{ overflow: 'hidden' }}>
                                <div style={{
                                    fontWeight: 600, fontSize: 13, color: 'var(--text-primary)',
                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                }}>
                                    {displayName}
                                </div>
                                <div style={{
                                    fontSize: 11, color: 'var(--text-muted)',
                                    textTransform: 'capitalize', fontWeight: 500,
                                }}>
                                    {userRole}
                                </div>
                            </div>
                        </div>
                    </NavLink>

                    <button
                        onClick={handleLogout}
                        className="nav-link"
                        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                    >
                        <LogOut size={18} />
                        <span className="menu-text" style={{ fontWeight: 500 }}>Logout</span>
                    </button>
                </div>
            </aside>

            {/* ── Main content ── */}
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
