import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendEmail(apiKey: string, to: string[], subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Qualifica+ <onboarding@resend.dev>",
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to send email");
  }

  return response.json();
}

interface FeedbackRequest {
  fornecedorId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { fornecedorId }: FeedbackRequest = await req.json();
    console.log("Processing feedback for supplier:", fornecedorId);

    // Fetch supplier data
    const { data: fornecedor, error: fornecedorError } = await supabase
      .from("fornecedores")
      .select("id, nome, codigo, score_atual")
      .eq("id", fornecedorId)
      .single();

    if (fornecedorError || !fornecedor) {
      console.error("Supplier not found:", fornecedorError);
      throw new Error("Fornecedor não encontrado");
    }

    // Fetch contacts for this supplier
    const { data: contatos } = await supabase
      .from("fornecedor_contatos")
      .select("email, nome")
      .eq("fornecedor_id", fornecedorId)
      .not("email", "is", null);

    if (!contatos || contatos.length === 0) {
      throw new Error("Fornecedor não possui contatos com email cadastrado");
    }

    // First try to get qualifications from last month
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    let { data: documentos } = await supabase
      .from("documentos")
      .select(`
        id,
        data_recebimento,
        numero_nf,
        status,
        documento_criterios (
          score,
          observacao,
          criterios (
            codigo,
            descricao
          )
        )
      `)
      .eq("fornecedor_id", fornecedorId)
      .eq("status", "concluido")
      .gte("created_at", lastMonth.toISOString());

    let periodLabel = "último mês";

    // If no recent qualifications, get all qualifications
    if (!documentos || documentos.length === 0) {
      console.log("No qualifications in last month, fetching all history...");
      
      const { data: allDocs } = await supabase
        .from("documentos")
        .select(`
          id,
          data_recebimento,
          numero_nf,
          status,
          documento_criterios (
            score,
            observacao,
            criterios (
              codigo,
              descricao
            )
          )
        `)
        .eq("fornecedor_id", fornecedorId)
        .eq("status", "concluido")
        .order("created_at", { ascending: false })
        .limit(20);

      documentos = allDocs;
      periodLabel = "histórico completo";
    }

    if (!documentos || documentos.length === 0) {
      throw new Error("Fornecedor não possui qualificações concluídas");
    }

    console.log(`Found ${documentos.length} qualifications (${periodLabel})`);

    // Aggregate scores by criteria
    const criteriaScores: Record<string, { descricao: string; scores: number[]; observacoes: string[] }> = {};
    
    documentos.forEach((doc: any) => {
      doc.documento_criterios?.forEach((dc: any) => {
        const codigo = dc.criterios?.codigo;
        const descricao = dc.criterios?.descricao;
        if (codigo && descricao) {
          if (!criteriaScores[codigo]) {
            criteriaScores[codigo] = { descricao, scores: [], observacoes: [] };
          }
          criteriaScores[codigo].scores.push(dc.score);
          if (dc.observacao) {
            criteriaScores[codigo].observacoes.push(dc.observacao);
          }
        }
      });
    });

    // Calculate averages and find lowest scoring criteria
    const criteriaWithAvg = Object.entries(criteriaScores).map(([codigo, data]) => ({
      codigo,
      descricao: data.descricao,
      avgScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
      observacoes: data.observacoes,
    }));

    const lowestCriteria = criteriaWithAvg
      .sort((a, b) => a.avgScore - b.avgScore)
      .slice(0, 5);

    console.log("Lowest scoring criteria:", lowestCriteria);

