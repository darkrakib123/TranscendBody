import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import NavigationHeader from "@/components/NavigationHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Admin() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      toast({
        title: "Access Denied",
        description: "Admin access required",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-neutral-50">
      <NavigationHeader user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-800 mb-2">Admin Panel</h1>
          <p className="text-gray-600">Manage users and activities</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-users text-primary"></i>
                <span>User Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">View and manage user accounts</p>
              <button className="w-full py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                Manage Users
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-cog text-secondary"></i>
                <span>Activity Library</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Add, edit, or remove activities</p>
              <button className="w-full py-2 px-4 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors">
                Manage Activities
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-chart-bar text-accent"></i>
                <span>Analytics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">View platform usage statistics</p>
              <button className="w-full py-2 px-4 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors">
                View Analytics
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
