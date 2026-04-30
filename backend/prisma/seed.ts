import { PrismaClient, RolNombre, EstadoPostulacion, EstadoTesis } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  await cleanDatabase();

  const roles = await createRoles();
  console.log('✅ Roles creados');

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

  await createSeguimientos(postulaciones);
  console.log('✅ Seguimientos creados');

  await createTesis(estudiantes, asesores);
  console.log('✅ Tesis creadas');

  await createReportes(usuarios);
  console.log('✅ Reportes creados');

  console.log('🎉 Seed completado exitosamente!');
  console.log('📧 Credenciales de acceso:');
  console.log('   Admin: admin@unitru.edu.pe / Admin123@');
  console.log('   Coordinador: coordinador.sistemas@unitru.edu.pe / Coord123@');
  console.log('   Asesor: juan.garcia@unitru.edu.pe / Asesor123@');
  console.log('   Estudiante: carlos.lopez@unitru.edu.pe / Estu123@');
  console.log('   Empresa: rrhh@techcorp.com / Empresa123@');
}

async function cleanDatabase() {
  await prisma.$transaction([
    prisma.reporte.deleteMany(),
    prisma.actaSustentacion.deleteMany(),
    prisma.avanceTesis.deleteMany(),
    prisma.juradoTesis.deleteMany(),
    prisma.tesis.deleteMany(),
    prisma.seguimientoPractica.deleteMany(),
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
    { nombre: RolNombre.admin, descripcion: 'Administrador del sistema con acceso completo' },
    { nombre: RolNombre.coordinador, descripcion: 'Coordinador de facultad encargado de aprobar prácticas' },
    { nombre: RolNombre.asesor, descripcion: 'Docente asesor de prácticas y tesis' },
    { nombre: RolNombre.estudiante, descripcion: 'Estudiante de pregrado' },
    { nombre: RolNombre.empresa, descripcion: 'Representante de empresa para gestión de ofertas' },
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
  const asesorRol = roles.find(r => r.nombre === RolNombre.asesor);
  const estudianteRol = roles.find(r => r.nombre === RolNombre.estudiante);
  const empresaRol = roles.find(r => r.nombre === RolNombre.empresa);

  const usuariosData = [
    {
      email: 'admin@unitru.edu.pe',
      password: await bcrypt.hash('Admin123@', 10),
      nombres: 'Carlos',
      apellidos: 'Rodríguez Mendoza',
      dni: '18123456',
      telefono: '999888777',
      roles: [adminRol],
    },
    {
      email: 'admin2@unitru.edu.pe',
      password: await bcrypt.hash('Admin123@', 10),
      nombres: 'María',
      apellidos: 'Fernández Silva',
      dni: '18123457',
      telefono: '999888778',
      roles: [adminRol],
    },
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
    {
      email: 'coordinador.administracion@unitru.edu.pe',
      password: await bcrypt.hash('Coord123@', 10),
      nombres: 'Roberto',
      apellidos: 'Díaz López',
      dni: '18234569',
      telefono: '999777668',
      roles: [coordinadorRol],
    },
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
      email: 'rrhh@softperu.com',
      password: await bcrypt.hash('Empresa123@', 10),
      nombres: 'Rosa',
      apellidos: 'Cabrera Huertas',
      dni: '18567892',
      telefono: '999444335',
      roles: [empresaRol],
    },
    {
      email: 'rrhh@construye.com',
      password: await bcrypt.hash('Empresa123@', 10),
      nombres: 'Mario',
      apellidos: 'Tenorio Palacios',
      dni: '18567893',
      telefono: '999444336',
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
        data: {
          usuario_id: usuario.id,
          rol_id: rol.id,
        },
      });
    }

    usuarios.push({ ...usuario, roles: userRoles });
  }

  return usuarios;
}

