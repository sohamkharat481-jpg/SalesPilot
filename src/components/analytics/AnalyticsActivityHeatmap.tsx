import React from 'react';
import { Activity, Calendar, FileText, CheckCircle2, Sparkles } from 'lucide-react';
import { HeatmapCell, WeeklyReportSummary } from '../../analytics/analytics-data';

interface AnalyticsActivityHeatmapProps {
  heatmapCells: HeatmapCell[];
  weeklyReport: WeeklyReportSummary;
}

export function AnalyticsActivityHeatmap({ heatmapCells, weeklyReport }: AnalyticsActivityHeatmapProps) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

  // Function to map intensity (0-10) to Tailwind bg color
  const getCellBg = (intensity: number) => {
    if (intensity === 0) return 'bg-slate-100 dark:bg-slate-800/40 text-transparent';
    if (intensity <= 3) return 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300';
    if (intensity <= 6) return 'bg-blue-300 dark:bg-blue-800 text-blue-900 dark:text-white';
    if (intensity <= 8) return 'bg-indigo-500 text-white font-bold';
    return 'bg-purple-600 text-white font-black shadow-sm';
  };

  return (
    <div className="space-y-6">
      {/* Activity Heatmap Grid */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-500" /> Hourly Outreach & Activity Heatmap
            </h3>
            <p className="text-xs text-slate-500">
              Identifies optimal contact time windows based on email opens, replies, and calendar bookings.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
            <span>Low Intensity</span>
            <span className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-950 inline-block" />
            <span className="w-3 h-3 rounded bg-blue-400 inline-block" />
            <span className="w-3 h-3 rounded bg-purple-600 inline-block" />
            <span>Peak Activity</span>
          </div>
        </div>

        {/* Heatmap Grid Table */}
        <div className="overflow-x-auto">
          <div className="min-w-[600px] space-y-1.5">
            {/* Hour Headers */}
            <div className="grid grid-cols-14 gap-1.5 text-center text-[10px] font-mono font-bold text-slate-400">
              <div>Day</div>
              {hours.map((h) => (
                <div key={h}>{h}:00</div>
              ))}
            </div>

            {/* Heatmap Rows per Day */}
            {days.map((day) => (
              <div key={day} className="grid grid-cols-14 gap-1.5 items-center">
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono">
                  {day}
                </div>
                {hours.map((hour) => {
                  const cell = heatmapCells.find((c) => c.day === day && c.hour === hour) || {
                    intensity: 0,
                    activityCount: 0
                  };
                  return (
                    <div
                      key={`${day}-${hour}`}
                      title={`${day} ${hour}:00 - ${cell.activityCount} actions logged`}
                      className={`h-8 rounded-lg flex items-center justify-center text-[10px] font-mono transition transform hover:scale-110 cursor-pointer ${getCellBg(
                        cell.intensity
                      )}`}
                    >
                      {cell.activityCount > 0 ? cell.activityCount : ''}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Executive Summary & Performance Insights */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-500" /> Weekly Executive Performance Report ({weeklyReport.weekPeriod})
          </h3>
          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
            {weeklyReport.aiAutonomyPercentage}% AI Autonomous Execution
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-0.5">
            <span className="text-slate-500 text-[10px] uppercase font-mono">New Prospects</span>
            <div className="text-base font-bold text-slate-900 dark:text-white">+{weeklyReport.newLeadsThisWeek}</div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-0.5">
            <span className="text-slate-500 text-[10px] uppercase font-mono">Deals Closed</span>
            <div className="text-base font-bold text-slate-900 dark:text-white">{weeklyReport.dealsClosedThisWeek}</div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-0.5">
            <span className="text-slate-500 text-[10px] uppercase font-mono">Booked Revenue</span>
            <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">₹{weeklyReport.revenueBookedThisWeek.toLocaleString('en-IN')}</div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-0.5">
            <span className="text-slate-500 text-[10px] uppercase font-mono">Top Channel</span>
            <div className="text-base font-bold text-indigo-600 dark:text-indigo-400 truncate">{weeklyReport.topPerformingChannel}</div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-500 uppercase font-mono flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-500" /> Key Intelligence Observations
          </h4>
          <div className="space-y-1.5">
            {weeklyReport.keyInsights.map((insight, idx) => (
              <div key={idx} className="p-2.5 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
