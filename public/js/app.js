// Transcend Your Body - Main JavaScript

let currentTracker = null;
let activities = [];
let currentTimeSlot = 'morning';
let isLoading = false;

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname === '/dashboard') {
        initializeDashboard();
    }
    
    // Initialize tooltips
    if (window.bootstrap && typeof bootstrap.Tooltip !== 'undefined') {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    
    // Tooltip logic for info icons
    document.querySelectorAll('.info-icon').forEach(function(icon) {
        var tooltip = icon.querySelector('.custom-tooltip');
        if (!tooltip) return;
        icon.addEventListener('mouseenter', function() { tooltip.style.display = 'block'; });
        icon.addEventListener('mouseleave', function() { tooltip.style.display = 'none'; });
        icon.addEventListener('click', function(e) {
            e.stopPropagation();
            tooltip.style.display = tooltip.style.display === 'block' ? 'none' : 'block';
        });
    });
    document.addEventListener('click', function() {
        document.querySelectorAll('.custom-tooltip').forEach(function(tooltip) {
            tooltip.style.display = 'none';
        });
    });
    const createCustomCheckbox = document.getElementById('createCustom');
    if (createCustomCheckbox) {
        createCustomCheckbox.addEventListener('change', toggleCustomActivityFields);
    }
    initializeFormValidation();
});

async function initializeDashboard() {
    if (isLoading) return;
    isLoading = true;
    
    try {
        await Promise.all([
            loadTodayTracker(),
            loadActivities(),
            loadStats()
        ]);
        updateProgressDisplay();
        loadPopularActivities();
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showAlert('Failed to load dashboard data', 'danger');
    } finally {
        isLoading = false;
    }
}

async function loadTodayTracker() {
    try {
        const response = await fetch('/api/tracker/today');
        if (response.ok) {
            currentTracker = await response.json();
            renderTrackerEntries();
        } else if (response.status === 404) {
            await createTodayTracker();
        }
    } catch (error) {
        console.error('Error loading tracker:', error);
    }
}

async function createTodayTracker() {
    try {
        const response = await fetch('/api/tracker', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: new Date().toISOString().split('T')[0] })
        });
        if (response.ok) {
            currentTracker = await response.json();
        }
    } catch (error) {
        console.error('Error creating tracker:', error);
    }
}

async function loadActivities() {
    try {
        const response = await fetch('/api/activities');
        if (response.ok) {
            activities = await response.json();
            populateActivitySelect();
        }
    } catch (error) {
        console.error('Error loading activities:', error);
    }
}

