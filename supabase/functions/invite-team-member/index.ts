import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { email, fullName, role, companyId } = await req.json();

    // Validar dados
    if (!email || !fullName || !role || !companyId) {
      throw new Error("Dados incompletos");
    }

    // Verificar se o usuário autenticado é admin
    const authHeader = req.headers.get("authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Não autorizado");
    }

    // Verificar se o usuário autenticado é admin da empresa
    const { data: currentUser, error: currentUserError } = await supabaseAdmin
      .from("users")
      .select("role, company_id")
      .eq("id", user.id)
      .single();

    if (currentUserError || currentUser.role !== "ADMIN" || currentUser.company_id !== companyId) {
      throw new Error("Sem permissão para convidar membros");
    }

    // Criar convite usando Admin API
    const redirectUrl = `${Deno.env.get("SUPABASE_URL")}/auth/v1/verify`;
    
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: redirectUrl,
        data: {
          full_name: fullName,
          company_id: companyId,
          role: role,
        },
      }
    );

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
