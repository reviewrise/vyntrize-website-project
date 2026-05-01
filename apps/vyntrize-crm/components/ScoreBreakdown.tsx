'use client';

interface ScoreBreakdownProps {
  breakdown: Record<string, number>;
  totalScore: number;
}

const factorDescriptions: Record<string, string> = {
  'Page Views': 'Website engagement and interest level',
  'Form Submissions': 'Direct conversion actions',
  'Email Opens': 'Email engagement',
  'Email Clicks': 'Active interest in content',
  'Downloads': 'Resource downloads',
  'Recent Activity': 'Activity within last 7 days',
  'Company Size': 'Based on employee count',
  'Job Title': 'Based on seniority level',
  'Engagement': 'Diversity of interactions',
};

export default function ScoreBreakdown({ breakdown, totalScore }: ScoreBreakdownProps) {
  // Sort factors by score (highest first)
  const sortedFactors = Object.entries(breakdown)
    .filter(([_, score]) => score > 0)
    .sort(([, a], [, b]) => b - a);

  if (sortedFactors.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-500">No scoring factors available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">Score Breakdown</h4>

      {sortedFactors.map(([factor, score]) => {
        const percentage = totalScore > 0 ? (score / totalScore) * 100 : 0;
        const description = factorDescriptions[factor] || '';

        return (
          <div key={factor} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex-1">
                <span className="font-medium text-gray-700">{factor}</span>
                {description && (
                  <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                )}
              </div>
              <span className="font-semibold text-gray-900 ml-4">{score}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}

      {/* Total */}
      <div className="pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm font-semibold">
          <span className="text-gray-900">Total Score</span>
          <span className="text-gray-900">{totalScore}</span>
        </div>
      </div>
    </div>
  );
}
