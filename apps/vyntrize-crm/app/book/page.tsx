import { vyntrizeDb } from "@platform/vyntrize-db";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function BookingHub() {
  const experts = await vyntrizeDb.crmUser.findMany({
    where: {
      bookingSlug: {
        not: null
      }
    },
    select: {
      id: true,
      displayName: true,
      email: true,
      bookingSlug: true,
      role: true,
      bookingSettings: true,
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col min-h-[600px] p-8">
        
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Book a Consultation</h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Choose an expert from our team to schedule your 30-minute consultation. We're here to help you grow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
          {experts.map((expert) => (
            <div key={expert.id} className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col hover:shadow-md hover:border-blue-100 transition-all">
              <div className="flex items-center mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-sm">
                  {expert.displayName.charAt(0)}
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-slate-900">{expert.displayName}</h3>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded capitalize">
                      {expert.role?.toLowerCase() || 'Expert'}
                    </span>
                    <span className="text-xs font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {expert.bookingSettings?.durationMinutes || 30} min
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-slate-600 text-sm mb-6 flex-1 line-clamp-3">
                {expert.bookingSettings?.description || `Book a time to discuss your goals and how ${expert.displayName.split(' ')[0]} can assist you.`}
              </p>
              <Link href={`/book/${expert.bookingSlug}`} className="w-full text-center py-3 px-4 bg-slate-900 text-white rounded-xl font-medium shadow-sm hover:bg-slate-800 transition-colors">
                Book with {expert.displayName.split(' ')[0]}
              </Link>
            </div>
          ))}
          
          {/* Match me option */}
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 flex flex-col hover:shadow-md hover:bg-blue-100/50 transition-all">
             <div className="flex items-center mb-4">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-blue-600 text-xl shadow-sm border border-blue-200">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-slate-900">Let Us Match You</h3>
                  <p className="text-sm text-slate-500">Auto-Assign</p>
                </div>
              </div>
              <p className="text-slate-600 mb-6 flex-1">
                Not sure who to speak with? We'll match you with the best available expert for your needs.
              </p>
              <Link href={experts.length > 0 ? `/book/${experts[0].bookingSlug}` : '/book'} className="w-full text-center py-3 px-4 bg-blue-600 text-white rounded-xl font-medium shadow-sm hover:bg-blue-700 transition-colors">
                Find My Match
              </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
