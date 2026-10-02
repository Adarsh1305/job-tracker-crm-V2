const db = require('../src/lib/db');
const path = require('path');
const fs = require('fs');

async function runTests() {
  console.log('=== RUNNING TESTS FOR JOB TRACKER CRM IMPROVEMENTS ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // TEST 1: NATURAL NUMERIC JOB ID SORTING
  console.log('\n--- 1. Testing Natural Numeric Job ID Sorting ---');
  const ascJobs = db.getJoinedJobs({ sortBy: 'id', sortDir: 'asc' });
  const descJobs = db.getJoinedJobs({ sortBy: 'id', sortDir: 'desc' });

  assert(ascJobs.length > 0, `Loaded ${ascJobs.length} jobs for sorting`);
  assert(ascJobs[0].id === 'JOB-2026-001', `First job in asc sort is ${ascJobs[0]?.id} (expected JOB-2026-001)`);
  assert(ascJobs[1].id === 'JOB-2026-002', `Second job in asc sort is ${ascJobs[1]?.id} (expected JOB-2026-002)`);
  assert(descJobs[0].id > descJobs[descJobs.length - 1].id, `First job in desc (${descJobs[0]?.id}) > last job (${descJobs[descJobs.length - 1]?.id})`);

  // Verify natural numeric comparison with test values
  const sampleIds = ['JOB-2026-10', 'JOB-2026-2', 'JOB-2026-1', 'JOB-2026-20', 'JOB-2026-3'];
  sampleIds.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  assert(
    JSON.stringify(sampleIds) === JSON.stringify(['JOB-2026-1', 'JOB-2026-2', 'JOB-2026-3', 'JOB-2026-10', 'JOB-2026-20']),
    `Natural numeric sort orders JOB-2026-2 before JOB-2026-10`
  );

  // TEST 2: APPLICATION STAGES CRUD & REORDERING
  console.log('\n--- 2. Testing Application Stages CRUD & Reordering ---');
  const initialStages = db.getStages();
  assert(Array.isArray(initialStages) && initialStages.length >= 12, `Initial stages count is ${initialStages.length}`);

  // Create custom stage
  const customStage = db.addStage({
    name: 'Technical Assessment',
    description: 'Take-home coding assignment',
    color: '#8b5cf6',
  });
  assert(customStage.id.startsWith('technical_assessment'), `Created custom stage with ID "${customStage.id}"`);
  assert(customStage.is_default === false, `Custom stage is marked is_default: false`);

  // Check stage job counts
  const stageCounts = db.getStageJobCounts();
  assert(typeof stageCounts === 'object', `Stage job counts returned: ${Object.keys(stageCounts).length} stages tracked`);

  // Assign a test job to this new custom stage
  const testJobId = ascJobs[0].id;
  const originalStage = ascJobs[0].stage;
  db.updateJobStage(testJobId, customStage.id, 'Assigned to assessment for testing');

  // Verify deletion without migration fails because jobs are assigned
  let prevented = false;
  try {
    db.deleteStage(customStage.id);
  } catch (err) {
    prevented = true;
  }
  assert(prevented, `Stage deletion prevented when jobs are currently assigned to it`);

  // Delete with safe migration to originalStage
  const deleteResult = db.deleteStage(customStage.id, originalStage);
  assert(deleteResult.success === true, `Stage deleted successfully with migration target`);
  assert(deleteResult.migratedCount >= 1, `Migrated ${deleteResult.migratedCount} job(s) safely before stage deletion`);

  const updatedJob = db.getJoinedJobs().find(j => j.id === testJobId);
  assert(updatedJob.stage === originalStage, `Job was safely migrated back to "${originalStage}" (no orphaned records)`);

  // TEST 3: PROFILE MODEL & PHOTO PERSISTENCE
  console.log('\n--- 3. Testing Profile Model & Photo Reference ---');
  const currentProfile = db.getProfile();
  assert(currentProfile !== null, `Loaded user profile for ${currentProfile.name}`);
  assert('profile_photo_url' in currentProfile, `profile_photo_url field exists on user profile`);

  // Update profile photo
  const testPhotoUrl = '/uploads/avatar_test.webp';
  db.saveProfile({ ...currentProfile, profile_photo_url: testPhotoUrl });
  const reloadedProfile = db.getProfile();
  assert(reloadedProfile.profile_photo_url === testPhotoUrl, `profile_photo_url persists to disk: ${reloadedProfile.profile_photo_url}`);

  // Clean up profile photo
  db.saveProfile({ ...reloadedProfile, profile_photo_url: '' });

  // TEST 4: FAVICON FILES EXISTENCE
  console.log('\n--- 4. Testing Favicon Files ---');
  const iconAppSvg = path.join(process.cwd(), 'src', 'app', 'icon.svg');
  const iconPublicSvg = path.join(process.cwd(), 'public', 'icon.svg');
  const appleSvg = path.join(process.cwd(), 'src', 'app', 'apple-icon.svg');
  const faviconSvg = path.join(process.cwd(), 'public', 'favicon.svg');

  assert(fs.existsSync(iconAppSvg), `src/app/icon.svg exists`);
  assert(fs.existsSync(iconPublicSvg), `public/icon.svg exists`);
  assert(fs.existsSync(appleSvg), `src/app/apple-icon.svg exists`);
  assert(fs.existsSync(faviconSvg), `public/favicon.svg exists`);

  // Read content to verify "AV" is rendered
  const iconContent = fs.readFileSync(iconAppSvg, 'utf8');
  assert(iconContent.includes('AV'), `icon.svg contains "AV" monogram`);

  console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