async function createEstudiantes(usuarios: any[], escuelas: any[]) {
  const estudiantesData = [
    { usuario_id: usuarios.find(u => u.email === 'carlos.lopez@unitru.edu.pe').id, escuela_id: escuelas[0].id, codigo_universitario: '20201001', ciclo: 'VIII', resolucion_practicas: 'RES-2024-001' },
    { usuario_id: usuarios.find(u => u.email === 'maria.huaman@unitru.edu.pe').id, escuela_id: escuelas[0].id, codigo_universitario: '20201002', ciclo: 'VIII', resolucion_practicas: 'RES-2024-002' },
    { usuario_id: usuarios.find(u => u.email === 'jose.valencia@unitru.edu.pe').id, escuela_id: escuelas[1].id, codigo_universitario: '20201003', ciclo: 'IX', resolucion_practicas: 'RES-2024-003' },
    { usuario_id: usuarios.find(u => u.email === 'lucia.torres@unitru.edu.pe').id, escuela_id: escuelas[1].id, codigo_universitario: '20201004', ciclo: 'IX', resolucion_practicas: 'RES-2024-004' },
    { usuario_id: usuarios.find(u => u.email === 'diego.chavez@unitru.edu.pe').id, escuela_id: escuelas[2].id, codigo_universitario: '20201005', ciclo: 'X', resolucion_practicas: 'RES-2024-005' },
    { usuario_id: usuarios.find(u => u.email === 'andrea.rivas@unitru.edu.pe').id, escuela_id: escuelas[3].id, codigo_universitario: '20201006', ciclo: 'VIII', resolucion_practicas: 'RES-2024-006' },
    { usuario_id: usuarios.find(u => u.email === 'fernando.cruz@unitru.edu.pe').id, escuela_id: escuelas[3].id, codigo_universitario: '20201007', ciclo: 'VIII', resolucion_practicas: 'RES-2024-007' },
    { usuario_id: usuarios.find(u => u.email === 'gabriela.marin@unitru.edu.pe').id, escuela_id: escuelas[4].id, codigo_universitario: '20201008', ciclo: 'IX', resolucion_practicas: 'RES-2024-008' },
    { usuario_id: usuarios.find(u => u.email === 'ricardo.leon@unitru.edu.pe').id, escuela_id: escuelas[4].id, codigo_universitario: '20201009', ciclo: 'IX', resolucion_practicas: 'RES-2024-009' },
    { usuario_id: usuarios.find(u => u.email === 'valentina.ruiz@unitru.edu.pe').id, escuela_id: escuelas[5].id, codigo_universitario: '20201010', ciclo: 'X', resolucion_practicas: 'RES-2024-010' },
    { usuario_id: usuarios.find(u => u.email === 'eduardo.ramos@unitru.edu.pe').id, escuela_id: escuelas[0].id, codigo_universitario: '20201011', ciclo: 'VII', resolucion_practicas: null },
    { usuario_id: usuarios.find(u => u.email === 'sofia.castro@unitru.edu.pe').id, escuela_id: escuelas[1].id, codigo_universitario: '20201012', ciclo: 'VII', resolucion_practicas: null },
    { usuario_id: usuarios.find(u => u.email === 'alejandro.rosas@unitru.edu.pe').id, escuela_id: escuelas[2].id, codigo_universitario: '20201013', ciclo: 'VIII', resolucion_practicas: null },
    { usuario_id: usuarios.find(u => u.email === 'daniela.ochoa@unitru.edu.pe').id, escuela_id: escuelas[3].id, codigo_universitario: '20201014', ciclo: 'VII', resolucion_practicas: null },
    { usuario_id: usuarios.find(u => u.email === 'hugo.gil@unitru.edu.pe').id, escuela_id: escuelas[4].id, codigo_universitario: '20201015', ciclo: 'VIII', resolucion_practicas: null },
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
      ruc: '20123456783',
      razon_social: 'Software Perú E.I.R.L.',
      direccion: 'Jr. Bolognesi 345, Trujillo, La Libertad',
      telefono: '044-555-0103',
      email_contacto: 'rrhh@softperu.com',
      representante: 'Rosa Cabrera Huertas',
      convenio_activo: true,
    },
    {
      ruc: '20123456784',
      razon_social: 'Constructora del Norte S.A.',
      direccion: 'Av. España 456, Trujillo, La Libertad',
      telefono: '044-555-0104',
      email_contacto: 'rrhh@construye.com',
      representante: 'Mario Tenorio Palacios',
      convenio_activo: true,
    },
    {
      ruc: '20123456785',
      razon_social: 'DataCenter Perú S.A.C.',
      direccion: 'Av. César Vallejo 567, Trujillo, La Libertad',
      telefono: '044-555-0105',
      email_contacto: 'rrhh@datacenter.pe',
      representante: 'Patricia Zegarra Yupanqui',
      convenio_activo: false,
    },
    {
      ruc: '20123456786',
      razon_social: 'AgroIndustrias del Valle S.A.',
      direccion: 'Carretera Panamericana Norte Km 558, Trujillo',
      telefono: '044-555-0106',
      email_contacto: 'contacto@agrovalle.com',
      representante: 'Francisco del Valle Romero',
      convenio_activo: false,
    },
    {
      ruc: '20123456787',
      razon_social: 'Consultores Asociados La Libertad',
      direccion: 'Jr. Pizarro 789, Trujillo, La Libertad',
      telefono: '044-555-0107',
      email_contacto: 'info@consultores.com',
      representante: 'Silvia Mantilla Obando',
      convenio_activo: false,
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
    {
      empresa_id: empresas[0].id,
      fecha_inicio: new Date('2024-01-01'),
      fecha_fin: new Date('2025-12-31'),
      tipo: 'marco',
      archivo_pdf: 'convenio-techcorp-2024.pdf',
      estado: 'vigente',
    },
    {
      empresa_id: empresas[1].id,
      fecha_inicio: new Date('2024-02-01'),
      fecha_fin: new Date('2025-01-31'),
      tipo: 'marco',
      archivo_pdf: 'convenio-innova-2024.pdf',
      estado: 'vigente',
    },
    {
      empresa_id: empresas[2].id,
      fecha_inicio: new Date('2023-06-01'),
      fecha_fin: new Date('2024-05-31'),
      tipo: 'especifico',
      archivo_pdf: 'convenio-softperu-2023.pdf',
      estado: 'vigente',
    },
    {
      empresa_id: empresas[3].id,
      fecha_inicio: new Date('2024-03-01'),
      fecha_fin: new Date('2026-02-28'),
      tipo: 'marco',
      archivo_pdf: 'convenio-construye-2024.pdf',
      estado: 'vigente',
    },
    {
      empresa_id: empresas[0].id,
      fecha_inicio: new Date('2023-01-01'),
      fecha_fin: new Date('2023-12-31'),
      tipo: 'especifico',
      archivo_pdf: 'convenio-techcorp-2023.pdf',
      estado: 'vencido',
    },
  ];

  for (const conv of conveniosData) {
    await prisma.convenio.create({ data: conv });
  }
}

