const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'data', 'Updated_Job_Tracker_2026-09-25.xlsx');
const workbook = xlsx.readFile(filePath);

console.log('=== WORKBOOK SHEETS ===');
console.log(workbook.SheetNames);

const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet, { defval: '' });

console.log('\n=== TOTAL ROWS ===', data.length);

if (data.length > 0) {
  console.log('\n=== HEADERS ===');
  console.log(Object.keys(data[0]));

  console.log('\n=== SAMPLE ROW 1 ===');
  console.log(JSON.stringify(data[0], null, 2));

  console.log('\n=== UNIQUE MATCH CLASSIFICATIONS ===');
  const matchClassifications = [...new Set(data.map(r => r['Match Classification']).filter(Boolean))];
  console.log(matchClassifications);

  console.log('\n=== UNIQUE APPLICATION STATUSES ===');
  const statuses = [...new Set(data.map(r => r['Application Status']).filter(Boolean))];
  console.log(statuses);

  console.log('\n=== UNIQUE WORK MODES ===');
  const workModes = [...new Set(data.map(r => r['Work Mode']).filter(Boolean))];
  console.log(workModes);

  console.log('\n=== UNIQUE SOURCES ===');
  const sources = [...new Set(data.map(r => r['Job Source']).filter(Boolean))];
  console.log(sources);

  console.log('\n=== MATCH SCORES SAMPLE ===');
  const scores = data.map(r => ({ id: r['Job ID'], score: r['Match Score'] }));
  console.log(scores.slice(0, 10));
}
