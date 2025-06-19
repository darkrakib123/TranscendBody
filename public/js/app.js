// Transcend Your Body - Main JavaScript

let currentTracker = null;
let activities = [];
let currentTimeSlot = 'morning';

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname === '/dashboard') {
        initializeDashboard();
    }
    
    // Initialize custom activity toggle
    const createCustomCheckbox = document.getElementById('createCustom');
    if (createCustomCheckbox) {
        createCustomCheckbox.addEventListener('change', toggleCustomActivityFields);
    }
    
    // Initialize form validation
    initializeFormValidation();
});

// Dashboard initialization
async function initializeDashboard() {
    try {
        await Promise.all([
            loadTodayTracker(),
            loadActivities(),
            loadStats()
        ]);
        
        initializeProgressChart();
        updateProgressDisplay();
        loadPopularActivities();
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showAlert('Failed to load dashboard data', 'danger');
    }
}

// Load today's tracker
async function loadTodayTracker() {
    try {
        const response = await fetch('/api/tracker/today');
        if (response.ok) {
            currentTracker = await response.json();
            renderTrackerEntries();
        } else if (response.status === 404) {
            // No tracker for today, create one
            await createTodayTracker();
        }
    } catch (error) {
        console.error('Error loading tracker:', error);
    }
}

// Create today's tracker
async function createTodayTracker() {
    try {
        const response = await fetch('/api/tracker', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                date: new Date().toISOString().split('T')[0]
            })
        });
        
        if (response.ok) {
            currentTracker = await response.json();
        }
    } catch (error) {
        console.error('Error creating tracker:', error);
    }
}

// Load activities
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

