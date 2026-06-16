import React from 'react';

export default function StatsCard({ tools = [] }) {
  const totalTools = tools.length;
  
  // Calculate category distributions
  const fieldCounts = tools.reduce((acc, tool) => {
    acc[tool.field] = (acc[tool.field] || 0) + 1;
    return acc;
  }, {});

  const departments = tools.reduce((acc, tool) => {
    if (tool.internal_info?.internal_department) {
      acc[tool.internal_info.internal_department] = (acc[tool.internal_info.internal_department] || 0) + 1;
    }
    return acc;
  }, {});

  const totalDepartments = Object.keys(departments).length || 5; // Fallback for visualization if no internal tools are loaded

  return (
    <div className="glass-panel p-6 rounded-2xl shadow-xl hover-lift flex flex-col justify-between h-full min-h-[300px]">
      <div>
        <div className="flex justify-between items-center mb-6">
          <span className="text-sm font-semibold tracking-wider uppercase opacity-80 text-primary-sky">System Analytics</span>
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full tag-sky">
            Active Directory
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <span className="text-2xl font-bold tracking-tight text-primary-sky">
              {totalTools}
            </span>
            <p className="text-xs opacity-75 font-medium mt-1">Cataloged Tools</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <span className="text-2xl font-bold tracking-tight text-primary-sky">
              {totalDepartments}
            </span>
            <p className="text-xs opacity-75 font-medium mt-1">Departments Mapped</p>
          </div>
        </div>

        {/* Custom graphic representing categories distribution */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider opacity-60 mb-2">Category Distribution</h4>
          {Object.entries(fieldCounts).slice(0, 3).map(([field, count]) => {
            const percentage = totalTools > 0 ? Math.round((count / totalTools) * 100) : 0;
            return (
              <div key={field} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="truncate max-w-[150px]">{field}</span>
                  <span>{percentage}%</span>
                </div>
                <div className="w-full h-1.5 bg-neutral-medium/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary-sky to-primary-secondary transition-all duration-500" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-neutral-medium/20 flex items-center justify-between text-xs font-medium opacity-70">
        <span>Licensing Node Status</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-brand-sky-medium animate-pulse" />
          Synchronized
        </span>
      </div>
    </div>
  );
}
