const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILES = {
  jobs: path.join(DATA_DIR, 'jobs.json'),
  applications: path.join(DATA_DIR, 'applications.json'),
  stages: path.join(DATA_DIR, 'stages.json'),
  activity_logs: path.join(DATA_DIR, 'activity_logs.json'),
  integrations: path.join(DATA_DIR, 'integrations.json'),
  sync_logs: path.join(DATA_DIR, 'sync_logs.json'),
  contacts: path.join(DATA_DIR, 'contacts.json'),
  user_profile: path.join(DATA_DIR, 'user_profile.json'),
};

// In-memory cache for ultra-fast queries
let cache = {
  jobs: null,
  applications: null,
  stages: null,
  activity_logs: null,
  integrations: null,
  sync_logs: null,
  contacts: null,
  user_profile: null,
};

// Safe atomic file writer
function writeJsonAtomic(filePath, data) {
  const tempPath = `${filePath}.${Date.now()}.${Math.random().toString(36).substring(2, 7)}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tempPath, filePath);
}

function readJsonFile(filePath, defaultValue = []) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return defaultValue;
}

// Default Application Stages
const DEFAULT_STAGES = [
  {
    id: 'new',
    name: 'New',
    order: 1,
    color: '#3b82f6',
    badge: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    description: 'Newly discovered or uncontacted job opportunity',
    is_default: true,
  },
  {
    id: 'interested',
    name: 'Interested',
    order: 2,
    color: '#6366f1',
    badge: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    description: 'Bookmarked for targeted custom application',
    is_default: true,
  },
  {
    id: 'preparing',
    name: 'Preparing Application',
    order: 3,
    color: '#8b5cf6',
    badge: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    description: 'Tailoring CV and cover letter for submission',
    is_default: true,
  },
  {
    id: 'applied',
    name: 'Applied',
    order: 4,
    color: '#06b6d4',
    badge: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    description: 'Application officially submitted via portal/email',
    is_default: true,
  },
  {
    id: 'screening',
    name: 'Screening',
    order: 5,
    color: '#eab308',
    badge: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    description: 'Recruiter phone or video preliminary check',
    is_default: true,
  },
  {
    id: 'interview',
    name: 'Interview',
    order: 6,
    color: '#f59e0b',
    badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    description: 'Hiring manager or team round scheduled',
    is_default: true,
  },
  {
    id: 'tech_interview',
    name: 'Technical Interview',
    order: 7,
    color: '#f97316',
    badge: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    description: 'Coding challenge, architecture, or tech evaluation',
    is_default: true,
  },
  {
    id: 'hr_interview',
    name: 'HR Interview',
    order: 8,
    color: '#ec4899',
    badge: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
    description: 'Culture fit, visa, salary & benefits discussion',
    is_default: true,
  },
  {
    id: 'offer',
    name: 'Offer',
    order: 9,
    color: '#10b981',
    badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    description: 'Formal offer received or undergoing negotiation',
    is_default: true,
  },
  {
    id: 'rejected',
    name: 'Rejected',
    order: 10,
    color: '#ef4444',
    badge: 'bg-red-500/10 text-red-500 border-red-500/20',
    description: 'Not selected for this role; feedback noted',
    is_default: true,
  },
  {
    id: 'closed_expired',
    name: 'Closed / Expired',
    order: 11,
    color: '#64748b',
    badge: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    description: 'Listing closed or expired on the portal',
    is_default: true,
  },
  {
    id: 'not_pursuing',
    name: 'Not Pursuing',
    order: 12,
    color: '#71717a',
    badge: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
    description: 'Withdrawn or deemed not a fit',
    is_default: true,
  },
];

// Profile for Adarsh Vinothan
const DEFAULT_PROFILE = {
  name: 'Adarsh Vinothan',
  title: 'Full-Stack Web Developer | React.js, Next.js & Node.js',
  email: 'adarsh.vinodhan.00@gmail.com',
  phone: '+971-565693968',
  location: 'Dubai, UAE',
  visaStatus: 'Visit Visa',
  targetRoles: [
    'Full-Stack Developer',
    'Frontend Developer',
    'Node.js Developer',
    'Next.js Developer',
    'Web Developer & IT Support',
  ],
  targetLocations: ['Dubai, UAE', 'Abu Dhabi, UAE', 'Sharjah, UAE'],
  preferredWorkModes: ['On-site', 'Hybrid'],
  minSalaryAED: 8000,
  yearsOfExperience: '3+ years',
  linkedin: 'https://linkedin.com/in/adarsh-vinothan',
  portfolio: 'https://adarshvinothan.com',
  github: 'https://github.com/adarsh-vinothan',
  profile_photo_url: '',
  bio: 'Results-driven Full-Stack Web Developer with 3+ years of experience designing responsive, high-performance user interfaces and building scalable backend services and APIs. Skilled in React.js, Next.js, Node.js, Laravel, REST APIs, MongoDB, MySQL, and Bitrix24 CRM integrations.',
  skills: [
    'React.js',
    'Next.js',
    'Node.js',
    'TypeScript',
    'JavaScript (ES6+)',
    'Tailwind CSS',
    'REST APIs',
    'Laravel/PHP',
    'MongoDB',
    'MySQL',
    'Microservices',
    'Webhooks',
    'Bitrix24 CRM',
    'cPanel',
    'DNS',
    'Hosting & Deployment',
    'Vercel',
    'Git/GitHub',
    'SEO & Performance',
  ],
  education: [
    {
      degree: 'Master of Computer Applications (MCA)',
      institution: 'Sree Saraswathi Thyagaraja College, India',
      period: '2020–2022',
    },
    {
      degree: 'Bachelor of Computer Applications (BCA)',
      institution: 'Sree Saraswathi Thyagaraja College, India',
      period: '2017–2020',
    },
  ],
  workExperience: [
    {
      role: 'Web Developer & IT Support',
      company: 'X-Space Real Estate',
      location: 'Dubai, UAE',
      period: 'Nov 2024 – May 2026',
      highlights: [
        'Built responsive, SEO-optimized user interfaces and backend services using Next.js (CSR/SSR) and Node.js.',
        'Integrated external APIs and XML property feeds for real-time listing updates across portals.',
        'Automated Bitrix24 CRM workflows and webhook-based data sync, streamlining sales operations.',
        'Managed cPanel, DNS, hosting, and deployment; supervised property portal integrations and listing quality.',
      ],
    },
    {
      role: 'Web Developer',
      company: 'Crystal Code Labs',
      location: 'Tamil Nadu, India',
      period: 'Mar 2022 – Aug 2024',
      highlights: [
        'Built secure REST APIs and SSR applications with Next.js, achieving 30% performance improvement.',
        'Developed scalable Node.js backend services, reducing server response time by 40%.',
        'Architected microservices for Authorization, Metrics, and Notifications.',
        'Awarded Best Employee Award (Aug 2023 & Jun 2024).',
      ],
    },
  ],
  resumeLink:
    'https://drive.google.com/file/d/1yNwNHmUH0xLmMiAPsDWtqNamwHrknanv/view',
};

const DEFAULT_INTEGRATION = {
  connected: false,
  spreadsheetId: '',
  sheetName: 'Sheet1',
  range: 'Sheet1!A1:AI100',
  autoSync: false,
  syncIntervalHours: 6,
  lastSyncTime: null,
  lastSyncStatus: null,
  lastSyncMessage: 'Not synced yet',
  csvUrl: '',
  apiKey: '',
  serviceAccountEmail: '',
};

// Normalize Match Score safely
function normalizeMatchScore(val) {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') {
    if (val <= 1.0) return Math.round(val * 100);
    return Math.round(val);
  }
  const str = String(val).trim();
  const match = str.match(/(\d+(\.\d+)?)/);
  if (match) {
    const num = parseFloat(match[1]);
    if (num <= 1.0 && str.includes('.')) return Math.round(num * 100);
    return Math.round(num);
  }
  return 0;
}

// Map Application Status from Excel to stage id
function mapStatusToStage(status) {
  if (!status) return 'new';
  const s = String(status).toLowerCase();
  if (s.includes('applied')) return 'applied';
  if (s.includes('reviewing') || s.includes('interested')) return 'interested';
  if (s.includes('preparing')) return 'preparing';
  if (s.includes('technical interview')) return 'tech_interview';
  if (s.includes('hr interview')) return 'hr_interview';
  if (s.includes('interview')) return 'interview';
  if (s.includes('screening')) return 'screening';
  if (s.includes('offer')) return 'offer';
  if (s.includes('rejected')) return 'rejected';
  if (
    s.includes('closed') ||
    s.includes('expired') ||
    s.includes('invalid') ||
    s.includes('dead')
  )
    return 'closed_expired';
  if (s.includes('blocked') || s.includes('not pursuing'))
    return 'not_pursuing';
  if (s.includes('new')) return 'new';
  return 'new';
}

// Map Priority based on match score and stage
function calculateDefaultPriority(matchScore, stage) {
  if (['closed_expired', 'not_pursuing', 'rejected'].includes(stage)) {
    return 'low';
  }
  if (matchScore >= 85) return 'high';
  if (matchScore >= 70) return 'medium';
  return 'low';
}

// Initialize database with seed data if empty
function initializeDatabase() {
  // 1. Stages
  let stages = readJsonFile(DB_FILES.stages, null);
  if (!stages || stages.length === 0) {
    stages = DEFAULT_STAGES;
    writeJsonAtomic(DB_FILES.stages, stages);
  }
  cache.stages = stages;

  // 2. User Profile
  let profile = readJsonFile(DB_FILES.user_profile, null);
  if (!profile || !profile.email) {
    profile = DEFAULT_PROFILE;
    writeJsonAtomic(DB_FILES.user_profile, profile);
  }
  cache.user_profile = profile;

  // 3. Integrations
  let integrations = readJsonFile(DB_FILES.integrations, null);
  if (!integrations || typeof integrations !== 'object') {
    integrations = DEFAULT_INTEGRATION;
    writeJsonAtomic(DB_FILES.integrations, integrations);
  }
  cache.integrations = integrations;

  // 4. Jobs & Applications
  let jobs = readJsonFile(DB_FILES.jobs, null);
  let applications = readJsonFile(DB_FILES.applications, null);
  let activityLogs = readJsonFile(DB_FILES.activity_logs, null);
  let syncLogs = readJsonFile(DB_FILES.sync_logs, null);

  if (!jobs || jobs.length === 0) {
    const excelPath = path.join(
      DATA_DIR,
      'Updated_Job_Tracker_2026-09-25.xlsx',
    );
    jobs = [];
    applications = [];
    activityLogs = [];
    syncLogs = [];

    if (fs.existsSync(excelPath)) {
      try {
        const workbook = xlsx.readFile(excelPath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

        rows.forEach((row, index) => {
          const jobId = String(
            row['Job ID'] || `JOB-2026-${String(index + 1).padStart(3, '0')}`,
          ).trim();
          const matchScore = normalizeMatchScore(row['Match Score']);
          const rawStatus = String(row['Application Status'] || 'New').trim();
          const stage = mapStatusToStage(rawStatus);
          const priority = calculateDefaultPriority(matchScore, stage);
          const nowIso = new Date().toISOString();

          // External Job Entity
          const job = {
            id: jobId,
            job_id: jobId,
            title: row['Job Title'] || 'Untitled Position',
            company: row['Company'] || 'Unknown Company',
            location: row['Location'] || 'Dubai, UAE',
            work_mode: row['Work Mode'] || 'On-site',
            posted_date: row['Posted Date'] || '',
            experience_required: row['Experience Required'] || '',
            key_skills: row['Key Technologies / Skills'] || '',
            salary: row['Salary'] || 'Not specified',
            match_classification:
              row['Match Classification'] || '🟢 Good Match',
            match_score: matchScore,
            match_reason: row['Match Reason'] || '',
            matching_skills: row['Matching Skills'] || '',
            missing_requirements: row['Missing Requirements'] || '',
            job_url: row['Job Description URL'] || '',
            application_url: row['Direct Application URL'] || '',
            source: row['Job Source'] || 'Automated Search',
            alert_date: row['Alert Date'] || '',
            alert_time: row['Alert Time (UAE)'] || '',
            date_added: row['Date Added'] || '2026-09-25',
            created_at: nowIso,
            updated_at: nowIso,
          };
          jobs.push(job);

          // Personal Application Entity
          const app = {
            job_id: jobId,
            stage: stage,
            status_detail: rawStatus,
            priority: priority,
            applied_date:
              row['Application Date'] ||
              (stage === 'applied' ? '2026-09-23' : ''),
            application_confirmation: row['Application Confirmation'] || '',
            follow_up_date: row['Follow-up Date'] || '',
            follow_up_type: 'email',
            follow_up_status: 'pending',
            interview_date: '',
            recruiter_name: '',
            recruiter_email: '',
            recruiter_phone: '',
            notes: row['Notes'] || '',
            personal_rating: matchScore >= 85 ? 5 : matchScore >= 70 ? 4 : 3,
            resume_status: row['Resume Created']
              ? row['Resume Created'].startsWith('Yes')
                ? 'Ready'
                : 'Not Started'
              : 'Not Started',
            cover_letter_status: row['Cover Letter Created'] || 'Not required',
            cover_letter_required:
              row['Cover Letter Required'] || 'Not specified',
            resume_version: row['Resume Version'] || '',
            resume_file_link: row['Resume File Link'] || '',
            resume_quality_check: row['Resume Quality Check'] || '',
            hyperlinks_verified: row['Hyperlinks Verified'] || '',
            pdf_verified: row['PDF Verified'] || '',
            docx_verified: row['DOCX Verified'] || '',
            last_resume_audit_date: row['Last Resume Audit Date'] || '',
            created_at: nowIso,
            updated_at: nowIso,
          };
          applications.push(app);

          // Activity Log for initial discovery
          activityLogs.push({
            id: `ACT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            job_id: jobId,
            type: 'discovered',
            title: `Job Discovered: ${job.title} at ${job.company}`,
            description: `Imported via reference tracker. Match Score: ${matchScore}%. Initial Status: ${rawStatus}.`,
            timestamp: row['Alert Date']
              ? `${row['Alert Date']}T${row['Alert Time (UAE)'] || '12:00'}:00Z`
              : nowIso,
            user: 'System Import',
          });
        });

        // Add an initial sync log entry
        syncLogs.push({
          id: `SYNC-${Date.now()}`,
          timestamp: '2026-09-25T12:46:00Z',
          type: 'excel_import',
          sourceName: 'Updated_Job_Tracker_2026-09-25.xlsx',
          total_rows: rows.length,
          new_count: rows.length,
          updated_count: 0,
          duplicate_count: 0,
          error_count: 0,
          status: 'success',
          message: `Successfully initialized database with ${rows.length} jobs from reference Excel tracker.`,
          created_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Error importing reference Excel on bootstrap:', err);
      }
    }

    writeJsonAtomic(DB_FILES.jobs, jobs);
    writeJsonAtomic(DB_FILES.applications, applications);
    writeJsonAtomic(DB_FILES.activity_logs, activityLogs);
    writeJsonAtomic(DB_FILES.sync_logs, syncLogs);
  }

  cache.jobs = jobs || [];
  cache.applications = applications || [];
  cache.activity_logs = activityLogs || [];
  cache.sync_logs = syncLogs || [];
  cache.contacts = readJsonFile(DB_FILES.contacts, []);
}

