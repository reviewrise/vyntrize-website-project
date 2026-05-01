// Scoring type definitions

export type QualificationStatus = 'new' | 'cold' | 'warm' | 'mql' | 'sql';

export interface ScoreChange {
  leadId: string;
  oldScore: number;
  newScore: number;
  oldQualification: QualificationStatus;
  newQualification: QualificationStatus;
  timestamp: Date;
}

export interface ScoringConfig {
  enabled: boolean;
  autoRecalculate: boolean;
  recalculateInterval: number; // minutes
  notifyOnQualificationChange: boolean;
}
