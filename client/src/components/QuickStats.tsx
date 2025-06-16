import { useQuery } from "@tanstack/react-query";

interface Stats {
  currentStreak: number;
  weeklyAverage: number;
  totalActivities: number;
}

export default function QuickStats() {
  const { data: stats } = useQuery<Stats>({
    queryKey: ['/api/stats'],
  });

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-neutral-800 mb-4">Quick Stats</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-fire text-red-600 text-sm"></i>
            </div>
            <span className="text-sm font-medium">Streak</span>
          </div>
          <span className="text-lg font-bold text-neutral-800">
            {stats?.currentStreak || 0} days
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-trophy text-green-600 text-sm"></i>
            </div>
            <span className="text-sm font-medium">This Week</span>
          </div>
          <span className="text-lg font-bold text-neutral-800">
            {stats?.weeklyAverage || 0}%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-target text-blue-600 text-sm"></i>
            </div>
            <span className="text-sm font-medium">Total Activities</span>
          </div>
          <span className="text-lg font-bold text-neutral-800">
            {stats?.totalActivities || 0}
          </span>
        </div>
      </div>
    </div>
  );
}
