export default () => ({
  port: parseInt(process.env.PORT, 10) || 4000,
  jwt: {
    secret: process.env.JWT_SECRET || 'defaultSecretKey',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  practicas: {
    /** Horas mínimas acumuladas para habilitar "Solicitar revisión de informe final" */
    horasMinimasRevisionInforme: parseInt(process.env.PRACTICAS_HORAS_MINIMAS, 10) || 300,
  },
  tesis: {
    similitudMaximaParaJurado: parseFloat(process.env.TESIS_SIMILITUD_MAX_JURADO || '') || 25,
    mesesAlertaInactividad: parseInt(process.env.TESIS_MESES_INACTIVIDAD, 10) || 12,
    tipoAvanceBorradorTurnitin: process.env.TESIS_TIPO_AVANCE_TURNITIN || 'borrador_turnitin',
  },
  upload: {
    maxBytes: parseInt(process.env.UPLOAD_MAX_BYTES || '', 10) || 20 * 1024 * 1024,
    dir: process.env.UPLOAD_DIR || '',
  },
});
