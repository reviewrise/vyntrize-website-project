'use client';

import { useState } from 'react';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/solid';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import ScoreBreakdown from './ScoreBreakdown';

interface LeadScoreWidgetProps {
  score: number;
  previousScore?: number;
  qualificationStatus: string;
  breakdown?: Record<string, number>;
  className?: string;
}

const qualificationConfig = {
  sql: {
    label: 'Sales Qualified',
    color: 'bg-green-100 text-green-800 border-green-200',
    badgeColor: 'bg-green-500',
  },
  mql: {
    label: 'Marketing Qualified',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    badgeColor: 'bg-blue-500',
  },
  warm: {
    label: 'Warm Lead',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    badgeColor: 'bg-yellow-500',
  },
  cold: {
    label: 'Cold Lead',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    badgeColor: 'bg-gray-500',
  },
  new: {
    label: 'New Lead',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    badgeColor: 'bg-purple-500',
  },
};

export default function LeadScoreWidget({
  score,
  previousScore,
  qualificationStatus,
  breakdown,
  className = '',
}: LeadScoreWidgetProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const config = qualificationConfig[qualificationStatus as keyof typeof qualificationConfig] || qualificationConfig.new;
  const scoreDiff = previousScore !== undefined ? score - previousScore : 0;
  const hasIncreased = scoreDiff > 0;
  const hasDecreased = scoreDiff < 0;

  // Calculate score percentage for visual indicator
  const scorePercentage = Math.min(score, 100);

  // Determine score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Lead Score</h3>
          {breakdown && (
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="View score breakdown"
            >
              <InformationCircleIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Score Display */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-baseline gap-2">
            <span className={`text-5xl font-bold ${getScoreColor(score)}`}>{score}</span>
            <span className="text-2xl text-gray-400">/100</span>
          </div>

          {/* Trend Indicator */}
          {previousScore !== undefined && scoreDiff !== 0 && (
            <div className="flex items-center gap-1">
              {hasIncreased ? (
                <>
                  <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-green-600">+{scoreDiff}</span>
                </>
              ) : (
                <>
                  <ArrowTrendingDownIcon className="h-5 w-5 text-red-500" />
                  <span className="text-sm font-medium text-red-600">{scoreDiff}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${getProgressColor(score)} transition-all duration-500 ease-out`}
              style={{ width: `${scorePercentage}%` }}
            />
          </div>
        </div>

        {/* Qualification Badge */}
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
            <span className={`w-2 h-2 rounded-full ${config.badgeColor} mr-2`} />
            {config.label}
          </span>

          {/* Score Thresholds Hint */}
          <div className="text-xs text-gray-500">
            {score < 80 && <span>Next: {score < 40 ? 'Warm (40)' : score < 60 ? 'MQL (60)' : 'SQL (80)'}</span>}
          </div>
        </div>

        {/* Score Breakdown */}
        {showBreakdown && breakdown && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <ScoreBreakdown breakdown={breakdown} totalScore={score} />
          </div>
        )}
      </div>
    </div>
  );
}
