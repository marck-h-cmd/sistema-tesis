import { PrismaClient, RolNombre, EstadoPostulacion, EstadoPractica, EstadoTesis, EstadoConvenioEspecifico, EstadoPago, EstadoRevisionJurado, TipoDocumentoPractica, TipoDocumentoTesis, TipoPago } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function main() {
  console.log('🌱 Iniciando seed con Workflow completo de Prácticas y Tesis...');
  
  const existingUsers = await prisma.usuario.count();
  if (existingUsers > 0) {
    console.log('⚠️ Limpiando base de datos existente...');
    await cleanDatabase();
  }

  try {
    const roles = await createRoles();
    console.log('✅ Roles creados (incluye secretaria)');

    const escuelas = await createEscuelas();
    console.log('✅ Escuelas creadas');

    const usuarios = await createUsuarios(roles);
    console.log('✅ Usuarios creados');

    const estudiantes = await createEstudiantes(usuarios, escuelas);
    console.log('✅ Estudiantes creados');

    const asesores = await createAsesores(usuarios, escuelas);
    console.log('✅ Asesores creados');

    const empresas = await createEmpresas();
    console.log('✅ Empresas creadas');

    await createConvenios(empresas);
    console.log('✅ Convenios creados');

    const ofertas = await createOfertas(empresas);
    console.log('✅ Ofertas creadas');

    const postulaciones = await createPostulaciones(ofertas, estudiantes, asesores);
    console.log('✅ Postulaciones creadas');

    await createPracticas(postulaciones, estudiantes, asesores, usuarios);
    console.log('✅ Prácticas con hitos y documentos creadas');

    await createPagosEstudiantes(estudiantes, usuarios);
    console.log('✅ Pagos de estudiantes creados');

    await createTesis(estudiantes, asesores, usuarios);
    console.log('✅ Tesis con documentos, pagos y revisiones creadas');

    await createNotificaciones(usuarios, estudiantes, asesores);
    console.log('✅ Notificaciones creadas');

    await createReportes(usuarios);
    console.log('✅ Reportes creados');

    console.log('\n🎉 SEED COMPLETADO EXITOSAMENTE!');
    console.log('\n📧 CREDENCIALES DE ACCESO:');
    console.log('━'.repeat(60));
    console.log('👑 Admin: admin@unitru.edu.pe / Admin123@');
    console.log('📋 Coordinador: coordinador.sistemas@unitru.edu.pe / Coord123@');
    console.log('📎 Secretaría: secretaria.sistemas@unitru.edu.pe / Secre123@');
    console.log('👨‍🏫 Asesor: juan.garcia@unitru.edu.pe / Asesor123@');
    console.log('🎓 Estudiante (PPP completo, en Tesis): diego.chavez@unitru.edu.pe / Estu123@');
    console.log('🎓 Estudiante (PPP en ejecución): carlos.lopez@unitru.edu.pe / Estu123@');
    console.log('🎓 Estudiante (Plan pendiente): eduardo.ramos@unitru.edu.pe / Estu123@');
    console.log('🏢 Empresa: rrhh@techcorp.com / Empresa123@');
    console.log('━'.repeat(60));
    console.log('\n📊 ESCENARIOS DEL WORKFLOW:');
    console.log('━'.repeat(60));
    console.log('🔵 PRACTICANTE (Plan pendiente):');
    console.log('   eduardo.ramos@unitru.edu.pe - Espera que Secretaría valide su plan');
    console.log('');
    console.log('🟢 EN EJECUCIÓN (Subiendo reportes):');
    console.log('   carlos.lopez@unitru.edu.pe - 180/300 horas, 3 reportes mensuales');
    console.log('   maria.huaman@unitru.edu.pe - 150/300 horas, 3 reportes mensuales');
    console.log('');
    console.log('🟡 EGRESADO (Prácticas aprobadas):');
    console.log('   diego.chavez@unitru.edu.pe - 300/300 horas, informe firmado, resolución cargada');
    console.log('   andrea.rivas@unitru.edu.pe - 280/300 horas, informe aprobado');
    console.log('');
    console.log('🟣 TESISTA (En desarrollo):');
    console.log('   andrea.rivas@unitru.edu.pe - Tesis en desarrollo, Turnitin 12.5% ✅');
    console.log('   fernando.cruz@unitru.edu.pe - Tesis en desarrollo, Turnitin 28.5% ⚠️');
    console.log('   carlos.lopez@unitru.edu.pe - Tesis con 16 meses, alerta de vencimiento ⏰');
    console.log('');
    console.log('🔴 EN REVISIÓN (Jurado asignado):');
    console.log('   gabriela.marin@unitru.edu.pe - 3 jurados, 1 con observaciones');
    console.log('');
    console.log('🟠 EXPEDITO (Listo para sustentar):');
    console.log('   jose.valencia@unitru.edu.pe - Prácticas OK, pagos OK, jurado conforme');
    console.log('');
    console.log('⭐ CULMINADO:');
    console.log('   ricardo.leon@unitru.edu.pe - Acta de sustentación generada, nota 17.5');
    console.log('━'.repeat(60));
  } catch (error) {
    console.error('❌ Error en el seed:', error);
    throw error;
  }
}

async function cleanDatabase() {
  await prisma.$transaction([
    prisma.notificacion.deleteMany(),
    prisma.reporte.deleteMany(),
    prisma.actaSustentacion.deleteMany(),
    prisma.revisionJurado.deleteMany(),
    prisma.juradoTesis.deleteMany(),
    prisma.avanceTesis.deleteMany(),
    prisma.pagoTesis.deleteMany(),
    prisma.documentoTesis.deleteMany(),
    prisma.tesis.deleteMany(),
    prisma.pago.deleteMany(),
    prisma.documentoPractica.deleteMany(),
    prisma.reporteMensualPractica.deleteMany(),
    prisma.practica.deleteMany(),
    prisma.asesorPostulacion.deleteMany(),
    prisma.postulacion.deleteMany(),
    prisma.ofertaPractica.deleteMany(),
    prisma.convenio.deleteMany(),
    prisma.empresa.deleteMany(),
    prisma.asesor.deleteMany(),
    prisma.estudiante.deleteMany(),
    prisma.usuarioRol.deleteMany(),
    prisma.usuario.deleteMany(),
    prisma.escuela.deleteMany(),
    prisma.rol.deleteMany(),
  ]);
}

async function createRoles() {
  const rolesData = [
    { nombre: RolNombre.admin, descripcion: 'Administrador del sistema' },
    { nombre: RolNombre.coordinador, descripcion: 'Coordinador de escuela - asigna jurados, programa sustentaciones' },
    { nombre: RolNombre.secretaria, descripcion: 'Validador administrativo - revisa planes de práctica y documentos' },
    { nombre: RolNombre.asesor, descripcion: 'Docente asesor de prácticas y tesis, jurado' },
    { nombre: RolNombre.estudiante, descripcion: 'Estudiante de pregrado' },
    { nombre: RolNombre.empresa, descripcion: 'Representante de empresa' },
  ];

  const roles = [];
  for (const rol of rolesData) {
    const created = await prisma.rol.upsert({
      where: { nombre: rol.nombre },
      update: {},
      create: rol,
    });
    roles.push(created);
  }
  return roles;
}

async function createEscuelas() {
  const escuelasData = [
    { nombre: 'Ingeniería de Sistemas', facultad: 'Facultad de Ingeniería' },
    { nombre: 'Ingeniería Industrial', facultad: 'Facultad de Ingeniería' },
    { nombre: 'Ingeniería Civil', facultad: 'Facultad de Ingeniería' },
    { nombre: 'Administración', facultad: 'Facultad de Ciencias Económicas' },
    { nombre: 'Contabilidad', facultad: 'Facultad de Ciencias Económicas' },
    { nombre: 'Economía', facultad: 'Facultad de Ciencias Económicas' },
    { nombre: 'Derecho', facultad: 'Facultad de Derecho y Ciencias Políticas' },
    { nombre: 'Medicina', facultad: 'Facultad de Medicina' },
  ];

  const escuelas = [];
  for (const escuela of escuelasData) {
    const created = await prisma.escuela.create({ data: escuela });
    escuelas.push(created);
  }
  return escuelas;
}

