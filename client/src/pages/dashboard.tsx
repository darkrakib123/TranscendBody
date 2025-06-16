import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import NavigationHeader from "@/components/NavigationHeader";
import TimeSlotSection from "@/components/TimeSlotSection"; 
import ActivityLibrary from "@/components/ActivityLibrary";
import QuickStats from "@/components/QuickStats";
import { useQuery } from "@tanstack/react-query";
import type { DailyTrackerWithEntries } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const { data: tracker, isLoading: trackerLoading, error } = useQuery<DailyTrackerWithEntries>({
    queryKey: ["/api/tracker/today"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (error && isUnauthorizedError(error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  if (isLoading || trackerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-dumbbell text-white text-sm"></i>
          </div>
          <p className="text-gray-600">Loading your tracker...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const morningEntries = tracker?.entries.filter(e => e.timeSlot === 'morning') || [];
  const afternoonEntries = tracker?.entries.filter(e => e.timeSlot === 'afternoon') || [];
  const eveningEntries = tracker?.entries.filter(e => e.timeSlot === 'evening') || [];

  const completionPercentage = tracker?.completionRate || 0;

  return (
    <div className="min-h-screen bg-neutral-50">
      <NavigationHeader user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-800 mb-2">Today's Tracker</h1>
              <p className="text-gray-600">{currentDate}</p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{completionPercentage}%</div>
                <div className="text-sm text-gray-600">Complete</div>
              </div>
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                  <path 
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                    fill="none" 
                    stroke="#E5E7EB" 
                    strokeWidth="2"
                  />
                  <path 
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                    fill="none" 
                    stroke="#3B82F6" 
                    strokeWidth="2" 
                    strokeDasharray={`${completionPercentage}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <i className="fas fa-fire text-accent text-lg"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <TimeSlotSection 
              timeSlot="morning" 
              entries={morningEntries}
              trackerId={tracker?.id}
            />
            <TimeSlotSection 
              timeSlot="afternoon" 
              entries={afternoonEntries}
              trackerId={tracker?.id}
            />
            <TimeSlotSection 
              timeSlot="evening" 
              entries={eveningEntries}
              trackerId={tracker?.id}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <QuickStats />
            <ActivityLibrary trackerId={tracker?.id} />
            
            {/* Admin Panel */}
            {user?.role === 'admin' && (
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg p-6 text-white">
                <h3 className="text-lg font-semibold mb-4">Admin Panel</h3>
                <div className="space-y-3">
                  <button 
                    className="w-full text-left py-2 px-3 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors text-sm"
                    onClick={() => window.location.href = '/admin'}
                  >
                    <i className="fas fa-users mr-2"></i>Manage Users
                  </button>
                  <button className="w-full text-left py-2 px-3 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors text-sm">
                    <i className="fas fa-cog mr-2"></i>Manage Activities
                  </button>
                  <button className="w-full text-left py-2 px-3 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors text-sm">
                    <i className="fas fa-chart-bar mr-2"></i>View Analytics
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
