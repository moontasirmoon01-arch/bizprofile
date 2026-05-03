import pg from "pg"

const PAGE_TOKEN = "EAAVBT7YbUoIBRVLUO6kG6qEDKZAFvzupBchlSBV9tbmUH4bZAcQziZC2KCL8HASbdJErilLsiXmOB77ZANjaLFrc2ieqAGun45nkV4c0eGFjq58WA3uw07ZAQOIc6eLWuZAuU2gchw8aZBParwx4O7ZCZB7ggZBQLGrfJHtPg1XcgSFYTjwpZCvnfYQZCe1VvNS9gmXQDchePoOIu4SMAOUb8jwEfMnXbHcESF9eTn0DcAasH69BYi6cQsjSc6egoj6eEcNiDGPt0ZBkiWWIZD"
const NEXTAUTH_SECRET = "89a7da3461726d4f405b32c216b692a68d1d6bde1d28f4afc5030b3843190015"
const BUSINESS_ID = "cmooqiilg0002mcukfilv2fh7"
const PAGE_ID = "451633578030551"

function encryptToken(token) {
  const buf = Buffer.from(token, "utf-8")
  const keyBuf = Buffer.from(NEXTAUTH_SECRET.slice(0, 32), "utf-8")
  const result = Buffer.alloc(buf.length)
  for (let i = 0; i < buf.length; i++) result[i] = buf[i] ^ keyBuf[i % keyBuf.length]
  return result.toString("base64")
}

const client = new pg.Client({
  connectionString: "postgresql://postgres:BizProfile%402026%23Secure@localhost:5432/bizprofile"
})
await client.connect()

const encrypted = encryptToken(PAGE_TOKEN)
const id = `cuid_meta_${Date.now()}`

const res = await client.query(`
  INSERT INTO "PlatformConnection" (id, "businessId", platform, "accessToken", "pageId", metadata, "createdAt", "updatedAt")
  VALUES ($1, $2, 'META', $3, $4, '[]', NOW(), NOW())
  ON CONFLICT ("businessId", platform) DO UPDATE SET "accessToken" = $3, "pageId" = $4, "updatedAt" = NOW()
  RETURNING id, platform, "pageId"
`, [id, BUSINESS_ID, encrypted, PAGE_ID])

console.log("Upserted:", res.rows)
await client.end()
