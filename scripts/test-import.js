const fs = require('fs');
const path = require('path');

async function testExcelImport() {
  const filePath = path.join(__dirname, '..', 'data', 'Updated_Job_Tracker_2026-09-25.xlsx');
  const fileBuffer = fs.readFileSync(filePath);

  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const bodyParts = [
    `--${boundary}\r\nContent-Disposition: form-data; name="action"\r\n\r\npreview\r\n`,
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="Updated_Job_Tracker_2026-09-25.xlsx"\r\nContent-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n`,
  ];

  const payloadHeader = Buffer.from(bodyParts.join(''));
  const payloadFooter = Buffer.from(`\r\n--${boundary}--\r\n`);
  const fullPayload = Buffer.concat([payloadHeader, fileBuffer, payloadFooter]);

  const res = await fetch('http://localhost:3000/api/import/excel', {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body: fullPayload,
  });

  const data = await res.json();
  console.log('Import Preview Status:', res.status);
  console.log('Detected Sheets:', data.sheetNames);
  console.log('Total Rows:', data.totalRows);
  console.log('Mapped Headers Count:', Object.keys(data.mapping || {}).length);
  console.log('Summary:', data.summary);
  console.log('First preview row:', data.previewRows?.[0]?.['Job Title'], 'at', data.previewRows?.[0]?.['Company']);
}

testExcelImport().catch(console.error);