async function createUsuarios(roles: any[]) {
  const adminRol = roles.find(r => r.nombre === RolNombre.admin);
  const coordinadorRol = roles.find(r => r.nombre === RolNombre.coordinador);
  const secretariaRol = roles.find(r => r.nombre === RolNombre.secretaria);
  const asesorRol = roles.find(r => r.nombre === RolNombre.asesor);
  const estudianteRol = roles.find(r => r.nombre === RolNombre.estudiante);
  const empresaRol = roles.find(r => r.nombre === RolNombre.empresa);

  const usuariosData = [
    // Admin (1)
    {
      email: 'admin@unitru.edu.pe',
      password: await bcrypt.hash('Admin123@', 10),
      nombres: 'Carlos',
      apellidos: 'Rodríguez Mendoza',
      dni: '18123456',
      telefono: '999888777',
      roles: [adminRol],
    },
    // Coordinadores (2)
    {
      email: 'coordinador.sistemas@unitru.edu.pe',
      password: await bcrypt.hash('Coord123@', 10),
      nombres: 'Luis',
      apellidos: 'Martínez Torres',
      dni: '18234567',
      telefono: '999777666',
      roles: [coordinadorRol],
    },
    {
      email: 'coordinador.industrial@unitru.edu.pe',
      password: await bcrypt.hash('Coord123@', 10),
      nombres: 'Ana',
      apellidos: 'Sánchez García',
      dni: '18234568',
      telefono: '999777667',
      roles: [coordinadorRol],
    },
    // Secretarías (2)
    {
      email: 'secretaria.sistemas@unitru.edu.pe',
      password: await bcrypt.hash('Secre123@', 10),
      nombres: 'Rosa',
      apellidos: 'Vargas Castillo',
      dni: '18333444',
      telefono: '999666111',
      roles: [secretariaRol],
    },
    {
      email: 'secretaria.industrial@unitru.edu.pe',
      password: await bcrypt.hash('Secre123@', 10),
      nombres: 'Diana',
      apellidos: 'Paredes López',
      dni: '18333445',
      telefono: '999666112',
      roles: [secretariaRol],
    },
    // Asesores (6)
    {
      email: 'juan.garcia@unitru.edu.pe',
      password: await bcrypt.hash('Asesor123@', 10),
      nombres: 'Juan',
      apellidos: 'García Pérez',
      dni: '18345678',
      telefono: '999666555',
      roles: [asesorRol],
    },
    {
      email: 'patricia.vargas@unitru.edu.pe',
      password: await bcrypt.hash('Asesor123@', 10),
      nombres: 'Patricia',
      apellidos: 'Vargas Huamán',
      dni: '18345679',
      telefono: '999666556',
      roles: [asesorRol],
    },
    {
      email: 'miguel.ramirez@unitru.edu.pe',
      password: await bcrypt.hash('Asesor123@', 10),
      nombres: 'Miguel',
      apellidos: 'Ramírez Cárdenas',
      dni: '18345680',
      telefono: '999666557',
      roles: [asesorRol],
    },
    {
      email: 'carmen.flores@unitru.edu.pe',
      password: await bcrypt.hash('Asesor123@', 10),
      nombres: 'Carmen',
      apellidos: 'Flores Rojas',
      dni: '18345681',
      telefono: '999666558',
      roles: [asesorRol],
    },
    {
      email: 'pedro.castillo@unitru.edu.pe',
      password: await bcrypt.hash('Asesor123@', 10),
      nombres: 'Pedro',
      apellidos: 'Castillo Medina',
      dni: '18345682',
      telefono: '999666559',
      roles: [asesorRol],
    },
    {
      email: 'rosa.quispe@unitru.edu.pe',
      password: await bcrypt.hash('Asesor123@', 10),
      nombres: 'Rosa',
      apellidos: 'Quispe Mamani',
      dni: '18345683',
      telefono: '999666560',
      roles: [asesorRol],
    },
    // Estudiantes (15)
    {
      email: 'carlos.lopez@unitru.edu.pe',
      password: await bcrypt.hash('Estu123@', 10),
      nombres: 'Carlos',
      apellidos: 'López Gutiérrez',
      dni: '18456789',
      telefono: '999555444',
      roles: [estudianteRol],
    },
    {
      email: 'maria.huaman@unitru.edu.pe',
      password: await bcrypt.hash('Estu123@', 10),
      nombres: 'María',
      apellidos: 'Huamán Quispe',
      dni: '18456790',
      telefono: '999555445',
      roles: [estudianteRol],
    },
    {
      email: 'jose.valencia@unitru.edu.pe',
      password: await bcrypt.hash('Estu123@', 10),
      nombres: 'José',
      apellidos: 'Valencia Ríos',
      dni: '18456791',
      telefono: '999555446',
      roles: [estudianteRol],
    },
    {
      email: 'lucia.torres@unitru.edu.pe',
      password: await bcrypt.hash('Estu123@', 10),
      nombres: 'Lucía',
      apellidos: 'Torres Mendoza',
      dni: '18456792',
      telefono: '999555447',
      roles: [estudianteRol],
    },
    {
      email: 'diego.chavez@unitru.edu.pe',
      password: await bcrypt.hash('Estu123@', 10),
      nombres: 'Diego',
      apellidos: 'Chávez Paredes',
      dni: '18456793',
      telefono: '999555448',
      roles: [estudianteRol],
    },
    {
      email: 'andrea.rivas@unitru.edu.pe',
      password: await bcrypt.hash('Estu123@', 10),
      nombres: 'Andrea',
      apellidos: 'Rivas Salazar',
      dni: '18456794',
      telefono: '999555449',
      roles: [estudianteRol],
    },
    {
      email: 'fernando.cruz@unitru.edu.pe',
      password: await bcrypt.hash('Estu123@', 10),
      nombres: 'Fernando',
      apellidos: 'Cruz Vega',
      dni: '18456795',
      telefono: '999555450',
      roles: [estudianteRol],
    },
    {
      email: 'gabriela.marin@unitru.edu.pe',
      password: await bcrypt.hash('Estu123@', 10),
      nombres: 'Gabriela',
      apellidos: 'Marín Campos',
      dni: '18456796',
      telefono: '999555451',
      roles: [estudianteRol],
    },
    {
      email: 'ricardo.leon@unitru.edu.pe',
      password: await bcrypt.hash('Estu123@', 10),
      nombres: 'Ricardo',
      apellidos: 'León Herrera',
      dni: '18456797',
      telefono: '999555452',
      roles: [estudianteRol],
    },
    {
      email: 'valentina.ruiz@unitru.edu.pe',
      password: await bcrypt.hash('Estu123@', 10),
      nombres: 'Valentina',
      apellidos: 'Ruiz Aguilar',
      dni: '18456798',
      telefono: '999555453',
      roles: [estudianteRol],
    },
    {
      email: 'eduardo.ramos@unitru.edu.pe',
      password: await bcrypt.hash('Estu123@', 10),
      nombres: 'Eduardo',
      apellidos: 'Ramos Sánchez',
      dni: '18456799',
      telefono: '999555454',
      roles: [estudianteRol],
    },
    {
      email: 'sofia.castro@unitru.edu.pe',
      password: await bcrypt.hash('Estu123@', 10),
      nombres: 'Sofía',
      apellidos: 'Castro Vargas',
      dni: '18456800',
      telefono: '999555455',
      roles: [estudianteRol],
    },
    {
      email: 'alejandro.rosas@unitru.edu.pe',
      password: await bcrypt.hash('Estu123@', 10),
      nombres: 'Alejandro',
      apellidos: 'Rosas Guzmán',
      dni: '18456801',
      telefono: '999555456',
      roles: [estudianteRol],
    },
    {
      email: 'daniela.ochoa@unitru.edu.pe',
      password: await bcrypt.hash('Estu123@', 10),
      nombres: 'Daniela',
      apellidos: 'Ochoa Cisneros',
      dni: '18456802',
      telefono: '999555457',
      roles: [estudianteRol],
    },
    {
      email: 'hugo.gil@unitru.edu.pe',
      password: await bcrypt.hash('Estu123@', 10),
      nombres: 'Hugo',
      apellidos: 'Gil Navarro',
      dni: '18456803',
      telefono: '999555458',
      roles: [estudianteRol],
    },
    // Empresas (3)
    {
      email: 'rrhh@techcorp.com',
      password: await bcrypt.hash('Empresa123@', 10),
      nombres: 'Gloria',
      apellidos: 'Paredes Villanueva',
      dni: '18567890',
      telefono: '999444333',
      roles: [empresaRol],
    },
    {
      email: 'rrhh@innova.com',
      password: await bcrypt.hash('Empresa123@', 10),
      nombres: 'Jorge',
      apellidos: 'Medina Delgado',
      dni: '18567891',
      telefono: '999444334',
      roles: [empresaRol],
    },
    {
      email: 'rrhh@datacenter.pe',
      password: await bcrypt.hash('Empresa123@', 10),
      nombres: 'Patricia',
      apellidos: 'Zegarra Yupanqui',
      dni: '18567894',
      telefono: '999444337',
      roles: [empresaRol],
    },
  ];

  const usuarios = [];
  for (const userData of usuariosData) {
    const { roles: userRoles, ...userInfo } = userData;
    const usuario = await prisma.usuario.create({ data: userInfo });

    for (const rol of userRoles) {
      await prisma.usuarioRol.create({
        data: { usuario_id: usuario.id, rol_id: rol.id },
      });
    }
    usuarios.push({ ...usuario, _roles: userRoles });
  }
  return usuarios;
}

