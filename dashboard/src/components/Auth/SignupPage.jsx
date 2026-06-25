import React, { useState } from 'react';
import { UserPlus, User, Mail, Phone, Lock, ShieldAlert, CheckCircle } from 'lucide-react';

const SignupPage = ({ onToggle }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:8080/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username, 
          email, 
          password,
          phone: phone || '+1234567890'
        }),
      });

      const responseText = await response.text();

      if (response.ok) {
        setSuccess('Operative clearance registered. Redirecting to access portal...');
        setUsername('');
        setEmail('');
        setPassword('');
        setPhone('');
        setTimeout(() => {
          onToggle();
        }, 2000);
      } else {
        setError(responseText || 'Failed to complete registration');
      }
    } catch (err) {
      setError('System Error: Connection to backend failed. Confirm Spring Boot is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card animate-fade" style={{ maxWidth: '420px', margin: '60px auto', padding: '2.5rem', position: 'relative', border: '1px solid rgba(56, 189, 248, 0.15)' }}>
      {/* Top indicator light */}
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '60px', height: '3px', background: 'var(--gold)', boxShadow: '0 0 10px var(--gold)', borderRadius: '0 0 4px 4px' }} />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ background: 'rgba(234, 179, 8, 0.1)', padding: '1rem', borderRadius: '50%', border: '1px solid rgba(234, 179, 8, 0.3)', marginBottom: '1rem', color: 'var(--gold)' }}>
          <UserPlus size={36} style={{ filter: 'drop-shadow(0 0 5px var(--gold))' }} />
        </div>
        <h1 style={{ color: 'var(--gold)', fontSize: '1.75rem', fontWeight: '700', letterSpacing: '1px', marginBottom: '0.25rem', textAlign: 'center' }}>
          NEW DEPLOYMENT
        </h1>
        <p style={{ color: 'var(--cyber-blue)', fontSize: '0.75rem', letterSpacing: '1.5px', textTransform: 'uppercase', opacity: 0.8, textAlign: 'center' }}>
          CREATE SECURE OPERATIVE PROFILE
        </p>
      </div>
      
      {error && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--ruby-red)', background: 'rgba(185, 28, 28, 0.1)', padding: '0.85rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.8rem', border: '1px solid rgba(185, 28, 28, 0.25)' }}>
          <ShieldAlert size={16} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--neon-green)', background: 'rgba(16, 185, 129, 0.1)', padding: '0.85rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.8rem', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
          <CheckCircle size={16} style={{ flexShrink: 0 }} />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'gray', marginBottom: '0.5rem', fontWeight: '600' }}>
            Operative Username *
          </label>
          <div style={{ position: 'relative' }}>
            <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'gray' }} />
            <input 
              type="text" 
              placeholder="e.g. agent_k" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', background: 'var(--midnight)', border: '1px solid var(--navy)', color: '#fff', fontSize: '0.9rem' }}
            />
          </div>
        </div>
        
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'gray', marginBottom: '0.5rem', fontWeight: '600' }}>
            Secure Email *
          </label>
          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'gray' }} />
            <input 
              type="email" 
              placeholder="john@agency.gov" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', background: 'var(--midnight)', border: '1px solid var(--navy)', color: '#fff', fontSize: '0.9rem' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'gray', marginBottom: '0.5rem', fontWeight: '600' }}>
            Contact Number (Optional)
          </label>
          <div style={{ position: 'relative' }}>
            <Phone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'gray' }} />
            <input 
              type="text" 
              placeholder="+1 (555) 123-4567" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', background: 'var(--midnight)', border: '1px solid var(--navy)', color: '#fff', fontSize: '0.9rem' }}
            />
          </div>
        </div>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'gray', marginBottom: '0.5rem', fontWeight: '600' }}>
            Security Passphrase *
          </label>
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'gray' }} />
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', background: 'var(--midnight)', border: '1px solid var(--navy)', color: '#fff', fontSize: '0.9rem' }}
            />
          </div>
        </div>
        
        <button 
          type="submit"
          className="btn-primary glow-hover" 
          style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem', borderRadius: '8px', background: 'var(--cyber-blue)', color: 'var(--midnight)', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', transition: 'all 0.3s ease' }}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(0,0,0,0.1)', borderTop: '2px solid #000', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <span>Deploying Operative...</span>
            </>
          ) : (
            <>
              <UserPlus size={18} />
              <span>Finalize Authorization</span>
            </>
          )}
        </button>
      </form>
      
      <p style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem', color: 'gray' }}>
        Already cleared? <span onClick={onToggle} style={{ color: 'var(--cyber-blue)', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }}>Access Portal</span>
      </p>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SignupPage;