async function createOfertas(empresas: any[]) {
  const ofertasData = [
    {
      empresa_id: empresas[0].id,
      titulo: 'Practicante de Desarrollo Backend',
      descripcion: 'Desarrollo de APIs RESTful con Node.js y bases de datos PostgreSQL. Participación en proyectos de microservicios.',
      requisitos: 'Conocimientos en JavaScript, Node.js, PostgreSQL. Estudiante de últimos ciclos de Ingeniería de Sistemas.',
      fecha_inicio: new Date('2024-04-01'),
      fecha_fin: new Date('2024-09-30'),
      vacantes: 2,
      modalidad: 'hibrida',
      estado: 'abierta',
    },
    {
      empresa_id: empresas[0].id,
      titulo: 'Practicante de Frontend React',
      descripcion: 'Desarrollo de interfaces de usuario con React y Next.js. Implementación de diseños responsivos.',
      requisitos: 'Conocimientos en React, TypeScript, CSS. Estudiante de últimos ciclos.',
      fecha_inicio: new Date('2024-04-15'),
      fecha_fin: new Date('2024-10-15'),
      vacantes: 1,
      modalidad: 'remota',
      estado: 'abierta',
    },
    {
      empresa_id: empresas[1].id,
      titulo: 'Practicante de Análisis de Datos',
      descripcion: 'Análisis de datos empresariales con Python y herramientas de BI. Generación de reportes gerenciales.',
      requisitos: 'Conocimientos en Python, SQL, Excel avanzado. Estudiante de Ingeniería Industrial o Sistemas.',
      fecha_inicio: new Date('2024-05-01'),
      fecha_fin: new Date('2024-10-31'),
      vacantes: 3,
      modalidad: 'presencial',
      estado: 'abierta',
    },
    {
      empresa_id: empresas[2].id,
      titulo: 'Practicante de QA Testing',
      descripcion: 'Pruebas de software automatizadas y manuales. Documentación de casos de prueba y reporte de bugs.',
      requisitos: 'Conocimientos básicos de testing, metodologías ágiles. Estudiante de Sistemas.',
      fecha_inicio: new Date('2024-03-15'),
      fecha_fin: new Date('2024-09-15'),
      vacantes: 1,
      modalidad: 'hibrida',
      estado: 'abierta',
    },
    {
      empresa_id: empresas[2].id,
      titulo: 'Practicante de DevOps',
      descripcion: 'Automatización de despliegues con Docker y Kubernetes. Gestión de infraestructura en la nube.',
      requisitos: 'Conocimientos en Linux, Docker, Git. Estudiante de Sistemas.',
      fecha_inicio: new Date('2024-04-01'),
      fecha_fin: new Date('2024-10-01'),
      vacantes: 1,
      modalidad: 'remota',
      estado: 'abierta',
    },
    {
      empresa_id: empresas[3].id,
      titulo: 'Practicante de Ingeniería Civil',
      descripcion: 'Supervisión de obras, control de calidad de materiales y elaboración de informes técnicos.',
      requisitos: 'Estudiante de Ingeniería Civil de últimos ciclos. Conocimientos en AutoCAD.',
      fecha_inicio: new Date('2024-05-01'),
      fecha_fin: new Date('2024-11-30'),
      vacantes: 2,
      modalidad: 'presencial',
      estado: 'abierta',
    },
    {
      empresa_id: empresas[3].id,
      titulo: 'Practicante de Seguridad Industrial',
      descripcion: 'Implementación de políticas de seguridad y salud ocupacional en obras de construcción.',
      requisitos: 'Estudiante de Ingeniería Industrial. Conocimientos en normativa de seguridad.',
      fecha_inicio: new Date('2024-04-15'),
      fecha_fin: new Date('2024-10-15'),
      vacantes: 1,
      modalidad: 'presencial',
      estado: 'cerrada',
    },
    {
      empresa_id: empresas[4].id,
      titulo: 'Practicante de Redes y Telecomunicaciones',
      descripcion: 'Administración de redes, configuración de equipos y monitoreo de infraestructura TI.',
      requisitos: 'Estudiante de Ingeniería de Sistemas. Conocimientos en redes CCNA.',
      fecha_inicio: new Date('2024-05-15'),
      fecha_fin: new Date('2024-11-15'),
      vacantes: 2,
      modalidad: 'presencial',
      estado: 'abierta',
    },
    {
      empresa_id: empresas[5].id,
      titulo: 'Practicante de Administración',
      descripcion: 'Apoyo en gestión administrativa, control de inventarios y atención a proveedores.',
      requisitos: 'Estudiante de Administración. Manejo de Office intermedio.',
      fecha_inicio: new Date('2024-05-01'),
      fecha_fin: new Date('2024-10-31'),
      vacantes: 1,
      modalidad: 'presencial',
      estado: 'abierta',
    },
    {
      empresa_id: empresas[6].id,
      titulo: 'Practicante de Contabilidad',
      descripcion: 'Registro de operaciones contables, conciliaciones bancarias y apoyo en declaraciones tributarias.',
      requisitos: 'Estudiante de Contabilidad de últimos ciclos. Conocimientos en SUNAT.',
      fecha_inicio: new Date('2024-06-01'),
      fecha_fin: new Date('2024-12-31'),
      vacantes: 1,
      modalidad: 'hibrida',
      estado: 'abierta',
    },
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
    {
      oferta_id: ofertas[0].id,
      estudiante_id: estudiantes[0].id,
      asesor_academico_id: asesores[0].id,
      fecha_postulacion: new Date('2024-03-15'),
      estado: EstadoPostulacion.en_curso,
    },
    {
      oferta_id: ofertas[1].id,
      estudiante_id: estudiantes[1].id,
      asesor_academico_id: asesores[0].id,
      fecha_postulacion: new Date('2024-03-20'),
      estado: EstadoPostulacion.en_curso,
    },
    {
      oferta_id: ofertas[2].id,
      estudiante_id: estudiantes[2].id,
      asesor_academico_id: asesores[1].id,
      fecha_postulacion: new Date('2024-04-01'),
      estado: EstadoPostulacion.aceptado,
    },
    {
      oferta_id: ofertas[3].id,
      estudiante_id: estudiantes[3].id,
      asesor_academico_id: asesores[2].id,
      fecha_postulacion: new Date('2024-03-01'),
      estado: EstadoPostulacion.en_curso,
    },
    {
      oferta_id: ofertas[5].id,
      estudiante_id: estudiantes[4].id,
      asesor_academico_id: asesores[2].id,
      fecha_postulacion: new Date('2024-01-15'),
      estado: EstadoPostulacion.finalizado,
    },
    {
      oferta_id: ofertas[6].id,
      estudiante_id: estudiantes[5].id,
      asesor_academico_id: asesores[3].id,
      fecha_postulacion: new Date('2024-02-01'),
      estado: EstadoPostulacion.finalizado,
    },
    {
      oferta_id: ofertas[0].id,
      estudiante_id: estudiantes[10].id,
      asesor_academico_id: null,
      fecha_postulacion: new Date('2024-05-01'),
      estado: EstadoPostulacion.postulado,
    },
    {
      oferta_id: ofertas[4].id,
      estudiante_id: estudiantes[11].id,
      asesor_academico_id: null,
      fecha_postulacion: new Date('2024-05-10'),
      estado: EstadoPostulacion.postulado,
    },
    {
      oferta_id: ofertas[8].id,
      estudiante_id: estudiantes[12].id,
      asesor_academico_id: null,
      fecha_postulacion: new Date('2024-05-15'),
      estado: EstadoPostulacion.postulado,
    },
    {
      oferta_id: ofertas[9].id,
      estudiante_id: estudiantes[13].id,
      asesor_academico_id: null,
      fecha_postulacion: new Date('2024-05-20'),
      estado: EstadoPostulacion.postulado,
    },
    {
      oferta_id: ofertas[7].id,
      estudiante_id: estudiantes[14].id,
      asesor_academico_id: null,
      fecha_postulacion: new Date('2024-04-10'),
      estado: EstadoPostulacion.rechazado,
    },
  ];

  const postulaciones = [];
  for (const post of postulacionesData) {
    const created = await prisma.postulacion.create({ data: post });
    postulaciones.push(created);

    if (post.asesor_academico_id) {
      await prisma.asesorPostulacion.create({
        data: {
          asesor_id: post.asesor_academico_id,
          postulacion_id: created.id,
        },
      });
    }
  }

  return postulaciones;
}

