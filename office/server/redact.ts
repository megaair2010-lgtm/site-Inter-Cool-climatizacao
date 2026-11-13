// Remove segredos e dados pessoais desnecessários antes de qualquer texto sair da API.
// A tela mostra o trabalho real, mas nunca senhas, tokens, chaves, cartões ou CPF.

const RULES: [RegExp, string][] = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, '[chave privada removida]'],
  [/\b(sk|pk|rk)-[A-Za-z0-9_-]{16,}\b/g, '[token removido]'],
  [/\bsk-ant-[A-Za-z0-9_-]{10,}\b/g, '[token removido]'],
  [/\b(ghp|gho|ghu|ghs|github_pat)_[A-Za-z0-9_]{20,}\b/g, '[token removido]'],
  [/\bxox[abprs]-[A-Za-z0-9-]{10,}\b/g, '[token removido]'],
  [/\bAKIA[0-9A-Z]{16}\b/g, '[token removido]'],
  [/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, '[jwt removido]'],
  [/\bBearer\s+[A-Za-z0-9._~+/-]{12,}=*/gi, 'Bearer [removido]'],
  [/\b(password|passwd|senha|secret|segredo|api[_-]?key|token|access[_-]?key|client[_-]?secret)\b(\s*["']?\s*[:=]\s*["']?)[^\s"',;]+/gi, '$1$2[removido]'],
  [/\b(?:\d[ -]?){13,19}\b/g, (m: string) => (luhn(m) ? '[cartão removido]' : m)] as unknown as [RegExp, string],
  [/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '[CPF removido]'],
  [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[e-mail removido]'],
  [/\b(?:\+?55\s?)?\(?\d{2}\)?\s?9?\d{4}-?\d{4}\b/g, '[telefone removido]'],
]

function luhn(raw: string): boolean {
  const d = raw.replace(/\D/g, '')
  if (d.length < 13 || d.length > 19) return false
  let sum = 0
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i])
    if (i % 2 === 1) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
  }
  return sum % 10 === 0
}

export function redact(input: unknown, max = 4000): string | null {
  if (input === null || input === undefined) return null
  let s = typeof input === 'string' ? input : safeJson(input)
  for (const [re, rep] of RULES) s = s.replace(re, rep as never)
  return s.length > max ? s.slice(0, max) + '… [truncado]' : s
}

function safeJson(v: unknown): string {
  try {
    return JSON.stringify(v, null, 2)
  } catch {
    return String(v)
  }
}
