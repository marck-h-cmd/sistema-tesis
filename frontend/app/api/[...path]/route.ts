import { NextRequest, NextResponse } from 'next/server';

function getBackendOrigin() {
  const raw =
    process.env['NEXT_PUBLIC_API_URL'] ||
    process.env['BACKEND_URL'] ||
    process.env['API_URL'] ||
    '';

  const trimmed = raw.trim().replace(/\/+$/, '');
  return trimmed.replace(/\/api$/i, '');
}

async function proxy(req: NextRequest, pathSegments: string[]) {
  const origin = getBackendOrigin();
  if (!origin) {
    return NextResponse.json(
      { message: 'Backend URL is not configured' },
      { status: 500 }
    );
  }

  const incomingUrl = req.nextUrl;
  const targetUrl = new URL(`/api/${pathSegments.join('/')}`, origin);
  targetUrl.search = incomingUrl.search;

  const headers = new Headers(req.headers);
  headers.delete('host');

  const method = req.method.toUpperCase();
  const body =
    method === 'GET' || method === 'HEAD' ? undefined : await req.arrayBuffer();

  const upstreamResponse = await fetch(targetUrl, {
    method,
    headers,
    body,
    redirect: 'manual',
  });

  const responseHeaders = new Headers(upstreamResponse.headers);
  responseHeaders.delete('content-encoding');
  responseHeaders.delete('transfer-encoding');

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxy(req, params.path);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxy(req, params.path);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxy(req, params.path);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxy(req, params.path);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxy(req, params.path);
}
