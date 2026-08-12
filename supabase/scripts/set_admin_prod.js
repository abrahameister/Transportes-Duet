// Script para actualizar el perfil del primer ADMIN en Supabase PROD
// Ejecutar con: node supabase/scripts/set_admin_prod.js
// Requiere: DATABASE_URL apuntando a PROD (nunca commitear con valores reales)

import pkg from 'pg';
const { Client } = pkg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL no está definida. Ejemplo de uso:');
  console.error('DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres" node supabase/scripts/set_admin_prod.js');
  process.exit(1);
}

const ADMIN_EMAIL = 'abraham.ramirez@duetsolutions.cl';
const ADMIN_NOMBRE = 'Abraham Ramírez';

const client = new Client({ connectionString: DATABASE_URL });

async function setAdmin() {
  await client.connect();
  console.log('✅ Conectado a la base de datos.');

  try {
    // 1. Verificar que el usuario existe en auth.users
    const authResult = await client.query(
      `SELECT id, email FROM auth.users WHERE email = $1 LIMIT 1`,
      [ADMIN_EMAIL]
    );

    if (authResult.rows.length === 0) {
      console.error(`❌ Usuario ${ADMIN_EMAIL} NO existe en auth.users de PROD.`);
      console.error('Invita al usuario primero desde el Dashboard de Supabase.');
      process.exit(1);
    }

    const authUserId = authResult.rows[0].id;
    console.log(`✅ auth.users encontrado: ${authUserId}`);

    // 2. Verificar si el perfil ya fue creado por el trigger
    const perfilResult = await client.query(
      `SELECT id, rol, estado FROM public.perfiles WHERE auth_user_id = $1 LIMIT 1`,
      [authUserId]
    );

    if (perfilResult.rows.length === 0) {
      console.error('❌ Perfil NO encontrado en public.perfiles.');
      console.error('Verifica que el trigger on_auth_user_created existe y funcionó correctamente.');
      process.exit(1);
    }

    const perfil = perfilResult.rows[0];
    console.log(`✅ Perfil encontrado: id=${perfil.id}, rol actual=${perfil.rol}, estado=${perfil.estado}`);

    if (perfil.rol === 'ADMIN' && perfil.estado === 'activo') {
      console.log('✅ El perfil ya tiene rol=ADMIN y estado=activo. Nada que hacer.');
      process.exit(0);
    }

    // 3. Actualizar a ADMIN
    await client.query(
      `UPDATE public.perfiles 
       SET rol = 'ADMIN', estado = 'activo', nombre_completo = $1, updated_at = now()
       WHERE auth_user_id = $2`,
      [ADMIN_NOMBRE, authUserId]
    );

    console.log(`✅ Perfil actualizado: rol=ADMIN, estado=activo, nombre="${ADMIN_NOMBRE}"`);

    // 4. Verificar resultado
    const verify = await client.query(
      `SELECT id, email, nombre_completo, rol, estado FROM public.perfiles WHERE auth_user_id = $1`,
      [authUserId]
    );
    console.log('✅ Estado final del perfil:', verify.rows[0]);

  } finally {
    await client.end();
  }
}

setAdmin().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
