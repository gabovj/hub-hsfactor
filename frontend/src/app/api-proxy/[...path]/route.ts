import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

async function proxy(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const targetUrl = `${BACKEND_URL}/${path.join("/")}${req.nextUrl.search}`

  const headers = new Headers(req.headers)
  headers.delete("host")

  const isBodyless = req.method === "GET" || req.method === "HEAD"

  const response = await fetch(targetUrl, {
    method: req.method,
    headers,
    body: isBodyless ? undefined : req.body,
    // @ts-expect-error — duplex requerido para body streaming en Node 18+
    duplex: isBodyless ? undefined : "half",
  })

  return new NextResponse(response.body, {
    status: response.status,
    headers: response.headers,
  })
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const PATCH = proxy
export const DELETE = proxy
