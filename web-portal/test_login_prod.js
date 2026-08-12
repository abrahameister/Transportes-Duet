import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Faltan variables SUPABASE_URL o SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testLogin() {
  console.log('Iniciando sesión...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'abraham.ramirez@duetsolutions.cl',
    password: 'PasswordAdmin123!'
  });

  if (authError) {
    console.error('Error en Auth:', authError.message);
    process.exit(1);
  }

  console.log('Login exitoso. User ID:', authData.user.id);

  console.log('Consultando perfil...');
  const { data: perfil, error: perfilError } = await supabase
    .from('perfiles')
    .select('*')
    .eq('auth_user_id', authData.user.id)
    .single();

  if (perfilError) {
    console.error('Error obteniendo perfil:', perfilError);
  } else {
    console.log('Perfil obtenido:', perfil);
  }
}

testLogin().catch(console.error);
