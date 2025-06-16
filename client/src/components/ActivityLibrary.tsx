import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Activity } from "@shared/schema";
import AddActivityModal from "./AddActivityModal";

interface ActivityLibraryProps {
  trackerId?: number;
}

const categoryConfig = {
  workout: { color: 'red', icon: 'fas fa-running' },
  nutrition: { color: 'green', icon: 'fas fa-glass-water' },
  recovery: { color: 'blue', icon: 'fas fa-bed' },
  mindset: { color: 'purple', icon: 'fas fa-heart' }
};

export default function ActivityLibrary({ trackerId }: ActivityLibraryProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: activities } = useQuery<Activity[]>({
    queryKey: ['/api/activities'],
  });

  // Show only a few popular activities in the sidebar
  const popularActivities = activities?.filter(a => !a.isCustom).slice(0, 3) || [];

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-800">Activity Library</h3>
        <button className="text-primary hover:text-blue-700 text-sm font-medium">
          View All
        </button>
      </div>
      
      <div className="space-y-3">
        {popularActivities.map((activity) => {
          const categoryConf = categoryConfig[activity.category as keyof typeof categoryConfig];
          return (
            <div 
              key={activity.id}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-6 h-6 bg-${categoryConf.color}-100 rounded flex items-center justify-center`}>
                  <i className={`${categoryConf.icon} text-${categoryConf.color}-600 text-xs`}></i>
                </div>
                <span className="text-sm font-medium">{activity.title}</span>
              </div>
              <i className="fas fa-plus text-gray-400 text-xs"></i>
            </div>
          );
        })}
      </div>
      
      <button 
        className="w-full mt-4 py-2 px-4 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        onClick={() => setIsModalOpen(true)}
      >
        <i className="fas fa-plus mr-2"></i>Create Custom Activity
      </button>

      {isModalOpen && (
        <AddActivityModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          trackerId={trackerId}
        />
      )}
    </div>
  );
}
