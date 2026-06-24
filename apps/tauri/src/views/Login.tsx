import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMac } from '../hooks/useMac';
import { login } from '../api/auth';
import logo472 from '../assets/logo-472.png';


interface Props {
  onLogin: (token: string, user: { nombre: string }) => void;
}

export function Login({ onLogin }: Props) {
  const { mac, error: macError } = useMac();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const result = await login(email, password, mac);
      localStorage.setItem('access_token', result.access_token);
      localStorage.setItem('usuario', JSON.stringify(result.usuario));
      onLogin(result.access_token, result.usuario);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.screen}>
      <div style={s.card}>

        {/* Banda superior con los tres colores de marca */}
        <div style={s.brandBar}>
          <span style={{ flex: 1, background: '#FFC229' }} />
          <span style={{ flex: 2, background: '#0033A0' }} />
          <span style={{ flex: 1, background: '#E4002B' }} />
        </div>

        {/* Logo oficial */}
        <div style={s.logoWrap}>
          <img src={logo472} alt="4-72 Servicios Postales Nacionales" style={s.logo} />
          <p style={s.logoSub}>Sistema POS</p>
        </div>

        <form style={s.form} onSubmit={handleSubmit}>
          <label style={s.field}>
            <span style={s.label}>Correo electrónico</span>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="cajero@4-72.com.co"
              autoComplete="username"
              required
              disabled={loading}
              style={s.input}
            />
          </label>

          <label style={s.field}>
            <span style={s.label}>Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              disabled={loading}
              style={s.input}
            />
          </label>

          {errorMsg && (
            errorMsg.includes('no está autorizado') ? (
              <div style={s.alertBox}>
                <span style={s.alertIcon}>⚠</span>
                <div>
                  <p style={s.alertTitle}>Equipo no autorizado</p>
                  <p style={s.alertBody}>
                    Este equipo no está registrado en el sistema.<br />
                    Contáctese con soporte:<br />
                    <a href="mailto:applicationerp472@gmail.com" style={s.alertLink}>
                      applicationerp472@gmail.com
                    </a>
                  </p>
                </div>
              </div>
            ) : (
              <p style={s.error}>{errorMsg}</p>
            )
          )}

          <button
            type="submit"
            disabled={loading || !mac}
            style={{ ...s.btnLogin, opacity: loading || !mac ? 0.5 : 1 }}
          >
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  screen:   { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F4F6FB' },
  card:     { width: 380, background: '#FFFFFF', borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,51,160,.12)', display: 'flex', flexDirection: 'column' },

  brandBar: { display: 'flex', height: 6 },

  logoWrap: { padding: '32px 36px 20px', textAlign: 'center', borderBottom: '1px solid #E8ECF4' },
  logo:     { maxWidth: 200, height: 'auto' },
  logoSub:  { marginTop: 10, fontSize: '.72rem', fontWeight: 600, color: '#0033A0', letterSpacing: '.14em', textTransform: 'uppercase' },

  form:     { padding: '24px 36px 28px', display: 'flex', flexDirection: 'column', gap: 16 },
  field:    { display: 'flex', flexDirection: 'column', gap: 5 },
  label:    { fontSize: '.78rem', fontWeight: 600, color: '#1A1A2E' },
  input:    { padding: '11px 14px', borderRadius: 7, border: '1.5px solid #D1D9EE', background: '#FAFBFF', color: '#1A1A2E', fontSize: '.95rem', outline: 'none', transition: 'border-color .15s' },
  error:    { fontSize: '.8rem', color: '#E4002B', textAlign: 'center' },

  alertBox:   { display: 'flex', gap: 12, background: '#FFF4F4', border: '1.5px solid #E4002B', borderRadius: 8, padding: '12px 14px' },
  alertIcon:  { fontSize: '1.3rem', color: '#E4002B', lineHeight: 1.2, flexShrink: 0 },
  alertTitle: { fontSize: '.82rem', fontWeight: 700, color: '#E4002B', marginBottom: 4 },
  alertBody:  { fontSize: '.78rem', color: '#6B2020', lineHeight: 1.6 },
  alertLink:  { color: '#0033A0', fontWeight: 600, textDecoration: 'none' },
  btnLogin: { marginTop: 4, padding: 14, borderRadius: 7, border: 'none', background: '#0033A0', color: '#FFFFFF', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', letterSpacing: '.02em', transition: 'background .15s' },
};
