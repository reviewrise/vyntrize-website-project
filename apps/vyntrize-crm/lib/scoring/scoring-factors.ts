// Lead scoring factors and weights

export interface ScoringFactors {
  pageViews: number;
  formSubmits: number;
  emailOpens: number;
  emailClicks: number;
  downloads: number;
  recency: number;
  companySize: number;
  jobTitle: number;
  engagement: number;
}

export const SCORING_WEIGHTS = {
  // Activity-based scoring
  pageView: 1,              // 1 point per page view (max 20)
  formSubmit: 30,           // 30 points per form submission
  emailOpen: 5,             // 5 points per email open (max 15)
  emailClick: 10,           // 10 points per email click (max 20)
  download: 15,             // 15 points per download
  
  // Recency bonus
  recentActivity: 10,       // 10 points if active in last 7 days
  
  // Demographic scoring
  companySize: {
    '1-10': 5,
    '11-50': 10,
    '51-200': 15,
    '201-1000': 18,
    '1000+': 20,
  },
  
  jobTitle: {
    'C-Level': 15,          // CEO, CTO, CFO, etc.
    'VP/Director': 12,      // VP, Director
    'Manager': 8,           // Manager, Team Lead
    'Individual': 5,        // Individual contributor
    'Other': 3,
  },
};

export const SCORING_CAPS = {
  pageViews: 20,
  emailOpens: 15,
  emailClicks: 20,
};

export const QUALIFICATION_THRESHOLDS = {
  sql: 80,    // Sales Qualified Lead
  mql: 60,    // Marketing Qualified Lead
  warm: 40,   // Warm lead
  cold: 20,   // Cold lead
  new: 0,     // New lead
};

/**
 * Determine job title category from title string
 */
export function categorizeJobTitle(title?: string): keyof typeof SCORING_WEIGHTS.jobTitle {
  if (!title) return 'Other';
  
  const normalized = title.toLowerCase();
  
  // C-Level
  if (/(ceo|cto|cfo|coo|cmo|chief|founder|president|owner)/i.test(normalized)) {
    return 'C-Level';
  }
  
  // VP/Director
  if (/(vp|vice president|director|head of)/i.test(normalized)) {
    return 'VP/Director';
  }
  
  // Manager
  if (/(manager|lead|supervisor)/i.test(normalized)) {
    return 'Manager';
  }
  
  // Individual contributor
  if (/(engineer|developer|designer|analyst|specialist|coordinator)/i.test(normalized)) {
    return 'Individual';
  }
  
  return 'Other';
}

/**
 * Determine company size category from employee count
 */
export function categorizeCompanySize(employeeCount?: number): keyof typeof SCORING_WEIGHTS.companySize {
  if (!employeeCount) return '1-10';
  
  if (employeeCount >= 1000) return '1000+';
  if (employeeCount >= 201) return '201-1000';
  if (employeeCount >= 51) return '51-200';
  if (employeeCount >= 11) return '11-50';
  return '1-10';
}

/**
 * Check if lead has recent activity (last 7 days)
 */
export function hasRecentActivity(lastActivityAt?: Date): boolean {
  if (!lastActivityAt) return false;
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  return lastActivityAt >= sevenDaysAgo;
}