async function createEstudiantes(usuarios: any[], escuelas: any[]) {
  const estudiantesData = [
    { usuario_id: usuarios.find(u => u.email === 'carlos.lopez@unitru.edu.pe').id, escuela_id: escuelas[0].id, codigo_universitario: '20201001' },
    { usuario_id: usuarios.find(u => u.email === 'maria.huaman@unitru.edu.pe').id, escuela_id: escuelas[0].id, codigo_universitario: '20201002' },
    { usuario_id: usuarios.find(u => u.email === 'jose.valencia@unitru.edu.pe').id, escuela_id: escuelas[1].id, codigo_universitario: '20201003' },
    { usuario_id: usuarios.find(u => u.email === 'lucia.torres@unitru.edu.pe').id, escuela_id: escuelas[1].id, codigo_universitario: '20201004' },
    { usuario_id: usuarios.find(u => u.email === 'diego.chavez@unitru.edu.pe').id, escuela_id: escuelas[2].id, codigo_universitario: '20201005' },
    { usuario_id: usuarios.find(u => u.email === 'andrea.rivas@unitru.edu.pe').id, escuela_id: escuelas[3].id, codigo_universitario: '20201006' },
    { usuario_id: usuarios.find(u => u.email === 'fernando.cruz@unitru.edu.pe').id, escuela_id: escuelas[3].id, codigo_universitario: '20201007' },
    { usuario_id: usuarios.find(u => u.email === 'gabriela.marin@unitru.edu.pe').id, escuela_id: escuelas[4].id, codigo_universitario: '20201008' },
    { usuario_id: usuarios.find(u => u.email === 'ricardo.leon@unitru.edu.pe').id, escuela_id: escuelas[4].id, codigo_universitario: '20201009' },
    { usuario_id: usuarios.find(u => u.email === 'valentina.ruiz@unitru.edu.pe').id, escuela_id: escuelas[5].id, codigo_universitario: '20201010' },
    { usuario_id: usuarios.find(u => u.email === 'eduardo.ramos@unitru.edu.pe').id, escuela_id: escuelas[0].id, codigo_universitario: '20201011' },
    { usuario_id: usuarios.find(u => u.email === 'sofia.castro@unitru.edu.pe').id, escuela_id: escuelas[1].id, codigo_universitario: '20201012' },
    { usuario_id: usuarios.find(u => u.email === 'alejandro.rosas@unitru.edu.pe').id, escuela_id: escuelas[2].id, codigo_universitario: '20201013' },
    { usuario_id: usuarios.find(u => u.email === 'daniela.ochoa@unitru.edu.pe').id, escuela_id: escuelas[3].id, codigo_universitario: '20201014' },
    { usuario_id: usuarios.find(u => u.email === 'hugo.gil@unitru.edu.pe').id, escuela_id: escuelas[4].id, codigo_universitario: '20201015' },
  ];

  const estudiantes = [];
  for (const est of estudiantesData) {
    const estudiante = await prisma.estudiante.create({ data: est });
    estudiantes.push(estudiante);
  }
  return estudiantes;
}

async function createAsesores(usuarios: any[], escuelas: any[]) {
  const asesoresData = [
    { usuario_id: usuarios.find(u => u.email === 'juan.garcia@unitru.edu.pe').id, escuela_id: escuelas[0].id, especialidad: 'Ingeniería de Software' },
    { usuario_id: usuarios.find(u => u.email === 'patricia.vargas@unitru.edu.pe').id, escuela_id: escuelas[1].id, especialidad: 'Gestión de Operaciones' },
    { usuario_id: usuarios.find(u => u.email === 'miguel.ramirez@unitru.edu.pe').id, escuela_id: escuelas[2].id, especialidad: 'Estructuras' },
    { usuario_id: usuarios.find(u => u.email === 'carmen.flores@unitru.edu.pe').id, escuela_id: escuelas[3].id, especialidad: 'Marketing' },
    { usuario_id: usuarios.find(u => u.email === 'pedro.castillo@unitru.edu.pe').id, escuela_id: escuelas[4].id, especialidad: 'Auditoría' },
    { usuario_id: usuarios.find(u => u.email === 'rosa.quispe@unitru.edu.pe').id, escuela_id: escuelas[5].id, especialidad: 'Macroeconomía' },
  ];

  const asesores = [];
  for (const asesor of asesoresData) {
    const created = await prisma.asesor.create({ data: asesor });
    asesores.push(created);
  }
  return asesores;
}

async function createEmpresas() {
  const empresasData = [
    {
      ruc: '20123456781',
      razon_social: 'TechCorp Solutions S.A.C.',
      direccion: 'Av. Javier Prado 1234, San Isidro, Lima',
      telefono: '01-555-0101',
      email_contacto: 'rrhh@techcorp.com',
      representante: 'Gloria Paredes Villanueva',
      convenio_activo: true,
    },
    {
      ruc: '20123456782',
      razon_social: 'Innovación Digital S.A.',
      direccion: 'Av. La Marina 2345, San Miguel, Lima',
      telefono: '01-555-0102',
      email_contacto: 'rrhh@innova.com',
      representante: 'Jorge Medina Delgado',
      convenio_activo: true,
    },
    {
      ruc: '20123456785',
      razon_social: 'DataCenter Perú S.A.C.',
      direccion: 'Av. César Vallejo 567, Trujillo, La Libertad',
      telefono: '044-555-0105',
      email_contacto: 'rrhh@datacenter.pe',
      representante: 'Patricia Zegarra Yupanqui',
      convenio_activo: false, // Sin convenio - requiere convenio específico
    },
  ];

  const empresas = [];
  for (const emp of empresasData) {
    const empresa = await prisma.empresa.create({ data: emp });
    empresas.push(empresa);
  }
  return empresas;
}

async function createConvenios(empresas: any[]) {
  const conveniosData = [
    { empresa_id: empresas[0].id, fecha_inicio: new Date('2024-01-01'), fecha_fin: new Date('2025-12-31'), tipo: 'marco', archivo_pdf: 'convenio-marco-techcorp-2024.pdf', estado: 'vigente' },
    { empresa_id: empresas[1].id, fecha_inicio: new Date('2024-02-01'), fecha_fin: new Date('2025-01-31'), tipo: 'marco', archivo_pdf: 'convenio-marco-innova-2024.pdf', estado: 'vigente' },
    { empresa_id: empresas[0].id, fecha_inicio: new Date('2023-01-01'), fecha_fin: new Date('2023-12-31'), tipo: 'especifico', archivo_pdf: 'convenio-especifico-techcorp-2023.pdf', estado: 'vencido' },
  ];

  for (const conv of conveniosData) {
    await prisma.convenio.create({ data: conv });
  }
}

