import { useState, useEffect } from 'react';
import { Login } from './views/Login';

interface Usuario { nombre: string }

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem('access_token'));
    const raw = localStorage.getItem('usuario');
    setUsuario(raw ? JSON.parse(raw) : null);
  }, []);

  function onLogin(t: string, u: Usuario) {
    setToken(t);
    setUsuario(u);
  }

  function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('usuario');
    setToken(null);
    setUsuario(null);
  }

  if (!token) return <Login onLogin={onLogin} />;

  return (
    <div style={{ padding: 40, color: '#f8fafc', background: '#0f172a', minHeight: '100vh' }}>
      <p>Bienvenido, {usuario?.nombre}</p>
      <button onClick={logout} style={{ marginTop: 16 }}>Cerrar sesión</button>
    </div>
  );
}