async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        if (response.ok) {
            const stats = await response.json();
            stats.totalActivities = stats.activitiesCompleted;
            stats.successfulDays30 = stats.successfulDays30 ?? 0;
            stats.totalDays30 = stats.totalDays30 ?? 30;
            stats.successfulDays60 = stats.successfulDays60 ?? 0;
            stats.totalDays60 = stats.totalDays60 ?? 60;
            stats.successfulDays90 = stats.successfulDays90 ?? 0;
            stats.totalDays90 = stats.totalDays90 ?? 90;
            stats.weeklyAverage = stats.weeklyAverage ?? 0;
            updateStatsDisplay(stats);
        } else {
            console.error('Failed to load stats:', response.status);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function renderTrackerEntries() {
    if (!currentTracker) return;
    const entries = Array.isArray(currentTracker.entries) ? currentTracker.entries : [];
    const timeSlots = ['morning', 'afternoon', 'evening', 'night'];
    timeSlots.forEach(timeSlot => {
        const container = document.getElementById(`${timeSlot}-activities`);
        if (!container) return;
        const slotEntries = entries.filter(entry => entry.timeSlot === timeSlot);
        if (slotEntries.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="fas fa-plus-circle fa-2x mb-2"></i>
                    <p class="mb-0">No activities scheduled for ${timeSlot}</p>
                    <button class="btn btn-link btn-sm" onclick="showAddActivityModal('${timeSlot}')">
                        Add your first activity
                    </button>
                </div>
            `;
        } else {
            container.innerHTML = slotEntries.map(entry => createActivityHTML(entry)).join('');
        }
        updateTimeSlotProgress(timeSlot, slotEntries);
    });
    updateProgressDisplay();
}

function updateTimeSlotProgress(timeSlot, entries) {
    const progressElement = document.getElementById(`${timeSlot}-progress`);
    if (!progressElement) return;
    const total = entries.length;
    const completed = entries.filter(e => e.status === 'completed').length;
    progressElement.textContent = `${completed} of ${total} completed`;
}

function createActivityHTML(entry) {
    const activity = entry.activity;
    const isCompleted = entry.status === 'completed';
    const categoryClass = `category-${activity.category}`;
    return `
        <div class="activity-item ${isCompleted ? 'completed' : ''}" data-entry-id="${entry.id}">
            <div class="d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center">
                    <div class="form-check me-3">
                        <input class="form-check-input" type="checkbox" ${isCompleted ? 'checked' : ''} 
                               onchange="toggleActivityStatus(${entry.id}, this.checked)">
                    </div>
                    <div class="flex-grow-1">
                        <h6 class="activity-title mb-1">${activity.title}</h6>
                        <p class="text-muted mb-0 small">${activity.description}</p>
                    </div>
                </div>
                <div class="d-flex align-items-center">
                    <span class="badge ${categoryClass} me-2">${activity.category}</span>
                    <button class="btn btn-sm btn-outline-danger btn-delete" 
                            onclick="deleteActivity(${entry.id})" 
                            title="Remove activity">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function showAddActivityModal(timeSlot) {
    currentTimeSlot = timeSlot;
    const modal = new bootstrap.Modal(document.getElementById('addActivityModal'));
    const timeSlotSelect = document.getElementById('timeSlot');
    if (timeSlotSelect) {
        timeSlotSelect.value = timeSlot;
    }
    console.log('[DEBUG] Opening Add Activity Modal. activities:', activities);
    populateActivitySelect(); // Ensure dropdown is populated every time modal opens
    modal.show();
}
window.showAddActivityModal = showAddActivityModal;

function toggleCustomActivityFields() {
    const customFields = document.getElementById('customActivityFields');
    const activitySelect = document.getElementById('activitySelect');
    const createCustom = document.getElementById('createCustom');
    if (createCustom.checked) {
        customFields.style.display = 'block';
        activitySelect.disabled = true;
    } else {
        customFields.style.display = 'none';
        activitySelect.disabled = false;
    }
}

// Group activities by category and time slot for the dropdown
function populateActivitySelect() {
    const select = document.getElementById('activitySelect');
    if (!select || !activities) {
        console.log('[DEBUG] No select element or activities array missing.');
        return;
    }
    select.innerHTML = '';
    if (activities.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No activities available';
        select.appendChild(option);
        select.disabled = true;
        return;
    }
    select.disabled = false;
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select an activity';
    select.appendChild(defaultOption);
    // Group by category and time slot
    const grouped = {};
    activities.forEach(activity => {
        const groupKey = `${activity.category} - ${activity.timeOfDay || 'any'}`;
        if (!grouped[groupKey]) grouped[groupKey] = [];
        grouped[groupKey].push(activity);
    });
    Object.keys(grouped).forEach(groupKey => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = groupKey.charAt(0).toUpperCase() + groupKey.slice(1);
        grouped[groupKey].forEach(activity => {
            const option = document.createElement('option');
            option.value = activity.id;
            option.textContent = activity.title;
            option.title = activity.description || '';
            optgroup.appendChild(option);
        });
        select.appendChild(optgroup);
    });
}

// Show/hide custom activity form
const showCustomBtn = document.getElementById('showCustomActivityFields');
if (showCustomBtn) {
    showCustomBtn.addEventListener('click', function() {
        document.getElementById('customActivityFields').style.display = 'block';
        document.getElementById('addActivityForm').scrollIntoView({ behavior: 'smooth' });
    });
}

const createCustomBtn = document.getElementById('createCustomActivityBtn');
if (createCustomBtn) {
    createCustomBtn.addEventListener('click', async function() {
        const title = document.getElementById('customTitle').value;
        const description = document.getElementById('customDescription').value;
        const category = document.getElementById('customCategory').value;
        const timeOfDay = document.getElementById('customTimeSlot').value;
        if (!title || !category || !timeOfDay) {
            showAlert('Please fill in all required fields for custom activity.', 'warning');
            return;
        }
        try {
            const response = await fetch('/api/activities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description, category, timeOfDay, isCustom: true })
            });
            if (!response.ok) throw new Error('Failed to create custom activity');
            const newActivity = await response.json();
            activities.push(newActivity);
            populateActivitySelect();
            document.getElementById('activitySelect').value = newActivity.id;
            document.getElementById('customActivityFields').style.display = 'none';
            showAlert('Custom activity created!', 'success');
        } catch (error) {
            showAlert('Failed to create custom activity', 'danger');
        }
    });
}

function getTimeAppropriateActivities(timeSlot, allActivities) {
    // Return all activities, regardless of time slot
    return allActivities;
}

async function addActivity() {
    const form = document.getElementById('addActivityForm');
    const formData = new FormData(form);
    try {
        let activityId;
        if (document.getElementById('customActivityFields').style.display === 'block') {
            // Custom activity creation
            const title = formData.get('customTitle');
            const description = formData.get('customDescription');
            const category = formData.get('customCategory');
            const timeOfDay = formData.get('customTimeSlot');
            if (!title || !category || !timeOfDay) {
                showAlert('Please fill in all required fields for custom activity.', 'warning');
                return;
            }
            const activityResponse = await fetch('/api/activities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description, category, timeOfDay, isCustom: true })
            });
            if (!activityResponse.ok) throw new Error('Failed to create custom activity');
            const newActivity = await activityResponse.json();
            activityId = newActivity.id;
            activities.push(newActivity);
            populateActivitySelect();
            document.getElementById('activitySelect').value = newActivity.id;
        } else {
            activityId = parseInt(formData.get('activityId'));
            if (!activityId) {
                showAlert('Please select an activity', 'warning');
                return;
            }
        }
        // Always use the selected time slot from the timeSlotSelect
        const timeSlot = formData.get('timeSlot');
        if (!timeSlot) {
            showAlert('Please select a time slot.', 'warning');
            return;
        }
        const trackerEntry = {
            trackerId: currentTracker.id,
            activityId: activityId,
            timeSlot: timeSlot,
            status: 'pending'
        };
        const response = await fetch('/api/tracker/entries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(trackerEntry)
        });
        if (response.ok) {
            await loadTodayTracker();
            const modal = bootstrap.Modal.getInstance(document.getElementById('addActivityModal'));
            modal.hide();
            form.reset();
            document.getElementById('customActivityFields').style.display = 'none';
            document.getElementById('activitySelect').disabled = false;
            showAlert('Activity added successfully!', 'success');
        } else {
            throw new Error('Failed to add activity to tracker');
        }
    } catch (error) {
        console.error('Error adding activity:', error);
        showAlert('Failed to add activity', 'danger');
    }
}

async function toggleActivityStatus(entryId, isCompleted) {
    if (isLoading) return;
    
    try {
        isLoading = true;
        const status = isCompleted ? 'completed' : 'pending';
        const response = await fetch(`/api/tracker/entries/${entryId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (response.ok) {
            const entry = currentTracker.entries.find(e => e.id === entryId);
            if (entry) {
                entry.status = status;
            }
            renderTrackerEntries();
            loadStats();
            showAlert(`Activity marked as ${status}!`, 'success');
        } else {
            throw new Error('Failed to update activity status');
        }
    } catch (error) {
        console.error('Error updating activity status:', error);
        showAlert('Failed to update activity', 'danger');
    } finally {
        isLoading = false;
    }
}

function showConfirmationModal(message, onConfirm) {
    let modal = document.getElementById('confirmationModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'confirmationModal';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Confirm Action</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="confirmationModalBody">${message}</div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-danger" id="confirmationModalOk">OK</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } else {
        document.getElementById('confirmationModalBody').textContent = message;
    }
    const okBtn = document.getElementById('confirmationModalOk');
    okBtn.onclick = () => {
        bootstrap.Modal.getInstance(modal).hide();
        onConfirm();
    };
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

async function deleteActivity(entryId) {
    showConfirmationModal('Are you sure you want to remove this activity from your tracker?', async function() {
        try {
            const response = await fetch(`/api/tracker/entries/${entryId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                currentTracker.entries = currentTracker.entries.filter(e => e.id !== entryId);
                renderTrackerEntries();
                loadStats();
                showAlert('Activity removed successfully!', 'success');
            } else {
                throw new Error('Failed to delete activity');
            }
        } catch (error) {
            console.error('Error deleting activity:', error);
            showAlert('Failed to remove activity', 'danger');
        }
    });
}