async function createOfertas(empresas: any[]) {
  const ofertasData = [
    { empresa_id: empresas[0].id, titulo: 'Practicante de Desarrollo Backend', descripcion: 'APIs RESTful con Node.js y PostgreSQL.', requisitos: 'JavaScript, Node.js, PostgreSQL. Últimos ciclos de Sistemas.', fecha_inicio: new Date('2024-04-01'), fecha_fin: new Date('2024-09-30'), vacantes: 2, modalidad: 'hibrida', estado: 'abierta' },
    { empresa_id: empresas[0].id, titulo: 'Practicante de Frontend React', descripcion: 'Interfaces con React y Next.js.', requisitos: 'React, TypeScript. Últimos ciclos.', fecha_inicio: new Date('2024-04-15'), fecha_fin: new Date('2024-10-15'), vacantes: 1, modalidad: 'remota', estado: 'abierta' },
    { empresa_id: empresas[1].id, titulo: 'Practicante de Análisis de Datos', descripcion: 'Análisis con Python y herramientas BI.', requisitos: 'Python, SQL, Excel avanzado. Sistemas o Industrial.', fecha_inicio: new Date('2024-05-01'), fecha_fin: new Date('2024-10-31'), vacantes: 3, modalidad: 'presencial', estado: 'abierta' },
    { empresa_id: empresas[2].id, titulo: 'Practicante de Redes y Telecomunicaciones', descripcion: 'Administración de redes y monitoreo TI.', requisitos: 'Redes CCNA. Sistemas.', fecha_inicio: new Date('2024-05-15'), fecha_fin: new Date('2024-11-15'), vacantes: 2, modalidad: 'presencial', estado: 'abierta' },
  ];

  const ofertas = [];
  for (const oferta of ofertasData) {
    const created = await prisma.ofertaPractica.create({ data: oferta });
    ofertas.push(created);
  }
  return ofertas;
}

async function createPostulaciones(ofertas: any[], estudiantes: any[], asesores: any[]) {
  const postulacionesData = [
    { oferta_id: ofertas[0].id, estudiante_id: estudiantes[0].id, asesor_academico_id: asesores[0].id, fecha_postulacion: new Date('2024-03-15'), estado: EstadoPostulacion.en_curso },
    { oferta_id: ofertas[1].id, estudiante_id: estudiantes[1].id, asesor_academico_id: asesores[0].id, fecha_postulacion: new Date('2024-03-20'), estado: EstadoPostulacion.en_curso },
    { oferta_id: ofertas[2].id, estudiante_id: estudiantes[2].id, asesor_academico_id: asesores[1].id, fecha_postulacion: new Date('2024-04-01'), estado: EstadoPostulacion.aceptado },
    { oferta_id: ofertas[1].id, estudiante_id: estudiantes[3].id, asesor_academico_id: asesores[2].id, fecha_postulacion: new Date('2024-03-01'), estado: EstadoPostulacion.en_curso },
    { oferta_id: ofertas[2].id, estudiante_id: estudiantes[4].id, asesor_academico_id: asesores[2].id, fecha_postulacion: new Date('2024-01-15'), estado: EstadoPostulacion.finalizado },
    { oferta_id: ofertas[2].id, estudiante_id: estudiantes[5].id, asesor_academico_id: asesores[3].id, fecha_postulacion: new Date('2024-02-01'), estado: EstadoPostulacion.finalizado },
    { oferta_id: ofertas[0].id, estudiante_id: estudiantes[6].id, asesor_academico_id: null, fecha_postulacion: new Date('2024-04-10'), estado: EstadoPostulacion.finalizado },
    { oferta_id: ofertas[3].id, estudiante_id: estudiantes[10].id, asesor_academico_id: null, fecha_postulacion: new Date('2024-05-01'), estado: EstadoPostulacion.postulado, requiere_convenio_especifico: true, estado_convenio_especifico: EstadoConvenioEspecifico.pendiente },
  ];

  const postulaciones = [];
  for (const post of postulacionesData) {
    const created = await prisma.postulacion.create({ data: post });
    postulaciones.push(created);

    if (post.asesor_academico_id) {
      await prisma.asesorPostulacion.create({
        data: { asesor_id: post.asesor_academico_id, postulacion_id: created.id },
      });
    }
  }
  return postulaciones;
}

