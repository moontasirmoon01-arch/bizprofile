const SUPABASE_URL = process.env.SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
export const STORAGE_BUCKET = "product-images"

export async function getUploadUrl(path: string) {
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/sign/upload/${STORAGE_BUCKET}/${path}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${SERVICE_KEY}` },
    }
  )
  if (!res.ok) throw new Error("Failed to create signed upload URL")
  const data = await res.json()
  return { url: `${SUPABASE_URL}${data.signedURL}`, key: path }
}

export function getPublicUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`
}
