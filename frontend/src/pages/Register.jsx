import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, Mail, Type, Cross, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        first_name: '',
        last_name: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            await api.post('auth/register/', formData);
            setSuccess('Account created successfully! Redirecting to login...');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
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
                background: 'linear-gradient(145deg, #0d9488 0%, #1e2d5a 100%)',
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
                {/* Decorative circles */}
                <div style={{ position: 'absolute', top: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ position: 'absolute', bottom: -60, right: -60, width: 250, height: 250, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ position: 'absolute', top: '40%', right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', color: '#fff', maxWidth: 360 }}>
                    {/* Logo */}
                    <div style={{
                        width: 150, height: 150, borderRadius: '50%',
                        background: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 28px',
                        overflow: 'hidden',
                        padding: 0,
                        border: '4px solid #fff',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                    }}>
                        <img src="/church-logo.png" alt="St. Bakhita Catholic Church Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.08)' }} />
                    </div>
                    <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.02em', lineHeight: 1.2 }}>ST. BAKHITA<br />CATHOLIC CHURCH</h1>
                    <p style={{ fontSize: 15, opacity: 0.85, lineHeight: 1.6 }}>
                        Amasaman<br />
                        Join the community and stay connected.
                    </p>
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
                    <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6, color: 'var(--text-primary)' }}>Create Account</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 14 }}>
                        Sign up to access your member dashboard
                    </p>

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
                    {success && (
                        <div style={{
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            color: '#15803d',
                            borderRadius: 8,
                            padding: '12px 16px',
                            fontSize: 13.5,
                            marginBottom: 20,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}>
                            ✓ {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Name fields */}
                        <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: 6, fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                                    First Name
                                </label>
                                <div className="input-wrapper">
                                    <Type size={16} className="input-icon" />
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        className="form-input"
                                        placeholder="First"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: 6, fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                                    Last Name
                                </label>
                                <div className="input-wrapper">
                                    <Type size={16} className="input-icon" />
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        className="form-input"
                                        placeholder="Last"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: 18 }}>
                            <label style={{ display: 'block', marginBottom: 6, fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                                Email
                            </label>
                            <div className="input-wrapper">
                                <Mail size={16} className="input-icon" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                        </div>

                        {/* Username */}
                        <div style={{ marginBottom: 18 }}>
                            <label style={{ display: 'block', marginBottom: 6, fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                                Username
                            </label>
                            <div className="input-wrapper">
                                <User size={16} className="input-icon" />
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Choose a username"
                                    required
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
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Create a password"
                                    style={{ paddingRight: 44 }}
                                    required
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
                            disabled={loading || success}
                            className="btn-primary"
                            style={{ width: '100%', justifyContent: 'center', padding: '13px 20px', fontSize: 15, opacity: (loading || success) ? 0.8 : 1 }}
                        >
                            {loading ? 'Creating account…' : 'Sign Up'}
                        </button>
                    </form>

                    <p style={{ marginTop: 28, textAlign: 'center', fontSize: 13.5, color: 'var(--text-muted)' }}>
                        Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
                    </p>
                </div>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .login-panel-left { display: none; }
                    .login-panel-right { width: 100%; padding: 40px 28px; box-shadow: none; }
                }
            `}</style>
        </div>
    );
};

export default Register;