async function createPracticas(postulaciones: any[], estudiantes: any[], asesores: any[], usuarios: any[]) {
  const secretariaSistemas = usuarios.find(u => u.email === 'secretaria.sistemas@unitru.edu.pe');
  const secretariaIndustrial = usuarios.find(u => u.email === 'secretaria.industrial@unitru.edu.pe');
  const asesorJuan = asesores[0]; // juan.garcia
  const asesorMiguel = asesores[2]; // miguel.ramirez
  const asesorCarmen = asesores[3]; // carmen.flores

  // ─────────────────────────────────────
  // PRÁCTICA 1: Carlos López - EN EJECUCIÓN (180/300 horas)
  // ─────────────────────────────────────
  const practica1 = await prisma.practica.create({
    data: {
      estudiante_id: estudiantes[0].id,
      postulacion_id: postulaciones[0].id,
      asesor_id: asesorJuan.id,
      estado: EstadoPractica.en_ejecucion,
      // Plan validado por secretaría
      plan_practicas_url: 'plan-practicas-carlos-lopez.pdf',
      plan_practicas_subido_en: new Date('2024-03-10'),
      plan_validado: true,
      plan_validado_por: secretariaSistemas.id,
      plan_validado_en: new Date('2024-03-12'),
      // Ejecución
      fecha_inicio: new Date('2024-04-01'),
      fecha_fin_estimada: new Date('2024-09-30'),
      horas_cumplidas: 180,
      horas_totales: 300,
    },
  });

  // Documento de plan de prácticas
  await prisma.documentoPractica.create({
    data: {
      practica_id: practica1.id,
      tipo: TipoDocumentoPractica.plan_practicas,
      archivo_url: 'plan-practicas-carlos-lopez.pdf',
      nombre_original: 'Plan_Practicas_Carlos_Lopez.pdf',
      subido_por: estudiantes[0].usuario_id,
      subido_en: new Date('2024-03-10'),
      validado: true,
      validado_por: secretariaSistemas.id,
      validado_en: new Date('2024-03-12'),
      observaciones: 'Plan de prácticas aprobado. Actividades alineadas al perfil.',
    },
  });

  // Reportes mensuales
  const reportesCarlos = [
    { anio: 2024, mes: 4, horas_reportadas: 60, archivo_url: 'reporte-abril-2024-carlos.pdf', observaciones: 'Adaptación al entorno de desarrollo.' },
    { anio: 2024, mes: 5, horas_reportadas: 60, archivo_url: 'reporte-mayo-2024-carlos.pdf', observaciones: 'Desarrollo de API REST para módulo de usuarios.' },
    { anio: 2024, mes: 6, horas_reportadas: 60, archivo_url: 'reporte-junio-2024-carlos.pdf', observaciones: 'Implementación de microservicios con Docker.' },
  ];
  for (const rep of reportesCarlos) {
    await prisma.reporteMensualPractica.create({
      data: { ...rep, practica_id: practica1.id },
    });
  }

  // ─────────────────────────────────────
  // PRÁCTICA 2: María Huamán - EN EJECUCIÓN (150/300 horas)
  // ─────────────────────────────────────
  const practica2 = await prisma.practica.create({
    data: {
      estudiante_id: estudiantes[1].id,
      postulacion_id: postulaciones[1].id,
      asesor_id: asesorJuan.id,
      estado: EstadoPractica.en_ejecucion,
      plan_practicas_url: 'plan-practicas-maria-huaman.pdf',
      plan_practicas_subido_en: new Date('2024-03-15'),
      plan_validado: true,
      plan_validado_por: secretariaSistemas.id,
      plan_validado_en: new Date('2024-03-18'),
      fecha_inicio: new Date('2024-04-15'),
      fecha_fin_estimada: new Date('2024-10-15'),
      horas_cumplidas: 150,
      horas_totales: 300,
    },
  });

  await prisma.documentoPractica.create({
    data: {
      practica_id: practica2.id,
      tipo: TipoDocumentoPractica.plan_practicas,
      archivo_url: 'plan-practicas-maria-huaman.pdf',
      subido_por: estudiantes[1].usuario_id,
      subido_en: new Date('2024-03-15'),
      validado: true,
      validado_por: secretariaSistemas.id,
      validado_en: new Date('2024-03-18'),
    },
  });

  const reportesMaria = [
    { anio: 2024, mes: 4, horas_reportadas: 50, archivo_url: 'reporte-abril-2024-maria.pdf', observaciones: 'Inicio de prácticas frontend.' },
    { anio: 2024, mes: 5, horas_reportadas: 50, archivo_url: 'reporte-mayo-2024-maria.pdf', observaciones: 'Componentes React.' },
    { anio: 2024, mes: 6, horas_reportadas: 50, archivo_url: 'reporte-junio-2024-maria.pdf', observaciones: 'Diseños responsivos.' },
  ];
  for (const rep of reportesMaria) {
    await prisma.reporteMensualPractica.create({
      data: { ...rep, practica_id: practica2.id },
    });
  }

  // ─────────────────────────────────────
  // PRÁCTICA 3: Diego Chávez - APROBADO (300/300, INFORME FIRMADO, RESOLUCIÓN)
  // ─────────────────────────────────────
  const practica3 = await prisma.practica.create({
    data: {
      estudiante_id: estudiantes[4].id,
      postulacion_id: postulaciones[4].id,
      asesor_id: asesorMiguel.id,
      estado: EstadoPractica.aprobado,
      // Plan validado
      plan_practicas_url: 'plan-practicas-diego-chavez.pdf',
      plan_practicas_subido_en: new Date('2024-01-05'),
      plan_validado: true,
      plan_validado_por: secretariaSistemas.id,
      plan_validado_en: new Date('2024-01-10'),
      // Ejecución completa
      fecha_inicio: new Date('2024-01-15'),
      fecha_fin_estimada: new Date('2024-07-15'),
      horas_cumplidas: 300,
      horas_totales: 300,
      // Informe final firmado por asesor
      informe_final_url: 'informe-final-diego-chavez.pdf',
      informe_final_subido_en: new Date('2024-07-10'),
      informe_aprobado: true,
      informe_aprobado_en: new Date('2024-07-15'),
      informe_aprobado_por: asesorMiguel.usuario_id,
      // Resolución de facultad
      resolucion_numero: 'RES-2024-005-UNT-FI',
      resolucion_url: 'resolucion-practicas-diego-chavez.pdf',
      resolucion_cargado_en: new Date('2024-07-20'),
      resolucion_cargado_por: usuarios.find(u => u.email === 'admin@unitru.edu.pe').id,
    },
  });

  await prisma.documentoPractica.create({
    data: {
      practica_id: practica3.id,
      tipo: TipoDocumentoPractica.plan_practicas,
      archivo_url: 'plan-practicas-diego-chavez.pdf',
      subido_por: estudiantes[4].usuario_id,
      subido_en: new Date('2024-01-05'),
      validado: true,
      validado_por: secretariaSistemas.id,
      validado_en: new Date('2024-01-10'),
    },
  });

  await prisma.documentoPractica.create({
    data: {
      practica_id: practica3.id,
      tipo: TipoDocumentoPractica.informe_final,
      archivo_url: 'informe-final-diego-chavez.pdf',
      nombre_original: 'Informe_Final_Diego_Chavez.pdf',
      subido_por: estudiantes[4].usuario_id,
      subido_en: new Date('2024-07-10'),
      validado: true,
      validado_por: asesorMiguel.usuario_id,
      validado_en: new Date('2024-07-15'),
    },
  });

  await prisma.documentoPractica.create({
    data: {
      practica_id: practica3.id,
      tipo: TipoDocumentoPractica.acta_aprobacion_asesor,
      archivo_url: 'acta-aprobacion-diego-chavez.pdf',
      subido_por: asesorMiguel.usuario_id,
      subido_en: new Date('2024-07-15'),
      validado: true,
    },
  });

  await prisma.documentoPractica.create({
    data: {
      practica_id: practica3.id,
      tipo: TipoDocumentoPractica.resolucion_facultad,
      archivo_url: 'resolucion-practicas-diego-chavez.pdf',
      subido_por: usuarios.find(u => u.email === 'admin@unitru.edu.pe').id,
      subido_en: new Date('2024-07-20'),
      validado: true,
    },
  });

  const reportesDiego = [
    { anio: 2024, mes: 1, horas_reportadas: 75, archivo_url: 'reporte-enero-2024-diego.pdf', observaciones: 'Inicio de prácticas en obra.' },
    { anio: 2024, mes: 2, horas_reportadas: 75, archivo_url: 'reporte-febrero-2024-diego.pdf', observaciones: 'Supervisión de obra 1.' },
    { anio: 2024, mes: 3, horas_reportadas: 75, archivo_url: 'reporte-marzo-2024-diego.pdf', observaciones: 'Supervisión de obra 2.' },
    { anio: 2024, mes: 4, horas_reportadas: 75, archivo_url: 'reporte-abril-2024-diego.pdf', observaciones: 'Supervisión de obra 3.' },
  ];
  for (const rep of reportesDiego) {
    await prisma.reporteMensualPractica.create({
      data: { ...rep, practica_id: practica3.id },
    });
  }

  // ─────────────────────────────────────
  // PRÁCTICA 4: Andrea Rivas - INFORME PENDIENTE (280/300)
  // ─────────────────────────────────────
  const practica4 = await prisma.practica.create({
    data: {
      estudiante_id: estudiantes[5].id,
      postulacion_id: postulaciones[5].id,
      asesor_id: asesorCarmen.id,
      estado: EstadoPractica.informe_pendiente,
      plan_practicas_url: 'plan-practicas-andrea-rivas.pdf',
      plan_practicas_subido_en: new Date('2024-01-20'),
      plan_validado: true,
      plan_validado_por: secretariaIndustrial.id,
      plan_validado_en: new Date('2024-01-25'),
      fecha_inicio: new Date('2024-02-01'),
      fecha_fin_estimada: new Date('2024-08-01'),
      horas_cumplidas: 280,
      horas_totales: 300,
      informe_final_url: 'informe-final-andrea-rivas.pdf',
      informe_final_subido_en: new Date('2024-07-25'),
      informe_aprobado: false,
      informe_observaciones: 'Pendiente completar sección de conclusiones.',
    },
  });

  await prisma.documentoPractica.create({
    data: {
      practica_id: practica4.id,
      tipo: TipoDocumentoPractica.plan_practicas,
      archivo_url: 'plan-practicas-andrea-rivas.pdf',
      subido_por: estudiantes[5].usuario_id,
      subido_en: new Date('2024-01-20'),
      validado: true,
      validado_por: secretariaIndustrial.id,
      validado_en: new Date('2024-01-25'),
    },
  });

  await prisma.documentoPractica.create({
    data: {
      practica_id: practica4.id,
      tipo: TipoDocumentoPractica.informe_final,
      archivo_url: 'informe-final-andrea-rivas.pdf',
      subido_por: estudiantes[5].usuario_id,
      subido_en: new Date('2024-07-25'),
      validado: false,
      observaciones: 'Pendiente firma del asesor.',
    },
  });

  // ─────────────────────────────────────
  // PRÁCTICA 5: Eduardo Ramos - PLAN PENDIENTE (Secretaría no ha validado)
  // ─────────────────────────────────────
  const practica5 = await prisma.practica.create({
    data: {
      estudiante_id: estudiantes[10].id,
      postulacion_id: postulaciones[7].id,
      asesor_id: null,
      estado: EstadoPractica.plan_pendiente,
      plan_practicas_url: 'plan-practicas-eduardo-ramos.pdf',
      plan_practicas_subido_en: new Date('2024-05-05'),
      plan_validado: false,
      plan_observaciones: 'Plan de prácticas pendiente de revisión por secretaría.',
    },
  });

  await prisma.documentoPractica.create({
    data: {
      practica_id: practica5.id,
      tipo: TipoDocumentoPractica.plan_practicas,
      archivo_url: 'plan-practicas-eduardo-ramos.pdf',
      subido_por: estudiantes[10].usuario_id,
      subido_en: new Date('2024-05-05'),
      validado: false,
    },
  });

  return [practica1, practica2, practica3, practica4, practica5];
}

