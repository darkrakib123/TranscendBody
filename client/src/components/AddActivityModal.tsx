import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { Activity } from "@shared/schema";

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeSlot?: 'morning' | 'afternoon' | 'evening';
  trackerId?: number;
}

export default function AddActivityModal({ isOpen, onClose, timeSlot = 'morning', trackerId }: AddActivityModalProps) {
  const [selectedActivity, setSelectedActivity] = useState<number | 'custom'>('custom');
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [category, setCategory] = useState<string>('workout');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(timeSlot);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: activities } = useQuery<Activity[]>({
    queryKey: ['/api/activities'],
  });

  const createActivityMutation = useMutation({
    mutationFn: async (activityData: any) => {
      const response = await apiRequest('POST', '/api/activities', activityData);
      return response.json();
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
        description: "Failed to create activity",
        variant: "destructive",
      });
    },
  });

  const addToTrackerMutation = useMutation({
    mutationFn: async (entryData: any) => {
      await apiRequest('POST', '/api/tracker/entries', entryData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tracker/today'] });
      onClose();
      resetForm();
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
        description: "Failed to add activity to tracker",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedActivity('custom');
    setCustomTitle('');
    setCustomDescription('');
    setCategory('workout');
    setSelectedTimeSlot('morning');
  };

  const handleSubmit = async () => {
    if (!trackerId) {
      toast({
        title: "Error",
        description: "No tracker available",
        variant: "destructive",
      });
      return;
    }

    let activityId: number;

    if (selectedActivity === 'custom') {
      if (!customTitle.trim()) {
        toast({
          title: "Error",
          description: "Activity name is required",
          variant: "destructive",
        });
        return;
      }

      // Create custom activity first
      const newActivity = await createActivityMutation.mutateAsync({
        title: customTitle,
        description: customDescription,
        category,
        isCustom: true,
      });
      activityId = newActivity.id;
    } else {
      activityId = Number(selectedActivity);
    }

    // Add to tracker
    addToTrackerMutation.mutate({
      trackerId,
      activityId,
      timeSlot: selectedTimeSlot,
      status: 'pending',
    });
  };

  // Filter activities based on time slot for better relevance
  const getTimeAppropriatActivities = (timeSlot: string, activities: Activity[]) => {
    const morningActivities = ['Morning Meditation', 'Healthy Breakfast', 'Protein Shake', 'Stretching', 'Goal Visualization', 'Gratitude Journal'];
    const afternoonActivities = ['HIIT Training', 'Push-ups', 'Squats', 'Planks', '30-min Walk', 'Meal Prep', 'Track Calories', 'Progress Photos'];
    const eveningActivities = ['8 Hours Sleep', 'Foam Rolling', 'Hot Bath', 'Massage', 'Drink 8 Glasses Water', 'Positive Affirmations'];
    
    return activities.filter(a => {
      if (a.isCustom) return true; // Always show custom activities
      
      switch (timeSlot) {
        case 'morning':
          return morningActivities.some(title => a.title.includes(title) || title.includes(a.title));
        case 'afternoon':
          return afternoonActivities.some(title => a.title.includes(title) || title.includes(a.title));
        case 'evening':
          return eveningActivities.some(title => a.title.includes(title) || title.includes(a.title));
        default:
          return true;
      }
    });
  };

  const preloadedActivities = getTimeAppropriatActivities(selectedTimeSlot, activities?.filter(a => !a.isCustom) || []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Activity</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Choose Activity</Label>
            <Select value={selectedActivity.toString()} onValueChange={(value) => setSelectedActivity(value === 'custom' ? 'custom' : Number(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Select an activity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Create Custom Activity</SelectItem>
                {preloadedActivities.map((activity) => (
                  <SelectItem key={activity.id} value={activity.id.toString()}>
                    {activity.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedActivity === 'custom' && (
            <>
              <div>
                <Label>Activity Name</Label>
                <Input
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Enter activity name"
                />
              </div>

              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workout">Workout</SelectItem>
                    <SelectItem value="nutrition">Nutrition</SelectItem>
                    <SelectItem value="recovery">Recovery</SelectItem>
                    <SelectItem value="mindset">Mindset</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Description (Optional)</Label>
                <Textarea
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Add notes or details"
                  rows={2}
                />
              </div>
            </>
          )}

          <div>
            <Label>Time Slot</Label>
            <Select value={selectedTimeSlot} onValueChange={(value: any) => {
              setSelectedTimeSlot(value);
              // Reset selected activity when time slot changes to show relevant activities
              setSelectedActivity('custom');
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Morning</SelectItem>
                <SelectItem value="afternoon">Afternoon</SelectItem>
                <SelectItem value="evening">Evening</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              {selectedTimeSlot === 'morning' && 'Best for: meditation, breakfast, stretching, goal setting'}
              {selectedTimeSlot === 'afternoon' && 'Best for: workouts, meal prep, active tasks'}
              {selectedTimeSlot === 'evening' && 'Best for: recovery, sleep prep, reflection'}
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              className="flex-1"
              disabled={createActivityMutation.isPending || addToTrackerMutation.isPending}
            >
              {createActivityMutation.isPending || addToTrackerMutation.isPending ? "Adding..." : "Add Activity"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
