const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('ERROR: Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const ADMIN_EMAIL = 'abraham.ramirez@duetsolutions.cl';
const NEW_PASSWORD = 'PasswordAdmin123!';

async function forceResetPassword() {
  console.log(`Buscando usuario: ${ADMIN_EMAIL}...`);
  
  // 1. List users
  const listResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    }
  });

  if (!listResponse.ok) {
    const errorText = await listResponse.text();
    console.error('Error obteniendo usuarios:', errorText);
    process.exit(1);
  }

  const listData = await listResponse.json();
  const user = listData.users.find(u => u.email === ADMIN_EMAIL);
  
  if (!user) {
    console.error(`Usuario ${ADMIN_EMAIL} no encontrado en auth.users.`);
    process.exit(1);
  }

  console.log(`Usuario encontrado (ID: ${user.id}). Forzando nueva contraseña...`);

  // 2. Update user
  const updateResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
    method: 'PUT',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      password: NEW_PASSWORD,
      email_confirm: true
    })
  });

  if (!updateResponse.ok) {
    const errorText = await updateResponse.text();
    console.error('❌ Error actualizando contraseña:', errorText);
    process.exit(1);
  }

  console.log('✅ Contraseña actualizada exitosamente.');
  console.log('--------------------------------------------------');
  console.log(`Email: ${ADMIN_EMAIL}`);
  console.log(`Nueva Contraseña: ${NEW_PASSWORD}`);
  console.log('--------------------------------------------------');
  console.log('Ya puedes iniciar sesión directamente en https://duetgo.netlify.app/login');
}

forceResetPassword().catch(console.error);
