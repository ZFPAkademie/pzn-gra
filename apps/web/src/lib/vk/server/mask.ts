// vk-analytics 0.2.0 — maskování cest (tokeny, id) — server i edge
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function maskPath(input: string | null | undefined): string {
  if (!input) return "/"
  let path = String(input).split("?")[0].split("#")[0]
  if (!path.startsWith("/")) path = "/" + path
  const out = path.split("/").map((s) => {
    if (!s) return s
    if (UUID.test(s)) return ":id"
    if (/^\d+$/.test(s)) return ":n"
    // token bez pomlček s číslicí (hex, base64url) nebo cokoli dlouhého bez slovních pomlček
    if (s.length >= 16 && /^[A-Za-z0-9_]+$/.test(s) && /\d/.test(s)) return ":token"
    if (s.length >= 32 && /^[A-Za-z0-9_-]+$/.test(s) && !/-[a-z]{3,}-/.test(s)) return ":token"
    return s
  })
  const joined = out.join("/") || "/"
  return joined.length > 300 ? joined.slice(0, 300) : joined
}
