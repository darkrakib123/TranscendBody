// Manual Test Script for Transcend Your Body App
// Run this in browser console to test all functionality

const testSuite = {
  // Test 1: Check if FontAwesome icons are loaded
  async testFontAwesome() {
    console.log('Testing FontAwesome icons...');
    const hasFA = document.querySelector('.fa, .fas, .far, .fab');
    console.log('FontAwesome icons found:', hasFA ? 'YES' : 'NO');
    return hasFA !== null;
  },

  // Test 2: Check if delete buttons are visible
  async testDeleteButtons() {
    console.log('Testing delete button visibility...');
    const deleteButtons = document.querySelectorAll('[title="Remove activity"], .fa-trash');
    console.log('Delete buttons found:', deleteButtons.length);
    deleteButtons.forEach((btn, index) => {
      console.log(`Delete button ${index + 1}:`, btn.classList.toString());
    });
    return deleteButtons.length > 0;
  },

  // Test 3: Check admin panel visibility
  async testAdminPanel() {
    console.log('Testing admin panel visibility...');
    const adminPanel = document.querySelector('div:contains("Admin Panel")');
    console.log('Admin panel found:', adminPanel ? 'YES' : 'NO');
    return adminPanel !== null;
  },

  // Test 4: Check time slot sections
  async testTimeSlots() {
    console.log('Testing time slot sections...');
    const timeSlots = ['Morning', 'Afternoon', 'Evening'];
    const foundSlots = timeSlots.filter(slot => 
      document.querySelector(`*:contains("${slot}")`)
    );
    console.log('Time slots found:', foundSlots);
    return foundSlots.length === 3;
  },

  // Test 5: Check completion percentage updates
  async testCompletionTracking() {
    console.log('Testing completion percentage...');
    const progressElement = document.querySelector('text-2xl');
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    console.log('Progress elements found:', progressElement ? 'YES' : 'NO');
    console.log('Activity checkboxes found:', checkboxes.length);
    return progressElement && checkboxes.length > 0;
  },

  // Run all tests
  async runAllTests() {
    console.log('=== STARTING COMPREHENSIVE TEST SUITE ===');
    const results = {};
    
    results.fontAwesome = await this.testFontAwesome();
    results.deleteButtons = await this.testDeleteButtons();
    results.adminPanel = await this.testAdminPanel();
    results.timeSlots = await this.testTimeSlots();
    results.completion = await this.testCompletionTracking();
    
    console.log('=== TEST RESULTS ===');
    Object.entries(results).forEach(([test, passed]) => {
      console.log(`${test}: ${passed ? 'PASS' : 'FAIL'}`);
    });
    
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    console.log(`Overall: ${passedTests}/${totalTests} tests passed`);
    
    return results;
  }
};

// Auto-run tests when script loads
setTimeout(() => testSuite.runAllTests(), 1000);