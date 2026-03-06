import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Cross, Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loginRole, setLoginRole] = useState('member'); // 'member' or 'admin'
    const [ripple, setRipple] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, logout } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await login(username, password);

            // Check authorization strictly
            if (loginRole === 'admin') {
                if (data.role !== 'admin' && data.role !== 'priest') {
                    logout();
                    setError('Unauthorized: You do not have admin privileges.');
                    setLoading(false);
                    return;
                }
            } else if (loginRole === 'member') {
                if (data.role === 'admin' || data.role === 'priest') {
                    logout();
                    setError('Please use the Admin login portal for priest accounts.');
                    setLoading(false);
                    return;
                }
            }

            navigate('/');
        } catch {
            setError('Invalid username or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            background: 'var(--bg)',
        }}>
            {/* Left panel */}
            <div style={{
                flex: 1,
                background: '#0f172a',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 48,
                position: 'relative',
                overflow: 'hidden',
            }}
                className="login-panel-left"
            >
                {/* Cross-fading gradient layers */}
                <div className="panel-gradient panel-gradient-member" style={{ opacity: loginRole === 'member' ? 1 : 0 }} />
                <div className="panel-gradient panel-gradient-admin" style={{ opacity: loginRole === 'admin' ? 1 : 0 }} />

                {/* Ripple burst on switch */}
                {ripple && <div className="panel-ripple" />}

                {/* Animated floating orbs */}
                <div className="orb orb-1" />
                <div className="orb orb-2" />
                <div className="orb orb-3" />
                <div className="orb orb-4" />

                {/* Shimmer streak */}
                <div className="panel-shimmer" />

                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', color: '#fff', maxWidth: 360 }}>
                    {/* Logo with glow ring */}
                    <div style={{ position: 'relative', width: 150, height: 150, margin: '0 auto 28px' }}>
                        <div className={`logo-ring ${loginRole === 'admin' ? 'logo-ring-admin' : 'logo-ring-member'}`} />
                        <div style={{
                            width: 150, height: 150, borderRadius: '50%',
                            background: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            overflow: 'hidden',
                            position: 'relative', zIndex: 1,
                            border: '4px solid rgba(255,255,255,0.9)',
                            boxShadow: loginRole === 'admin'
                                ? '0 8px 32px rgba(37,99,235,0.5), 0 0 0 8px rgba(37,99,235,0.15)'
                                : '0 8px 32px rgba(249,115,22,0.5), 0 0 0 8px rgba(249,115,22,0.15)',
                            transition: 'box-shadow 0.8s ease',
                        }}>
                            <img src="/church-logo.png" alt="St. Bakhita Catholic Church Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.08)' }} />
                        </div>
                    </div>

                    <h1 style={{
                        fontSize: 26, fontWeight: 800, marginBottom: 12,
                        letterSpacing: '-0.02em', lineHeight: 1.2,
                        textShadow: '0 2px 12px rgba(0,0,0,0.3)',
                    }}>ST. BAKHITA<br />CATHOLIC CHURCH</h1>
                    <p style={{ fontSize: 15, opacity: 0.85, lineHeight: 1.6 }}>
                        Amasaman<br />
                        Church Management System
                    </p>

                    <div style={{ marginTop: 48, textAlign: 'center' }}>
                        <div style={{
                            width: 48, height: 2, margin: '0 auto 20px',
                            background: loginRole === 'admin' ? 'rgba(147,197,253,0.6)' : 'rgba(254,215,170,0.6)',
                            transition: 'background 0.6s ease',
                            borderRadius: 2,
                        }} />
                        <p style={{
                            fontSize: 16,
                            fontStyle: 'italic',
                            fontWeight: 600,
                            opacity: 0.95,
                            lineHeight: 1.7,
                            letterSpacing: '0.01em',
                            textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        }}>
                            "St. Bakhita,<br />Pray For Us<br />The Fortunate Ones"
                        </p>
                        <div style={{
                            width: 48, height: 2, margin: '20px auto 0',
                            background: loginRole === 'admin' ? 'rgba(147,197,253,0.6)' : 'rgba(254,215,170,0.6)',
                            transition: 'background 0.6s ease',
                            borderRadius: 2,
                        }} />
                    </div>
                </div>
            </div>

            {/* Right panel — form */}
            <div style={{
                width: 480,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px 56px',
                background: '#fff',
                boxShadow: '-4px 0 40px rgba(0,0,0,0.06)',
            }}
                className="login-panel-right"
            >
                <div style={{ width: '100%', maxWidth: 360 }}>
                    <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6, color: 'var(--text-primary)' }}>
                        {loginRole === 'admin' ? 'Admin / Priest Portal' : 'Member Sign in'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>
                        Enter your credentials to access the dashboard
                    </p>

                    {/* Role Toggle */}
                    <div style={{
                        display: 'flex',
                        background: 'var(--bg)',
                        padding: 4,
                        borderRadius: 12,
                        marginBottom: 24,
                        border: '1px solid var(--border)',
                    }}>
                        <button
                            type="button"
                            onClick={() => {
                                if (loginRole !== 'member') { setRipple(false); requestAnimationFrame(() => { setRipple(true); setTimeout(() => setRipple(false), 850); }); }
                                setLoginRole('member'); setError('');
                            }}
                            style={{
                                flex: 1, padding: '10px 0', border: 'none', borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                                background: loginRole === 'member' ? 'var(--primary)' : 'transparent',
                                color: loginRole === 'member' ? '#fff' : 'var(--text-secondary)',
                                boxShadow: loginRole === 'member' ? '0 4px 12px rgba(30,45,90,0.25)' : 'none',
                            }}
                        >
                            Member
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (loginRole !== 'admin') { setRipple(false); requestAnimationFrame(() => { setRipple(true); setTimeout(() => setRipple(false), 850); }); }
                                setLoginRole('admin'); setError('');
                            }}
                            style={{
                                flex: 1, padding: '10px 0', border: 'none', borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                                background: loginRole === 'admin' ? 'var(--primary)' : 'transparent',
                                color: loginRole === 'admin' ? '#fff' : 'var(--text-secondary)',
                                boxShadow: loginRole === 'admin' ? '0 4px 12px rgba(30,45,90,0.25)' : 'none',
                            }}
                        >
                            Admin
                        </button>
                    </div>

                    {error && (
                        <div style={{
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            color: '#dc2626',
                            borderRadius: 8,
                            padding: '12px 16px',
                            fontSize: 13.5,
                            marginBottom: 20,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}>
                            ⚠ {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} autoComplete="off">
                        {/* Username */}
                        <div style={{ marginBottom: 18 }}>
                            <label style={{ display: 'block', marginBottom: 6, fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                                Username
                            </label>
                            <div className="input-wrapper">
                                <User size={16} className="input-icon" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    onFocus={(e) => e.target.removeAttribute('readonly')}
                                    onClick={(e) => e.target.removeAttribute('readonly')}
                                    className="form-input"
                                    placeholder="Enter username"
                                    required
                                    readOnly
                                    autoComplete="new-username"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: 28 }}>
                            <label style={{ display: 'block', marginBottom: 6, fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                                Password
                            </label>
                            <div className="input-wrapper" style={{ position: 'relative' }}>
                                <Lock size={16} className="input-icon" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    onFocus={(e) => e.target.removeAttribute('readonly')}
                                    onClick={(e) => e.target.removeAttribute('readonly')}
                                    className="form-input"
                                    placeholder="Enter password"
                                    style={{ paddingRight: 44 }}
                                    required
                                    readOnly
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0,
                                    }}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary"
                            style={{ width: '100%', justifyContent: 'center', padding: '13px 20px', fontSize: 15, opacity: loading ? 0.8 : 1 }}
                        >
                            {loading ? 'Signing in…' : 'Sign In'}
                        </button>
                    </form>

                    <p style={{ marginTop: 28, textAlign: 'center', fontSize: 13.5, color: 'var(--text-muted)' }}>
                        Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Sign up</Link>
                    </p>

                    <p style={{ marginTop: 12, textAlign: 'center', fontSize: 12.5, color: 'var(--text-muted)' }}>
                        St. Bakhita Catholic Church © {new Date().getFullYear()}. All rights reserved.
                    </p>
                </div>
            </div>

            <style>{`
        /* Cross-fading gradient layers */
        .panel-gradient {
          position: absolute; inset: 0;
          transition: opacity 0.9s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .panel-gradient-member {
          background: linear-gradient(145deg, #f97316 0%, #c2410c 40%, #1e2d5a 100%);
        }
        .panel-gradient-admin {
          background: linear-gradient(145deg, #1e2d5a 0%, #1d4ed8 60%, #0ea5e9 100%);
        }

        /* Ripple burst */
        .panel-ripple {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%) scale(0);
          width: 600px; height: 600px;
          border-radius: 50%;
          background: rgba(255,255,255,0.12);
          animation: rippleBurst 0.8s cubic-bezier(0.2, 0.8, 0.4, 1) forwards;
          pointer-events: none; z-index: 2;
        }
        @keyframes rippleBurst {
          0%   { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
        }

        /* Floating orbs */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(40px);
          opacity: 0.25;
          pointer-events: none;
        }
        .orb-1 {
          width: 320px; height: 320px;
          top: -80px; left: -80px;
          background: rgba(255,255,255,0.5);
          animation: floatOrb1 8s ease-in-out infinite;
        }
        .orb-2 {
          width: 240px; height: 240px;
          bottom: -60px; right: -60px;
          background: rgba(255,255,255,0.4);
          animation: floatOrb2 10s ease-in-out infinite;
        }
        .orb-3 {
          width: 180px; height: 180px;
          top: 45%; right: -40px;
          background: rgba(255,255,255,0.3);
          animation: floatOrb3 7s ease-in-out infinite;
        }
        .orb-4 {
          width: 120px; height: 120px;
          top: 20%; left: 30%;
          background: rgba(255,255,255,0.2);
          animation: floatOrb4 9s ease-in-out infinite;
        }
        @keyframes floatOrb1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(30px, 40px) scale(1.1); }
        }
        @keyframes floatOrb2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(-25px, -35px) scale(1.08); }
        }
        @keyframes floatOrb3 {
          0%, 100% { transform: translate(0, 0); }
          50%       { transform: translate(-20px, 20px); }
        }
        @keyframes floatOrb4 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.2; }
          50%       { transform: translate(15px, -20px) scale(1.15); opacity: 0.35; }
        }

        /* Shimmer diagonal streak */
        .panel-shimmer {
          position: absolute;
          top: -50%; left: -75%;
          width: 60%; height: 200%;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.07) 50%, transparent 60%);
          animation: shimmerSweep 6s ease-in-out infinite;
          pointer-events: none; z-index: 0;
        }
        @keyframes shimmerSweep {
          0%   { transform: translateX(0); }
          50%  { transform: translateX(280%); }
          100% { transform: translateX(0); }
        }

        /* Logo glow ring */
        .logo-ring {
          position: absolute;
          inset: -10px;
          border-radius: 50%;
          animation: pulseRing 2.5s ease-in-out infinite;
        }
        .logo-ring-member { background: radial-gradient(circle, rgba(249,115,22,0.5) 0%, transparent 70%); }
        .logo-ring-admin  { background: radial-gradient(circle, rgba(37,99,235,0.55) 0%, transparent 70%); }
        @keyframes pulseRing {
          0%, 100% { transform: scale(1);    opacity: 0.7; }
          50%       { transform: scale(1.15); opacity: 1; }
        }

        @media (max-width: 768px) {
          .login-panel-left { display: none; }
          .login-panel-right { width: 100%; padding: 40px 28px; box-shadow: none; }
        }
      `}</style>
        </div>
    );
};

export default Login;
