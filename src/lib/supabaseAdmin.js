// lib/supabaseAdmin.js
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY // nunca expor no front!

// Cliente com service_role (para uso em rotas da Vercel, Node.js)
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
