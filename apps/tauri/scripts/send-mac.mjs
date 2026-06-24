#!/usr/bin/env node
import os from 'os';

const API_URL = process.env.API_URL ?? 'http://localhost:8000';
const INTERVAL_MS = 30_000;

function getMac() {
  const ifaces = os.networkInterfaces();
  for (const iface of Object.values(ifaces)) {
    for (const addr of iface ?? []) {
      if (!addr.internal && addr.mac && addr.mac !== '00:00:00:00:00:00') {
        return addr.mac;
      }
    }
  }
  return null;
}

async function sendHeartbeat() {
  const mac = getMac();
  if (!mac) {
    console.error('[heartbeat] No se encontró dirección MAC');
    return;
  }
  try {
    const res = await fetch(`${API_URL}/devices/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mac, hostname: os.hostname(), ts: new Date().toISOString() }),
    });
    const data = await res.json().catch(() => ({}));
    console.log(`[heartbeat] ${new Date().toISOString()} mac=${mac} status=${res.status}`, data);
  } catch (err) {
    console.error(`[heartbeat] ${new Date().toISOString()} ERROR:`, err.message);
  }
}

sendHeartbeat();
setInterval(sendHeartbeat, INTERVAL_MS);
