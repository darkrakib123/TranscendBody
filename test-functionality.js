const puppeteer = require('puppeteer');

class QATestRunner {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      auth: { passed: 0, total: 0, issues: [] },
      dashboard: { passed: 0, total: 0, issues: [] },
      activities: { passed: 0, total: 0, issues: [] },
      completion: { passed: 0, total: 0, issues: [] },
      deletion: { passed: 0, total: 0, issues: [] },
      sidebar: { passed: 0, total: 0, issues: [] },
      admin: { passed: 0, total: 0, issues: [] },
      client: { passed: 0, total: 0, issues: [] },
      persistence: { passed: 0, total: 0, issues: [] },
      errors: { passed: 0, total: 0, issues: [] },
      performance: { passed: 0, total: 0, issues: [] },
      security: { passed: 0, total: 0, issues: [] }
    };
  }

  async init() {
    console.log('🔧 Initializing QA Test Runner...');
    this.browser = await puppeteer.launch({ headless: false, slowMo: 50 });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 720 });
  }

  async testAuthenticationAndLanding() {
    console.log('📋 Testing Section 1: Authentication & Landing Page');
    
    try {
      // Test 1.1: Landing Page Display
      await this.page.goto('http://localhost:5000');
      await this.page.waitForSelector('.hero-section', { timeout: 5000 });
      this.testResults.auth.passed++;
      console.log('✅ Landing page loads with professional gradient design');
      
      // Test auth toggle
      const toggleExists = await this.page.$('.auth-toggle, .toggle-form');
      if (toggleExists) {
        this.testResults.auth.passed++;
        console.log('✅ Auth toggle found');
      } else {
        this.testResults.auth.issues.push('Auth toggle not found');
      }
      
      this.testResults.auth.total += 4;
      
      // Test 1.2: User Registration - check validation
      await this.page.click('input[type="email"]');
      await this.page.type('input[type="email"]', '');
      await this.page.click('input[type="password"]');
      
      // Test 1.3: User Authentication
      await this.page.type('input[type="email"]', 'admin@transcendbody.com');
      await this.page.type('input[type="password"]', 'password123');
      await this.page.click('button[type="submit"]');
      
      await this.page.waitForNavigation({ timeout: 10000 });
      const currentUrl = this.page.url();
      
      if (currentUrl.includes('dashboard')) {
        this.testResults.auth.passed += 2;
        console.log('✅ Admin login successful');
      } else {
        this.testResults.auth.issues.push('Admin login failed');
      }
      
    } catch (error) {
      this.testResults.auth.issues.push(`Auth test error: ${error.message}`);
    }
  }

  async testDashboardCore() {
    console.log('📋 Testing Section 2: Dashboard Core Functionality');
    
    try {
      // Test 2.1: Dashboard Loading
      await this.page.waitForSelector('.dashboard-header', { timeout: 5000 });
      this.testResults.dashboard.passed++;
      console.log('✅ Dashboard loads');
      
      // Check for user name
      const userName = await this.page.$('.user-name, .greeting');
      if (userName) {
        this.testResults.dashboard.passed++;
        console.log('✅ User name displayed');
      }
      
      // Check date display
      const dateElement = await this.page.$('.date, .today-date');
      if (dateElement) {
        this.testResults.dashboard.passed++;
        console.log('✅ Date displayed');
      }
      
      // Test 2.2: Time Slot Management
      const timeSlots = await this.page.$$('.time-slot');
      if (timeSlots.length === 3) {
        this.testResults.dashboard.passed++;
        console.log('✅ Three time slots displayed');
      } else {
        this.testResults.dashboard.issues.push(`Expected 3 time slots, found ${timeSlots.length}`);
      }
      
      // Test progress indicator
      const progressIndicator = await this.page.$('.progress-circle, .circular-progress');
      if (progressIndicator) {
        this.testResults.dashboard.passed++;
        console.log('✅ Progress indicator found');
      }
      
      this.testResults.dashboard.total += 5;
      
    } catch (error) {
      this.testResults.dashboard.issues.push(`Dashboard test error: ${error.message}`);
    }
  }

  async testActivityManagement() {
    console.log('📋 Testing Section 3: Activity Management');
    
    try {
      // Test 3.1: Add Activity Modal
      const addButtons = await this.page.$$('.add-activity-btn, button:contains("Add Activity")');
      if (addButtons.length > 0) {
        await addButtons[0].click();
        await this.page.waitForSelector('#addActivityModal', { timeout: 5000 });
        this.testResults.activities.passed++;
        console.log('✅ Add Activity modal opens');
        
        // Test dropdown population
        const dropdown = await this.page.$('#activitySelect');
        if (dropdown) {
          const options = await this.page.$$('#activitySelect option');
          if (options.length > 1) {
            this.testResults.activities.passed++;
            console.log('✅ Activity dropdown populated');
          } else {
            this.testResults.activities.issues.push('Activity dropdown not populated');
          }
        }
        
        // Test custom activity option
        await this.page.selectOption('#activitySelect', 'custom');
        await this.page.waitForTimeout(500);
        
        const customFields = await this.page.$('#customActivityFields');
        const isVisible = await customFields.isVisible();
        if (isVisible) {
          this.testResults.activities.passed++;
          console.log('✅ Custom activity fields appear');
        } else {
          this.testResults.activities.issues.push('Custom activity fields not showing');
        }
        
        // Close modal
        await this.page.click('.btn-close, .modal-close');
      }
      
      this.testResults.activities.total += 3;
      
    } catch (error) {
      this.testResults.activities.issues.push(`Activity test error: ${error.message}`);
    }
  }

  async testCompletionTracking() {
    console.log('📋 Testing Section 4: Activity Completion');
    
    try {
      // Find activity checkboxes
      const checkboxes = await this.page.$$('input[type="checkbox"]');
      if (checkboxes.length > 0) {
        const initialProgress = await this.page.$eval('.progress-percentage', el => el.textContent);
        
        // Click first checkbox
        await checkboxes[0].click();
        await this.page.waitForTimeout(1000);
        
        const newProgress = await this.page.$eval('.progress-percentage', el => el.textContent);
        
        if (initialProgress !== newProgress) {
          this.testResults.completion.passed++;
          console.log('✅ Progress updates on completion');
        } else {
          this.testResults.completion.issues.push('Progress not updating');
        }
      }
      
      this.testResults.completion.total += 1;
      
    } catch (error) {
      this.testResults.completion.issues.push(`Completion test error: ${error.message}`);
    }
  }

  async testDeleteButtons() {
    console.log('📋 Testing Section 5: Activity Deletion');
    
    try {
      const deleteButtons = await this.page.$$('.delete-btn, .trash-btn, i.fa-trash');
      if (deleteButtons.length > 0) {
        this.testResults.deletion.passed++;
        console.log('✅ Delete buttons found');
        
        // Test delete confirmation (if implemented)
        await deleteButtons[0].click();
        await this.page.waitForTimeout(500);
        
        // Check if confirmation dialog appears
        const confirmDialog = await this.page.$('.modal, .confirm-dialog');
        if (confirmDialog) {
          this.testResults.deletion.passed++;
          console.log('✅ Delete confirmation works');
        }
      } else {
        this.testResults.deletion.issues.push('Delete buttons not found');
      }
      
      this.testResults.deletion.total += 2;
      
    } catch (error) {
      this.testResults.deletion.issues.push(`Deletion test error: ${error.message}`);
    }
  }

  async testAdminPanel() {
    console.log('📋 Testing Section 7: Admin-Specific Features');
    
    try {
      // Check for admin panel
      const adminPanel = await this.page.$('.admin-panel, .admin-section');
      if (adminPanel) {
        this.testResults.admin.passed++;
        console.log('✅ Admin panel visible for admin user');
        
        // Test admin buttons
        const manageButtons = await this.page.$$('.manage-users, .manage-activities');
        if (manageButtons.length > 0) {
          this.testResults.admin.passed++;
          console.log('✅ Admin management buttons found');
        }
      } else {
        this.testResults.admin.issues.push('Admin panel not found for admin user');
      }
      
      this.testResults.admin.total += 2;
      
    } catch (error) {
      this.testResults.admin.issues.push(`Admin test error: ${error.message}`);
    }
  }

  async testClientUser() {
    console.log('📋 Testing Section 8: Client User Features');
    
    try {
      // Logout and login as client
      await this.page.goto('http://localhost:5000/logout');
      await this.page.goto('http://localhost:5000/login');
      
      await this.page.type('input[type="email"]', 'client@transcendbody.com');
      await this.page.type('input[type="password"]', 'password123');
      await this.page.click('button[type="submit"]');
      
      await this.page.waitForNavigation();
      
      // Check admin panel is NOT visible
      const adminPanel = await this.page.$('.admin-panel, .admin-section');
      if (!adminPanel) {
        this.testResults.client.passed++;
        console.log('✅ Admin panel hidden for client user');
      } else {
        this.testResults.client.issues.push('Admin panel visible for client user');
      }
      
      this.testResults.client.total += 1;
      
    } catch (error) {
      this.testResults.client.issues.push(`Client test error: ${error.message}`);
    }
  }

  async generateReport() {
    console.log('\n🏁 QA TEST REPORT');
    console.log('==================');
    
    let totalPassed = 0;
    let totalTests = 0;
    let totalIssues = 0;
    
    Object.keys(this.testResults).forEach(section => {
      const result = this.testResults[section];
      totalPassed += result.passed;
      totalTests += result.total;
      totalIssues += result.issues.length;
      
      const percentage = result.total > 0 ? ((result.passed / result.total) * 100).toFixed(1) : 0;
      console.log(`${section.toUpperCase()}: ${result.passed}/${result.total} (${percentage}%)`);
      
      if (result.issues.length > 0) {
        result.issues.forEach(issue => console.log(`  ❌ ${issue}`));
      }
    });
    
    const overallScore = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;
    console.log('\n📊 OVERALL SCORE');
    console.log(`Tests Passed: ${totalPassed}/${totalTests}`);
    console.log(`Success Rate: ${overallScore}%`);
    console.log(`Issues Found: ${totalIssues}`);
    
    return { overallScore, totalPassed, totalTests, totalIssues };
  }

  async runAllTests() {
    await this.init();
    
    try {
      await this.testAuthenticationAndLanding();
      await this.testDashboardCore();
      await this.testActivityManagement();
      await this.testCompletionTracking();
      await this.testDeleteButtons();
      await this.testAdminPanel();
      await this.testClientUser();
      
      const report = await this.generateReport();
      await this.browser.close();
      
      return report;
    } catch (error) {
      console.error('Test runner error:', error);
      await this.browser.close();
      return { overallScore: 0, totalPassed: 0, totalTests: 0, totalIssues: 1 };
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const runner = new QATestRunner();
  runner.runAllTests().then(report => {
    console.log(`\n🎯 FINAL QA SCORE: ${report.overallScore}%`);
    process.exit(report.overallScore >= 80 ? 0 : 1);
  });
}

module.exports = QATestRunner;