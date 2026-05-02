'use client';

export default function AnalyticsPage() {
  return (
    <div className="p-8 bg-white rounded-lg shadow">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">Analytics Dashboard - Minimal Test</h1>
      <p className="text-gray-700 mb-2">If you can see this, the route is working!</p>
      <p className="text-gray-600 text-sm">The full analytics page will be restored once we confirm this loads.</p>
      
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <h2 className="font-semibold text-blue-900 mb-2">Debug Info:</h2>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ Component is rendering</li>
          <li>✓ Route is accessible</li>
          <li>✓ Layout is working</li>
        </ul>
      </div>
    </div>
  );
}
