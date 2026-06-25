import React, { useState } from 'react';
import LoginPage from './components/Auth/LoginPage';
import SignupPage from './components/Auth/SignupPage';
import Metrics from './components/Dashboard/Metrics';

function App() {
  const [view, setView] = useState('login'); // 'login', 'signup', 'dashboard'
  const [user, setUser] = useState(null); // stores { id, username, role }

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setView('login');
  };

  return (
    <div className="container">
      {view === 'login' && (
        <LoginPage 
          onToggle={() => setView('signup')} 
          onLoginSuccess={handleLoginSuccess} 
        />
      )}
      {view === 'signup' && (
        <SignupPage 
          onToggle={() => setView('login')} 
        />
      )}
      {view === 'dashboard' && (
        <Metrics 
          user={user} 
          onLogout={handleLogout} 
        />
      )}
      
      {/* Dev Toggle for demo purposes */}
      <div style={{ position: 'fixed', bottom: '10px', right: '10px', display: 'flex', gap: '5px', zIndex: 1000 }}>
        <button onClick={() => setView('login')} style={{ background: '#333', color: '#fff', fontSize: '10px', padding: '5px' }}>Login</button>
        <button onClick={() => setView('signup')} style={{ background: '#333', color: '#fff', fontSize: '10px', padding: '5px' }}>Signup</button>
        <button onClick={() => {
          if (!user) setUser({ id: 1, username: 'admin_demo', role: 'ADMIN' });
          setView('dashboard');
        }} style={{ background: '#333', color: '#fff', fontSize: '10px', padding: '5px' }}>Dash</button>
      </div>
    </div>
  );
}

export default App;
