import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Members from './pages/Members';
import Attendance from './pages/Attendance';
import Financials from './pages/Financials';
import Events from './pages/Events';
import AdminPanel from './pages/AdminPanel';
import Profile from './pages/Profile';
import api from './services/api';
import {
  Users, ClipboardList, Banknote, Calendar,
  TrendingUp, TrendingDown, ArrowUpRight,
  Activity, Heart, BookOpen, UserCheck
} from 'lucide-react';

/* ──────────────────────── Dashboard ──────────────────────── */
const StatCardColor = ({ label, value, badge, badgeUp, cardClass, icon, comingSoon }) => (
  <div className={`stat-card ${cardClass}`}>
    <div className="stat-card-label">{label}</div>
    {comingSoon ? (
      <div style={{ fontSize: 13, fontWeight: 700, margin: '8px 0', opacity: 0.8 }}>Coming Soon</div>
    ) : (
      <>
        <div className="stat-card-value">{value}</div>
        {badge && (
          <span className="stat-card-badge">
            {badgeUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {badge}
          </span>
        )}
      </>
    )}
    {icon && (
      <div style={{
        position: 'absolute', top: 20, right: 20,
        opacity: 0.25, zIndex: 1,
      }}>
        {icon}
      </div>
    )}
  </div>
);

const StatCardWhite = ({ label, value, change, changeType, icon, iconBg, comingSoon }) => (
  <div className="stat-card-white">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        {comingSoon ? (
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', background: 'var(--border-light)', padding: '2px 8px', borderRadius: 6, opacity: 0.8, marginBottom: 8, display: 'inline-block' }}>Coming Soon</div>
        ) : (
          <div className="stat-value">{value}</div>
        )}
        <div className="stat-label">{label}</div>
        {!comingSoon && change && (
          <div className={changeType === 'up' ? 'stat-change-positive' : 'stat-change-negative'}
            style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
            {changeType === 'up' ? <ArrowUpRight size={13} /> : <TrendingDown size={13} />}
            {change}
          </div>
        )}
      </div>
      {icon && (
        <div className="stat-icon-box" style={{ background: iconBg || '#fff7ed' }}>
          {icon}
        </div>
      )}
    </div>
  </div>
);

const formatTimeAgo = (date) => {
  if (!date) return 'Recently';
  const diff = Math.floor((new Date() - date) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    members: 0, donations: 0, events: 0, services: 0,
    donationTotal: 0, loading: true, activities: [],
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const [membersRes, donationsRes, eventsRes, servicesRes] = await Promise.allSettled([
          api.get('members/?page_size=10'),
          api.get('donations/?page_size=100'),
          api.get('events/?page_size=10'),
          api.get('services/?page_size=10'),
        ]);

        const membersList = membersRes.status === 'fulfilled' ? membersRes.value.data.results || [] : [];
        const eventsList = eventsRes.status === 'fulfilled' ? eventsRes.value.data.results || [] : [];
        const servicesList = servicesRes.status === 'fulfilled' ? servicesRes.value.data.results || [] : [];

        let donationsList = [];
        let donationTotal = 0;
        let donationCount = 0;
        if (donationsRes.status === 'fulfilled') {
          donationsList = donationsRes.value.data.results || [];
          donationCount = donationsRes.value.data.count || donationsList.length;
          donationTotal = donationsList.reduce((s, d) => s + parseFloat(d.amount || 0), 0);
        }

        const members = membersRes.status === 'fulfilled' ? membersRes.value.data.count || 0 : 0;
        const events = eventsRes.status === 'fulfilled' ? eventsRes.value.data.count || 0 : 0;
        const services = servicesRes.status === 'fulfilled' ? servicesRes.value.data.count || 0 : 0;

        const allActs = [];
        membersList.forEach(m => allActs.push({
          label: `New member ${m.first_name || 'Anonymous'} joined`,
          timeDate: new Date(m.created_at || m.membership_date || Date.now()),
          color: '#0d9488'
        }));
        donationsList.slice(0, 20).forEach(d => allActs.push({
          label: `GH₵${parseFloat(d.amount).toFixed(0)} donation recorded`,
          timeDate: new Date(d.created_at || d.date || Date.now()),
          color: '#3b82f6'
        }));
        eventsList.forEach(e => allActs.push({
          label: `Event "${e.title}" announced`,
          timeDate: new Date(e.created_at || e.start_datetime || Date.now()),
          color: '#8b5cf6'
        }));
        servicesList.forEach(s => allActs.push({
          label: `Service "${s.name}" scheduled`,
          timeDate: new Date(s.created_at || s.date || Date.now()),
          color: '#f97316'
        }));

        allActs.sort((a, b) => b.timeDate - a.timeDate);

        const activities = allActs.slice(0, 5).map(a => ({
          label: a.label,
          time: formatTimeAgo(a.timeDate),
          color: a.color
        }));

        setStats({ members, donations: donationCount, events, services, donationTotal, loading: false, activities });
      } catch {
        setStats(s => ({ ...s, loading: false }));
      }
    };
    fetch();
  }, []);

  const fmt = (n) => n >= 1000 ? `GH₵${(n / 1000).toFixed(1)}k` : `GH₵${n.toFixed(0)}`;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ fontSize: 28 }}>Welcome, {user?.first_name || user?.username || 'Admin'}</h1>
          <p className="page-subtitle">Here's what's happening at your church today.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary">
            <Activity size={15} /> Reports
          </button>
          <button className="btn-primary">
            <UserCheck size={15} /> Quick Check-in
          </button>
        </div>
      </div>

      {/* Colorful top stat cards */}
      <div className="grid-cols-4" style={{ marginBottom: 24 }}>
        <StatCardColor
          label="Total Members"
          value={stats.loading ? '—' : stats.members.toLocaleString()}
          badge="+8% this month"
          badgeUp
          cardClass="stat-card-orange"
          icon={<Users size={52} />}
        />
        <StatCardColor
          label="Total Donations"
          value={stats.loading ? '—' : fmt(stats.donationTotal)}
          badge="+12% vs last month"
          badgeUp
          cardClass="stat-card-navy"
          icon={<Banknote size={52} />}
        />
        <StatCardColor
          label="Services Held"
          comingSoon
          cardClass="stat-card-teal"
          icon={<Heart size={52} />}
        />
        <StatCardColor
          label="Upcoming Events"
          value={stats.loading ? '—' : stats.events.toLocaleString()}
          badge="+3 new this week"
          badgeUp
          cardClass="stat-card-blue"
          icon={<Calendar size={52} />}
        />
      </div>

      {/* White secondary stat cards */}
      <div className="grid-cols-4" style={{ marginBottom: 32 }}>
        <StatCardWhite
          label="Active Members"
          value={stats.loading ? '—' : stats.members.toLocaleString()}
          change="+35% vs last month"
          changeType="up"
          icon={<Users size={20} color="#f97316" />}
          iconBg="#fff7ed"
        />
        <StatCardWhite
          label="Total Transactions"
          value={stats.loading ? '—' : stats.donations.toLocaleString()}
          change="+18% vs last month"
          changeType="up"
          icon={<ClipboardList size={20} color="#0d9488" />}
          iconBg="#f0fdfa"
        />
        <StatCardWhite
          label="Bible Studies"
          comingSoon
          icon={<BookOpen size={20} color="#3b82f6" />}
          iconBg="#eff6ff"
        />
        <StatCardWhite
          label="Avg. Attendance"
          comingSoon
          icon={<Activity size={20} color="#8b5cf6" />}
          iconBg="#f5f3ff"
        />
      </div>

      {/* Bottom two-column section */}
      <div className="grid-cols-2">
        {/* Recent Activity */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Recent Activity</h3>
            <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: 12 }}>View All</button>
          </div>
          <div style={{ padding: '8px 0' }}>
            {stats.loading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
            ) : stats.activities.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No recent activity</div>
            ) : stats.activities.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 24px', borderBottom: i < stats.activities.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: 13.5, color: 'var(--text-primary)' }}>{item.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>{item.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Overall Information</h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>This month</span>
          </div>
          <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { label: 'Families', color: '#f97316', icon: <Users size={22} color="#f97316" /> },
              { label: 'Volunteers', color: '#0d9488', icon: <UserCheck size={22} color="#0d9488" /> },
              { label: 'Small Groups', color: '#3b82f6', icon: <Heart size={22} color="#3b82f6" /> },
              { label: 'Funds Active', color: '#8b5cf6', icon: <Banknote size={22} color="#8b5cf6" /> },
            ].map((item, i) => (
              <div key={i} style={{
                background: 'var(--bg)',
                borderRadius: 10,
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                border: '1px solid var(--border)',
              }}>
                {item.icon}
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', background: 'var(--border-light)', padding: '2px 8px', borderRadius: 6, opacity: 0.8 }}>Coming Soon</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', fontWeight: 500 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ──────────────────────── Auth Guard ──────────────────────── */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '3px solid var(--primary)',
          borderTopColor: 'transparent',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 12px',
        }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  const role = user?.role || 'member';
  if (!user) return <Navigate to="/login" />;
  if (role !== 'admin') return <Navigate to="/" />;
  return children;
};

/* ──────────────────────── App ──────────────────────── */
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="members" element={<Members />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="financials" element={<Financials />} />
            <Route path="events" element={<Events />} />
            <Route path="profile" element={<Profile />} />
            <Route path="admin" element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            } />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
