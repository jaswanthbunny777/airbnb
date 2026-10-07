/* eslint-disable */
'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useToast } from './Toast';

interface Props {
  mode: 'login' | 'register';
  onClose: () => void;
  onSwitch: (mode: 'login' | 'register') => void;
}

export default function AuthModal({ mode, onClose, onSwitch }: Props) {
  const { login, register } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({ email: '', password: '', first_name: '', last_name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        showToast('Welcome back!');
      } else {
        await register(form);
        showToast('Account created! Welcome to Airbnb!');
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 32 32" width="16" height="16" fill="currentColor">
              <path d="M6 6l20 20M26 6L6 26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </button>
          <h2 style={{ flex: 1, textAlign: 'center', fontSize: '16px', fontWeight: 600 }}>
            {mode === 'login' ? 'Log in' : 'Sign up'}
          </h2>
          <div style={{ width: 32 }} />
        </div>

        <div style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '24px' }}>
            {mode === 'login' ? 'Welcome back' : 'Welcome to Airbnb'}
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {mode === 'register' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">First name</label>
                  <input className="input" value={form.first_name} onChange={update('first_name')} required placeholder="First name" />
                </div>
                <div className="input-group">
                  <label className="input-label">Last name</label>
                  <input className="input" value={form.last_name} onChange={update('last_name')} required placeholder="Last name" />
                </div>
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Email</label>
              <input className="input" type="email" value={form.email} onChange={update('email')} required placeholder="Email address" />
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <input className="input" type="password" value={form.password} onChange={update('password')} required placeholder="Password" minLength={6} />
            </div>

            {error && (
              <div style={{ background: '#FFF1F2', border: '1px solid #FFD6D9', borderRadius: '8px', padding: '12px', color: '#E31C5F', fontSize: '14px' }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-gradient btn-full" style={{ marginTop: '8px', padding: '14px', borderRadius: '8px', fontSize: '16px' }} disabled={loading}>
              {loading ? <span className="spinner" /> : (mode === 'login' ? 'Log in' : 'Continue')}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#717171' }}>
            {mode === 'login' ? (
              <>Don't have an account?{' '}
                <button style={{ color: '#222', fontWeight: 600, textDecoration: 'underline', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px' }}
                  onClick={() => onSwitch('register')}>Sign up</button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button style={{ color: '#222', fontWeight: 600, textDecoration: 'underline', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px' }}
                  onClick={() => onSwitch('login')}>Log in</button>
              </>
            )}
          </div>

          {mode === 'login' && (
            <div style={{ marginTop: '20px', padding: '16px', background: '#F7F7F7', borderRadius: '8px', fontSize: '13px' }}>
              <strong>Demo credentials:</strong><br/>
              Guest: guest@example.com / password123<br/>
              Host: sarah@example.com / password123
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