async function createPagosEstudiantes(estudiantes: any[], usuarios: any[]) {
  const adminUser = usuarios.find(u => u.email === 'admin@unitru.edu.pe');

  const pagosData = [
    // Diego Chávez - Turnitin pagado y verificado
    {
      estudiante_id: estudiantes[4].id,
      tipo: TipoPago.turnitin,
      monto: 87.00,
      estado: EstadoPago.verificado,
      comprobante_url: 'voucher-turnitin-diego-chavez.pdf',
      comprobante_subido_en: new Date('2024-07-05'),
      verificado_por: adminUser.id,
      verificado_en: new Date('2024-07-06'),
    },
    // Diego Chávez - Carpeta de tesis pagado y verificado
    {
      estudiante_id: estudiantes[4].id,
      tipo: TipoPago.carpeta_tesis,
      monto: 50.00,
      estado: EstadoPago.verificado,
      comprobante_url: 'voucher-carpeta-diego-chavez.pdf',
      comprobante_subido_en: new Date('2024-07-05'),
      verificado_por: adminUser.id,
      verificado_en: new Date('2024-07-06'),
    },
    // Andrea Rivas - Turnitin comprobante cargado, pendiente verificar
    {
      estudiante_id: estudiantes[5].id,
      tipo: TipoPago.turnitin,
      monto: 87.00,
      estado: EstadoPago.comprobante_cargado,
      comprobante_url: 'voucher-turnitin-andrea-rivas.pdf',
      comprobante_subido_en: new Date('2024-04-10'),
    },
    // Andrea Rivas - Derecho de sustentación pendiente
    {
      estudiante_id: estudiantes[5].id,
      tipo: TipoPago.derecho_sustentacion,
      monto: 150.00,
      estado: EstadoPago.pendiente,
    },
    // Carlos López - Turnitin pendiente
    {
      estudiante_id: estudiantes[0].id,
      tipo: TipoPago.turnitin,
      monto: 87.00,
      estado: EstadoPago.pendiente,
    },
    // Fernando Cruz - Turnitin verificado
    {
      estudiante_id: estudiantes[6].id,
      tipo: TipoPago.turnitin,
      monto: 87.00,
      estado: EstadoPago.verificado,
      comprobante_url: 'voucher-turnitin-fernando-cruz.pdf',
      comprobante_subido_en: new Date('2024-03-05'),
      verificado_por: adminUser.id,
      verificado_en: new Date('2024-03-06'),
    },
    // José Valencia - Pagos completos
    {
      estudiante_id: estudiantes[2].id,
      tipo: TipoPago.turnitin,
      monto: 87.00,
      estado: EstadoPago.verificado,
      comprobante_url: 'voucher-turnitin-jose-valencia.pdf',
      comprobante_subido_en: new Date('2024-03-01'),
      verificado_por: adminUser.id,
      verificado_en: new Date('2024-03-02'),
    },
    {
      estudiante_id: estudiantes[2].id,
      tipo: TipoPago.carpeta_tesis,
      monto: 50.00,
      estado: EstadoPago.verificado,
      comprobante_url: 'voucher-carpeta-jose-valencia.pdf',
      comprobante_subido_en: new Date('2024-03-01'),
      verificado_por: adminUser.id,
      verificado_en: new Date('2024-03-02'),
    },
    {
      estudiante_id: estudiantes[2].id,
      tipo: TipoPago.derecho_sustentacion,
      monto: 150.00,
      estado: EstadoPago.verificado,
      comprobante_url: 'voucher-sustentacion-jose-valencia.pdf',
      comprobante_subido_en: new Date('2024-05-01'),
      verificado_por: adminUser.id,
      verificado_en: new Date('2024-05-02'),
    },
  ];

  for (const pago of pagosData) {
    await prisma.pago.create({ data: pago });
  }
}

