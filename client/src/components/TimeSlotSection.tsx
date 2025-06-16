import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { TrackerEntryWithActivity } from "@shared/schema";
import AddActivityModal from "./AddActivityModal";

interface TimeSlotSectionProps {
  timeSlot: 'morning' | 'afternoon' | 'evening';
  entries: TrackerEntryWithActivity[];
  trackerId?: number;
}

const timeSlotConfig = {
  morning: {
    icon: 'fas fa-sun',
    gradient: 'from-yellow-400 to-orange-400',
    title: 'Morning'
  },
  afternoon: {
    icon: 'fas fa-sun',
    gradient: 'from-blue-400 to-indigo-400',
    title: 'Afternoon'
  },
  evening: {
    icon: 'fas fa-moon',
    gradient: 'from-indigo-500 to-purple-500',
    title: 'Evening'
  }
};

const categoryConfig = {
  workout: { color: 'red', icon: 'fas fa-dumbbell' },
  nutrition: { color: 'green', icon: 'fas fa-apple-alt' },
  recovery: { color: 'blue', icon: 'fas fa-bed' },
  mindset: { color: 'purple', icon: 'fas fa-brain' }
};

export default function TimeSlotSection({ timeSlot, entries, trackerId }: TimeSlotSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const config = timeSlotConfig[timeSlot];

  const completedCount = entries.filter(e => e.status === 'completed').length;
  const totalCount = entries.length;

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ entryId, status }: { entryId: number; status: string }) => {
      await apiRequest('PATCH', `/api/tracker/entries/${entryId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tracker/today'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update activity status",
        variant: "destructive",
      });
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (entryId: number) => {
      await apiRequest('DELETE', `/api/tracker/entries/${entryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tracker/today'] });
      toast({
        title: "Success",
        description: "Activity removed from tracker",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to remove activity",
        variant: "destructive",
      });
    },
  });

  const handleToggleActivity = (entryId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    toggleStatusMutation.mutate({ entryId, status: newStatus });
  };

  const handleDeleteEntry = (entryId: number) => {
    if (confirm('Are you sure you want to remove this activity from your tracker?')) {
      deleteEntryMutation.mutate(entryId);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 bg-gradient-to-r ${config.gradient} rounded-full flex items-center justify-center`}>
            <i className={`${config.icon} text-white`}></i>
          </div>
          <h2 className="text-xl font-semibold text-neutral-800">{config.title}</h2>
          <span className="text-sm text-gray-500">
            {completedCount} of {totalCount} completed
          </span>
        </div>
        <button 
          className="text-primary hover:text-blue-700 text-sm font-medium"
          onClick={() => setIsModalOpen(true)}
        >
          <i className="fas fa-plus mr-1"></i>Add Activity
        </button>
      </div>
      
      <div className="space-y-3">
        {entries.length === 0 ? (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
            <p className="text-gray-500">No activities scheduled for {timeSlot}</p>
            <button 
              className="mt-2 text-primary hover:text-blue-700 text-sm font-medium"
              onClick={() => setIsModalOpen(true)}
            >
              Add your first activity
            </button>
          </div>
        ) : (
          entries.map((entry) => {
            const categoryConf = categoryConfig[entry.activity.category as keyof typeof categoryConfig];
            return (
              <div 
                key={entry.id}
                className={`bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex items-center justify-between hover:shadow-md transition-shadow ${
                  entry.status === 'completed' ? 'opacity-75' : ''
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <input 
                      type="checkbox" 
                      checked={entry.status === 'completed'}
                      onChange={() => handleToggleActivity(entry.id, entry.status)}
                      className="w-5 h-5 text-secondary rounded focus:ring-2 focus:ring-secondary"
                      disabled={toggleStatusMutation.isPending}
                    />
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 bg-${categoryConf.color}-100 rounded-lg flex items-center justify-center`}>
                      <i className={`${categoryConf.icon} text-${categoryConf.color}-600 text-sm`}></i>
                    </div>
                    <div>
                      <h3 className="font-medium text-neutral-800">{entry.activity.title}</h3>
                      {entry.activity.description && (
                        <p className="text-sm text-gray-600">{entry.activity.description}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 bg-${categoryConf.color}-100 text-${categoryConf.color}-700 text-xs font-medium rounded-full capitalize`}>
                    {entry.activity.category}
                  </span>
                  <button 
                    className="text-red-400 hover:text-red-600"
                    onClick={() => handleDeleteEntry(entry.id)}
                    title="Delete activity"
                  >
                    <i className="fas fa-trash text-xs"></i>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <AddActivityModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          timeSlot={timeSlot}
          trackerId={trackerId}
        />
      )}
    </div>
  );
}
