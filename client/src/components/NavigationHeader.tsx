import type { User } from "@shared/schema";

interface NavigationHeaderProps {
  user?: User;
}

export default function NavigationHeader({ user }: NavigationHeaderProps) {
  const displayName = user 
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email 
    : 'User';

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                <i className="fas fa-dumbbell text-white text-sm"></i>
              </div>
              <span className="text-xl font-bold text-neutral-800">Transcend Your Body</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="text-gray-600 hover:text-gray-900 p-2">
              <i className="fas fa-bell text-lg"></i>
            </button>
            <div className="flex items-center space-x-3">
              {user?.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt="User Profile" 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <i className="fas fa-user text-gray-600 text-sm"></i>
                </div>
              )}
              <span className="text-sm font-medium">{displayName}</span>
              <div className="relative group">
                <button className="text-gray-400 hover:text-gray-600">
                  <i className="fas fa-chevron-down text-xs"></i>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="py-1">
                    <button 
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => window.location.href = '/api/logout'}
                    >
                      <i className="fas fa-sign-out-alt mr-2"></i>
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
