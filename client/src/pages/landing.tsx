import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
              <i className="fas fa-dumbbell text-white text-lg"></i>
            </div>
            <h1 className="text-4xl font-bold text-neutral-800">Transcend Your Body</h1>
          </div>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Your complete daily fitness tracker for fat loss and muscle building. 
            Plan, track, and achieve your fitness goals across workouts, nutrition, recovery, and mindset.
          </p>
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary/90"
            onClick={() => window.location.href = '/api/login'}
          >
            Get Started Today
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-dumbbell text-red-600"></i>
              </div>
              <h3 className="font-semibold mb-2">Workouts</h3>
              <p className="text-sm text-gray-600">Track your daily exercise routine</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-apple-alt text-green-600"></i>
              </div>
              <h3 className="font-semibold mb-2">Nutrition</h3>
              <p className="text-sm text-gray-600">Monitor your daily nutrition habits</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-bed text-blue-600"></i>
              </div>
              <h3 className="font-semibold mb-2">Recovery</h3>
              <p className="text-sm text-gray-600">Prioritize rest and recovery</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-brain text-purple-600"></i>
              </div>
              <h3 className="font-semibold mb-2">Mindset</h3>
              <p className="text-sm text-gray-600">Build mental resilience</p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-800 mb-4">Perfect for</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <span className="px-4 py-2 bg-white rounded-full text-sm font-medium shadow-sm">
              Fitness Beginners
            </span>
            <span className="px-4 py-2 bg-white rounded-full text-sm font-medium shadow-sm">
              Busy Professionals
            </span>
            <span className="px-4 py-2 bg-white rounded-full text-sm font-medium shadow-sm">
              Coaching Clients
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
