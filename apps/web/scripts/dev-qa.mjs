/**
 * `npm run dev:qa` — aplikace proti QA databázi.  (vibekodex os/qa, verze 1)
 *
 * Tento soubor spravuje `__vibekodex/os/qa/dev-qa.mjs`. V projektu ho needituj.
 *
 * Next.js si `.env.local` načte vždycky sám. Proměnná, která už v procesu je,
 * ale přednost má (i prázdná) — takže každý klíč z `.env.local`, který v `.env.qa`
 * není, tady nastavíme na prázdno. QA aplikace tak vidí jen to, co je v `.env.qa`:
 * žádný Resend, žádné Przelewy24, žádný ostrý service klíč.
 *
 * Běží na jiném portu než ostrý `npm run dev`, takže jdou oba naráz.
 *
 * Pošta: s MAIL_API_BASE v .env.qa (zapisuje ho local_db.sh) běží vedle lokální sink
 * místo Resendu — maily se jen uloží do .vibekodex/qa-mail/, ven nejde nic.
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync, statSync, rmSync } from "node:fs"
import { createServer } from "node:http"
import { randomUUID } from "node:crypto"
import { join, resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { spawn } from "node:child_process"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const parse = (p) => Object.fromEntries(
  readFileSync(p, "utf8").split("\n")
    .map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2].replace(/^["']|["']$/g, "")]),
)

const qaFile = join(ROOT, ".env.qa")
if (!existsSync(qaFile)) {
  console.error("\n  Chybí .env.qa. Nejdřív:  os/qa/local_db.sh " + ROOT.split("/").pop() + "\n")
  process.exit(3)
}
const qa = parse(qaFile)

// Stejná pojistka jako v qa-env.mjs: .env.qa musí mířit na lokální stack nebo deklarovaný QA ref.
const cfgFile = join(ROOT, ".vibekodex", "qa.json")
const cfg = existsSync(cfgFile) ? JSON.parse(readFileSync(cfgFile, "utf8")) : {}
const host = new URL(qa.NEXT_PUBLIC_SUPABASE_URL).hostname
const ref = /^(127\.0\.0\.1|localhost)$/.test(host) ? "local" : host.split(".")[0]
if (ref !== "local" && !(cfg.qa_refs ?? []).includes(ref)) {
  console.error(`\n  ZASTAVENO: .env.qa míří na '${ref}', což není QA databáze.\n`)
  process.exit(3)
}

// Přímé připojení k Postgresu (SUPABASE_DB_URL, DATABASE_URL…) obchází NEXT_PUBLIC_SUPABASE_URL —
// každá postgres:// adresa v QA env musí mířit na lokální stack (14. 10. 2026, Rituel/drizzle).
function assertLocalPostgres(vars, failFn) {
  for (const [k, v] of Object.entries(vars)) {
    if (!/^postgres(ql)?:\/\//.test(v ?? "")) continue
    let host
    try { host = new URL(v).hostname } catch { host = "?" }
    if (!["127.0.0.1", "localhost", "host.docker.internal"].includes(host)) failFn(`${k} míří na '${host}', ne na lokální QA databázi.`)
  }
}
assertLocalPostgres(qa, (m) => { console.error(`\n  ZASTAVENO: ${m}\n`); process.exit(3) })

const blanked = []
const prod = existsSync(join(ROOT, ".env.local")) ? parse(join(ROOT, ".env.local")) : {}
const childEnv = { ...process.env, ...qa }
for (const k of Object.keys(prod)) {
  if (!(k in qa)) { childEnv[k] = ""; blanked.push(k) }
}

const port = new URL(cfg.base_url ?? "http://localhost:3001").port || "3001"
console.log(`QA aplikace: http://localhost:${port}  →  databáze ${qa.NEXT_PUBLIC_SUPABASE_URL}`)
if (blanked.length) console.log(`Vypnuto z .env.local (${blanked.length}): ${blanked.join(", ")}`)

// Pošta: aplikace s MAIL_API_BASE na localhost posílá sem místo do Resendu. Sink nic
// nedoručuje, jen uloží zprávu do .vibekodex/qa-mail/ — test si ji tam může přečíst.
// Tvar odpovědi je jako u Resendu ({ id }), aby aplikace nepoznala rozdíl.
if (/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(qa.MAIL_API_BASE ?? "")) {
  const dir = join(ROOT, ".vibekodex", "qa-mail")
  mkdirSync(dir, { recursive: true })
  const mailPort = Number(new URL(qa.MAIL_API_BASE).port)
  createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      if (req.method !== "POST" || !req.url?.endsWith("/emails")) { res.writeHead(404).end(); return }
      const id = randomUUID()
      let mail = {}
      try { mail = JSON.parse(body) } catch {}
      writeFileSync(join(dir, `${new Date().toISOString().replace(/[:.]/g, "-")}_${id}.json`),
        JSON.stringify({ id, received_at: new Date().toISOString(), ...mail }, null, 2))
      console.log(`[qa-mail] → ${[].concat(mail.to ?? []).join(", ")} · ${mail.subject ?? ""}`)
      res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ id }))
    })
  }).listen(mailPort, "127.0.0.1", () => console.log(`Pošta QA: sink na ${qa.MAIL_API_BASE} → .vibekodex/qa-mail/`))
}

// Po `next build` (třeba v /ship) zůstane v .next/dev cache, se kterou dev server nezná
// některé routy (404 na portal/auth/callback, 2. 10.). Novější build → cache pryč.
{
  const buildId = join(ROOT, ".next", "BUILD_ID")
  const devCache = join(ROOT, ".next", "dev")
  if (existsSync(buildId) && existsSync(devCache) && statSync(buildId).mtimeMs > statSync(devCache).mtimeMs) {
    rmSync(devCache, { recursive: true, force: true })
    console.log("Smazána dev cache (.next/dev) — je starší než poslední produkční build.")
  }
}

const child = spawn("npx", ["next", "dev", "-p", port], { cwd: ROOT, env: childEnv, stdio: "inherit" })
child.on("exit", (code) => process.exit(code ?? 0))