// Ensure db is loaded
initializeDatabase();

// Database Operations
const db = {
  // Re-seed from reference file if requested
  reseed: () => {
    cache = {
      jobs: null,
      applications: null,
      stages: null,
      activity_logs: null,
      integrations: null,
      sync_logs: null,
      contacts: null,
      user_profile: null,
    };
    if (fs.existsSync(DB_FILES.jobs)) fs.unlinkSync(DB_FILES.jobs);
    if (fs.existsSync(DB_FILES.applications))
      fs.unlinkSync(DB_FILES.applications);
    if (fs.existsSync(DB_FILES.activity_logs))
      fs.unlinkSync(DB_FILES.activity_logs);
    if (fs.existsSync(DB_FILES.sync_logs)) fs.unlinkSync(DB_FILES.sync_logs);
    initializeDatabase();
    return { success: true, count: cache.jobs.length };
  },

  // 1. JOBS
  getJobs: () => {
    if (!cache.jobs) cache.jobs = readJsonFile(DB_FILES.jobs, []);
    return cache.jobs;
  },

  getApplications: () => {
    if (!cache.applications)
      cache.applications = readJsonFile(DB_FILES.applications, []);
    return cache.applications;
  },

  getJobById: (id) => {
    const jobs = db.getJobs();
    const apps = db.getApplications();
    const cleanId = String(id).trim().toUpperCase();
    const job = jobs.find(
      (j) =>
        j.id.toUpperCase() === cleanId || j.job_id.toUpperCase() === cleanId,
    );
    if (!job) return null;
    const application = apps.find(
      (a) => a.job_id.toUpperCase() === cleanId,
    ) || {
      job_id: job.id,
      stage: 'new',
      status_detail: 'New',
      priority: 'medium',
      notes: '',
    };
    const stages = db.getStages();
    const stageObj = stages.find((s) => s.id === application.stage) || {
      id: application.stage,
      name: application.stage,
    };
    return {
      ...job,
      application,
      stageInfo: stageObj,
      stage: application.stage,
      stage_name: stageObj.name,
      stage_color: stageObj.color,
      priority: application.priority,
      applied_date: application.applied_date,
      follow_up_date: application.follow_up_date,
      notes: application.notes,
      resume_status: application.resume_status,
    };
  },

  getJoinedJobs: (filters = {}) => {
    const jobs = db.getJobs();
    const apps = db.getApplications();
    const stages = db.getStages();
    const stageMap = Object.fromEntries(stages.map((s) => [s.id, s]));
    const appMap = Object.fromEntries(
      apps.map((a) => [a.job_id.toUpperCase(), a]),
    );

    let result = jobs.map((job) => {
      const app = appMap[job.id.toUpperCase()] || {
        job_id: job.id,
        stage: 'new',
        status_detail: 'New',
        priority: 'medium',
        notes: '',
      };
      const stageInfo = stageMap[app.stage] || {
        id: app.stage,
        name: app.stage,
        color: '#94a3b8',
      };
      return {
        ...job,
        application: app,
        stage: app.stage,
        stage_name: stageInfo.name,
        stage_color: stageInfo.color,
        priority: app.priority,
        applied_date: app.applied_date,
        follow_up_date: app.follow_up_date,
        notes: app.notes,
        resume_status: app.resume_status,
      };
    });

    // Filtering
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.company.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q) ||
          item.key_skills.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          item.source.toLowerCase().includes(q) ||
          (item.notes && item.notes.toLowerCase().includes(q)),
      );
    }

    if (filters.stage && filters.stage !== 'all') {
      result = result.filter((item) => item.stage === filters.stage);
    }

    if (filters.priority && filters.priority !== 'all') {
      result = result.filter((item) => item.priority === filters.priority);
    }

    if (filters.classification && filters.classification !== 'all') {
      result = result.filter((item) =>
        item.match_classification.includes(filters.classification),
      );
    }

    if (filters.workMode && filters.workMode !== 'all') {
      const wm = filters.workMode.toLowerCase();
      result = result.filter((item) =>
        item.work_mode.toLowerCase().includes(wm),
      );
    }

    if (filters.minScore) {
      const min = parseInt(filters.minScore, 10);
      if (!isNaN(min)) {
        result = result.filter((item) => item.match_score >= min);
      }
    }

    if (filters.source && filters.source !== 'all') {
      result = result.filter((item) =>
        item.source.toLowerCase().includes(filters.source.toLowerCase()),
      );
    }

    // Sorting
    const sortBy = filters.sortBy || 'match_score';
    const sortDir = filters.sortDir === 'asc' ? 1 : -1;

    result.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === 'id' || sortBy === 'job_id') {
        const strA = String(a.id || a.job_id || '');
        const strB = String(b.id || b.job_id || '');
        return (
          strA.localeCompare(strB, undefined, {
            numeric: true,
            sensitivity: 'base',
          }) * sortDir
        );
      }
      if (sortBy === 'match_score') {
        return ((a.match_score || 0) - (b.match_score || 0)) * sortDir;
      }
      if (sortBy === 'priority') {
        const pOrder = { high: 3, medium: 2, low: 1 };
        return (
          ((pOrder[a.priority] || 0) - (pOrder[b.priority] || 0)) * sortDir
        );
      }
      if (
        sortBy === 'date_added' ||
        sortBy === 'posted_date' ||
        sortBy === 'created_at'
      ) {
        return (new Date(valA || 0) - new Date(valB || 0)) * sortDir;
      }
      if (typeof valA === 'string') {
        return (
          valA.localeCompare(valB || '', undefined, {
            numeric: true,
            sensitivity: 'base',
          }) * sortDir
        );
      }
      return ((valA || 0) - (valB || 0)) * sortDir;
    });

    return result;
  },

  saveJob: (jobData) => {
    const jobs = db.getJobs();
    const index = jobs.findIndex(
      (j) => j.id.toUpperCase() === jobData.id.toUpperCase(),
    );
    const nowIso = new Date().toISOString();

    if (index >= 0) {
      jobs[index] = { ...jobs[index], ...jobData, updated_at: nowIso };
    } else {
      jobs.push({ ...jobData, created_at: nowIso, updated_at: nowIso });
    }
    writeJsonAtomic(DB_FILES.jobs, jobs);
    cache.jobs = jobs;
    return jobData;
  },

  // deleteJob: (jobId) => {
  //   let jobs = db.getJobs();
  //   let apps = db.getApplications();
  //   const logs = db.getActivityLogs();

  //   const cleanId = String(jobId).trim().toUpperCase();

  //   const jobExists = jobs.some(
  //     (j) =>
  //       String(j.id || '')
  //         .trim()
  //         .toUpperCase() === cleanId,
  //   );

  //   if (!jobExists) {
  //     return {
  //       success: false,
  //       deleted: false,
  //       jobId,
  //       error: 'Job not found',
  //     };
  //   }

  //   const updatedJobs = jobs.filter(
  //     (j) =>
  //       String(j.id || '')
  //         .trim()
  //         .toUpperCase() !== cleanId,
  //   );

  //   const updatedApps = apps.filter(
  //     (a) =>
  //       String(a.job_id || '')
  //         .trim()
  //         .toUpperCase() !== cleanId,
  //   );

  //   const updatedLogs = logs.filter(
  //     (l) =>
  //       String(l.job_id || '')
  //         .trim()
  //         .toUpperCase() !== cleanId,
  //   );

  //   // jobs = jobs.filter((j) => j.id.toUpperCase() !== cleanId);
  //   // apps = apps.filter((a) => a.job_id.toUpperCase() !== cleanId);

  //   // writeJsonAtomic(DB_FILES.jobs, jobs);
  //   // writeJsonAtomic(DB_FILES.applications, apps);

  //   writeJsonAtomic(DB_FILES.jobs, updatedJobs);
  //   writeJsonAtomic(DB_FILES.applications, updatedApps);
  //   writeJsonAtomic(DB_FILES.activity_logs, updatedLogs);

  //   cache.jobs = updatedJobs;
  //   cache.applications = updatedApps;
  //   cache.activity_logs = updatedLogs;

  //   return {
  //     success: true,
  //     deleted: true,
  //     jobId,
  //   };
  // },

  deleteJob: (jobId) => {
    try {
      const cleanId = String(jobId || '')
        .trim()
        .toUpperCase();

      if (!cleanId) {
        return {
          success: false,
          deleted: false,
          error: 'Job ID is required',
        };
      }

      let jobs = db.getJobs();
      let apps = db.getApplications();

      const existingJob = jobs.find(
        (job) =>
          String(job.id || '')
            .trim()
            .toUpperCase() === cleanId,
      );

      if (!existingJob) {
        return {
          success: false,
          deleted: false,
          error: `Job ${cleanId} not found`,
        };
      }

      // Delete job
      jobs = jobs.filter(
        (job) =>
          String(job.id || '')
            .trim()
            .toUpperCase() !== cleanId,
      );

      // Delete related application records
      apps = apps.filter(
        (app) =>
          String(app.job_id || '')
            .trim()
            .toUpperCase() !== cleanId,
      );

      writeJsonAtomic(DB_FILES.jobs, jobs);
      writeJsonAtomic(DB_FILES.applications, apps);

      cache.jobs = jobs;
      cache.applications = apps;

      return {
        success: true,
        deleted: true,
        jobId: cleanId,
      };
    } catch (error) {
      console.error('deleteJob error:', error);

      return {
        success: false,
        deleted: false,
        error: error.message,
      };
    }
  },

  // 2. APPLICATIONS (Personal Data)
  saveApplication: (appData, logActivity = true) => {
    const apps = db.getApplications();
    const cleanId = String(appData.job_id).trim().toUpperCase();
    const index = apps.findIndex((a) => a.job_id.toUpperCase() === cleanId);
    const nowIso = new Date().toISOString();
    let oldStage = null;

    let updatedApp;
    if (index >= 0) {
      oldStage = apps[index].stage;
      updatedApp = { ...apps[index], ...appData, updated_at: nowIso };
      apps[index] = updatedApp;
    } else {
      updatedApp = { ...appData, created_at: nowIso, updated_at: nowIso };
      apps.push(updatedApp);
    }

    writeJsonAtomic(DB_FILES.applications, apps);
    cache.applications = apps;

    if (
      logActivity &&
      appData.stage &&
      oldStage &&
      oldStage !== appData.stage
    ) {
      const stages = db.getStages();
      const oldStageName =
        stages.find((s) => s.id === oldStage)?.name || oldStage;
      const newStageName =
        stages.find((s) => s.id === appData.stage)?.name || appData.stage;
      db.addActivityLog({
        job_id: appData.job_id,
        type: 'stage_change',
        title: `Stage changed: ${oldStageName} → ${newStageName}`,
        description: `Application moved to ${newStageName}.`,
        user: 'Adarsh Vinothan',
      });
    }

    return updatedApp;
  },

  updateJobStage: (jobId, newStage, note = '') => {
    const apps = db.getApplications();
    const cleanId = String(jobId).trim().toUpperCase();
    let app = apps.find((a) => a.job_id.toUpperCase() === cleanId);
    const stages = db.getStages();
    const targetStage = stages.find((s) => s.id === newStage);

    if (!app) {
      app = {
        job_id: jobId,
        stage: newStage,
        priority: 'medium',
        notes: note || '',
      };
    }

    const oldStage = app.stage;
    app.stage = newStage;
    app.status_detail = targetStage ? targetStage.name : newStage;
    if (newStage === 'applied' && !app.applied_date) {
      app.applied_date = new Date().toISOString().split('T')[0];
    }
    if (note) {
      app.notes = (app.notes ? `${app.notes}\n` : '') + note;
    }

    const saved = db.saveApplication(app, false);

    // Record activity
    const oldStageName =
      stages.find((s) => s.id === oldStage)?.name || oldStage;
    const newStageName = targetStage?.name || newStage;
    db.addActivityLog({
      job_id: jobId,
      type: 'stage_change',
      title: `Stage changed: ${oldStageName} → ${newStageName}`,
      description: note || `Application stage updated to ${newStageName}.`,
      user: 'Adarsh Vinothan',
    });

    return saved;
  },

  // 3. STAGES
  getStages: () => {
    if (!cache.stages) {
      let stages = readJsonFile(DB_FILES.stages, DEFAULT_STAGES);
      const defaultIds = [
        'new',
        'interested',
        'preparing',
        'applied',
        'screening',
        'interview',
        'tech_interview',
        'hr_interview',
        'offer',
        'rejected',
        'closed_expired',
        'not_pursuing',
      ];
      stages = stages.map((s, idx) => ({
        ...s,
        order: typeof s.order === 'number' ? s.order : idx + 1,
        is_default:
          s.is_default !== undefined ? s.is_default : defaultIds.includes(s.id),
        description:
          s.description ||
          DEFAULT_STAGES.find((ds) => ds.id === s.id)?.description ||
          '',
      }));
      stages.sort((a, b) => (a.order || 0) - (b.order || 0));
      cache.stages = stages;
    }
    return cache.stages;
  },

  saveStages: (stagesList) => {
    const nowIso = new Date().toISOString();
    const normalized = stagesList.map((s, idx) => ({
      ...s,
      order: idx + 1,
      updated_at: nowIso,
    }));
    writeJsonAtomic(DB_FILES.stages, normalized);
    cache.stages = normalized;
    return normalized;
  },

  addStage: (stageData) => {
    const stages = db.getStages();
    let id = stageData.id ? String(stageData.id).trim().toLowerCase() : '';
    if (!id) {
      id = stageData.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
    }
    if (stages.some((s) => s.id === id)) {
      id = `${id}_${Date.now().toString().slice(-4)}`;
    }
    const nowIso = new Date().toISOString();
    const newStage = {
      id,
      name: stageData.name.trim(),
      description: stageData.description?.trim() || '',
      color: stageData.color || '#6366f1',
      badge:
        stageData.badge ||
        'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
      order: stages.length + 1,
      is_default: false,
      created_at: nowIso,
      updated_at: nowIso,
    };
    stages.push(newStage);
    db.saveStages(stages);
    return newStage;
  },

  updateStage: (stageId, stageData) => {
    const stages = db.getStages();
    const idx = stages.findIndex((s) => s.id === stageId);
    if (idx === -1) {
      throw new Error(`Stage "${stageId}" not found.`);
    }
    const nowIso = new Date().toISOString();
    stages[idx] = {
      ...stages[idx],
      ...stageData,
      id: stages[idx].id, // preserve ID
      is_default: stages[idx].is_default, // preserve default status
      updated_at: nowIso,
    };
    return db.saveStages(stages);
  },

  getStageJobCounts: () => {
    const apps = db.getApplications();
    const counts = {};
    apps.forEach((a) => {
      const stg = a.stage || 'new';
      counts[stg] = (counts[stg] || 0) + 1;
    });
    return counts;
  },

  deleteStage: (stageId, migrateToStageId = null) => {
    const stages = db.getStages();
    const target = stages.find((s) => s.id === stageId);
    if (!target) {
      throw new Error(`Stage "${stageId}" not found.`);
    }
    if (target.is_default) {
      throw new Error(`Cannot delete default system stage "${target.name}".`);
    }

    const apps = db.getApplications();
    const affectedApps = apps.filter((a) => a.stage === stageId);

    if (affectedApps.length > 0) {
      if (!migrateToStageId) {
        throw new Error(
          `This stage is currently used by ${affectedApps.length} job(s). Please choose a destination stage before removing it.`,
        );
      }
      const destStage = stages.find((s) => s.id === migrateToStageId);
      if (!destStage) {
        throw new Error(
          `Migration destination stage "${migrateToStageId}" is invalid.`,
        );
      }

      // Migrate applications
      affectedApps.forEach((a) => {
        db.updateJobStage(
          a.job_id,
          migrateToStageId,
          `Migrated from deleted custom stage "${target.name}" to "${destStage.name}".`,
        );
      });
    }

    const remainingStages = stages.filter((s) => s.id !== stageId);
    db.saveStages(remainingStages);
    return {
      success: true,
      migratedCount: affectedApps.length,
      deletedStage: target,
    };
  },

  // 4. ACTIVITY LOGS
  getActivityLogs: (jobId = null) => {
    if (!cache.activity_logs)
      cache.activity_logs = readJsonFile(DB_FILES.activity_logs, []);
    let logs = cache.activity_logs;
    if (jobId) {
      const cleanId = String(jobId).trim().toUpperCase();
      logs = logs.filter((l) => l.job_id && l.job_id.toUpperCase() === cleanId);
    }
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  addActivityLog: (logData) => {
    const logs = db.getActivityLogs();
    const entry = {
      id:
        logData.id ||
        `ACT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      job_id: logData.job_id || '',
      type: logData.type || 'note',
      title: logData.title || 'Activity',
      description: logData.description || '',
      timestamp: logData.timestamp || new Date().toISOString(),
      user: logData.user || 'Adarsh Vinothan',
    };
    logs.unshift(entry);
    writeJsonAtomic(DB_FILES.activity_logs, logs);
    cache.activity_logs = logs;
    return entry;
  },

  // 5. INTEGRATIONS & SYNC LOGS
  getIntegration: () => {
    if (!cache.integrations)
      cache.integrations = readJsonFile(
        DB_FILES.integrations,
        DEFAULT_INTEGRATION,
      );
    return cache.integrations;
  },

  saveIntegration: (data) => {
    const current = db.getIntegration();
    const updated = { ...current, ...data };
    writeJsonAtomic(DB_FILES.integrations, updated);
    cache.integrations = updated;
    return updated;
  },

  getSyncLogs: () => {
    if (!cache.sync_logs)
      cache.sync_logs = readJsonFile(DB_FILES.sync_logs, []);
    return cache.sync_logs.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
    );
  },

  addSyncLog: (logEntry) => {
    const logs = db.getSyncLogs();
    const newLog = {
      id: logEntry.id || `SYNC-${Date.now()}`,
      timestamp: logEntry.timestamp || new Date().toISOString(),
      type: logEntry.type || 'google_sheets',
      sourceName: logEntry.sourceName || 'Google Sheets',
      total_rows: logEntry.total_rows || 0,
      new_count: logEntry.new_count || 0,
      updated_count: logEntry.updated_count || 0,
      duplicate_count: logEntry.duplicate_count || 0,
      error_count: logEntry.error_count || 0,
      status: logEntry.status || 'success',
      message: logEntry.message || '',
      details: logEntry.details || [],
      created_at: new Date().toISOString(),
    };
    logs.unshift(newLog);
    writeJsonAtomic(DB_FILES.sync_logs, logs);
    cache.sync_logs = logs;
    return newLog;
  },

  // 6. PROFILE
  getProfile: () => {
    if (!cache.user_profile)
      cache.user_profile = readJsonFile(DB_FILES.user_profile, DEFAULT_PROFILE);
    if (
      cache.user_profile &&
      cache.user_profile.profile_photo_url === undefined
    ) {
      cache.user_profile.profile_photo_url = '';
    }
    return cache.user_profile;
  },

  saveProfile: (data) => {
    const current = db.getProfile();
    const updated = { ...current, ...data };
    writeJsonAtomic(DB_FILES.user_profile, updated);
    cache.user_profile = updated;
    return updated;
  },

  // 7. FOLLOW-UPS
  getFollowUps: () => {
    const jobs = db.getJoinedJobs();
    const todayStr = new Date().toISOString().split('T')[0];

    const withFollowUp = jobs.filter(
      (j) => j.follow_up_date && j.follow_up_date.trim() !== '',
    );

    const overdue = withFollowUp.filter(
      (j) =>
        j.follow_up_date < todayStr &&
        j.application.follow_up_status !== 'completed',
    );
    const today = withFollowUp.filter(
      (j) =>
        j.follow_up_date === todayStr &&
        j.application.follow_up_status !== 'completed',
    );
    const upcoming = withFollowUp.filter(
      (j) =>
        j.follow_up_date > todayStr &&
        j.application.follow_up_status !== 'completed',
    );
    const completed = withFollowUp.filter(
      (j) => j.application.follow_up_status === 'completed',
    );

    return { overdue, today, upcoming, completed, all: withFollowUp };
  },

  // 8. CORE MERGE & SYNC ENGINE: PRESERVES USER APPLICATION DATA!
  syncIncomingJobs: (
    incomingRows,
    sourceName = 'Google Sheets',
    sourceType = 'google_sheets',
    meta = {},
  ) => {
    const existingJobs = db.getJobs();
    const existingApps = db.getApplications();
    const nowIso = new Date().toISOString();

    const jobsMapById = new Map();
    const jobsMapByFallback = new Map(); // ONLY for rows missing Job ID
    const appsMap = new Map();

    existingJobs.forEach((j) => {
      if (j.id) jobsMapById.set(j.id.toUpperCase(), j);
      if (j.job_id) jobsMapById.set(j.job_id.toUpperCase(), j);
      const fallbackKey = `${(j.title || '').toLowerCase().trim()}|${(j.company || '').toLowerCase().trim()}|${(j.location || '').toLowerCase().trim()}|${(j.job_url || '').toLowerCase().trim()}`;
      jobsMapByFallback.set(fallbackKey, j);
    });

    existingApps.forEach((a) => {
      if (a.job_id) appsMap.set(a.job_id.toUpperCase(), a);
    });

    let newCount = 0;
    let updatedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    const errors = [];
    const failedRowsList = [];
    const changeDetails = [];

    const updatedJobsList = [...existingJobs];
    const updatedAppsList = [...existingApps];

    incomingRows.forEach((row, idx) => {
      const rowNum = row._rowNumber || idx + 2;
      try {
        const rawJobId = String(row['Job ID'] || row['job_id'] || '').trim();
        const title = String(
          row['Job Title'] || row['job_title'] || row['Title'] || '',
        ).trim();
        const company = String(row['Company'] || row['company'] || '').trim();
        const location = String(
          row['Location'] || row['location'] || 'Dubai, UAE',
        ).trim();
        const jobUrl = String(
          row['Job Description URL'] || row['job_url'] || '',
        ).trim();

        // Row validation: A valid job record MUST have either a Job ID or a Job Title
        if (!title && !rawJobId) {
          errorCount++;
          const reason = `Missing both Job ID and Job Title`;
          errors.push(`Row ${rowNum}: ${reason}`);
          failedRowsList.push({ rowNumber: rowNum, reason });
          return;
        }

        // Section 5: Strict Duplicate Detection
        // 1. Primary unique identifier: Job ID
        // 2. Fallback (ONLY when Job ID is missing): Job Title + Company + Location + Job URL
        let matchedJob = null;
        if (rawJobId) {
          if (jobsMapById.has(rawJobId.toUpperCase())) {
            matchedJob = jobsMapById.get(rawJobId.toUpperCase());
          }
        } else if (title && company && location && jobUrl) {
          const fallbackKey = `${title.toLowerCase().trim()}|${company.toLowerCase().trim()}|${location.toLowerCase().trim()}|${jobUrl.toLowerCase().trim()}`;
          if (jobsMapByFallback.has(fallbackKey)) {
            matchedJob = jobsMapByFallback.get(fallbackKey);
          }
        }

        const matchScore = normalizeMatchScore(
          row['Match Score'] || row['match_score'],
        );
        const rawStatus = String(
          row['Application Status'] || row['Status'] || row['status'] || 'New',
        ).trim();
        const suggestedStage = mapStatusToStage(rawStatus);

        const externalJobData = {
          title: title || matchedJob?.title || 'Untitled Role',
          company: company || matchedJob?.company || 'Unknown Company',
          location: location || matchedJob?.location || 'Dubai, UAE',
          work_mode: String(
            row['Work Mode'] ||
              row['work_mode'] ||
              matchedJob?.work_mode ||
              'On-site',
          ).trim(),
          posted_date: String(
            row['Posted Date'] ||
              row['posted_date'] ||
              matchedJob?.posted_date ||
              '',
          ).trim(),
          experience_required: String(
            row['Experience Required'] ||
              row['experience_required'] ||
              matchedJob?.experience_required ||
              '',
          ).trim(),
          key_skills: String(
            row['Key Technologies / Skills'] ||
              row['key_skills'] ||
              matchedJob?.key_skills ||
              '',
          ).trim(),
          salary: String(
            row['Salary'] ||
              row['salary'] ||
              matchedJob?.salary ||
              'Not specified',
          ).trim(),
          match_classification: String(
            row['Match Classification'] ||
              row['match_classification'] ||
              matchedJob?.match_classification ||
              '🟢 Good Match',
          ).trim(),
          match_score: matchScore || matchedJob?.match_score || 70,
          match_reason: String(
            row['Match Reason'] ||
              row['match_reason'] ||
              matchedJob?.match_reason ||
              '',
          ).trim(),
          matching_skills: String(
            row['Matching Skills'] ||
              row['matching_skills'] ||
              matchedJob?.matching_skills ||
              '',
          ).trim(),
          missing_requirements: String(
            row['Missing Requirements'] ||
              row['missing_requirements'] ||
              matchedJob?.missing_requirements ||
              '',
          ).trim(),
          job_url: jobUrl,
          application_url: String(
            row['Direct Application URL'] ||
              row['application_url'] ||
              matchedJob?.application_url ||
              '',
          ).trim(),
          source: String(
            row['Job Source'] ||
              row['source'] ||
              matchedJob?.source ||
              sourceName,
          ).trim(),
          alert_date: String(
            row['Alert Date'] ||
              row['alert_date'] ||
              matchedJob?.alert_date ||
              '',
          ).trim(),
          alert_time: String(
            row['Alert Time (UAE)'] ||
              row['alert_time'] ||
              matchedJob?.alert_time ||
              '',
          ).trim(),
          date_added: String(
            row['Date Added'] || matchedJob?.date_added || nowIso.split('T')[0],
          ).trim(),
        };

        if (matchedJob) {
          // EXISTING RECORD:
          // Check if any external fields actually changed
          let hasExternalChange = false;
          for (const key of Object.keys(externalJobData)) {
            if (
              externalJobData[key] !== '' &&
              externalJobData[key] !== matchedJob[key]
            ) {
              hasExternalChange = true;
              break;
            }
          }

          if (hasExternalChange) {
            // Update external fields ONLY
            const jobIndex = updatedJobsList.findIndex(
              (j) => j.id.toUpperCase() === matchedJob.id.toUpperCase(),
            );
            if (jobIndex >= 0) {
              updatedJobsList[jobIndex] = {
                ...updatedJobsList[jobIndex],
                ...externalJobData,
                updated_at: nowIso,
              };
            }
            updatedCount++;
            changeDetails.push({
              jobId: matchedJob.id,
              action: 'updated',
              title: matchedJob.title,
              company: matchedJob.company,
              reason:
                'External job details refreshed (Personal application data preserved)',
            });
          } else {
            duplicateCount++;
            changeDetails.push({
              jobId: matchedJob.id,
              action: 'duplicate',
              title: matchedJob.title,
              company: matchedJob.company,
              reason: 'Identical record already exists in database',
            });
          }

          // IMPORTANT: NEVER OVERWRITE USER PERSONAL APPLICATION FIELDS!
        } else {
          // NEW RECORD:
          const finalJobId =
            rawJobId ||
            `JOB-2026-${String(updatedJobsList.length + 1).padStart(3, '0')}`;
          const newJob = {
            id: finalJobId,
            job_id: finalJobId,
            ...externalJobData,
            created_at: nowIso,
            updated_at: nowIso,
          };
          updatedJobsList.push(newJob);
          jobsMapById.set(finalJobId.toUpperCase(), newJob);

          // Create default personal application tracking for this new job
          const initialPriority = calculateDefaultPriority(
            matchScore,
            suggestedStage,
          );
          const newApp = {
            job_id: finalJobId,
            stage: suggestedStage,
            status_detail: rawStatus,
            priority: initialPriority,
            applied_date:
              row['Application Date'] ||
              (suggestedStage === 'applied' ? nowIso.split('T')[0] : ''),
            application_confirmation: row['Application Confirmation'] || '',
            follow_up_date: row['Follow-up Date'] || '',
            follow_up_type: 'email',
            follow_up_status: 'pending',
            interview_date: '',
            recruiter_name: '',
            recruiter_email: '',
            recruiter_phone: '',
            notes: row['Notes'] || '',
            personal_rating: matchScore >= 85 ? 5 : matchScore >= 70 ? 4 : 3,
            resume_status: row['Resume Created']
              ? String(row['Resume Created']).startsWith('Yes')
                ? 'Ready'
                : 'Not Started'
              : 'Not Started',
            cover_letter_status: row['Cover Letter Created'] || 'Not required',
            cover_letter_required:
              row['Cover Letter Required'] || 'Not specified',
            resume_version: row['Resume Version'] || '',
            resume_file_link: row['Resume File Link'] || '',
            created_at: nowIso,
            updated_at: nowIso,
          };
          updatedAppsList.push(newApp);
          appsMap.set(finalJobId.toUpperCase(), newApp);

          newCount++;
          changeDetails.push({
            jobId: finalJobId,
            action: 'created',
            title: newJob.title,
            company: newJob.company,
          });

          // Activity Log for discovery
          db.addActivityLog({
            job_id: finalJobId,
            type: 'discovered',
            title: `Job Discovered: ${newJob.title} at ${newJob.company}`,
            description: `Imported via ${sourceName}. Match Score: ${matchScore}%.`,
            user: 'Automated Sync',
          });
        }
      } catch (rowErr) {
        errorCount++;
        const reason = rowErr.message;
        errors.push(`Row ${rowNum}: ${reason}`);
        failedRowsList.push({ rowNumber: rowNum, reason });
      }
    });

    // Commit changes to disk atomically
    writeJsonAtomic(DB_FILES.jobs, updatedJobsList);
    writeJsonAtomic(DB_FILES.applications, updatedAppsList);
    cache.jobs = updatedJobsList;
    cache.applications = updatedAppsList;

    // Section 13: Debug Logging
    const totalDetected = meta.totalExcelRows || incomingRows.length;
    const emptySkipped = meta.emptyRowsSkipped || 0;
    const validatedCount = incomingRows.length - errorCount;
    console.log(`\n========================================`);
    console.log(`[IMPORT DEBUG] Excel rows detected: ${totalDetected}`);
    console.log(`[IMPORT DEBUG] Rows skipped because empty: ${emptySkipped}`);
    console.log(`[IMPORT DEBUG] Rows validated: ${validatedCount}`);
    console.log(`[IMPORT DEBUG] New records: ${newCount}`);
    console.log(`[IMPORT DEBUG] Updated records: ${updatedCount}`);
    console.log(`[IMPORT DEBUG] Duplicates: ${duplicateCount}`);
    console.log(`[IMPORT DEBUG] Failed records: ${errorCount}`);
    console.log(
      `[IMPORT DEBUG] Database total after import: ${updatedJobsList.length}`,
    );
    console.log(`========================================\n`);

    // Create sync log entry
    const syncLog = db.addSyncLog({
      type: sourceType,
      sourceName: sourceName,
      total_rows: totalDetected,
      new_count: newCount,
      updated_count: updatedCount,
      duplicate_count: duplicateCount,
      error_count: errorCount,
      status:
        errorCount > 0 && newCount === 0 && updatedCount === 0
          ? 'error'
          : 'success',
      message: `Processed ${totalDetected} rows: ${newCount} new, ${updatedCount} updated, ${duplicateCount} duplicates skipped, ${errorCount} failed. Database total: ${updatedJobsList.length}.`,
      details: changeDetails,
    });

    // Update integration last sync info
    db.saveIntegration({
      lastSyncTime: nowIso,
      lastSyncStatus: syncLog.status,
      lastSyncMessage: syncLog.message,
    });

    return {
      summary: {
        totalExcelRows: totalDetected,
        emptyRowsSkipped: emptySkipped,
        validRecords: validatedCount,
        newJobs: newCount,
        updatedJobs: updatedCount,
        duplicatesSkipped: duplicateCount,
        failedRecords: errorCount,
        databaseRecordsAfterImport: updatedJobsList.length,
        errorMessages: errors,
        failedRowsList: failedRowsList,
        details: changeDetails,
      },
      syncLog,
    };
  },
};

module.exports = db;