// Load user stats
async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        if (response.ok) {
            const stats = await response.json();
            updateStatsDisplay(stats);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Render tracker entries
function renderTrackerEntries() {
    if (!currentTracker || !currentTracker.entries) return;
    
    const timeSlots = ['morning', 'afternoon', 'evening'];
    
    timeSlots.forEach(timeSlot => {
        const container = document.getElementById(`${timeSlot}-activities`);
        if (!container) return;
        
        const entries = currentTracker.entries.filter(entry => entry.timeSlot === timeSlot);
        
        if (entries.length === 0) {
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
            container.innerHTML = entries.map(entry => createActivityHTML(entry)).join('');
        }
    });
    
    updateProgressDisplay();
}

// Create activity HTML
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

// Show add activity modal
function showAddActivityModal(timeSlot) {
    currentTimeSlot = timeSlot;
    const modal = new bootstrap.Modal(document.getElementById('addActivityModal'));
    const timeSlotSelect = document.getElementById('timeSlot');
    
    if (timeSlotSelect) {
        timeSlotSelect.value = timeSlot;
    }
    
    modal.show();
}

// Toggle custom activity fields
function toggleCustomActivityFields() {
    const checkbox = document.getElementById('createCustom');
    const fields = document.getElementById('customActivityFields');
    const activitySelect = document.getElementById('activitySelect');
    
    if (checkbox && fields && activitySelect) {
        if (checkbox.checked) {
            fields.style.display = 'block';
            activitySelect.disabled = true;
        } else {
            fields.style.display = 'none';
            activitySelect.disabled = false;
        }
    }
}

// Populate activity select
function populateActivitySelect() {
    const select = document.getElementById('activitySelect');
    if (!select || !activities) return;
    
    // Filter activities based on time slot
    const filteredActivities = getTimeAppropriateActivities(currentTimeSlot, activities);
    
    select.innerHTML = '<option value="">Select an activity</option>';
    
    filteredActivities.forEach(activity => {
        const option = document.createElement('option');
        option.value = activity.id;
        option.textContent = activity.title;
        select.appendChild(option);
    });
}

// Get time-appropriate activities
function getTimeAppropriateActivities(timeSlot, allActivities) {
    const morningActivities = ['Morning Meditation', 'Healthy Breakfast', 'Protein Shake', 'Stretching', 'Goal Visualization', 'Gratitude Journal'];
    const afternoonActivities = ['HIIT Training', 'Push-ups', 'Squats', 'Planks', '30-min Walk', 'Meal Prep', 'Track Calories', 'Progress Photos'];
    const eveningActivities = ['8 Hours Sleep', 'Foam Rolling', 'Hot Bath', 'Massage', 'Drink 8 Glasses Water', 'Positive Affirmations'];
    
    return allActivities.filter(activity => {
        if (activity.isCustom) return true;
        
        switch (timeSlot) {
            case 'morning':
                return morningActivities.some(title => activity.title.includes(title) || title.includes(activity.title));
            case 'afternoon':
                return afternoonActivities.some(title => activity.title.includes(title) || title.includes(activity.title));
            case 'evening':
                return eveningActivities.some(title => activity.title.includes(title) || title.includes(activity.title));
            default:
                return true;
        }
    });
}

// Add activity
async function addActivity() {
    const form = document.getElementById('addActivityForm');
    const formData = new FormData(form);
    const isCustom = document.getElementById('createCustom').checked;
    
    try {
        let activityId;
        
        if (isCustom) {
            // Create custom activity first
            const customActivity = {
                title: formData.get('customTitle'),
                description: formData.get('customDescription'),
                category: formData.get('customCategory'),
                isCustom: true
            };
            
            const activityResponse = await fetch('/api/activities', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(customActivity)
            });
            
            if (!activityResponse.ok) {
                throw new Error('Failed to create custom activity');
            }
            
            const newActivity = await activityResponse.json();
            activityId = newActivity.id;
            activities.push(newActivity);
        } else {
            activityId = parseInt(formData.get('activityId'));
            if (!activityId) {
                showAlert('Please select an activity', 'warning');
                return;
            }
        }
        
        // Add to tracker
        const trackerEntry = {
            trackerId: currentTracker.id,
            activityId: activityId,
            timeSlot: formData.get('timeSlot'),
            status: 'pending'
        };
        
        const response = await fetch('/api/tracker/entries', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(trackerEntry)
        });
        
        if (response.ok) {
            const entry = await response.json();
            
            // Find the activity and attach it to the entry
            const activity = activities.find(a => a.id === activityId);
            entry.activity = activity;
            
            // Add to current tracker
            if (!currentTracker.entries) {
                currentTracker.entries = [];
            }
            currentTracker.entries.push(entry);
            
            renderTrackerEntries();
            
            // Close modal and reset form
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

// Toggle activity status
async function toggleActivityStatus(entryId, isCompleted) {
    try {
        const status = isCompleted ? 'completed' : 'pending';
        
        const response = await fetch(`/api/tracker/entries/${entryId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        
        if (response.ok) {
            // Update local state
            const entry = currentTracker.entries.find(e => e.id === entryId);
            if (entry) {
                entry.status = status;
            }
            
            renderTrackerEntries();
            loadStats(); // Refresh stats
            showAlert(`Activity marked as ${status}!`, 'success');
        } else {
            throw new Error('Failed to update activity status');
        }
    } catch (error) {
        console.error('Error updating activity status:', error);
        showAlert('Failed to update activity', 'danger');
    }
}

// Delete activity
async function deleteActivity(entryId) {
    if (!confirm('Are you sure you want to remove this activity from your tracker?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/tracker/entries/${entryId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // Remove from local state
            currentTracker.entries = currentTracker.entries.filter(e => e.id !== entryId);
            
            renderTrackerEntries();
            loadStats(); // Refresh stats
            showAlert('Activity removed successfully!', 'success');
        } else {
            throw new Error('Failed to delete activity');
        }
    } catch (error) {
        console.error('Error deleting activity:', error);
        showAlert('Failed to remove activity', 'danger');
    }
}

// Update progress display
function updateProgressDisplay() {
    if (!currentTracker || !currentTracker.entries) return;
    
    const total = currentTracker.entries.length;
    const completed = currentTracker.entries.filter(e => e.status === 'completed').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const percentageElement = document.getElementById('completionPercentage');
    if (percentageElement) {
        percentageElement.textContent = `${percentage}%`;
    }
    
    // Update progress chart
    updateProgressChart(percentage);
}

// Initialize progress chart
function initializeProgressChart() {
    const canvas = document.getElementById('progressChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    window.progressChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [0, 100],
                backgroundColor: ['#0d6efd', '#e9ecef'],
                borderWidth: 0
            }]
        },
        options: {
            cutout: '70%',
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Update progress chart
function updateProgressChart(percentage) {
    if (window.progressChart) {
        window.progressChart.data.datasets[0].data = [percentage, 100 - percentage];
        window.progressChart.update();
    }
}

// Update stats display
function updateStatsDisplay(stats) {
    console.log('Updating stats display:', stats);
    
    // Handle error case where stats fetch failed
    if (stats.message) {
        console.error('Stats error:', stats.message);
        // Set default values
        stats = {
            currentStreak: 0,
            weeklyAverage: 0,
            totalActivities: 0
        };
    }
    
    // Update streak value and progress - using correct IDs from dashboard
    const streakValue = document.getElementById('currentStreak');
    const streakProgress = document.getElementById('streakBar');
    const streakMessage = document.getElementById('streakMessage');
    const streakCard = document.querySelector('.streak-card');
    
    console.log('Updating streak display - Current streak:', stats.currentStreak);
    
    if (streakValue) {
        streakValue.innerHTML = '';
        streakValue.textContent = stats.currentStreak || 0;
    }
    
    if (streakProgress) {
        const progressPercent = Math.min((stats.currentStreak || 0) / 21 * 100, 100); // 21 days = 100%
        streakProgress.style.width = `${progressPercent}%`;
    }
    
    if (streakMessage) {
        const streak = stats.currentStreak || 0;
        if (streak === 0) {
            streakMessage.textContent = 'Start your streak today!';
        } else if (streak < 7) {
            streakMessage.textContent = `${streak} days strong - keep building!`;
        } else if (streak >= 21) {
            streakMessage.textContent = `${streak} days - you're unstoppable!`;
        } else {
            streakMessage.textContent = `${streak} days - incredible consistency!`;
        }
    }
    
    // Update streak card color based on achievement level
    if (streakCard) {
        const total = stats.totalActivities || 0;
        let cardStyle = '';
        if (total >= 100) {
            cardStyle = 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);';
        } else if (total >= 25) {
            cardStyle = 'background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);';
        } else {
            cardStyle = 'background: linear-gradient(135deg, #28a745 0%, #20c997 100%);';
        }
        streakCard.style.cssText = `${streakCard.style.cssText.replace(/background:[^;]+;?/g, '')} ${cardStyle} color: white; border-radius: 16px; box-shadow: 0 8px 24px rgba(40,167,69,0.3);`;
    }
    
    // Update weekly average - using correct ID
    const weeklyValue = document.getElementById('weeklyAverage');
    if (weeklyValue) {
        weeklyValue.textContent = `${stats.weeklyAverage || 0}%`;
    }
    
    // Update total activities - using correct ID with forced refresh
    const totalValue = document.getElementById('totalActivities');
    if (totalValue) {
        console.log('Forcing update of totalActivities to:', stats.totalActivities);
        totalValue.innerHTML = '';
        totalValue.textContent = stats.totalActivities || 0;
        totalValue.setAttribute('data-value', stats.totalActivities || 0);
    }
    
    // Update achievement level
    updateAchievementLevel(stats);
    
    // Update subscription status
    updateSubscriptionStatus(stats);
}

// Update achievement level based on stats
function updateAchievementLevel(stats) {
    const achievementBadge = document.getElementById('achievementBadge');
    if (!achievementBadge) return;
    
    const streak = stats.currentStreak || 0;
    const total = stats.totalActivities || 0;
    
    console.log('UpdateAchievementLevel - Total activities:', total, 'Streak:', streak);
    
    let level = 'Beginner';
    let badgeStyle = '';
    
    if (total >= 100) {
        level = 'Master';
        badgeStyle = 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none;';
    } else if (total >= 25) {
        level = 'Intermediate';
        badgeStyle = 'background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; border: none;';
    } else {
        level = 'Beginner';
        badgeStyle = 'background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; border: none;';
    }
    
    console.log('Setting achievement level to:', level, 'for total:', total);
    
    achievementBadge.innerHTML = '';
    achievementBadge.textContent = level;
    achievementBadge.className = 'badge achievement-badge-large';
    achievementBadge.style.cssText = `font-size: 18px; padding: 12px 24px; ${badgeStyle}`;
}

// Update subscription status based on stats
function updateSubscriptionStatus(stats) {
    const subscriptionStatus = document.getElementById('subscriptionStatus');
    if (!subscriptionStatus) return;
    
    const streak = stats.currentStreak || 0;
    const total = stats.totalActivities || 0;
    
    let status = 'Free Plan';
    let badgeClass = 'bg-secondary';
    
    let statusStyle = '';
    
    if (streak >= 7 || total >= 10) {
        status = 'Premium Earned';
        statusStyle = 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none;';
    } else if (streak >= 3 || total >= 7) {
        status = 'Almost Premium';
        statusStyle = 'background: linear-gradient(135deg, #ffc107 0%, #ffb347 100%); color: white; border: none;';
    } else {
        status = 'Free Plan';
        statusStyle = 'background: #6c757d; color: white; border: none;';
    }
    
    subscriptionStatus.textContent = status;
    subscriptionStatus.className = 'badge px-3 py-2';
    subscriptionStatus.style.cssText = statusStyle;
}

// Load popular activities
function loadPopularActivities() {
    const container = document.getElementById('popular-activities');
    if (!container) return;
    
    const popularActivities = activities.slice(0, 5);
    
    if (popularActivities.length === 0) {
        container.innerHTML = '<p class="text-muted small">No activities available</p>';
        return;
    }
    
    container.innerHTML = popularActivities.map(activity => `
        <div class="d-flex align-items-center mb-2">
            <span class="badge category-${activity.category} me-2">${activity.category}</span>
            <small class="text-truncate">${activity.title}</small>
        </div>
    `).join('');
}

// Show alert
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Insert after navbar
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        navbar.insertAdjacentElement('afterend', alertDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alertDiv && alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
}

// Initialize form validation
function initializeFormValidation() {
    // Registration form validation
    const registerForm = document.querySelector('form[action="/register"]');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (password !== confirmPassword) {
                e.preventDefault();
                showAlert('Passwords do not match', 'danger');
            }
            
            if (password.length < 6) {
                e.preventDefault();
                showAlert('Password must be at least 6 characters long', 'danger');
            }
        });
    }
}