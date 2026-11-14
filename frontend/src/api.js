const BASE = "http://localhost:8080"

export async function api(caminho, opcoes = {}) {
  let resposta
  try {
    resposta = await fetch(BASE + caminho, {
      ...opcoes,
      headers: {
        "Content-Type": "application/json",
        ...(opcoes.headers || {}),
      },
    })
  } catch {
    throw new Error("Não foi possível falar com a API")
  }

  if (resposta.status === 204) {
    return null
  }

  const texto = await resposta.text()
  const corpo = texto ? JSON.parse(texto) : null

  if (!resposta.ok) {
    throw new Error(corpo?.message || "A API recusou a operação")
  }

  return corpo
}
