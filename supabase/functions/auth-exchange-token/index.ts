import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-senior-token",
};

// Senior X API base URL
const SENIOR_X_API_BASE = "https://cloud-leaf.senior.com.br";

interface SeniorXUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  tenantName?: string;
  tenantDomain?: string;
}

/**
 * Validates a Senior X token by calling the Senior X API
 */
async function validateSeniorXToken(token: string): Promise<SeniorXUser | null> {
  try {
    console.log("Validating Senior X token...");
    
    const response = await fetch(`${SENIOR_X_API_BASE}/t/senior.com.br/bridge/1.0/rest/platform/user/queries/getUser`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("Senior X token validation failed:", response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    console.log("Senior X user data received:", JSON.stringify(data, null, 2));

    // Extract user info from Senior X response
    // Adjust field mapping based on actual Senior X API response structure
    return {
      id: data.id || data.userId || data.user?.id,
      username: data.username || data.login || data.user?.username,
      email: data.email || data.user?.email || `${data.username}@senior.com.br`,
      fullName: data.fullName || data.name || data.user?.fullName || data.username,
      tenantName: data.tenantName || data.tenant?.name,
      tenantDomain: data.tenantDomain || data.tenant?.domain,
    };
  } catch (error) {
    console.error("Error validating Senior X token:", error);
    return null;
  }
}

/**
 * Normalizes a Senior X username to an email format
 */
function normalizeToEmail(username: string, tenantDomain?: string): string {
  // If already an email, return as is
  if (username.includes("@")) {
    return username;
  }
  
  // Remove tenant prefix if present (e.g., "tenant~user" -> "user")
  const cleanUsername = username.includes("~") 
    ? username.split("~").pop() || username 
    : username;
  
  // Use tenant domain or default to senior.com.br
  const domain = tenantDomain || "senior.com.br";
  
  return `${cleanUsername}@${domain}`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract Senior X token from headers
    let seniorToken = req.headers.get("x-senior-token");
    
    // Also check Authorization header with "SeniorX" prefix
    if (!seniorToken) {
      const authHeader = req.headers.get("authorization");
      if (authHeader?.startsWith("SeniorX ")) {
        seniorToken = authHeader.substring(8);
      } else if (authHeader?.startsWith("Bearer ")) {
        // Check if it's a Senior X token (not a Supabase JWT)
        const token = authHeader.substring(7);
        // Senior X tokens typically don't have 3 parts separated by dots
        if (!token.includes(".") || token.split(".").length !== 3) {
          seniorToken = token;
        }
      }
    }

    if (!seniorToken) {
      console.error("No Senior X token provided");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Token Senior X não fornecido. Use header 'x-senior-token' ou 'Authorization: SeniorX <token>'" 
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate the Senior X token
    const seniorUser = await validateSeniorXToken(seniorToken);
    
    if (!seniorUser) {
      console.error("Invalid Senior X token");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Token Senior X inválido ou expirado" 
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Senior X user validated:", seniorUser.username);

    // Normalize email
    const email = normalizeToEmail(seniorUser.email || seniorUser.username, seniorUser.tenantDomain);
    const fullName = seniorUser.fullName?.replace(/\+/g, " ") || seniorUser.username;

    // Create admin Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Check if user exists in Supabase
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error("Error listing users:", listError);
      throw listError;
    }

    let userId: string;
    const existingUser = existingUsers.users.find(u => u.email === email);

    if (existingUser) {
      userId = existingUser.id;
      console.log("Existing Supabase user found:", userId);
      
      // Update user metadata if needed
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          full_name: fullName,
          senior_user_id: seniorUser.id,
          auth_provider: 'seniorx',
        },
      });
    } else {
      // Create new Supabase user
      const randomPassword = crypto.randomUUID() + crypto.randomUUID();
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: randomPassword,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          senior_user_id: seniorUser.id,
          auth_provider: 'seniorx',
        },
      });

      if (createError) {
        console.error("Error creating user:", createError);
        throw createError;
      }

      userId = newUser.user.id;
      console.log("Created new Supabase user:", userId);

      // Create profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          user_id: userId,
          email: email,
          full_name: fullName,
        });

      if (profileError) {
        console.error("Error creating profile (non-fatal):", profileError);
      }
    }

    // Generate a session for the user using signInWithPassword workaround
    // Since we can't directly create a session, we use generateLink + verifyOtp approach
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
    });

    if (linkError) {
      console.error("Error generating magic link:", linkError);
      throw linkError;
    }

    // Create a new client to verify the OTP and get a real session
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    const { data: sessionData, error: verifyError } = await supabaseClient.auth.verifyOtp({
      token_hash: linkData.properties?.hashed_token,
      type: 'magiclink',
    });

    if (verifyError || !sessionData.session) {
      console.error("Error verifying OTP:", verifyError);
      throw verifyError || new Error("Failed to create session");
    }

    console.log("Session created successfully for user:", userId);

    return new Response(
      JSON.stringify({
        success: true,
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
        expires_in: sessionData.session.expires_in,
        expires_at: sessionData.session.expires_at,
        token_type: "bearer",
        user: {
          id: userId,
          email: email,
          full_name: fullName,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in auth-exchange-token:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
