# Transcend Your Body - Daily Tracker Test Cases

## Test Credentials
- **Admin User**: `admin@transcendbody.com` / `password123`
- **Client User**: `client@transcendbody.com` / `password123`
- **Demo User**: `nanthekumar.2011@mitb.smu.edu.sg` / `password123`

## 1. Authentication & Landing Page Tests

### 1.1 Landing Page Display
- [ ] Verify landing page loads with professional gradient design
- [ ] Confirm auth toggle works (Sign In ↔ Create Account)
- [ ] Test form validation on both sign-in and registration forms
- [ ] Verify demo credentials are displayed

### 1.2 User Registration
- [ ] Register new user with valid credentials
- [ ] Test validation for required fields
- [ ] Verify redirect to dashboard after successful registration
- [ ] Test duplicate email validation

### 1.3 User Authentication
- [ ] Sign in with admin credentials
- [ ] Sign in with client credentials
- [ ] Test invalid credentials handling
- [ ] Verify session persistence after login
- [ ] Test logout functionality

## 2. Dashboard Core Functionality Tests

### 2.1 Dashboard Loading
- [ ] Verify dashboard loads with user's name in header
- [ ] Confirm today's date displays correctly
- [ ] Check circular progress indicator shows current completion percentage
- [ ] Verify three time slots are displayed (Morning, Afternoon, Evening)

### 2.2 Time Slot Management
- [ ] Confirm each time slot shows correct icon and color
- [ ] Verify completion counters (X of Y completed) update correctly
- [ ] Test "Add Activity" buttons for each time slot

### 2.3 Progress Tracking
- [ ] Verify circular progress indicator updates when activities are completed
- [ ] Test completion percentage calculation accuracy
- [ ] Confirm progress persists after page refresh

## 3. Activity Management Tests

### 3.1 Add Activity Modal
- [ ] Click "Add Activity" for morning slot
- [ ] Verify modal opens with activity dropdown populated
- [ ] Test dropdown contains all available activities
- [ ] Confirm custom activity option is present

### 3.2 Select Existing Activity
- [ ] Select "Push-ups" from workout category
- [ ] Verify activity is added to correct time slot
- [ ] Confirm activity appears with proper icon and badge
- [ ] Test adding same activity to different time slots

### 3.3 Create Custom Activity
- [ ] Select "Create Custom Activity" option
- [ ] Verify custom fields appear (name, description, category)
- [ ] Create custom workout activity
- [ ] Create custom nutrition activity
- [ ] Create custom recovery activity
- [ ] Create custom mindset activity
- [ ] Confirm custom activities are saved to database

### 3.4 Activity Categories
Test activities from each category:
- [ ] **Workout**: Push-ups, Morning Jog, Strength Training
- [ ] **Nutrition**: Healthy Breakfast, Protein Shake, Meal Prep
- [ ] **Recovery**: 8 Hours Sleep, Stretching, Meditation
- [ ] **Mindset**: Gratitude Journal, Goal Setting, Reading

## 4. Activity Completion Tests

### 4.1 Mark Activities Complete
- [ ] Check off pending activity and verify it becomes strikethrough
- [ ] Confirm checkbox becomes disabled after completion
- [ ] Verify completion counter updates immediately
- [ ] Test progress circle updates in real-time

### 4.2 Activity Status Persistence
- [ ] Complete several activities
- [ ] Refresh page and confirm status persists
- [ ] Test completion across different time slots

## 5. Activity Deletion Tests

### 5.1 Delete Individual Activities
- [ ] Click trash icon on any activity
- [ ] Confirm deletion confirmation dialog appears
- [ ] Accept deletion and verify activity is removed
- [ ] Cancel deletion and verify activity remains
- [ ] Test deletion of completed vs pending activities

### 5.2 Deletion Impact
- [ ] Delete activity and verify completion counters update
- [ ] Confirm progress percentage recalculates correctly
- [ ] Test deletion from each time slot

