// TranscendBody - Enhanced Main JavaScript with Bug Fixes and Improvements

let currentTracker = null;
let activities = [];
let currentTimeSlot = 'morning';
let isLoading = false;
let loadingStates = new Set();

// Enhanced error handling and logging
const logger = {
  info: (message, data = null) => {
    console.log(`[INFO] ${message}`, data || '');
  },
  error: (message, error = null) => {
    console.error(`[ERROR] ${message}`, error || '');
  },
  warn: (message, data = null) => {
    console.warn(`[WARN] ${message}`, data || '');
  }
};

// API helper with proper error handling
const api = {
  async request(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      
      return data.success !== false ? (data.data || data) : data;
    } catch (error) {
      logger.error(`API request failed: ${url}`, error);
      throw error;
    }
  },

  get(url) {
    return this.request(url);
  },

  post(url, body) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  patch(url, body) {
    return this.request(url, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  },

  delete(url) {
    return this.request(url, {
      method: 'DELETE'
    });
  }
};

// Enhanced loading state management
const loadingManager = {
  show(element, text = 'Loading...') {
    if (element) {
      element.disabled = true;
      element.classList.add('loading');
      const originalText = element.textContent;
      element.dataset.originalText = originalText;
      element.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${text}`;
    }
  },

  hide(element) {
    if (element) {
      element.disabled = false;
      element.classList.remove('loading');
      const originalText = element.dataset.originalText;
      if (originalText) {
        element.textContent = originalText;
        delete element.dataset.originalText;
      }
    }
  },

  setGlobal(loading) {
    isLoading = loading;
    const body = document.body;
    if (loading) {
      body.classList.add('loading');
    } else {
      body.classList.remove('loading');
    }
  }
};

// Enhanced DOM ready handler
document.addEventListener('DOMContentLoaded', function() {
  logger.info('DOM loaded, initializing application');
  
  try {
    // Initialize based on current page
    if (window.location.pathname === '/dashboard') {
      initializeDashboard();
    }
    
    // Initialize global components
    initializeTooltips();
    initializeFormValidation();
    initializeCustomActivityToggle();
    initializeGlobalEventListeners();
    
    // Set current date in header
    updateCurrentDate();
    
    logger.info('Application initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize application', error);
    showAlert('Failed to initialize application. Please refresh the page.', 'danger');
  }
});

// Enhanced dashboard initialization
async function initializeDashboard() {
  if (isLoading) {
    logger.warn('Dashboard initialization already in progress');
    return;
  }
  
  loadingManager.setGlobal(true);
  
  try {
    logger.info('Initializing dashboard');
    
    // Load all dashboard data in parallel
    const promises = [
      loadTodayTracker(),
      loadActivities(),
      loadStats()
    ];
    
    await Promise.allSettled(promises);
    
    // Update UI components
    updateProgressDisplay();
    
    logger.info('Dashboard initialized successfully');
  } catch (error) {
    logger.error('Dashboard initialization failed', error);
    showAlert('Failed to load dashboard data. Please refresh the page.', 'danger');
  } finally {
    loadingManager.setGlobal(false);
  }
}

// Enhanced tracker loading with better error handling
async function loadTodayTracker() {
  try {
    logger.info('Loading today\'s tracker');
    
    const response = await api.get('/api/tracker/today');
    currentTracker = response;
    renderTrackerEntries();
    
    logger.info('Today\'s tracker loaded successfully');
  } catch (error) {
    if (error.message.includes('404')) {
      logger.info('No tracker for today, creating new one');
      await createTodayTracker();
    } else {
      logger.error('Failed to load today\'s tracker', error);
      showAlert('Failed to load today\'s activities', 'warning');
    }
  }
}

// Enhanced tracker creation
async function createTodayTracker() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await api.post('/api/tracker', { date: today });
    currentTracker = response;
    renderTrackerEntries();
    
    logger.info('New tracker created for today');
  } catch (error) {
    logger.error('Failed to create today\'s tracker', error);
    showAlert('Failed to create today\'s tracker', 'danger');
  }
}

// Enhanced activities loading
async function loadActivities() {
  try {
    logger.info('Loading activities');
    
    const response = await api.get('/api/activities');
    activities = Array.isArray(response) ? response : (response.data || []);
    
    populateActivitySelect();
    
    logger.info(`Loaded ${activities.length} activities`);
  } catch (error) {
    logger.error('Failed to load activities', error);
    showAlert('Failed to load activities', 'warning');
    activities = [];
  }
}

// Enhanced stats loading
async function loadStats() {
  try {
    logger.info('Loading user stats');
    
    const response = await api.get('/api/stats');
    const stats = response.data || response;
    
    // Ensure stats have default values
    const normalizedStats = {
      currentStreak: 0,
      weeklyAverage: 0,
      totalActivities: 0,
      activitiesCompleted: 0,
      completionRate: 0,
      accountabilityCountdown: 0,
      accountabilityMessage: '',
      ...stats
    };
    
    updateStatsDisplay(normalizedStats);
    
    logger.info('User stats loaded successfully');
  } catch (error) {
    logger.error('Failed to load stats', error);
    // Don't show error alert for stats as it's not critical
    updateStatsDisplay({
      currentStreak: 0,
      weeklyAverage: 0,
      totalActivities: 0,
      activitiesCompleted: 0,
      completionRate: 0
    });
  }
}

// Enhanced tracker entries rendering
function renderTrackerEntries() {
  if (!currentTracker) {
    logger.warn('No current tracker to render');
    return;
  }
  
  const entries = Array.isArray(currentTracker.entries) ? currentTracker.entries : [];
  const timeSlots = ['morning', 'afternoon', 'evening', 'night'];
  
  timeSlots.forEach(timeSlot => {
    const container = document.getElementById(`${timeSlot}-activities`);
    if (!container) {
      logger.warn(`Container not found for time slot: ${timeSlot}`);
      return;
    }
    
    const slotEntries = entries.filter(entry => entry.timeSlot === timeSlot);
    
    if (slotEntries.length === 0) {
      container.innerHTML = createEmptySlotHTML(timeSlot);
    } else {
      container.innerHTML = slotEntries.map(entry => createActivityHTML(entry)).join('');
    }
    
    updateTimeSlotProgress(timeSlot, slotEntries);
  });
  
  updateProgressDisplay();
}

// Create empty slot HTML
function createEmptySlotHTML(timeSlot) {
  const timeSlotNames = {
    morning: 'Morning',
    afternoon: 'Afternoon', 
    evening: 'Evening',
    night: 'Night'
  };
  
  return `
    <div class="text-center py-4 text-muted empty-slot">
      <i class="fas fa-plus-circle fa-2x mb-2 opacity-50"></i>
      <p class="mb-2">No activities scheduled for ${timeSlotNames[timeSlot]}</p>
      <button class="btn btn-outline-primary btn-sm" onclick="showAddActivityModal('${timeSlot}')">
        <i class="fas fa-plus me-1"></i>Add Activity
      </button>
    </div>
  `;
}

// Enhanced activity HTML creation
function createActivityHTML(entry) {
  if (!entry || !entry.activity) {
    logger.warn('Invalid entry data', entry);
    return '';
  }
  
  const activity = entry.activity;
  const isCompleted = entry.status === 'completed';
  const isSkipped = entry.status === 'skipped';
  const categoryClass = `category-${activity.category}`;
  const statusClass = isCompleted ? 'completed' : (isSkipped ? 'skipped' : '');
  
  return `
    <div class="activity-item ${statusClass}" data-entry-id="${entry.id}">
      <div class="d-flex align-items-center justify-content-between">
        <div class="d-flex align-items-center flex-grow-1">
          <div class="form-check me-3">
            <input class="form-check-input" type="checkbox" 
                   ${isCompleted ? 'checked' : ''} 
                   onchange="toggleActivityStatus(${entry.id}, this.checked)"
                   id="activity-${entry.id}">
            <label class="form-check-label" for="activity-${entry.id}"></label>
          </div>
          <div class="flex-grow-1 min-w-0">
            <h6 class="activity-title mb-1 text-truncate">${escapeHtml(activity.title)}</h6>
            <p class="text-muted mb-0 small text-truncate">${escapeHtml(activity.description || '')}</p>
            ${entry.notes ? `<p class="text-info mb-0 small"><i class="fas fa-sticky-note me-1"></i>${escapeHtml(entry.notes)}</p>` : ''}
          </div>
        </div>
        <div class="d-flex align-items-center gap-2">
          <span class="badge ${categoryClass}">${activity.category}</span>
          ${activity.difficulty ? `<span class="badge bg-secondary">${activity.difficulty}</span>` : ''}
          <div class="dropdown">
            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
              <i class="fas fa-ellipsis-v"></i>
            </button>
            <ul class="dropdown-menu">
              <li><button class="dropdown-item" onclick="markAsSkipped(${entry.id})">
                <i class="fas fa-forward me-2"></i>Mark as Skipped
              </button></li>
              <li><button class="dropdown-item" onclick="addNoteToActivity(${entry.id})">
                <i class="fas fa-sticky-note me-2"></i>Add Note
              </button></li>
              <li><hr class="dropdown-divider"></li>
              <li><button class="dropdown-item text-danger" onclick="deleteActivity(${entry.id})">
                <i class="fas fa-trash me-2"></i>Remove
              </button></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Utility function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Enhanced time slot progress update
function updateTimeSlotProgress(timeSlot, entries) {
  const progressElement = document.getElementById(`${timeSlot}-progress`);
  if (!progressElement) return;
  
  const total = entries.length;
  const completed = entries.filter(e => e.status === 'completed').length;
  const skipped = entries.filter(e => e.status === 'skipped').length;
  
  let progressText = `${completed} of ${total} completed`;
  if (skipped > 0) {
    progressText += ` (${skipped} skipped)`;
  }
  
  progressElement.textContent = progressText;
  
  // Update progress color based on completion rate
  const completionRate = total > 0 ? (completed / total) * 100 : 0;
  progressElement.className = 'badge ';
  
  if (completionRate >= 80) {
    progressElement.className += 'bg-success';
  } else if (completionRate >= 50) {
    progressElement.className += 'bg-warning text-dark';
  } else {
    progressElement.className += 'bg-light text-dark';
  }
}

// Enhanced activity modal
function showAddActivityModal(timeSlot) {
  currentTimeSlot = timeSlot;
  
  const modal = document.getElementById('addActivityModal');
  const timeSlotSelect = document.getElementById('timeSlot');
  
  if (!modal) {
    logger.error('Add activity modal not found');
    return;
  }
  
  if (timeSlotSelect) {
    timeSlotSelect.value = timeSlot;
  }
  
  // Reset form
  const form = document.getElementById('addActivityForm');
  if (form) {
    form.reset();
  }
  
  // Hide custom fields
  const customFields = document.getElementById('customActivityFields');
  if (customFields) {
    customFields.style.display = 'none';
  }
  
  populateActivitySelect();
  
  const bsModal = new bootstrap.Modal(modal);
  bsModal.show();
  
  logger.info(`Opened add activity modal for ${timeSlot}`);
}

// Make function globally available
window.showAddActivityModal = showAddActivityModal;

// Enhanced activity selection population
function populateActivitySelect() {
  const select = document.getElementById('activitySelect');
  if (!select) {
    logger.warn('Activity select element not found');
    return;
  }
  
  select.innerHTML = '';
  
  if (!activities || activities.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No activities available';
    select.appendChild(option);
    select.disabled = true;
    return;
  }
  
  select.disabled = false;
  
  // Add default option
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Select an activity';
  select.appendChild(defaultOption);
  
  // Group activities by category
  const grouped = activities.reduce((acc, activity) => {
    const category = activity.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(activity);
    return acc;
  }, {});
  
  // Create optgroups
  Object.entries(grouped).forEach(([category, categoryActivities]) => {
    const optgroup = document.createElement('optgroup');
    optgroup.label = category.charAt(0).toUpperCase() + category.slice(1);
    
    categoryActivities
      .sort((a, b) => a.title.localeCompare(b.title))
      .forEach(activity => {
        const option = document.createElement('option');
        option.value = activity.id;
        option.textContent = activity.title;
        option.title = activity.description || '';
        optgroup.appendChild(option);
      });
    
    select.appendChild(optgroup);
  });
}

// Enhanced custom activity toggle
function initializeCustomActivityToggle() {
  const showCustomBtn = document.getElementById('showCustomActivityFields');
  const customFields = document.getElementById('customActivityFields');
  const activitySelect = document.getElementById('activitySelect');
  
  if (showCustomBtn && customFields) {
    showCustomBtn.addEventListener('click', function() {
      const isVisible = customFields.style.display === 'block';
      
      if (isVisible) {
        customFields.style.display = 'none';
        showCustomBtn.innerHTML = '<i class="fas fa-plus me-1"></i>Create Custom Activity';
        if (activitySelect) activitySelect.disabled = false;
      } else {
        customFields.style.display = 'block';
        showCustomBtn.innerHTML = '<i class="fas fa-minus me-1"></i>Use Existing Activity';
        if (activitySelect) activitySelect.disabled = true;
        customFields.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
}

// Enhanced activity addition
async function addActivity() {
  const form = document.getElementById('addActivityForm');
  const submitBtn = document.querySelector('#addActivityModal .btn-primary');
  
  if (!form) {
    logger.error('Add activity form not found');
    return;
  }
  
  loadingManager.show(submitBtn, 'Adding...');
  
  try {
    const formData = new FormData(form);
    const customFields = document.getElementById('customActivityFields');
    const isCustom = customFields && customFields.style.display === 'block';
    
    let activityId;
    
    if (isCustom) {
      // Create custom activity
      const customData = {
        title: formData.get('customTitle'),
        description: formData.get('customDescription'),
        category: formData.get('customCategory'),
        timeOfDay: formData.get('customTimeSlot'),
        isCustom: true,
        difficulty: 'medium'
      };
      
      // Validate custom activity data
      if (!customData.title || !customData.category || !customData.timeOfDay) {
        throw new Error('Please fill in all required fields for custom activity');
      }
      
      const newActivity = await api.post('/api/activities', customData);
      activityId = newActivity.id;
      
      // Add to activities array
      activities.push(newActivity);
      populateActivitySelect();
      
      logger.info('Custom activity created', newActivity);
    } else {
      // Use existing activity
      activityId = parseInt(formData.get('activityId'));
      if (!activityId) {
        throw new Error('Please select an activity');
      }
    }
    
    const timeSlot = formData.get('timeSlot');
    if (!timeSlot) {
      throw new Error('Please select a time slot');
    }
    
    // Add to tracker
    const trackerEntry = {
      trackerId: currentTracker.id,
      activityId: activityId,
      timeSlot: timeSlot,
      status: 'pending'
    };
    
    await api.post('/api/tracker/entries', trackerEntry);
    
    // Reload tracker and close modal
    await loadTodayTracker();
    await loadStats();
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('addActivityModal'));
    modal.hide();
    
    // Reset form
    form.reset();
    if (customFields) {
      customFields.style.display = 'none';
    }
    
    showAlert('Activity added successfully!', 'success');
    logger.info('Activity added to tracker successfully');
    
  } catch (error) {
    logger.error('Failed to add activity', error);
    showAlert(error.message || 'Failed to add activity', 'danger');
  } finally {
    loadingManager.hide(submitBtn);
  }
}

// Make function globally available
window.addActivity = addActivity;

// Enhanced activity status toggle
async function toggleActivityStatus(entryId, isCompleted) {
  if (loadingStates.has(entryId)) {
    logger.warn(`Status update already in progress for entry ${entryId}`);
    return;
  }
  
  loadingStates.add(entryId);
  
  try {
    const status = isCompleted ? 'completed' : 'pending';
    await api.patch(`/api/tracker/entries/${entryId}/status`, { status });
    
    // Update local state
    if (currentTracker && currentTracker.entries) {
      const entry = currentTracker.entries.find(e => e.id === entryId);
      if (entry) {
        entry.status = status;
        if (status === 'completed') {
          entry.completedAt = new Date().toISOString();
        }
      }
    }
    
    // Re-render and update stats
    renderTrackerEntries();
    loadStats();
    
    const statusText = status === 'completed' ? 'completed' : 'pending';
    showAlert(`Activity marked as ${statusText}!`, 'success');
    
    logger.info(`Activity ${entryId} status updated to ${status}`);
    
  } catch (error) {
    logger.error(`Failed to update activity status for entry ${entryId}`, error);
    
    // Revert checkbox state
    const checkbox = document.querySelector(`input[onchange*="${entryId}"]`);
    if (checkbox) {
      checkbox.checked = !isCompleted;
    }
    
    showAlert('Failed to update activity status', 'danger');
  } finally {
    loadingStates.delete(entryId);
  }
}

// Make function globally available
window.toggleActivityStatus = toggleActivityStatus;

// New function to mark activity as skipped
async function markAsSkipped(entryId) {
  if (loadingStates.has(entryId)) return;
  
  loadingStates.add(entryId);
  
  try {
    await api.patch(`/api/tracker/entries/${entryId}/status`, { status: 'skipped' });
    
    // Update local state
    if (currentTracker && currentTracker.entries) {
      const entry = currentTracker.entries.find(e => e.id === entryId);
      if (entry) {
        entry.status = 'skipped';
      }
    }
    
    renderTrackerEntries();
    loadStats();
    
    showAlert('Activity marked as skipped', 'info');
    logger.info(`Activity ${entryId} marked as skipped`);
    
  } catch (error) {
    logger.error(`Failed to skip activity ${entryId}`, error);
    showAlert('Failed to skip activity', 'danger');
  } finally {
    loadingStates.delete(entryId);
  }
}

// Make function globally available
window.markAsSkipped = markAsSkipped;

// New function to add notes to activity
async function addNoteToActivity(entryId) {
  const currentEntry = currentTracker?.entries?.find(e => e.id === entryId);
  const currentNote = currentEntry?.notes || '';
  
  const note = prompt('Add a note to this activity:', currentNote);
  
  if (note === null) return; // User cancelled
  
  try {
    await api.patch(`/api/tracker/entries/${entryId}/status`, { 
      status: currentEntry?.status || 'pending',
      notes: note 
    });
    
    // Update local state
    if (currentEntry) {
      currentEntry.notes = note;
    }
    
    renderTrackerEntries();
    showAlert('Note added successfully!', 'success');
    
  } catch (error) {
    logger.error(`Failed to add note to activity ${entryId}`, error);
    showAlert('Failed to add note', 'danger');
  }
}

// Make function globally available
window.addNoteToActivity = addNoteToActivity;

// Enhanced activity deletion
async function deleteActivity(entryId) {
  const entry = currentTracker?.entries?.find(e => e.id === entryId);
  const activityName = entry?.activity?.title || 'this activity';
  
  if (!confirm(`Are you sure you want to remove "${activityName}" from your tracker?`)) {
    return;
  }
  
  try {
    await api.delete(`/api/tracker/entries/${entryId}`);
    
    // Update local state
    if (currentTracker && currentTracker.entries) {
      currentTracker.entries = currentTracker.entries.filter(e => e.id !== entryId);
    }
    
    renderTrackerEntries();
    loadStats();
    
    showAlert('Activity removed successfully!', 'success');
    logger.info(`Activity ${entryId} deleted successfully`);
    
  } catch (error) {
    logger.error(`Failed to delete activity ${entryId}`, error);
    showAlert('Failed to remove activity', 'danger');
  }
}

// Make function globally available
window.deleteActivity = deleteActivity;

// Enhanced progress display update
function updateProgressDisplay() {
  if (!currentTracker || !currentTracker.entries) {
    updateProgressCircle(0);
    return;
  }
  
  const total = currentTracker.entries.length;
  const completed = currentTracker.entries.filter(e => e.status === 'completed').length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  // Update percentage text
  const percentageElement = document.getElementById('completionPercentage');
  if (percentageElement) {
    percentageElement.textContent = `${percentage}%`;
  }
  
  // Update progress circle
  updateProgressCircle(percentage);
  
  // Update completion rate in tracker
  if (currentTracker.completionRate !== percentage) {
    currentTracker.completionRate = percentage;
  }
}

// Enhanced progress circle update
function updateProgressCircle(percentage) {
  const circle = document.getElementById('completionBar');
  if (!circle) return;
  
  const pct = Math.max(0, Math.min(100, percentage));
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  
  circle.style.strokeDashoffset = offset;
  
  // Update color based on completion rate
  if (pct >= 80) {
    circle.style.stroke = '#28a745'; // Success green
  } else if (pct >= 50) {
    circle.style.stroke = '#ffc107'; // Warning yellow
  } else {
    circle.style.stroke = '#2563eb'; // Primary blue
  }
}

// Enhanced stats display update
function updateStatsDisplay(stats) {
  if (!stats || typeof stats !== 'object') {
    logger.warn('Invalid stats data received', stats);
    stats = {
      currentStreak: 0,
      weeklyAverage: 0,
      totalActivities: 0,
      activitiesCompleted: 0,
      accountabilityCountdown: 0,
      accountabilityMessage: ''
    };
  }
  
  // Update streak
  const streakElement = document.getElementById('currentStreak');
  if (streakElement) {
    streakElement.textContent = stats.currentStreak || 0;
  }
  
  // Update weekly average
  const weeklyElement = document.getElementById('weeklyAverage');
  if (weeklyElement) {
    const avg = stats.weeklyAverage || 0;
    weeklyElement.textContent = `${avg}%`;
  }
  
  // Update total activities
  const totalElement = document.getElementById('totalActivities');
  if (totalElement) {
    totalElement.textContent = stats.activitiesCompleted || stats.totalActivities || 0;
  }
  
  // Update accountability score
  const accountabilityElement = document.getElementById('accountabilityScore');
  if (accountabilityElement) {
    accountabilityElement.textContent = stats.accountabilityCountdown || 0;
  }
  
  // Update accountability message
  const messageElements = document.querySelectorAll('.text-muted.small');
  messageElements.forEach(el => {
    if (el.textContent.includes('more days') || el.textContent.includes('level')) {
      el.textContent = stats.accountabilityMessage || 'Keep going!';
    }
  });
  
  logger.info('Stats display updated', stats);
}

// Enhanced alert system
function showAlert(message, type = 'info', duration = 5000) {
  // Remove existing alerts
  const existingAlerts = document.querySelectorAll('.alert.position-fixed');
  existingAlerts.forEach(alert => alert.remove());
  
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
  alertDiv.style.cssText = `
    top: 20px; 
    right: 20px; 
    z-index: 9999; 
    min-width: 300px; 
    max-width: 400px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;
  
  const icon = getAlertIcon(type);
  alertDiv.innerHTML = `
    <div class="d-flex align-items-center">
      <i class="fas fa-${icon} me-2"></i>
      <div class="flex-grow-1">${message}</div>
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
  
  document.body.appendChild(alertDiv);
  
  // Auto-remove after specified duration
  setTimeout(() => {
    if (alertDiv.parentNode) {
      alertDiv.classList.remove('show');
      setTimeout(() => {
        if (alertDiv.parentNode) {
          alertDiv.parentNode.removeChild(alertDiv);
        }
      }, 150);
    }
  }, duration);
  
  logger.info(`Alert shown: ${type} - ${message}`);
}

// Get appropriate icon for alert type
function getAlertIcon(type) {
  const icons = {
    'success': 'check-circle',
    'danger': 'exclamation-triangle',
    'warning': 'exclamation-circle',
    'info': 'info-circle'
  };
  return icons[type] || 'info-circle';
}

// Enhanced tooltip initialization
function initializeTooltips() {
  try {
    if (window.bootstrap && typeof bootstrap.Tooltip !== 'undefined') {
      const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
      tooltipTriggerList.forEach(tooltipTriggerEl => {
        new bootstrap.Tooltip(tooltipTriggerEl, {
          trigger: 'hover focus',
          delay: { show: 500, hide: 100 }
        });
      });
      
      logger.info(`Initialized ${tooltipTriggerList.length} tooltips`);
    }
  } catch (error) {
    logger.error('Failed to initialize tooltips', error);
  }
}

// Enhanced form validation
function initializeFormValidation() {
  const forms = document.querySelectorAll('form[data-validate]');
  
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      if (!form.checkValidity()) {
        e.preventDefault();
        e.stopPropagation();
        showAlert('Please fill in all required fields correctly.', 'warning');
      }
      form.classList.add('was-validated');
    });
  });
  
  // Real-time validation for email fields
  const emailInputs = document.querySelectorAll('input[type="email"]');
  emailInputs.forEach(input => {
    input.addEventListener('blur', function() {
      if (this.value && !this.checkValidity()) {
        this.classList.add('is-invalid');
        this.classList.remove('is-valid');
      } else if (this.value) {
        this.classList.remove('is-invalid');
        this.classList.add('is-valid');
      }
    });
  });
  
  logger.info(`Initialized validation for ${forms.length} forms`);
}

// Initialize global event listeners
function initializeGlobalEventListeners() {
  // Handle clicks outside of dropdowns to close them
  document.addEventListener('click', function(e) {
    const dropdowns = document.querySelectorAll('.dropdown-menu.show');
    dropdowns.forEach(dropdown => {
      if (!dropdown.contains(e.target) && !dropdown.previousElementSibling?.contains(e.target)) {
        const bsDropdown = bootstrap.Dropdown.getInstance(dropdown.previousElementSibling);
        if (bsDropdown) {
          bsDropdown.hide();
        }
      }
    });
  });
  
  // Handle escape key to close modals
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const openModals = document.querySelectorAll('.modal.show');
      openModals.forEach(modal => {
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) {
          bsModal.hide();
        }
      });
    }
  });
}

// Update current date in header
function updateCurrentDate() {
  const dateElement = document.getElementById('currentDate');
  if (dateElement) {
    const today = new Date();
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    dateElement.textContent = `- ${today.toLocaleDateString('en-US', options)}`;
  }
}

// Utility function to debounce function calls
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Enhanced error boundary for unhandled errors
window.addEventListener('error', function(e) {
  logger.error('Unhandled error', e.error);
  showAlert('An unexpected error occurred. Please refresh the page if problems persist.', 'danger');
});

window.addEventListener('unhandledrejection', function(e) {
  logger.error('Unhandled promise rejection', e.reason);
  showAlert('An unexpected error occurred. Please refresh the page if problems persist.', 'danger');
});

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    api,
    loadingManager,
    showAlert,
    logger
  };
}