async function createTesis(estudiantes: any[], asesores: any[], usuarios: any[]) {
  const adminUser = usuarios.find(u => u.email === 'admin@unitru.edu.pe');
  const asesorJuan = asesores[0];
  const asesorPatricia = asesores[1];
  const asesorMiguel = asesores[2];
  const asesorCarmen = asesores[3];
  const asesorPedro = asesores[4];
  const asesorRosa = asesores[5];

  // ─────────────────────────────────────
  // TESIS 1: Andrea Rivas - EN DESARROLLO (Turnitin 12.5% OK)
  // ─────────────────────────────────────
  const tesis1 = await prisma.tesis.create({
    data: {
      titulo: 'Estrategias de Marketing Digital para MYPES en la Región La Libertad',
      resumen: 'Investigación sobre el impacto del marketing digital en las micro y pequeñas empresas de Trujillo.',
      estudiante_id: estudiantes[5].id,
      asesor_principal_id: asesorCarmen.id,
      estado: EstadoTesis.desarrollo,
      fecha_inicio: new Date('2024-03-01'),
      fecha_limite_sustentacion: new Date('2025-03-01'),
      recibo_turnitin_url: 'recibo-turnitin-tesis-andrea.pdf',
      recibo_turnitin_cargado_en: new Date('2024-04-15'),
      similitud_turnitin: 12.5,
      similitud_registrada_en: new Date('2024-04-20'),
      similitud_registrada_por_asesor_id: asesorCarmen.usuario_id,
    },
  });

  await prisma.documentoTesis.create({
    data: {
      tesis_id: tesis1.id,
      tipo: TipoDocumentoTesis.recibo_turnitin,
      archivo_url: 'recibo-turnitin-tesis-andrea.pdf',
      subido_por: estudiantes[5].usuario_id,
      subido_en: new Date('2024-04-15'),
      validado: true,
    },
  });

  await prisma.avanceTesis.createMany({
    data: [
      { tesis_id: tesis1.id, tipo: 'capitulo', descripcion: 'Capítulo I: Introducción', fecha_entrega: new Date('2024-04-15'), estado: 'aprobado' },
      { tesis_id: tesis1.id, tipo: 'capitulo', descripcion: 'Capítulo II: Marco Teórico', fecha_entrega: new Date('2024-05-15'), estado: 'revisado' },
    ],
  });

  // ─────────────────────────────────────
  // TESIS 2: Fernando Cruz - EN DESARROLLO (Turnitin 28.5% ⚠️ BLOQUEA JURADO)
  // ─────────────────────────────────────
  const tesis2 = await prisma.tesis.create({
    data: {
      titulo: 'Implementación de Normas Internacionales de Auditoría en Empresas Trujillanas',
      resumen: 'Análisis de la adopción de NIAs en empresas medianas de Trujillo.',
      estudiante_id: estudiantes[6].id,
      asesor_principal_id: asesorPedro.id,
      estado: EstadoTesis.desarrollo, // No puede pasar a "en_revision" hasta bajar similitud
      fecha_inicio: new Date('2024-02-01'),
      fecha_limite_sustentacion: new Date('2025-02-01'),
      recibo_turnitin_url: 'recibo-turnitin-tesis-fernando.pdf',
      recibo_turnitin_cargado_en: new Date('2024-03-10'),
      similitud_turnitin: 28.5, // ⚠️ SUPERA 25%
      similitud_registrada_en: new Date('2024-03-15'),
      similitud_registrada_por_asesor_id: asesorPedro.usuario_id,
    },
  });

  await prisma.documentoTesis.create({
    data: {
      tesis_id: tesis2.id,
      tipo: TipoDocumentoTesis.recibo_turnitin,
      archivo_url: 'recibo-turnitin-tesis-fernando.pdf',
      subido_por: estudiantes[6].usuario_id,
      subido_en: new Date('2024-03-10'),
      validado: true,
    },
  });

  await prisma.avanceTesis.createMany({
    data: [
      { tesis_id: tesis2.id, tipo: 'capitulo', descripcion: 'Capítulo I: Introducción', fecha_entrega: new Date('2024-03-15'), estado: 'aprobado' },
      { tesis_id: tesis2.id, tipo: 'capitulo', descripcion: 'Capítulo II: Marco Teórico', fecha_entrega: new Date('2024-04-15'), estado: 'revisado' },
      { tesis_id: tesis2.id, tipo: 'informe', descripcion: 'Informe de avance al 50%', fecha_entrega: new Date('2024-05-15'), estado: 'entregado' },
    ],
  });

  // ─────────────────────────────────────
  // TESIS 3: Gabriela Marín - EN REVISIÓN (Jurado con observaciones)
  // ─────────────────────────────────────
  const tesis3 = await prisma.tesis.create({
    data: {
      titulo: 'Análisis de Eficiencia en Procesos Industriales usando Machine Learning',
      resumen: 'Aplicación de algoritmos de machine learning para optimizar procesos industriales.',
      estudiante_id: estudiantes[7].id,
      asesor_principal_id: asesorPatricia.id,
      estado: EstadoTesis.observaciones_emitidas, // Jurado puso observaciones
      fecha_inicio: new Date('2023-08-01'),
      fecha_recepcion_documentos: new Date('2024-01-15'),
      fecha_limite_sustentacion: new Date('2024-12-31'),
      recibo_turnitin_url: 'recibo-turnitin-tesis-gabriela.pdf',
      recibo_turnitin_cargado_en: new Date('2024-01-10'),
      similitud_turnitin: 8.3,
      similitud_registrada_en: new Date('2024-01-15'),
      similitud_registrada_por_asesor_id: asesorPatricia.usuario_id,
    },
  });

  await prisma.documentoTesis.create({
    data: {
      tesis_id: tesis3.id,
      tipo: TipoDocumentoTesis.tesis_final,
      archivo_url: 'tesis-final-gabriela-marin-v1.pdf',
      version: 1,
      subido_por: estudiantes[7].usuario_id,
      subido_en: new Date('2024-01-15'),
      validado: true,
    },
  });

  await prisma.documentoTesis.create({
    data: {
      tesis_id: tesis3.id,
      tipo: TipoDocumentoTesis.recibo_turnitin,
      archivo_url: 'recibo-turnitin-tesis-gabriela.pdf',
      subido_por: estudiantes[7].usuario_id,
      subido_en: new Date('2024-01-10'),
      validado: true,
    },
  });

  await prisma.avanceTesis.createMany({
    data: [
      { tesis_id: tesis3.id, tipo: 'capitulo', descripcion: 'Capítulo I: Introducción', fecha_entrega: new Date('2023-09-15'), estado: 'aprobado' },
      { tesis_id: tesis3.id, tipo: 'capitulo', descripcion: 'Capítulo II: Marco Teórico', fecha_entrega: new Date('2023-10-15'), estado: 'aprobado' },
      { tesis_id: tesis3.id, tipo: 'capitulo', descripcion: 'Capítulo III: Metodología', fecha_entrega: new Date('2023-11-15'), estado: 'aprobado' },
      { tesis_id: tesis3.id, tipo: 'capitulo', descripcion: 'Capítulo IV: Resultados', fecha_entrega: new Date('2024-01-15'), estado: 'aprobado' },
      { tesis_id: tesis3.id, tipo: 'informe', descripcion: 'Informe final para revisión', fecha_entrega: new Date('2024-02-15'), estado: 'aprobado' },
    ],
  });

  // Asignar jurado (3 docentes)
  const juradoTesis3 = [
    { tesis_id: tesis3.id, asesor_id: asesorJuan.id, rol: 'presidente', asignado_en: new Date('2024-02-20') },
    { tesis_id: tesis3.id, asesor_id: asesorMiguel.id, rol: 'secretario', asignado_en: new Date('2024-02-20') },
    { tesis_id: tesis3.id, asesor_id: asesorCarmen.id, rol: 'vocal', asignado_en: new Date('2024-02-20') },
  ];
  const juradosCreados = [];
  for (const jurado of juradoTesis3) {
    const created = await prisma.juradoTesis.create({ data: jurado });
    juradosCreados.push(created);
  }

  // Revisiones del jurado
  // Presidente: CONFORME
  await prisma.revisionJurado.create({
    data: {
      jurado_tesis_id: juradosCreados[0].id,
      estado: EstadoRevisionJurado.conforme,
      conforme: true,
      revisado_en: new Date('2024-03-10'),
      version_documento: 1,
    },
  });

  // Secretario: CON OBSERVACIONES
  await prisma.revisionJurado.create({
    data: {
      jurado_tesis_id: juradosCreados[1].id,
      estado: EstadoRevisionJurado.observaciones,
      observaciones: 'Corregir metodología: falta justificar tamaño de muestra. Revisar normalidad de datos en sección 3.2.',
      conforme: false,
      revisado_en: new Date('2024-03-12'),
      version_documento: 1,
    },
  });

  // Vocal: CONFORME
  await prisma.revisionJurado.create({
    data: {
      jurado_tesis_id: juradosCreados[2].id,
      estado: EstadoRevisionJurado.conforme,
      conforme: true,
      revisado_en: new Date('2024-03-08'),
      version_documento: 1,
    },
  });

  // ─────────────────────────────────────
  // TESIS 4: José Valencia - EXPEDITO (Prácticas OK, Pagos OK, Jurado conforme)
  // ─────────────────────────────────────
  const tesis4 = await prisma.tesis.create({
    data: {
      titulo: 'Optimización de Procesos de Manufactura mediante Lean Six Sigma',
      resumen: 'Implementación de metodología Lean Six Sigma para reducción de defectos en línea de producción.',
      estudiante_id: estudiantes[2].id,
      asesor_principal_id: asesorPatricia.id,
      estado: EstadoTesis.expedito,
      fecha_inicio: new Date('2023-06-01'),
      fecha_recepcion_documentos: new Date('2024-02-15'),
      fecha_limite_sustentacion: new Date('2024-06-01'),
      recibo_turnitin_url: 'recibo-turnitin-tesis-jose.pdf',
      recibo_turnitin_cargado_en: new Date('2024-02-10'),
      similitud_turnitin: 9.1,
      similitud_registrada_en: new Date('2024-02-15'),
      similitud_registrada_por_asesor_id: asesorPatricia.usuario_id,
    },
  });

  await prisma.documentoTesis.create({
    data: {
      tesis_id: tesis4.id,
      tipo: TipoDocumentoTesis.tesis_final,
      archivo_url: 'tesis-final-jose-valencia.pdf',
      version: 1,
      subido_por: estudiantes[2].usuario_id,
      subido_en: new Date('2024-02-15'),
      validado: true,
    },
  });

  await prisma.documentoTesis.create({
    data: {
      tesis_id: tesis4.id,
      tipo: TipoDocumentoTesis.recibo_turnitin,
      archivo_url: 'recibo-turnitin-tesis-jose.pdf',
      subido_por: estudiantes[2].usuario_id,
      subido_en: new Date('2024-02-10'),
      validado: true,
    },
  });

  // Jurado todo conforme
  const juradoTesis4 = [
    { tesis_id: tesis4.id, asesor_id: asesorMiguel.id, rol: 'presidente' },
    { tesis_id: tesis4.id, asesor_id: asesorPedro.id, rol: 'secretario' },
    { tesis_id: tesis4.id, asesor_id: asesorRosa.id, rol: 'vocal' },
  ];
  const juradosT4 = [];
  for (const jurado of juradoTesis4) {
    const created = await prisma.juradoTesis.create({ data: jurado });
    juradosT4.push(created);
  }

  for (const jurado of juradosT4) {
    await prisma.revisionJurado.create({
      data: {
        jurado_tesis_id: jurado.id,
        estado: EstadoRevisionJurado.conforme,
        conforme: true,
        revisado_en: new Date('2024-03-01'),
        version_documento: 1,
      },
    });
  }

  // ─────────────────────────────────────
  // TESIS 5: Ricardo León - CULMINADO (Acta generada)
  // ─────────────────────────────────────
  const tesis5 = await prisma.tesis.create({
    data: {
      titulo: 'Evaluación Estructural de Edificaciones Antisísmicas en Trujillo',
      resumen: 'Estudio de resistencia sísmica de edificaciones en el centro histórico de Trujillo.',
      estudiante_id: estudiantes[8].id,
      asesor_principal_id: asesorMiguel.id,
      estado: EstadoTesis.culminado,
      fecha_inicio: new Date('2023-03-01'),
      fecha_recepcion_documentos: new Date('2023-12-15'),
      fecha_sustentacion: new Date('2024-02-20'),
      fecha_limite_sustentacion: new Date('2024-06-30'),
      recibo_turnitin_url: 'recibo-turnitin-tesis-ricardo.pdf',
      recibo_turnitin_cargado_en: new Date('2023-12-15'),
      similitud_turnitin: 5.2,
      similitud_registrada_en: new Date('2023-12-20'),
      similitud_registrada_por_asesor_id: asesorMiguel.usuario_id,
    },
  });

  await prisma.documentoTesis.create({
    data: {
      tesis_id: tesis5.id,
      tipo: TipoDocumentoTesis.tesis_final,
      archivo_url: 'tesis-final-ricardo-leon.pdf',
      subido_por: estudiantes[8].usuario_id,
      subido_en: new Date('2023-12-15'),
      validado: true,
    },
  });

  // Acta de sustentación
  await prisma.actaSustentacion.create({
    data: {
      tesis_id: tesis5.id,
      fecha: new Date('2024-02-20'),
      lugar: 'Auditorio de la Facultad de Ingeniería - UNT',
      nota_final: 17.5,
      archivo_acta_pdf: 'acta-sustentacion-2024-001-UNT.pdf',
      calificaciones_jurado: {
        presidente: { nombre: 'Juan García Pérez', nota: 18.0 },
        secretario: { nombre: 'Pedro Castillo Medina', nota: 17.0 },
        vocal: { nombre: 'Rosa Quispe Mamani', nota: 17.5 },
      },
    },
  });

  // ─────────────────────────────────────
  // TESIS 6: Carlos López - EN DESARROLLO (16 meses - ALERTA VENCIMIENTO)
  // ─────────────────────────────────────
  const tesis6 = await prisma.tesis.create({
    data: {
      titulo: 'Sistema de Gestión de Prácticas Preprofesionales con Microservicios',
      resumen: 'Desarrollo de un sistema web para la gestión de prácticas preprofesionales.',
      estudiante_id: estudiantes[0].id,
      asesor_principal_id: asesorJuan.id,
      estado: EstadoTesis.desarrollo,
      fecha_inicio: new Date('2023-01-15'), // Más de 16 meses
      fecha_limite_sustentacion: new Date('2024-07-15'), // Próximo a vencer
      recibo_turnitin_url: 'recibo-turnitin-tesis-carlos.pdf',
      recibo_turnitin_cargado_en: new Date('2023-06-15'),
      similitud_turnitin: 15.0,
      similitud_registrada_en: new Date('2023-06-20'),
      similitud_registrada_por_asesor_id: asesorJuan.usuario_id,
    },
  });

  await prisma.documentoTesis.create({
    data: {
      tesis_id: tesis6.id,
      tipo: TipoDocumentoTesis.recibo_turnitin,
      archivo_url: 'recibo-turnitin-tesis-carlos.pdf',
      subido_por: estudiantes[0].usuario_id,
      subido_en: new Date('2023-06-15'),
      validado: true,
    },
  });

  await prisma.avanceTesis.createMany({
    data: [
      { tesis_id: tesis6.id, tipo: 'capitulo', descripcion: 'Capítulo I: Introducción', fecha_entrega: new Date('2023-03-15'), estado: 'aprobado' },
      { tesis_id: tesis6.id, tipo: 'capitulo', descripcion: 'Capítulo II: Marco Teórico', fecha_entrega: new Date('2023-08-15'), estado: 'revisado' },
    ],
  });

  return [tesis1, tesis2, tesis3, tesis4, tesis5, tesis6];
}

