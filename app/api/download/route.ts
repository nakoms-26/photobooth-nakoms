import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fileUrl = searchParams.get('url');
    const filename = searchParams.get('filename') || `medkombox-download-${Date.now()}.png`;

    if (!fileUrl) {
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    // Fetch the asset directly from asset server on the backend (bypassing CORS)
    const response = await fetch(fileUrl);
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch asset' }, { status: 502 });
    }

    const contentType = response.headers.get('content-type') || (filename.endsWith('.gif') ? 'image/gif' : 'image/png');
    const arrayBuffer = await response.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Direct download API proxy error:', error);
    return NextResponse.json({ error: 'Failed to process direct download' }, { status: 500 });
  }
}