## 6. Sidebar & Statistics Tests

### 6.1 Quick Stats Display
- [ ] Verify "Current Streak" shows days
- [ ] Check "This Week" percentage displays
- [ ] Confirm "Total Activities" count is accurate

### 6.2 Popular Activities Section
- [ ] Verify popular activities list displays
- [ ] Test "+" buttons to quickly add popular activities
- [ ] Confirm "View All" link functionality

## 7. Admin-Specific Tests

### 7.1 Admin Panel Access
- [ ] Sign in as admin user
- [ ] Verify Admin Panel section appears in sidebar
- [ ] Test "Manage Users" button functionality
- [ ] Test "Manage Activities" button functionality

### 7.2 User Management (Admin Only)
- [ ] Access admin user management page
- [ ] View all registered users
- [ ] Test role change functionality (user ↔ admin)
- [ ] Verify admin can see user activity data

### 7.3 Activity Management (Admin Only)
- [ ] Access activity management interface
- [ ] Create new system-wide activities
- [ ] Edit existing activity details
- [ ] Delete activities (verify impact on user trackers)

## 8. Client User Tests

### 8.1 Client Dashboard Access
- [ ] Sign in as client user
- [ ] Verify no Admin Panel appears
- [ ] Confirm all user features work normally
- [ ] Test activity creation and management

### 8.2 Client Limitations
- [ ] Verify client cannot access admin URLs
- [ ] Confirm client gets 403 error for admin endpoints
- [ ] Test client can only manage their own activities

## 9. Data Persistence Tests

### 9.1 Cross-Session Persistence
- [ ] Add activities and complete some
- [ ] Log out and log back in
- [ ] Verify all data persists correctly
- [ ] Test with different browsers

### 9.2 Multi-User Data Isolation
- [ ] Add activities as admin user
- [ ] Switch to client user
- [ ] Verify users see only their own data
- [ ] Test activity creation doesn't affect other users

## 10. Edge Cases & Error Handling

### 10.1 Form Validation
- [ ] Submit empty activity creation form
- [ ] Test extremely long activity names/descriptions
- [ ] Try invalid category selections

### 10.2 Network Error Handling
- [ ] Test behavior when API requests fail
- [ ] Verify error messages display appropriately
- [ ] Confirm graceful degradation

### 10.3 Browser Compatibility
- [ ] Test in Chrome, Firefox, Safari, Edge
- [ ] Verify responsive design on mobile devices
- [ ] Test with JavaScript disabled

## 11. Performance Tests

### 11.1 Loading Performance
- [ ] Measure dashboard load time
- [ ] Test with many activities (50+ entries)
- [ ] Verify smooth animations and transitions

### 11.2 Real-time Updates
- [ ] Test rapid activity completion/deletion
- [ ] Verify progress indicators update smoothly
- [ ] Confirm no memory leaks during extended use

## 12. Security Tests

### 12.1 Authentication Security
- [ ] Test access to dashboard without login
- [ ] Verify admin endpoints require admin role
- [ ] Test session timeout behavior

### 12.2 Data Security
- [ ] Verify users can only access their own data
- [ ] Test SQL injection protection in forms
- [ ] Confirm XSS protection on user inputs

## Expected Results Summary

### For All Users:
- Smooth activity management across all time slots
- Real-time progress tracking and persistence
- Intuitive UI with immediate feedback
- Proper category-based organization

### For Admin Users:
- Additional admin panel with user/activity management
- Ability to create system-wide activities
- User role management capabilities

### For Client Users:
- Full tracker functionality without admin features
- Personal activity management only
- No access to admin functions

## Test Environment Setup
1. Clear browser cache before testing
2. Use provided test credentials
3. Test on latest browser versions
4. Verify database starts with sample data
5. Check all API endpoints respond correctly

Run these tests systematically to ensure all functionality works as intended for both user types.