async function createSeguimientos(postulaciones: any[]) {
  const seguimientosData = [
    {
      postulacion_id: postulaciones[0].id,
      horas_cumplidas: 180,
      horas_totales: 300,
      informe_estudiante: 'Informe de avance satisfactorio. He completado el 60% de las actividades planificadas.',
      informe_asesor: 'El estudiante muestra buen desempeño y compromiso con las actividades asignadas.',
      evaluacion: 'pendiente',
    },
    {
      postulacion_id: postulaciones[1].id,
      horas_cumplidas: 150,
      horas_totales: 300,
      informe_estudiante: 'Avance al 50%. He participado en 2 proyectos de frontend con React.',
      informe_asesor: 'Buen manejo de tecnologías frontend. Se recomienda continuar con el plan de prácticas.',
      evaluacion: 'pendiente',
    },
    {
      postulacion_id: postulaciones[3].id,
      horas_cumplidas: 200,
      horas_totales: 300,
      informe_estudiante: 'Práctica en testing muy enriquecedora. He aprendido Selenium y Cypress.',
      informe_asesor: 'Excelente desempeño en pruebas automatizadas. Cumple con los objetivos.',
      evaluacion: 'pendiente',
    },
    {
      postulacion_id: postulaciones[4].id,
      horas_cumplidas: 300,
      horas_totales: 300,
      informe_estudiante: 'Práctica completada satisfactoriamente. He participado en la supervisión de 3 obras.',
      informe_asesor: 'Estudiante cumplió con todas las horas y objetivos. Desempeño sobresaliente.',
      evaluacion: 'aprobado',
      fecha_evaluacion: new Date('2024-07-15'),
    },
    {
      postulacion_id: postulaciones[5].id,
      horas_cumplidas: 280,
      horas_totales: 300,
      informe_estudiante: 'Práctica casi completada. Pendiente informe final de seguridad industrial.',
      informe_asesor: 'Buen trabajo en implementación de políticas de seguridad. Se recomienda aprobar.',
      evaluacion: 'aprobado',
      fecha_evaluacion: new Date('2024-08-01'),
    },
  ];

  for (const seg of seguimientosData) {
    await prisma.seguimientoPractica.create({ data: seg });
  }
}

