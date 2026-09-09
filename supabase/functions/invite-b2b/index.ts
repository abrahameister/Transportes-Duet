import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/** Convierte cualquier valor de error a string legible */
function serializeError(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null) {
    const e = error as Record<string, unknown>
    // PostgrestError tiene message, details, hint, code
    if (typeof e.message === 'string') {
      const detail = e.details ? ` | details: ${e.details}` : ''
      const hint   = e.hint   ? ` | hint: ${e.hint}`       : ''
      const code   = e.code   ? ` | code: ${e.code}`       : ''
      return `${e.message}${detail}${hint}${code}`
    }
    return JSON.stringify(error)
  }
  return String(error)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configuradas en Supabase.')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const body = await req.json()
    const { 
      email, 
      fullName, 
      role, 
      cliente_corporativo_id, 
      redirectTo, 
      rut, 
      telefono, 
      tipoLicencia, 
      vencimientoLicencia 
    } = body

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Se requiere un correo electronico valido.' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const cleanEmail = email.trim().toLowerCase()
    const rawRole = (role || 'CLIENTE_B2B').toUpperCase()
    const validRoles = ['ADMIN', 'OPERACIONES', 'DISPATCHER', 'CONDUCTOR', 'CLIENTE_B2B']
    const finalRole = validRoles.includes(rawRole) ? rawRole : 'CLIENTE_B2B'
    const targetRedirect = redirectTo || 'https://duetgo.netlify.app/reset-password'

    let userId: string | null = null
    let isExistingUser = false
    let actionLink: string | null = null
    let emailSent = false

    // 1. Buscar si el usuario ya existe en auth.users
    const { data: listData } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    })
    
    const existingAuthUser = listData?.users?.find(
      (u: any) => u.email?.toLowerCase() === cleanEmail
    )

    if (existingAuthUser) {
      userId = existingAuthUser.id
      isExistingUser = true
    } else {
      // 2. Si es usuario nuevo, invitarlo por email (envia correo de bienvenida via SMTP configurado)
      try {
        const { data: inviteData, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(cleanEmail, {
          redirectTo: targetRedirect,
          data: {
            rol: finalRole,
            nombre_completo: fullName || 'Usuario Corporativo'
          }
        })
        if (!inviteErr && inviteData?.user) {
          userId = inviteData.user.id
          emailSent = true
          console.log('inviteUserByEmail exitoso, userId:', userId)
        } else if (inviteErr) {
          console.warn('inviteUserByEmail aviso:', serializeError(inviteErr))
        }
      } catch (err) {
        console.warn('inviteUserByEmail excepcion:', serializeError(err))
      }

      // Si fallo inviteUserByEmail, crear el usuario directamente
      if (!userId) {
        const { data: createData, error: createError } = await supabase.auth.admin.createUser({
          email: cleanEmail,
          email_confirm: true,
          user_metadata: {
            rol: finalRole,
            nombre_completo: fullName || 'Usuario Corporativo'
          }
        })
        if (createError) {
          // Si por concurrencia ya existia
          const { data: retryList } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
          const found = retryList?.users?.find((u: any) => u.email?.toLowerCase() === cleanEmail)
          if (found) {
            userId = found.id
            isExistingUser = true
          } else {
            throw new Error(`Error al registrar usuario en Supabase Auth: ${serializeError(createError)}`)
          }
        } else if (createData?.user) {
          userId = createData.user.id
        }
      }
    }

    if (!userId) {
      throw new Error('No fue posible resolver o crear el usuario en Supabase Auth.')
    }

    // 3. Generar enlace de acceso / restablecimiento
    try {
      const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: cleanEmail,
        options: { redirectTo: targetRedirect }
      })
      if (!linkErr && linkData?.properties?.action_link) {
        actionLink = linkData.properties.action_link
      } else if (linkErr) {
        console.warn('No se pudo generar action_link:', serializeError(linkErr))
      }
    } catch (linkEx) {
      console.warn('No se pudo generar action_link (excepcion):', serializeError(linkEx))
    }

    // 4. Crear o actualizar el perfil en la tabla 'perfiles'
    // Se busca primero por auth_user_id, luego por email (evita problemas con .or() y UUIDs)
    let existingProfile: { id: string; rol: string; estado: string } | null = null

    const byAuthId = await supabase
      .from('perfiles')
      .select('id, rol, estado')
      .eq('auth_user_id', userId)
      .maybeSingle()
    
    if (byAuthId.data) {
      existingProfile = byAuthId.data
    } else {
      // Fallback: buscar por email (el trigger puede haber creado el perfil antes de asignar auth_user_id)
      const byEmail = await supabase
        .from('perfiles')
        .select('id, rol, estado')
        .eq('email', cleanEmail)
        .maybeSingle()
      existingProfile = byEmail.data
    }

    console.log('existingProfile encontrado:', existingProfile ? existingProfile.id : 'null')

    let perfilId: string

    if (existingProfile) {
      perfilId = existingProfile.id
      const { error: updateProfileErr } = await supabase
        .from('perfiles')
        .update({
          auth_user_id: userId,
          rol: finalRole,
          nombre_completo: fullName || 'Usuario Invitado',
          estado: 'activo',
          email: cleanEmail,
          updated_at: new Date().toISOString()
        })
        .eq('id', perfilId)

      if (updateProfileErr) {
        throw new Error(`Error actualizando perfil [id=${perfilId}]: ${serializeError(updateProfileErr)}`)
      }
      console.log('Perfil actualizado correctamente, id:', perfilId)
    } else {
      // El trigger no creo el perfil (puede pasar si el usuario fue creado externamente)
      const { data: newProfile, error: profileError } = await supabase
        .from('perfiles')
        .insert([{
          auth_user_id: userId,
          email: cleanEmail,
          nombre_completo: fullName || 'Usuario Invitado',
          rol: finalRole,
          estado: 'activo'
        }])
        .select('id')
        .single()
        
      if (profileError) {
        throw new Error(`Error insertando perfil [email=${cleanEmail}]: ${serializeError(profileError)}`)
      }
      perfilId = newProfile.id
      console.log('Perfil creado correctamente, id:', perfilId)
    }

    // 5. Si es CLIENTE_B2B, asociar a la empresa en 'usuarios_cliente_b2b'
    if (finalRole === 'CLIENTE_B2B' && cliente_corporativo_id) {
      const { data: existingB2b } = await supabase
        .from('usuarios_cliente_b2b')
        .select('id')
        .eq('perfil_id', perfilId)
        .eq('cliente_corporativo_id', cliente_corporativo_id)
        .maybeSingle()
        
      if (!existingB2b) {
        const { error: b2bError } = await supabase
          .from('usuarios_cliente_b2b')
          .insert([{
            perfil_id: perfilId,
            cliente_corporativo_id: cliente_corporativo_id
          }])
        if (b2bError) {
          console.warn('Aviso vinculando usuarios_cliente_b2b:', serializeError(b2bError))
        } else {
          console.log('Vinculacion B2B creada, cliente_corporativo_id:', cliente_corporativo_id)
        }
      } else {
        console.log('Vinculacion B2B ya existia, id:', existingB2b.id)
      }
    }

    // 6. Si es CONDUCTOR, asociar o crear en 'conductores'
    if (finalRole === 'CONDUCTOR') {
      const { data: existingCond } = await supabase
        .from('conductores')
        .select('id')
        .eq('perfil_id', perfilId)
        .maybeSingle()

      if (!existingCond) {
        const { error: condError } = await supabase
          .from('conductores')
          .insert([{
            perfil_id: perfilId,
            rut: rut || ('RUT-' + userId.slice(0, 8)),
            nombre_completo: fullName || 'Conductor',
            telefono: telefono || '+56900000000',
            tipo_licencia: tipoLicencia || 'A2',
            vencimiento_licencia: vencimientoLicencia || null,
            estado: 'activo',
            email: cleanEmail
          }])
        if (condError) {
          console.warn('Aviso insertando conductor:', serializeError(condError))
        }
      } else {
        await supabase
          .from('conductores')
          .update({ estado: 'activo', email: cleanEmail })
          .eq('id', existingCond.id)
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      userId, 
      perfilId,
      actionLink,
      emailSent,
      isExistingUser,
      message: isExistingUser 
        ? 'Usuario corporativo existente vinculado y actualizado exitosamente.'
        : 'Invitacion y credenciales generadas exitosamente.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    const errorMsg = serializeError(error)
    console.error('Error detallado en invite-b2b:', errorMsg)
    return new Response(JSON.stringify({ 
      error: errorMsg
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})