function updateProgressCircle(percentage) {
    const circle = document.getElementById('completionBar');
    if (!circle) return;
    const pct = Math.max(0, Math.min(100, percentage));
    const radius = 62;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (pct / 100) * circumference;
    circle.style.strokeDashoffset = offset;
}

function updateProgressDisplay() {
    if (!currentTracker || !currentTracker.entries) return;
    const total = currentTracker.entries.length;
    const completed = currentTracker.entries.filter(e => e.status === 'completed').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const percentageElement = document.getElementById('completionPercentage');
    if (percentageElement) {
        percentageElement.textContent = `${percentage}%`;
    }
    updateProgressCircle(percentage);
}

// Remove Chart.js progress circle code
// - Remove initializeProgressChart
// - Remove updateProgressChart
// - Remove any references to window.progressChart

window.currentUser = window.currentUser || {};

function updateStatsDisplay(stats) {
    if (!stats || typeof stats !== 'object') {
        stats = { currentStreak: 0, weeklyAverage: 0, totalActivities: 0 };
    }
    if (stats.message) {
        stats = { currentStreak: 0, weeklyAverage: 0, totalActivities: 0 };
    }
    // Streak
    const streakValue = document.getElementById('currentStreak');
    if (streakValue) streakValue.textContent = stats.currentStreak || 0;
    // Weekly Avg
    const weeklyElement = document.getElementById('weeklyAverage');
    if (weeklyElement) weeklyElement.textContent = (typeof stats.weeklyAverage === 'number' && !isNaN(stats.weeklyAverage) ? stats.weeklyAverage : 0) + '%';
    // Accountability
    const accountabilityScore = document.getElementById('accountabilityScore');
    if (accountabilityScore && typeof stats.accountabilityCountdown !== 'undefined') accountabilityScore.textContent = stats.accountabilityCountdown;
    const accountabilityMsg = document.querySelector('#accountabilityScore')?.parentElement?.parentElement?.querySelector('.text-muted.small');
    if (accountabilityMsg && typeof stats.accountabilityMessage === 'string') accountabilityMsg.textContent = stats.accountabilityMessage;
    // Level Up Message
    const levelUpBanner = document.getElementById('levelUpMessageBanner');
    if (levelUpBanner && typeof stats.levelUpMessage === 'string') {
        levelUpBanner.textContent = stats.levelUpMessage;
        levelUpBanner.style.display = stats.levelUpMessage ? 'block' : 'none';
    }
    // Tier Progress
    const tierProgressText = document.getElementById('tierProgressText');
    if (tierProgressText) {
        if (stats.tier === 'gold') tierProgressText.textContent = 'Max tier!';
        else {
            const days = typeof stats.successfulDays30 === 'number' && !isNaN(stats.successfulDays30) ? stats.successfulDays30 : 0;
            const total = typeof stats.totalDays30 === 'number' && !isNaN(stats.totalDays30) ? stats.totalDays30 : 30;
            tierProgressText.textContent = `${days}/${total} to Silver`;
        }
    }
    // Accountability Progress
    const accountabilityProgressText = document.getElementById('accountabilityProgressText');
    if (accountabilityProgressText) {
        const days = typeof stats.successfulDays90 === 'number' && !isNaN(stats.successfulDays90) ? stats.successfulDays90 : 0;
        accountabilityProgressText.textContent = `${days}/90 to Intermediate`;
    }
    // Total Activities
    const totalValue = document.getElementById('totalActivities');
    if (totalValue) totalValue.textContent = stats.totalActivities || 0;
    // Progress Bars
    const tierProgressBar = document.getElementById('tierProgressBar');
    if (tierProgressBar) {
        let progress = 0;
        if (stats.tier === 'gold') progress = 100;
        else {
            const days = typeof stats.successfulDays30 === 'number' && !isNaN(stats.successfulDays30) ? stats.successfulDays30 : 0;
            const total = typeof stats.totalDays30 === 'number' && !isNaN(stats.totalDays30) ? stats.totalDays30 : 30;
            progress = total > 0 ? Math.min(100, Math.round((days / total) * 100)) : 0;
        }
        tierProgressBar.style.width = progress + '%';
    }
    const weeklyBar = document.getElementById('weeklyBar');
    if (weeklyBar) {
        const avg = typeof stats.weeklyAverage === 'number' && !isNaN(stats.weeklyAverage) ? stats.weeklyAverage : 0;
        weeklyBar.style.width = Math.min(100, avg) + '%';
    }
    // Tooltips
    if (window.bootstrap) {
        document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
            new bootstrap.Tooltip(el);
        });
    }
}