async function createTesis(estudiantes: any[], asesores: any[]) {
  const tesisData = [
    {
      titulo: 'Sistema de Gestión de Prácticas Preprofesionales con Microservicios',
      resumen: 'Desarrollo de un sistema web para la gestión de prácticas preprofesionales utilizando arquitectura de microservicios con Node.js y React.',
      estudiante_id: estudiantes[6].id,
      asesor_principal_id: asesores[0].id,
      estado: EstadoTesis.desarrollo,
      fecha_inicio: new Date('2024-01-15'),
    },
    {
      titulo: 'Análisis de Eficiencia en Procesos Industriales usando Machine Learning',
      resumen: 'Aplicación de algoritmos de machine learning para optimizar procesos en la industria manufacturera local.',
      estudiante_id: estudiantes[7].id,
      asesor_principal_id: asesores[1].id,
      estado: EstadoTesis.sustentacion,
      fecha_inicio: new Date('2023-08-01'),
      fecha_sustentacion: new Date('2024-06-15'),
    },
    {
      titulo: 'Evaluación Estructural de Edificaciones Antisísmicas en Trujillo',
      resumen: 'Estudio de la resistencia sísmica de edificaciones en el centro histórico de Trujillo.',
      estudiante_id: estudiantes[8].id,
      asesor_principal_id: asesores[2].id,
      estado: EstadoTesis.culminado,
      fecha_inicio: new Date('2023-03-01'),
      fecha_sustentacion: new Date('2024-02-20'),
    },
    {
      titulo: 'Estrategias de Marketing Digital para MYPES en la Región La Libertad',
      resumen: 'Investigación sobre el impacto del marketing digital en las micro y pequeñas empresas de Trujillo.',
      estudiante_id: estudiantes[9].id,
      asesor_principal_id: asesores[3].id,
      estado: EstadoTesis.propuesta,
      fecha_inicio: new Date('2024-03-01'),
    },
    {
      titulo: 'Implementación de Normas Internacionales de Auditoría en Empresas Trujillanas',
      resumen: 'Análisis de la adopción de NIAs en empresas medianas de Trujillo y su impacto en la calidad de auditoría.',
      estudiante_id: estudiantes[0].id,
      asesor_principal_id: asesores[4].id,
      estado: EstadoTesis.desarrollo,
      fecha_inicio: new Date('2024-02-01'),
    },
    {
      titulo: 'Impacto Económico del Turismo en la Provincia de Trujillo 2019-2024',
      resumen: 'Estudio econométrico del impacto del sector turismo en el desarrollo económico local.',
      estudiante_id: estudiantes[1].id,
      asesor_principal_id: asesores[5].id,
      estado: EstadoTesis.desarrollo,
      fecha_inicio: new Date('2024-04-01'),
    },
  ];

  for (const tesis of tesisData) {
    const created = await prisma.tesis.create({ data: tesis });

    if (tesis.estado === EstadoTesis.sustentacion || tesis.estado === EstadoTesis.culminado) {
      const juradosDisponibles = asesores.filter(a => a.id !== tesis.asesor_principal_id);

      if (juradosDisponibles.length >= 2) {
        const roles = ['presidente', 'secretario', 'vocal'];
        for (let i = 0; i < Math.min(3, juradosDisponibles.length); i++) {
          await prisma.juradoTesis.create({
            data: {
              tesis_id: created.id,
              asesor_id: juradosDisponibles[i].id,
              rol: roles[i],
            },
          });
        }
      }
    }

    if (tesis.estado === EstadoTesis.desarrollo || tesis.estado === EstadoTesis.sustentacion) {
      const avancesData = [
        {
          tesis_id: created.id,
          tipo: 'capitulo',
          descripcion: 'Capítulo I: Introducción y Marco Teórico',
          fecha_entrega: new Date('2024-04-15'),
          estado: 'aprobado',
        },
        {
          tesis_id: created.id,
          tipo: 'capitulo',
          descripcion: 'Capítulo II: Metodología de Investigación',
          fecha_entrega: new Date('2024-05-15'),
          estado: 'revisado',
        },
        {
          tesis_id: created.id,
          tipo: 'informe',
          descripcion: 'Informe de avance al 50%',
          fecha_entrega: new Date('2024-06-15'),
          estado: 'entregado',
        },
      ];

      for (const avance of avancesData) {
        await prisma.avanceTesis.create({ data: avance });
      }
    }

    if (tesis.estado === EstadoTesis.culminado) {
      await prisma.actaSustentacion.create({
        data: {
          tesis_id: created.id,
          fecha: new Date('2024-02-20'),
          lugar: 'Auditorio de la Facultad de Ingeniería',
          nota_final: 17.5,
          archivo_acta_pdf: 'acta-sustentacion-2024-001.pdf',
        },
      });
    }
  }
}

async function createReportes(usuarios: any[]) {
  const adminUser = usuarios.find(u => u.email === 'admin@unitru.edu.pe');

  const reportesData = [
    {
      tipo: 'practicas',
      parametros: { periodo: '2024-1', tipo_reporte: 'general' },
      generado_por: adminUser.id,
      generado_en: new Date('2024-05-15'),
    },
    {
      tipo: 'tesis',
      parametros: { periodo: '2024-1', estado: 'todas' },
      generado_por: adminUser.id,
      generado_en: new Date('2024-05-20'),
    },
    {
      tipo: 'empresas',
      parametros: { convenio_activo: true },
      generado_por: adminUser.id,
      generado_en: new Date('2024-06-01'),
    },
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