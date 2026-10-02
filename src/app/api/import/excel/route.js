import { NextResponse } from 'next/server';
const xlsx = require('xlsx');
const db = require('@/lib/db');

// Standard CRM fields that we map to
const STANDARD_FIELDS = [
  { key: 'job_id', label: 'Job ID', aliases: ['job id', 'job_id', 'id', 'jobid', 's.no', 'sno', 'sl no', 'sr no'] },
  { key: 'title', label: 'Job Title', aliases: ['job title', 'title', 'role', 'position', 'job role', 'job position'] },
  { key: 'company', label: 'Company', aliases: ['company', 'compant', 'compant name', 'company name', 'employer', 'organization'] },
  { key: 'location', label: 'Location', aliases: ['location', 'city', 'country', 'job location'] },
  { key: 'work_mode', label: 'Work Mode', aliases: ['work mode', 'workmode', 'work_mode', 'remote/onsite', 'employment type', 'work type'] },
  { key: 'posted_date', label: 'Posted Date', aliases: ['posted date', 'posted_date', 'date posted', 'posting date'] },
  { key: 'experience_required', label: 'Experience Required', aliases: ['experience required', 'experience', 'exp', 'years of experience'] },
  { key: 'key_skills', label: 'Key Technologies / Skills', aliases: ['key technologies / skills', 'key technologies', 'key skills', 'skills', 'technologies', 'tech stack'] },
  { key: 'salary', label: 'Salary', aliases: ['salary', 'compensation', 'pay', 'package'] },
  { key: 'match_classification', label: 'Match Classification', aliases: ['match classification', 'classification', 'category'] },
  { key: 'match_score', label: 'Match Score', aliases: ['match score', 'score', 'match %', 'match percentage'] },
  { key: 'match_reason', label: 'Match Reason', aliases: ['match reason', 'reason', 'match reasoning'] },
  { key: 'matching_skills', label: 'Matching Skills', aliases: ['matching skills', 'matched skills'] },
  { key: 'missing_requirements', label: 'Missing Requirements', aliases: ['missing requirements', 'gaps', 'skill gaps'] },
  { key: 'job_url', label: 'Job Description URL', aliases: ['job description url', 'job url', 'url', 'link', 'job link', 'posting link'] },
  { key: 'application_url', label: 'Direct Application URL', aliases: ['direct application url', 'application url', 'apply link', 'apply url'] },
  { key: 'source', label: 'Job Source', aliases: ['job source', 'source', 'portal', 'platform'] },
  { key: 'application_status', label: 'Application Status', aliases: ['application status', 'status', 'stage', 'current status'] },
  { key: 'application_date', label: 'Application Date', aliases: ['application date', 'applied date', 'date of apply', 'date applied'] },
  { key: 'notes', label: 'Notes', aliases: ['notes', 'comments', 'remarks', 'additional notes'] },
  { key: 'follow_up_date', label: 'Follow-up Date', aliases: ['follow-up date', 'followup date', 'follow_up_date'] },
  { key: 'resume_link', label: 'Resume File Link', aliases: ['resume file link', 'resume link', 'resume file', 'resume'] },
];

function formatExcelDate(val) {
  if (val === null || val === undefined || val === '') return '';
  if (typeof val === 'number' && val > 20000 && val < 60000) {
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    return date.toISOString().split('T')[0];
  }
  return String(val).trim();
}

