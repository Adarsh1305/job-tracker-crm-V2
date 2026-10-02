import { NextResponse } from 'next/server';
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const db = require('@/lib/db');

// Helper to parse CSV string into array of objects
function parseCsv(csvText) {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  // Parse header
  const headers = parseCsvLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h.trim()] = values[idx] || '';
    });
    rows.push(obj);
  }
  return rows;
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === '“' || char === '”') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const config = db.getIntegration();
    let rows = [];
    let sourceUsed = 'Google Sheets Integration';

    // Check if live CSV URL is configured
    const targetUrl = config.csvUrl || process.env.GOOGLE_SHEET_CSV_URL;
    const spreadsheetId = config.spreadsheetId || process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    const apiKey = config.apiKey;

    if (targetUrl) {
      try {
        const res = await fetch(targetUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const csvContent = await res.text();
        rows = parseCsv(csvContent);
        sourceUsed = `Google Sheets (CSV URL: ${targetUrl.slice(0, 30)}...)`;
      } catch (fetchErr) {
        console.warn('Could not fetch from CSV URL, attempting fallback:', fetchErr.message);
      }
    } else if (spreadsheetId && apiKey) {
      // Use Google Sheets v4 API
      try {
        const range = config.range || 'Sheet1!A1:AI100';
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Google Sheets API Error ${res.status}: ${res.statusText}`);
        const data = await res.json();
        if (data.values && data.values.length > 1) {
          const headers = data.values[0];
          rows = data.values.slice(1).map(rowVals => {
            const rowObj = {};
            headers.forEach((h, idx) => {
              rowObj[h] = rowVals[idx] || '';
            });
            return rowObj;
          });
          sourceUsed = `Google Sheets API (${spreadsheetId})`;
        }
      } catch (apiErr) {
        console.warn('Google Sheets API call failed:', apiErr.message);
      }
    }

    // If no live external connection or network failed, sync from the daily automation reference sheet
    if (rows.length === 0) {
      const refPath = path.join(process.cwd(), 'data', 'Updated_Job_Tracker_2026-09-25.xlsx');
      if (fs.existsSync(refPath)) {
        const fileBuffer = fs.readFileSync(refPath);
        const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });
        sourceUsed = 'Daily Automated Sheet (Updated_Job_Tracker_2026-09-25.xlsx)';
      } else {
        return NextResponse.json(
          { error: 'No data source available. Please configure a Google Sheet URL or upload an Excel tracker.' },
          { status: 400 }
        );
      }
    }

    // Perform synchronization with STRICT personal field protection
    const syncResult = db.syncIncomingJobs(rows, sourceUsed, 'google_sheets');

    return NextResponse.json({
      success: true,
      source: sourceUsed,
      summary: syncResult.summary,
      syncLog: syncResult.syncLog,
    });
  } catch (error) {
    console.error('Sync Error:', error);
    db.addSyncLog({
      type: 'google_sheets',
      sourceName: 'Google Sheets Sync',
      status: 'error',
      message: `Sync failed: ${error.message}`,
      error_count: 1,
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