function updateAchievementLevel(totalActivitiesCompleted) {
    const achievementBadge = document.getElementById('achievementBadge');
    if (!achievementBadge) return;
    let level = 'Beginner';
    let badgeStyle = '';
    if (totalActivitiesCompleted >= 100) {
        level = 'Master';
        badgeStyle = 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none;';
        applyMasterTheme();
    } else if (totalActivitiesCompleted >= 50) {
        level = 'Advanced';
        badgeStyle = 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none;';
        applyMasterTheme();
    } else if (totalActivitiesCompleted >= 25) {
        level = 'Intermediate';
        badgeStyle = 'background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; border: none;';
        applyIntermediateTheme();
    } else {
        level = 'Beginner';
        badgeStyle = 'background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; border: none;';
        applyBeginnerTheme();
    }
    achievementBadge.innerHTML = '';
    achievementBadge.textContent = level;
    achievementBadge.className = 'badge achievement-badge-large';
    achievementBadge.style.cssText = `font-size: 18px; padding: 12px 24px; ${badgeStyle}`;
    achievementBadge.style.display = 'none';
    achievementBadge.offsetHeight;
    achievementBadge.style.display = 'inline-block';
}

function applyMasterTheme() {
    // ...
}
function applyIntermediateTheme() {
    // ...
}
function applyBeginnerTheme() {
    // ...
}
function applyDashboardTheme(tier) {
    const container = document.querySelector('.quick-stats');
    if (!container) return;
    container.classList.remove('theme-bronze', 'theme-silver', 'theme-gold');
    if (tier === 'gold') container.classList.add('theme-gold');
    else if (tier === 'silver') container.classList.add('theme-silver');
    else container.classList.add('theme-bronze');
}
function updateSubscriptionStatus(streak, totalActivitiesCompleted) {
    // ...
}
function loadPopularActivities() {
    // ...
}
function showAlert(message, type = 'info') {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert.position-fixed');
    existingAlerts.forEach(alert => alert.remove());
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px; max-width: 400px;';
    alertDiv.innerHTML = `
        <i class="fas fa-${getAlertIcon(type)} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.classList.remove('show');
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.parentNode.removeChild(alertDiv);
                }
            }, 150);
        }
    }, 5000);
}

function getAlertIcon(type) {
    const icons = {
        'success': 'check-circle',
        'danger': 'exclamation-triangle',
        'warning': 'exclamation-circle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}
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
            } else {
                this.classList.remove('is-invalid');
            }
        });
    });
}