function autoDetectMapping(headers) {
  const mapping = {};
  STANDARD_FIELDS.forEach(field => {
    const foundHeader = headers.find(h => {
      const cleanH = String(h).trim().toLowerCase();
      return field.aliases.some(alias => cleanH === alias || cleanH.includes(alias));
    });
    if (foundHeader) {
      mapping[field.key] = foundHeader;
    }
  });
  return mapping;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const action = formData.get('action') || 'preview'; // 'preview' or 'import'
    const customMappingStr = formData.get('mapping');
    const customMapping = customMappingStr ? JSON.parse(customMappingStr) : null;

    if (!file) {
      return NextResponse.json({ error: 'No Excel file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = xlsx.read(buffer, { type: 'buffer' });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return NextResponse.json({ error: 'Excel workbook contains no sheets' }, { status: 400 });
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Ensure !ref covers all populated cells (handling expanded / dynamic bounds)
    const cellKeys = Object.keys(sheet).filter(k => !k.startsWith('!'));
    if (cellKeys.length > 0) {
      let minRow = Infinity, maxRow = 0, minCol = Infinity, maxCol = 0;
      for (const key of cellKeys) {
        const cell = xlsx.utils.decode_cell(key);
        if (cell.r < minRow) minRow = cell.r;
        if (cell.r > maxRow) maxRow = cell.r;
        if (cell.c < minCol) minCol = cell.c;
        if (cell.c > maxCol) maxCol = cell.c;
      }
      sheet['!ref'] = xlsx.utils.encode_range({ s: { r: minRow, c: minCol }, e: { r: maxRow, c: maxCol } });
    }

    // Extract all rows, preserving empty row awareness
    const rawRows = xlsx.utils.sheet_to_json(sheet, { defval: '', blankrows: true });

    if (rawRows.length === 0) {
      return NextResponse.json({ error: 'Uploaded sheet contains no data rows' }, { status: 400 });
    }

    // Get headers from first row keys or sheet header line
    const headers = Object.keys(rawRows[0] || {});
    const mapping = customMapping || autoDetectMapping(headers);

    // Existing jobs in DB for exact duplicate inspection
    const existingJobs = db.getJobs();
    const existingIds = new Map();
    const existingFallbacks = new Map();

    existingJobs.forEach(j => {
      if (j.id) existingIds.set(j.id.toUpperCase(), j);
      if (j.job_id) existingIds.set(j.job_id.toUpperCase(), j);
      const fallbackKey = `${(j.title || '').toLowerCase().trim()}|${(j.company || '').toLowerCase().trim()}|${(j.location || '').toLowerCase().trim()}|${(j.job_url || '').toLowerCase().trim()}`;
      existingFallbacks.set(fallbackKey, j);
    });

    const getVal = (row, fieldKey) => {
      const header = mapping[fieldKey];
      return header && row[header] !== undefined ? row[header] : '';
    };

    let emptyRowsSkipped = 0;
    const invalidRows = [];
    const validMappedRows = [];

    rawRows.forEach((row, idx) => {
      const rowNumber = idx + 2; // Row 1 is header, data starts at Row 2 in Excel
      const values = Object.values(row);
      const isEmpty = values.length === 0 || values.every(v => v === null || v === undefined || String(v).trim() === '');
      
      if (isEmpty) {
        emptyRowsSkipped++;
        return;
      }

      const jobId = String(getVal(row, 'job_id') || '').trim();
      const title = String(getVal(row, 'title') || '').trim();
      const company = String(getVal(row, 'company') || '').trim();
      const location = String(getVal(row, 'location') || 'Dubai, UAE').trim();
      const jobUrl = String(getVal(row, 'job_url') || '').trim();

      // Row validation: A valid job record MUST have either a Job ID or a Job Title
      if (!jobId && !title) {
        invalidRows.push({
          rowNumber,
          reason: 'Missing both Job ID and Job Title',
        });
        return;
      }

      // Section 5: Strict Duplicate Detection
      // 1. Primary: Job ID (case-insensitive exact match)
      // 2. Fallback (ONLY when Job ID is missing): Job Title + Company + Location + Job URL
      let isDuplicate = false;
      let duplicateType = 'None';

      if (jobId) {
        if (existingIds.has(jobId.toUpperCase())) {
          isDuplicate = true;
          duplicateType = `Existing Job ID (${jobId})`;
        }
      } else if (title && company && location && jobUrl) {
        const fallbackKey = `${title.toLowerCase().trim()}|${company.toLowerCase().trim()}|${location.toLowerCase().trim()}|${jobUrl.toLowerCase().trim()}`;
        if (existingFallbacks.has(fallbackKey)) {
          isDuplicate = true;
          duplicateType = 'Exact Match (Title, Company, Location & URL)';
        }
      }

      validMappedRows.push({
        _rowNumber: rowNumber,
        _isDuplicate: isDuplicate,
        _duplicateType: duplicateType,
        'Job ID': jobId,
        'Job Title': title,
        'Company': company,
        'Location': location,
        'Work Mode': String(getVal(row, 'work_mode') || 'On-site').trim(),
        'Posted Date': formatExcelDate(getVal(row, 'posted_date')),
        'Experience Required': String(getVal(row, 'experience_required') || '').trim(),
        'Key Technologies / Skills': String(getVal(row, 'key_skills') || '').trim(),
        'Salary': String(getVal(row, 'salary') || 'Not specified').trim(),
        'Match Classification': String(getVal(row, 'match_classification') || '🟢 Good Match').trim(),
        'Match Score': getVal(row, 'match_score') || 70,
        'Match Reason': String(getVal(row, 'match_reason') || '').trim(),
        'Matching Skills': String(getVal(row, 'matching_skills') || '').trim(),
        'Missing Requirements': String(getVal(row, 'missing_requirements') || '').trim(),
        'Job Description URL': jobUrl,
        'Direct Application URL': String(getVal(row, 'application_url') || '').trim(),
        'Job Source': String(getVal(row, 'source') || file.name || 'Excel Import').trim(),
        'Application Status': String(getVal(row, 'application_status') || 'New').trim(),
        'Application Date': formatExcelDate(getVal(row, 'application_date')),
        'Notes': String(getVal(row, 'notes') || '').trim(),
        'Follow-up Date': formatExcelDate(getVal(row, 'follow_up_date')),
        'Resume File Link': String(getVal(row, 'resume_link') || '').trim(),
      });
    });

    const totalExcelRows = rawRows.length;

    if (action === 'preview') {
      const duplicatesCount = validMappedRows.filter(r => r._isDuplicate).length;
      const potentialNewCount = validMappedRows.length - duplicatesCount;

      return NextResponse.json({
        sheetNames: workbook.SheetNames,
        selectedSheet: sheetName,
        totalRows: totalExcelRows,
        emptyRowsSkipped,
        validRowsCount: validMappedRows.length,
        invalidRowsCount: invalidRows.length,
        invalidRows,
        headers,
        standardFields: STANDARD_FIELDS,
        mapping,
        previewRows: validMappedRows.slice(0, 10), // first 10 for preview table
        summary: {
          totalRows: totalExcelRows,
          emptyRowsSkipped,
          validRows: validMappedRows.length,
          potentialNew: potentialNewCount,
          potentialDuplicates: duplicatesCount,
          invalidRows: invalidRows.length,
        },
      });
    }

    if (action === 'import') {
      // Execute the sync and preserve personal data!
      const syncResult = db.syncIncomingJobs(validMappedRows, file.name, 'excel_import', {
        totalExcelRows,
        emptyRowsSkipped,
      });

      // Combine any invalid rows identified before sync with failures from sync
      const combinedFailedList = [
        ...invalidRows,
        ...(syncResult.summary.failedRowsList || []),
      ];
      const totalFailed = invalidRows.length + (syncResult.summary.failedRecords || 0);
      const validCount = validMappedRows.length - (syncResult.summary.failedRecords || 0);

      const finalSummary = {
        totalExcelRows,
        emptyRowsSkipped,
        validRecords: validCount,
        invalidRecords: totalFailed,
        newJobs: syncResult.summary.newJobs,
        updatedJobs: syncResult.summary.updatedJobs,
        duplicatesSkipped: syncResult.summary.duplicatesSkipped,
        failedRecords: totalFailed,
        databaseRecordsAfterImport: syncResult.summary.databaseRecordsAfterImport,
        failedRowsList: combinedFailedList,
        details: syncResult.summary.details,
      };

      return NextResponse.json({
        success: true,
        summary: finalSummary,
        syncLog: syncResult.syncLog,
      });
    }

    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
  } catch (error) {
    console.error('Excel Import Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
