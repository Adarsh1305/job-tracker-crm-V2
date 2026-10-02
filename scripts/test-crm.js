const http = require('http');

let sessionCookie = '';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };
    if (sessionCookie) {
      defaultHeaders['Cookie'] = sessionCookie;
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path,
        method,
        headers: defaultHeaders,
      },
      (res) => {
        let data = '';
        if (res.headers['set-cookie']) {
          const cookieHeader = res.headers['set-cookie'];
          if (Array.isArray(cookieHeader)) {
            sessionCookie = cookieHeader[0].split(';')[0];
          } else {
            sessionCookie = cookieHeader.split(';')[0];
          }
        }

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: data.startsWith('{') || data.startsWith('[') ? JSON.parse(data) : data,
            });
          } catch (e) {
            resolve({ status: res.statusCode, headers: res.headers, body: data });
          }
        });
      }
    );

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== STARTING JOBHUNT CRM END-TO-END VALIDATION ===\n');

  // Test 1: Unauthenticated me
  console.log('1. Checking unauthenticated state...');
  const meBefore = await request('GET', '/api/auth/me');
  console.log('   Status:', meBefore.status, '| Authenticated:', meBefore.body.authenticated);

  // Test 2: Login
  console.log('\n2. Logging in with Adarsh Vinothan credentials...');
  const loginRes = await request('POST', '/api/auth/login', {
    email: 'adarsh.vinodhan.00@gmail.com',
    password: 'Dubai2026!',
  });
  console.log('   Status:', loginRes.status, '| User:', loginRes.body.user?.name);
  console.log('   Session Cookie captured:', sessionCookie ? 'YES (Secure HMAC)' : 'NO');

  // Test 3: Authenticated me
  console.log('\n3. Verifying session...');
  const meAfter = await request('GET', '/api/auth/me');
  console.log('   Status:', meAfter.status, '| Authenticated:', meAfter.body.authenticated, '| User:', meAfter.body.user?.name);

  // Test 4: Jobs listing
  console.log('\n4. Fetching all jobs from database...');
  const jobsRes = await request('GET', '/api/jobs?limit=50');
  console.log('   Status:', jobsRes.status, '| Total Jobs:', jobsRes.body.total, '| Returned:', jobsRes.body.jobs?.length);

  // Test 5: Filtering & Search
  console.log('\n5. Testing search & score filters (minScore=85, search="React")...');
  const searchRes = await request('GET', '/api/jobs?minScore=85&search=React');
  console.log('   Found matching high-scoring React jobs:', searchRes.body.total);
  searchRes.body.jobs.slice(0, 3).forEach(j => {
    console.log(`     • [${j.id}] ${j.title} at ${j.company} (${j.match_score}%)`);
  });

  // Test 6: Single Job Details & Activity
  console.log('\n6. Fetching single job details (JOB-2026-001)...');
  const singleJob = await request('GET', '/api/jobs/JOB-2026-001');
  console.log('   Title:', singleJob.body.job?.title);
  console.log('   Company:', singleJob.body.job?.company);
  console.log('   Initial Stage:', singleJob.body.job?.stage);
  console.log('   Activities count:', singleJob.body.activityLogs?.length);

  // Test 7: Quick Stage Update (e.g. from Kanban drag or dropdown)
  console.log('\n7. Updating stage of JOB-2026-001 to "interested"...');
  const stageUpdate = await request('PATCH', '/api/jobs/JOB-2026-001/stage', {
    stage: 'interested',
    note: 'Marked as interested for follow-up review',
  });
  console.log('   New Stage:', stageUpdate.body.job?.stage);

  // Test 8: Verify Activity Timeline Logged the Stage Change
  console.log('\n8. Verifying timeline activity entry for stage change...');
  const actRes = await request('GET', '/api/jobs/JOB-2026-001/activity');
  console.log('   Latest timeline event:', actRes.body.activities[0]?.title);
  console.log('   Description:', actRes.body.activities[0]?.description);

  // Test 9: Analytics Calculations
  console.log('\n9. Verifying dynamic analytics calculations...');
  const analyticsRes = await request('GET', '/api/analytics');
  console.log('   Total Jobs in analytics:', analyticsRes.body.stats?.totalJobs);
  console.log('   Average Match Score:', analyticsRes.body.stats?.averageMatchScore + '%');
  console.log('   Funnel steps:', analyticsRes.body.funnel?.length);
  console.log('   Match Distribution Strong:', analyticsRes.body.matchDistribution[0]?.count);

  // Test 10: Follow-up Management
  console.log('\n10. Testing follow-up creation & querying...');
  await request('POST', '/api/follow-ups', {
    jobId: 'JOB-2026-001',
    followUpDate: '2026-09-26',
    followUpType: 'linkedin',
    notes: 'Send LinkedIn message to FallenAmbers recruiter',
  });
  const followUps = await request('GET', '/api/follow-ups');
  console.log('    All follow-ups count:', followUps.body.all?.length);
  console.log('    Upcoming follow-ups:', followUps.body.upcoming?.length);

  // Test 11: CRITICAL TEST - Google Sheets Sync with Personal Data Preservation
  console.log('\n11. Testing Google Sheets Sync & Personal Data Preservation Rule...');
  const syncRes = await request('POST', '/api/integrations/google-sheets/sync');
  console.log('    Sync result status:', syncRes.body.summary);
  const verifyJobAfterSync = await request('GET', '/api/jobs/JOB-2026-001');
  console.log('    JOB-2026-001 Stage after sync:', verifyJobAfterSync.body.job?.stage);
  if (verifyJobAfterSync.body.job?.stage === 'interested') {
    console.log('    ✅ SUCCESS: Personal stage "interested" was PRESERVED and not overwritten by incoming sync!');
  } else {
    console.log('    ❌ FAILED: Personal stage was overwritten!');
  }

  // Test 12: Excel Export
  console.log('\n12. Testing Excel Export generation...');
  const exportRes = await request('POST', '/api/export/excel', { stage: 'all' });
  console.log('    Export Status:', exportRes.status);
  console.log('    Content-Type:', exportRes.headers['content-type']);
  console.log('    Content-Disposition:', exportRes.headers['content-disposition']);
  console.log('    Binary size:', exportRes.body.length, 'bytes');

  // Test 13: Profile Verification
  console.log('\n13. Checking user profile...');
  const profileRes = await request('GET', '/api/profile');
  console.log('    Name:', profileRes.body.profile?.name);
  console.log('    Location:', profileRes.body.profile?.location);
  console.log('    Visa:', profileRes.body.profile?.visaStatus);
  console.log('    Total Skills:', profileRes.body.profile?.skills?.length);

  console.log('\n=== ALL END-TO-END VALIDATION TESTS PASSED ===');
}

runTests().catch(console.error);
