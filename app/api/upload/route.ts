import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const app = formData.get('app');

    if (!file || !app) {
      return NextResponse.json(
        { success: false, error: 'Missing file or app parameter' },
        { status: 400 }
      );
    }

    const uploadUrl = process.env.UPLOAD_API_URL;
    const uploadSecret = process.env.UPLOAD_SECRET;

    if (!uploadUrl || !uploadSecret) {
      console.error('Environment variables for upload are not set');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const externalFormData = new FormData();
    externalFormData.append('secret', uploadSecret);
    externalFormData.append('app', app as string);
    externalFormData.append('file', file);

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: externalFormData,
    });

    const result = await response.json();
    
    // Return the response back to the client
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    console.error('API Upload Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
