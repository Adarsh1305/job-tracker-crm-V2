import { NextResponse } from 'next/server';
const db = require('@/lib/db');

export async function GET() {
  try {
    const config = db.getIntegration();
    // Do not leak raw private keys
    const safeConfig = {
      ...config,
      apiKey: config.apiKey ? '••••••••••••' + config.apiKey.slice(-4) : '',
      serviceAccountEmail: config.serviceAccountEmail || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
      hasEnvServiceAccount: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    };
    return NextResponse.json({ config: safeConfig });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const current = db.getIntegration();

    const updated = db.saveIntegration({
      connected: body.connected !== undefined ? body.connected : current.connected,
      spreadsheetId: body.spreadsheetId !== undefined ? body.spreadsheetId : current.spreadsheetId,
      sheetName: body.sheetName !== undefined ? body.sheetName : current.sheetName,
      range: body.range !== undefined ? body.range : current.range,
      autoSync: body.autoSync !== undefined ? body.autoSync : current.autoSync,
      syncIntervalHours: body.syncIntervalHours !== undefined ? parseInt(body.syncIntervalHours, 10) : current.syncIntervalHours,
      csvUrl: body.csvUrl !== undefined ? body.csvUrl : current.csvUrl,
      apiKey: body.apiKey && !body.apiKey.startsWith('••••') ? body.apiKey : current.apiKey,
    });

    return NextResponse.json({ success: true, config: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
