// /api/resultados.js — Vercel Serverless Function
// Proxy seguro para o football-data.org
// A chave nunca é exposta no navegador

export default async function handler(req, res) {
  // Apenas GET permitido
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.FOOTBALL_DATA_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "API key não configurada no servidor.",
      code: "NO_API_KEY"
    });
  }

  try {
    const url = "https://api.football-data.org/v4/competitions/WC/matches?season=2026&status=FINISHED";

    const response = await fetch(url, {
      headers: {
        "X-Auth-Token": apiKey,
      },
    });

    // Tratar erros específicos da API
    if (response.status === 401) {
      return res.status(401).json({
        error: "Chave de API inválida. Verifique a configuração.",
        code: "INVALID_KEY"
      });
    }

    if (response.status === 429) {
      return res.status(429).json({
        error: "Limite de requisições atingido. Tente novamente em alguns minutos.",
        code: "RATE_LIMIT"
      });
    }

    if (response.status === 403) {
      return res.status(403).json({
        error: "Acesso negado. Verifique as permissões da sua conta.",
        code: "FORBIDDEN"
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Erro na API: ${response.status} ${response.statusText}`,
        code: "API_ERROR"
      });
    }

    const data = await response.json();

    // Cache por 2 minutos para não gastar requisições
    res.setHeader("Cache-Control", "public, max-age=120");
    res.setHeader("Access-Control-Allow-Origin", "*");

    return res.status(200).json(data);

  } catch (error) {
    console.error("Erro ao consultar football-data.org:", error);
    return res.status(503).json({
      error: "Falha de conexão com a API de resultados. Tente novamente.",
      code: "CONNECTION_ERROR"
    });
  }
}