    // Generate AI suggestions
    const prompt = `Você é um consultor de qualidade para fornecedores industriais. 
Analise os critérios de avaliação abaixo que obtiveram os menores scores e gere sugestões de melhoria práticas e específicas para cada um.

Fornecedor: ${fornecedor.nome}
Score geral atual: ${Math.round(fornecedor.score_atual || 0)}%

Critérios com menor pontuação (score de 0 a 5):
${lowestCriteria.map(c => `
- ${c.descricao} (Código: ${c.codigo})
  Score médio: ${c.avgScore.toFixed(1)}/5
  Observações registradas: ${c.observacoes.length > 0 ? c.observacoes.join("; ") : "Nenhuma"}
`).join("")}

Gere um texto profissional de feedback em português brasileiro com:
1. Uma saudação cordial
2. Um resumo do desempenho geral
3. Para cada critério listado, forneça 2-3 sugestões de melhoria específicas e práticas
4. Uma mensagem de incentivo final

Formato: Texto corrido, profissional, sem markdown.`;

    console.log("Calling Lovable AI for suggestions...");
    
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um consultor especializado em qualidade de fornecedores industriais. Gere feedbacks construtivos e práticos." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error("Limite de requisições excedido. Tente novamente mais tarde.");
      }
      if (aiResponse.status === 402) {
        throw new Error("Créditos insuficientes. Adicione créditos ao workspace.");
      }
      throw new Error("Erro ao gerar sugestões com IA");
    }

    const aiData = await aiResponse.json();
    const suggestions = aiData.choices?.[0]?.message?.content || "Não foi possível gerar sugestões.";
    
    console.log("AI suggestions generated successfully");

    // Build email content
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0d9488 0%, #115e59 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .score-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
    .score-good { background: #dcfce7; color: #166534; }
    .score-warning { background: #fef9c3; color: #854d0e; }
    .score-bad { background: #fee2e2; color: #991b1b; }
    .criteria-list { margin: 20px 0; }
    .criteria-item { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #0d9488; }
    .suggestions { background: white; padding: 20px; border-radius: 8px; margin-top: 20px; white-space: pre-wrap; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">Relatório de Qualificação</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">Qualifica+ - Sistema de Qualificação de Fornecedores</p>
  </div>
  <div class="content">
    <h2>Olá, ${contatos[0].nome || "Fornecedor"}!</h2>
    
    <p>Segue o relatório de qualificação do fornecedor <strong>${fornecedor.nome}</strong> referente ao ${periodLabel}.</p>
    
    <p><strong>Score Geral:</strong></p>
    <span class="score-badge ${(fornecedor.score_atual || 0) >= 80 ? 'score-good' : (fornecedor.score_atual || 0) >= 70 ? 'score-warning' : 'score-bad'}">
      ${Math.round(fornecedor.score_atual || 0)}%
    </span>
    
    <p><strong>Qualificações analisadas:</strong> ${documentos.length}</p>
    
    <h3>Critérios com Menor Pontuação:</h3>
    <div class="criteria-list">
      ${lowestCriteria.map(c => `
        <div class="criteria-item">
          <strong>${c.descricao}</strong><br>
          <small>Score médio: ${(c.avgScore * 20).toFixed(0)}%</small>
        </div>
      `).join("")}
    </div>
    
    <h3>Sugestões de Melhoria:</h3>
    <div class="suggestions">
      ${suggestions}
    </div>
  </div>
  <div class="footer">
    <p>Este email foi gerado automaticamente pelo sistema Qualifica+</p>
  </div>
</body>
</html>
    `;

    // In test mode (no verified domain), send only to Resend account email
    const testEmail = "gustavo.marcolla@senior.com.br";
    const originalRecipients = contatos.map((c: any) => c.email).filter(Boolean);
    
    console.log("Test mode: sending to:", testEmail);
    console.log("Original recipients would be:", originalRecipients);

    await sendEmail(
      RESEND_API_KEY,
      [testEmail],
      `[TESTE] Relatório de Qualificação - ${fornecedor.nome}`,
      emailHtml
    );

    console.log("Email sent successfully!");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Feedback enviado para ${testEmail} (modo de teste)`,
        recipients: [testEmail],
        originalRecipients 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error: any) {
    console.error("Error in send-supplier-feedback:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