async function createNotificaciones(usuarios: any[], estudiantes: any[], asesores: any[]) {
  const coordinadorSistemas = usuarios.find(u => u.email === 'coordinador.sistemas@unitru.edu.pe');
  const secretariaSistemas = usuarios.find(u => u.email === 'secretaria.sistemas@unitru.edu.pe');
  const asesorJuan = usuarios.find(u => u.email === 'juan.garcia@unitru.edu.pe');
  const estudianteEduardo = usuarios.find(u => u.email === 'eduardo.ramos@unitru.edu.pe');
  const estudianteGabriela = usuarios.find(u => u.email === 'gabriela.marin@unitru.edu.pe');
  const estudianteDiego = usuarios.find(u => u.email === 'diego.chavez@unitru.edu.pe');
  const estudianteJose = usuarios.find(u => u.email === 'jose.valencia@unitru.edu.pe');

  const notificacionesData = [
    // Para Secretaría: Plan de prácticas pendiente
    {
      usuario_id: secretariaSistemas.id,
      titulo: '📋 Plan de prácticas pendiente de revisión',
      mensaje: 'El estudiante Eduardo Ramos (20201011) ha subido su plan de prácticas y está pendiente de validación.',
      leida: false,
      metadata: { tipo: 'plan_pendiente', estudiante_id: estudiantes[10].id, practica_id: 5 },
    },
    // Para Estudiante: Plan no validado aún
    {
      usuario_id: estudianteEduardo.id,
      titulo: '⏳ Plan de prácticas en revisión',
      mensaje: 'Tu plan de prácticas ha sido recibido y está siendo revisado por secretaría.',
      leida: true,
      metadata: { tipo: 'plan_en_revision' },
    },
    // Para Coordinador: Alerta de similitud Turnitin
    {
      usuario_id: coordinadorSistemas.id,
      titulo: '⚠️ Similitud Turnitin excedida',
      mensaje: 'La tesis "Implementación de Normas Internacionales de Auditoría" de Fernando Cruz presenta 28.5% de similitud. No se puede asignar jurado hasta que baje del 25%.',
      leida: false,
      metadata: { tipo: 'similitud_alta', porcentaje: 28.5, tesis: 'Implementación de Normas Internacionales de Auditoría' },
    },
    // Para Estudiante Gabriela: Observaciones del jurado
    {
      usuario_id: estudianteGabriela.id,
      titulo: '📝 Tienes observaciones de los jurados',
      mensaje: 'El jurado secretario ha emitido observaciones a tu tesis. Ingresa al sistema para revisarlas y subir la versión corregida.',
      leida: false,
      metadata: { tipo: 'observaciones_jurado', tesis: 'Análisis de Eficiencia en Procesos Industriales', jurado: 'Miguel Ramírez' },
    },
    // Para Asesor Juan: Asignado como jurado
    {
      usuario_id: asesorJuan.id,
      titulo: '📌 Designación como jurado de tesis',
      mensaje: 'Has sido designado como PRESIDENTE del jurado para la tesis "Análisis de Eficiencia en Procesos Industriales usando Machine Learning" de Gabriela Marín.',
      leida: false,
      metadata: { tipo: 'asignacion_jurado', rol: 'presidente', tesis: 'Análisis de Eficiencia en Procesos Industriales' },
    },
    // Para Estudiante Diego: Prácticas aprobadas
    {
      usuario_id: estudianteDiego.id,
      titulo: '✅ ¡Prácticas aprobadas!',
      mensaje: 'Tu informe final de prácticas ha sido aprobado por tu asesor. La resolución de facultad ha sido cargada. Ya puedes iniciar tu proceso de tesis.',
      leida: true,
      metadata: { tipo: 'practicas_aprobadas', resolucion: 'RES-2024-005-UNT-FI' },
    },
    // Para Estudiante José: Expedito para sustentar
    {
      usuario_id: estudianteJose.id,
      titulo: '🎯 ¡Estás expedito para sustentar!',
      mensaje: 'Todos tus documentos han sido validados, los pagos están verificados y el jurado ha dado su conformidad. Solicita la programación de tu fecha de sustentación.',
      leida: false,
      metadata: { tipo: 'expedito', tesis: 'Optimización de Procesos de Manufactura mediante Lean Six Sigma' },
    },
    // Para Coordinador: Alerta de vencimiento de tesis
    {
      usuario_id: coordinadorSistemas.id,
      titulo: '⏰ Tesis próxima a vencer',
      mensaje: 'La tesis de Carlos López tiene 16 meses de antigüedad y su fecha límite de sustentación es el 15/07/2024. Solo tiene 2 avances registrados.',
      leida: false,
      metadata: { tipo: 'alerta_vencimiento', meses: 16, estudiante: 'Carlos López', fecha_limite: '2024-07-15' },
    },
    // Para Secretaría: Documentos listos para validación final
    {
      usuario_id: secretariaSistemas.id,
      titulo: '📄 Validación final requerida',
      mensaje: 'El estudiante José Valencia tiene todos los documentos y pagos completos. Se requiere validación administrativa final.',
      leida: false,
      metadata: { tipo: 'validacion_final', estudiante: 'José Valencia', estado: 'expedito' },
    },
  ];

  for (const notif of notificacionesData) {
    await prisma.notificacion.create({ data: notif });
  }
}

async function createReportes(usuarios: any[]) {
  const adminUser = usuarios.find(u => u.email === 'admin@unitru.edu.pe');
  const coordinadorSistemas = usuarios.find(u => u.email === 'coordinador.sistemas@unitru.edu.pe');

  const reportesData = [
    { tipo: 'practicas_general', parametros: { periodo: '2024-1', formato: 'pdf' }, generado_por: adminUser.id, generado_en: new Date('2024-06-01') },
    { tipo: 'tesis_estado', parametros: { periodo: '2024-1', formato: 'pdf' }, generado_por: adminUser.id, generado_en: new Date('2024-06-01') },
    { tipo: 'embudo_conversion', parametros: { metrica: 'workflow', formato: 'dashboard' }, generado_por: coordinadorSistemas.id, generado_en: new Date('2024-06-15') },
    { tipo: 'alertas_vencimiento', parametros: { tipo: 'tesis_proximas_vencer', formato: 'pdf' }, generado_por: coordinadorSistemas.id, generado_en: new Date('2024-06-15') },
    { tipo: 'acta_sustentacion', parametros: { tesis_id: 5, formato: 'pdf', plantilla: 'FUT-UNT' }, generado_por: adminUser.id, generado_en: new Date('2024-02-20') },
  ];

  for (const reporte of reportesData) {
    await prisma.reporte.create({ data: reporte });
  }
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });