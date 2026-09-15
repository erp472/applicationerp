// MongoDB init script — crea índices de las colecciones de auditoría y seguridad
db = db.getSiblingDB('pos472_audit');

db.audit_events.createIndex({ audit_key: 1, timestamp: -1 });
db.audit_events.createIndex({ usuario_id: 1, timestamp: -1 });
db.audit_events.createIndex({ ip: 1, timestamp: -1 });
db.audit_events.createIndex({ resultado: 1, timestamp: -1 });
db.audit_events.createIndex({ accion: 1, resultado: 1, timestamp: -1 });

db.security_alerts.createIndex({ timestamp: -1 });
db.security_alerts.createIndex({ mitre: 1, timestamp: -1 });
db.security_alerts.createIndex({ nist_csf: 1, timestamp: -1 });
db.security_alerts.createIndex({ severidad: 1, timestamp: -1 });
db.security_alerts.createIndex({ usuario_id: 1, timestamp: -1 });
db.security_alerts.createIndex({ ip: 1, timestamp: -1 });

print('pos472_audit: colecciones e índices inicializados');
