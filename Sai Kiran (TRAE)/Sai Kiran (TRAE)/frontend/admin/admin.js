// Admin credentials
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};

// Admin login function
function adminLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        // Hide login modal
        document.getElementById('adminLoginModal').style.display = 'none';
        
        // Show admin panel
        document.getElementById('adminPanel').style.display = 'block';
        document.getElementById('adminMainContent').style.display = 'block';
        
        // Load dashboard
        showSection('dashboard');
        
        showAlert('Login successful!', 'success');
    } else {
        showAlert('Invalid credentials!', 'error');
    }
}

// Show admin section
function showSection(section) {
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Find and activate the correct nav link
    const activeLink = document.querySelector(`[onclick="showSection('${section}')"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Update section title
    const titles = {
        'dashboard': 'Dashboard',
        'users': 'User Management',
        'trips': 'Trip Management',
        'payments': 'Payment Management',
        'settings': 'Settings'
    };
    document.getElementById('sectionTitle').textContent = titles[section];
    
    // Load section content
    switch(section) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'users':
            loadUsers();
            break;
        case 'trips':
            loadTrips();
            break;
        case 'payments':
            loadPayments();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// Load dashboard
async function loadDashboard() {
    let users = [];
    try {
        const response = await fetch('http://localhost:8080/api/admin/users');
        users = await response.json();
    } catch (error) {
        // Fallback to localStorage
        users = JSON.parse(localStorage.getItem('users') || '[]');
        const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
        if (currentUser && !users.find(u => u.id === currentUser.id)) {
            users.push(currentUser);
        }
    }
    
    let trips = [];
    let payments = [];
    
    try {
        const tripsResponse = await fetch('http://localhost:8080/api/trips');
        trips = await tripsResponse.json();
    } catch (error) {
        trips = JSON.parse(localStorage.getItem('userTrips') || '[]');
    }
    
    try {
        const paymentsResponse = await fetch('http://localhost:8080/api/admin/payments');
        payments = await paymentsResponse.json();
    } catch (error) {
        payments = JSON.parse(localStorage.getItem('payments') || '[]');
    }
    
    console.log('Final data - users:', users.length, 'trips:', trips.length, 'payments:', payments.length);
    
    // Filter out trips from blocked users
    const blockedUserIds = users.filter(u => u.blocked).map(u => u.id);
    const activeTrips = trips.filter(t => t.status === 'approved' && !blockedUserIds.includes(t.user_id)).length;
    
    const totalUsers = users.length;
    const pendingTrips = trips.filter(t => t.status === 'pending').length;
    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    
    const content = document.getElementById('adminContent');
    content.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon blue">
                    <i class="fas fa-users"></i>
                </div>
                <div class="stat-info">
                    <h3>Total Users</h3>
                    <div class="value">${totalUsers}</div>
                    <p class="stat-change">Registered users</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green">
                    <i class="fas fa-car"></i>
                </div>
                <div class="stat-info">
                    <h3>Active Trips</h3>
                    <div class="value">${activeTrips}</div>
                    <p class="stat-change">Approved trips</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange">
                    <i class="fas fa-money-bill"></i>
                </div>
                <div class="stat-info">
                    <h3>Revenue</h3>
                    <div class="value">₹${totalRevenue}</div>
                    <p class="stat-change">Total earnings</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon purple">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="stat-info">
                    <h3>Pending Approvals</h3>
                    <div class="value">${pendingTrips}</div>
                    <p class="stat-change">${pendingTrips > 0 ? 'Needs attention' : 'All clear'}</p>
                </div>
            </div>
        </div>
        <div class="content-card">
            <h2><i class="fas fa-clock"></i> Recent Activity</h2>
            <div class="activity-list">
                ${trips.length === 0 && users.length === 0 ? 
                    '<div class="empty-state"><i class="fas fa-inbox"></i><h3>No Activity Yet</h3><p>Activity will appear here as users interact with the platform</p></div>' :
                    '<div class="activity-item"><div class="activity-icon blue"><i class="fas fa-info-circle"></i></div><div class="activity-content"><p><strong>System ready:</strong> Platform is operational</p><span class="activity-time">Just now</span></div></div>'
                }
            </div>
        </div>
    `;
}

// Load users
async function loadUsers() {
    let users = [];
    try {
        const response = await fetch('http://localhost:8080/api/admin/users');
        users = await response.json();
    } catch (error) {
        // Fallback to localStorage
        users = JSON.parse(localStorage.getItem('users') || '[]');
        const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
        if (currentUser && !users.find(u => u.id === currentUser.id)) {
            users.push(currentUser);
        }
    }
    const userTrips = JSON.parse(localStorage.getItem('userTrips') || '[]');
    const userChats = JSON.parse(localStorage.getItem('userChats') || '[]');
    
    const content = document.getElementById('adminContent');
    content.innerHTML = `
        <div class="content-card">
            <div class="card-header">
                <h2><i class="fas fa-users"></i> User Management</h2>
                <div class="header-actions">
                    <input type="text" placeholder="Search users..." class="search-input" id="userSearchInput">
                </div>
            </div>
            <div class="users-grid" id="usersGrid">
                ${users.length === 0 ? 
                    '<div class="empty-state"><i class="fas fa-users"></i><h3>No Users Yet</h3><p>Users will appear here when they register</p></div>' :
                    users.map(user => {
                        const userTripCount = userTrips.filter(t => t.user_id === user.id).length;
                        const userChatCount = userChats.filter(c => c.userId === user.id).length;
                        return `
                            <div class="user-card" data-user-info="${user.username.toLowerCase()} ${user.email.toLowerCase()} ${user.aadhar_number}">
                                <div class="user-header">
                                    <div class="user-avatar">${user.username.charAt(0).toUpperCase()}</div>
                                    <div class="user-info">
                                        <h3>${user.username}</h3>
                                        <p class="user-email">${user.email}</p>
                                        <p class="user-joined">Joined: ${new Date().toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div class="user-details">
                                    <div class="detail-item">
                                        <i class="fas fa-id-card"></i>
                                        <span>Aadhar: ${user.aadhar_number}</span>
                                    </div>
                                    <div class="detail-item">
                                        <i class="fas fa-coins"></i>
                                        <span>Credits: ${user.credits || 0}</span>
                                    </div>
                                    <div class="detail-item">
                                        <i class="fas fa-car"></i>
                                        <span>Trips: ${userTripCount}</span>
                                    </div>
                                    <div class="detail-item">
                                        <i class="fas fa-comments"></i>
                                        <span>Chats: ${userChatCount}</span>
                                    </div>
                                </div>
                                <div class="user-actions">
                                    <button class="action-btn" onclick="viewAadharPhoto('${user.id}')" style="background: linear-gradient(135deg, #667eea, #764ba2);"><i class="fas fa-image"></i> View Aadhar</button>
                                    <button class="action-btn ${user.blocked ? 'approve' : 'reject'}" onclick="toggleUserBlock('${user.id}', ${user.blocked ? 'false' : 'true'})">
                                        <i class="fas fa-${user.blocked ? 'check' : 'ban'}"></i> ${user.blocked ? 'Unblock' : 'Block'}
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')
                }
            </div>
        </div>
    `;
    
    // Attach search event listener after content is loaded
    setTimeout(() => {
        const searchInput = document.getElementById('userSearchInput');
        if (searchInput) {
            // Remove any existing event listeners
            const clone = searchInput.cloneNode(true);
            searchInput.parentNode.replaceChild(clone, searchInput);
            
            // Add event listener
            clone.addEventListener('input', function() {
                performSearch(this.value);
            });
        }
    }, 100);
}

// Simple search function
function performSearch(searchTerm) {
    const usersGrid = document.getElementById('usersGrid');
    const userCards = usersGrid.querySelectorAll('.user-card');
    const term = searchTerm.toLowerCase().trim();
    
    userCards.forEach(card => {
        const userInfo = card.getAttribute('data-user-info');
        if (term === '' || (userInfo && userInfo.includes(term))) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Load trips
async function loadTrips() {
    let trips = [];
    let users = [];
    
    try {
        const tripsResponse = await fetch('http://localhost:8080/api/admin/trips');
        if (tripsResponse.ok) {
            trips = await tripsResponse.json();
        } else {
            throw new Error('API failed');
        }
    } catch (error) {
        console.log('Using fallback trips data');
        trips = JSON.parse(localStorage.getItem('userTrips') || '[]');
        // Add sample trip data if empty
        if (trips.length === 0) {
            trips = [
                {
                    id: '0c02c29f-9d98-4d6d-ac20-0f58e871ea88',
                    user_id: 'f62914c6-c72f-4093-b3b8-0c9b657c0284',
                    title: 'Fun',
                    from_location: 'Bellary',
                    to_location: 'Mysuru',
                    date: '2025-10-22',
                    seats: 5,
                    budget: 20000,
                    description: 'Trip for 3 days and 2 nights',
                    type: 'driver',
                    status: 'approved',
                    created_at: '2025-10-21T01:26:13.010686'
                },
                {
                    id: 'dd8d833e-2dea-4703-8aaf-c16908f5f73b',
                    user_id: 'f62914c6-c72f-4093-b3b8-0c9b657c0284',
                    title: 'Business',
                    from_location: 'Bellary',
                    to_location: 'Goa',
                    date: '2025-10-24',
                    seats: 3,
                    budget: 25000,
                    description: 'Its a Business and short enjoy trip',
                    type: 'driver',
                    status: 'rejected',
                    created_at: '2025-10-21T01:41:57.518595'
                }
            ];
        }
    }
    
    try {
        const usersResponse = await fetch('http://localhost:8080/api/admin/users');
        users = await usersResponse.json();
    } catch (error) {
        users = JSON.parse(localStorage.getItem('users') || '[]');
    }
    
    const allCount = trips.length;
    const pendingCount = trips.filter(t => t.status === 'pending').length;
    const approvedCount = trips.filter(t => t.status === 'approved').length;
    const rejectedCount = trips.filter(t => t.status === 'rejected').length;
    const blockedUserIds = users.filter(u => u.blocked).map(u => u.id);
    const blockedCount = trips.filter(t => blockedUserIds.includes(t.user_id)).length;
    
    const content = document.getElementById('adminContent');
    content.innerHTML = `
        <div class="content-card">
            <div class="card-header">
                <h2><i class="fas fa-car"></i> Trip Management</h2>
                <div class="filter-tabs">
                    <button class="filter-tab active" onclick="filterTrips('all')">All (${allCount})</button>
                    <button class="filter-tab" onclick="filterTrips('pending')">Pending (${pendingCount})</button>
                    <button class="filter-tab" onclick="filterTrips('approved')">Approved (${approvedCount})</button>
                    <button class="filter-tab" onclick="filterTrips('rejected')">Rejected (${rejectedCount})</button>
                    <button class="filter-tab" onclick="filterTrips('blocked')">Blocked (${blockedCount})</button>
                </div>
            </div>
            <div class="trips-grid">
                ${trips.length === 0 ? 
                    '<div class="empty-state"><i class="fas fa-car"></i><h3>No Trips Yet</h3><p>Trip requests will appear here for approval</p></div>' :
                    trips.map(trip => {
                        const user = users.find(u => u.id === trip.user_id);
                        const userName = user ? user.username : 'Unknown User';
                        return `
                            <div class="trip-card ${trip.status}" data-status="${trip.status}">
                                <div style="position: relative; margin-bottom: 1rem;">
                                    <div class="trip-type">${trip.type.toUpperCase()}</div>
                                    <div style="position: absolute; top: 0; right: 0; display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                                        ${blockedUserIds.includes(trip.user_id) ? 
                                            `<span class="badge badge-${trip.status}" style="display: inline-block;">${trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}</span><span class="badge badge-blocked" style="display: inline-block;">USER BLOCKED</span>` : 
                                            `<span class="badge badge-${trip.status}" style="display: inline-block;">${trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}</span>`
                                        }
                                    </div>
                                </div>
                                <h3>${trip.title}</h3>
                                <div class="trip-route">
                                    <span>${trip.from_location}</span>
                                    <i class="fas fa-arrow-right"></i>
                                    <span>${trip.to_location}</span>
                                </div>
                                <div class="trip-details">
                                    <p><i class="fas fa-calendar"></i> ${new Date(trip.date).toLocaleDateString()}</p>
                                    <p><i class="fas fa-users"></i> ${trip.seats} seats</p>
                                    <p><i class="fas fa-rupee-sign"></i> ₹${trip.budget}</p>
                                    <p><i class="fas fa-user"></i> By: ${userName}</p>
                                </div>
                                <div class="trip-actions">
                                    ${trip.status === 'pending' ? `
                                        <button class="action-btn approve" onclick="approveTrip('${trip.id}')"><i class="fas fa-check"></i> Approve</button>
                                        <button class="action-btn reject" onclick="rejectTrip('${trip.id}')"><i class="fas fa-times"></i> Reject</button>
                                    ` : trip.status === 'approved' ? `
                                        <button class="action-btn reject" onclick="rejectTrip('${trip.id}')"><i class="fas fa-ban"></i> Disable</button>
                                    ` : ''}
                                    <button class="action-btn" onclick="viewTrip('${trip.id}')" style="background: linear-gradient(135deg, #667eea, #764ba2);"><i class="fas fa-eye"></i> View</button>
                                </div>
                            </div>
                        `;
                    }).join('')
                }
            </div>
        </div>
    `;
}

// Load payments
async function loadPayments() {
    let payments = [];
    let users = [];
    
    try {
        const paymentsResponse = await fetch('http://localhost:8080/api/admin/payments');
        payments = await paymentsResponse.json();
    } catch (error) {
        payments = JSON.parse(localStorage.getItem('payments') || '[]');
    }
    
    try {
        const usersResponse = await fetch('http://localhost:8080/api/admin/users');
        users = await usersResponse.json();
    } catch (error) {
        users = JSON.parse(localStorage.getItem('users') || '[]');
    }
    
    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalTransactions = payments.length;
    const totalCredits = payments.reduce((sum, p) => sum + (p.credits || 0), 0);
    
    const content = document.getElementById('adminContent');
    content.innerHTML = `
        <div class="stats-grid" style="margin-bottom: 2rem;">
            <div class="stat-card">
                <div class="stat-icon green">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="stat-info">
                    <h3>Total Revenue</h3>
                    <div class="value">₹${totalRevenue}</div>
                    <p class="stat-change">All time earnings</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon blue">
                    <i class="fas fa-credit-card"></i>
                </div>
                <div class="stat-info">
                    <h3>Transactions</h3>
                    <div class="value">${totalTransactions}</div>
                    <p class="stat-change">Total payments</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange">
                    <i class="fas fa-coins"></i>
                </div>
                <div class="stat-info">
                    <h3>Credits Sold</h3>
                    <div class="value">${totalCredits}</div>
                    <p class="stat-change">Total credits</p>
                </div>
            </div>
        </div>
        <div class="content-card">
            <div class="card-header">
                <h2><i class="fas fa-money-bill"></i> Transaction History</h2>
                <select class="filter-select">
                    <option>All Transactions</option>
                    <option>Today</option>
                    <option>This Week</option>
                    <option>This Month</option>
                </select>
            </div>
            <div class="payments-grid">
                ${payments.length === 0 ? 
                    '<div class="empty-state"><i class="fas fa-credit-card"></i><h3>No Transactions Yet</h3><p>Payment history will appear here</p></div>' :
                    payments.map((payment, index) => {
                        const user = users.find(u => u.id === payment.user_id);
                        const userName = user ? user.username : 'Unknown User';
                        return `
                            <div class="payment-card">
                                <div style="display: grid; grid-template-columns: auto 1fr auto; gap: 1rem; align-items: center;">
                                    <div class="payment-icon">
                                        <i class="fas fa-credit-card"></i>
                                    </div>
                                    <div>
                                        <p class="payment-label">Transaction ID</p>
                                        <p class="payment-value">#TXN${String(index + 1).padStart(3, '0')}</p>
                                        <p class="payment-label">User</p>
                                        <p class="payment-value">${userName}</p>
                                    </div>
                                    <div style="text-align: right;">
                                        <p class="payment-amount">₹${payment.amount}</p>
                                        <div class="credit-badge">${payment.credits} Credits</div>
                                        <p class="payment-date">${new Date(payment.date || Date.now()).toLocaleDateString()}</p>
                                        <p class="payment-time">${new Date(payment.date || Date.now()).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')
                }
            </div>
        </div>
    `;
}

// Load settings
function loadSettings() {
    const content = document.getElementById('adminContent');
    content.innerHTML = `
        <div class="settings-grid-full">
            <div class="settings-card">
                <div class="settings-card-header">
                    <i class="fas fa-coins"></i>
                    <h3>Pricing Settings</h3>
                </div>
                <div class="settings-card-body">
                    <div class="form-group">
                        <label>Credit Price (₹)</label>
                        <div class="input-wrapper">
                            <i class="fas fa-rupee-sign input-icon"></i>
                            <input type="number" value="20" min="1">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Bulk Discount (%)</label>
                        <div class="input-wrapper">
                            <i class="fas fa-percentage input-icon"></i>
                            <input type="number" value="10" min="0" max="50">
                        </div>
                    </div>
                </div>
            </div>
            <div class="settings-card">
                <div class="settings-card-header">
                    <i class="fas fa-shield-alt"></i>
                    <h3>Security Settings</h3>
                </div>
                <div class="settings-card-body">
                    <div class="form-group">
                        <label>Auto-approve Trips</label>
                        <div class="select-wrapper">
                            <select>
                                <option>Manual Review</option>
                                <option>Auto Approve</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Max Credits per Purchase</label>
                        <div class="input-wrapper">
                            <i class="fas fa-coins input-icon"></i>
                            <input type="number" value="50" min="1">
                        </div>
                    </div>
                </div>
            </div>
            <div class="settings-card">
                <div class="settings-card-header">
                    <i class="fas fa-bell"></i>
                    <h3>Notifications</h3>
                </div>
                <div class="settings-card-body">
                    <div class="form-group">
                        <label>Email Notifications</label>
                        <div class="select-wrapper">
                            <select>
                                <option>Enabled</option>
                                <option>Disabled</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>SMS Notifications</label>
                        <div class="select-wrapper">
                            <select>
                                <option>Disabled</option>
                                <option>Enabled</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            <div class="settings-card">
                <div class="settings-card-header">
                    <i class="fas fa-database"></i>
                    <h3>System Settings</h3>
                </div>
                <div class="settings-card-body">
                    <div class="form-group">
                        <label>Maintenance Mode</label>
                        <div class="select-wrapper">
                            <select>
                                <option>Disabled</option>
                                <option>Enabled</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Backup Frequency</label>
                        <div class="select-wrapper">
                            <select>
                                <option>Daily</option>
                                <option>Weekly</option>
                                <option>Monthly</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="form-actions" style="margin-top: 2rem;">
            <button class="action-btn approve" onclick="saveSettings()"><i class="fas fa-save"></i> Save All Settings</button>
            <button class="action-btn" onclick="resetSettings()" style="background: linear-gradient(135deg, #6b7280, #4b5563);"><i class="fas fa-undo"></i> Reset to Default</button>
        </div>
    `;
}

// Admin logout
function adminLogout() {
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('adminMainContent').style.display = 'none';
    document.getElementById('adminLoginModal').style.display = 'block';
    
    // Clear form
    document.getElementById('adminUsername').value = '';
    document.getElementById('adminPassword').value = '';
}

// Show alert
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `notification ${type}`;
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 5000);
}

// Search users function
function searchUsers(searchTerm) {
    try {
        console.log('Search term:', searchTerm);
        const userCards = document.querySelectorAll('.user-card');
        console.log('Found user cards:', userCards.length);
        
        // If no search term, show all cards
        if (!searchTerm || searchTerm.trim() === '') {
            userCards.forEach(card => {
                card.style.display = 'block';
            });
            return;
        }
        
        searchTerm = searchTerm.toLowerCase().trim();
        
        userCards.forEach((card, index) => {
            try {
                // Get user information from the card
                const usernameElement = card.querySelector('h3');
                const emailElement = card.querySelector('.user-email');
                const aadharElements = card.querySelectorAll('.detail-item span');
                
                const username = usernameElement ? usernameElement.textContent.toLowerCase().trim() : '';
                const email = emailElement ? emailElement.textContent.toLowerCase().trim() : '';
                
                // Find the Aadhar element (it should contain "Aadhar:")
                let aadhar = '';
                for (let i = 0; i < aadharElements.length; i++) {
                    const text = aadharElements[i].textContent;
                    if (text && text.includes('Aadhar:')) {
                        aadhar = text.replace('Aadhar:', '').trim().toLowerCase();
                        break;
                    }
                }
                
                console.log(`Card ${index}:`, { username, email, aadhar });
                
                // Check if any of the fields match the search term
                const matches = 
                    username.includes(searchTerm) || 
                    email.includes(searchTerm) || 
                    aadhar.includes(searchTerm);
                    
                console.log(`Card ${index} matches:`, matches);
                
                card.style.display = matches ? 'block' : 'none';
            } catch (error) {
                console.error('Error searching user card:', error);
                // Show the card if there's an error to avoid hiding valid cards
                card.style.display = 'block';
            }
        });
    } catch (error) {
        console.error('Error in searchUsers function:', error);
        // If there's an error in the search function, show all cards
        const userCards = document.querySelectorAll('.user-card');
        userCards.forEach(card => {
            card.style.display = 'block';
        });
    }
}

// Additional functions for improved functionality
function filterTrips(status) {
    document.querySelectorAll('.filter-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    const tripCards = document.querySelectorAll('.trip-card');
    tripCards.forEach(card => {
        if (status === 'all') {
            card.style.display = 'block';
        } else if (status === 'blocked') {
            const isBlocked = card.querySelector('.badge-blocked');
            card.style.display = isBlocked ? 'block' : 'none';
        } else {
            const cardStatus = card.getAttribute('data-status');
            card.style.display = cardStatus === status ? 'block' : 'none';
        }
    });
    
    showAlert(`Filtered trips by: ${status}`, 'success');
}

async function approveTrip(id) {
    try {
        const response = await fetch(`http://localhost:8080/api/admin/trip/${id}/status?status=approved`, {
            method: 'PUT'
        });
        if (response.ok) {
            showAlert('Trip approved successfully!', 'success');
            loadTrips();
        } else {
            throw new Error('API failed');
        }
    } catch (error) {
        const trips = JSON.parse(localStorage.getItem('userTrips') || '[]');
        const tripIndex = trips.findIndex(t => t.id === id);
        if (tripIndex !== -1) {
            trips[tripIndex].status = 'approved';
            localStorage.setItem('userTrips', JSON.stringify(trips));
            showAlert('Trip approved successfully!', 'success');
            loadTrips();
        }
    }
}

async function rejectTrip(id) {
    const reason = prompt('Enter rejection reason:') || 'Trip does not meet platform guidelines';
    try {
        const response = await fetch(`http://localhost:8080/api/admin/trip/${id}/status?status=rejected&reason=${encodeURIComponent(reason)}`, {
            method: 'PUT'
        });
        if (response.ok) {
            showAlert('Trip rejected!', 'success');
            loadTrips();
        } else {
            throw new Error('API failed');
        }
    } catch (error) {
        const trips = JSON.parse(localStorage.getItem('userTrips') || '[]');
        const tripIndex = trips.findIndex(t => t.id === id);
        if (tripIndex !== -1) {
            trips[tripIndex].status = 'rejected';
            localStorage.setItem('userTrips', JSON.stringify(trips));
            
            const rejections = JSON.parse(localStorage.getItem('tripRejections') || '{}');
            rejections[id] = { reason, rejectedAt: new Date().toISOString() };
            localStorage.setItem('tripRejections', JSON.stringify(rejections));
            
            showAlert('Trip rejected!', 'success');
            loadTrips();
        }
    }
}

function viewTrip(id) {
    const trips = JSON.parse(localStorage.getItem('userTrips') || '[]');
    let trip = trips.find(t => t.id === id);
    
    // If not found in localStorage, use sample data
    if (!trip) {
        const sampleTrips = [
            {
                id: '0c02c29f-9d98-4d6d-ac20-0f58e871ea88',
                title: 'Fun',
                from_location: 'Bellary',
                to_location: 'Mysuru',
                date: '2025-10-22',
                seats: 5,
                budget: 20000,
                description: 'Trip for 3 days and 2 nights',
                type: 'driver',
                status: 'approved'
            },
            {
                id: 'dd8d833e-2dea-4703-8aaf-c16908f5f73b',
                title: 'Business',
                from_location: 'Bellary',
                to_location: 'Goa',
                date: '2025-10-24',
                seats: 3,
                budget: 25000,
                description: 'Its a Business and short enjoy trip',
                type: 'driver',
                status: 'rejected'
            }
        ];
        trip = sampleTrips.find(t => t.id === id);
    }
    
    if (!trip) {
        showAlert('Trip not found!', 'error');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.innerHTML = `
        <div class="admin-modal-content">
            <span class="admin-modal-close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h2><i class="fas fa-car"></i> ${trip.title}</h2>
            <div style="display: grid; gap: 1.5rem; margin: 2rem 0;">
                <div><strong>Route:</strong> ${trip.from_location} → ${trip.to_location}</div>
                <div><strong>Date:</strong> ${new Date(trip.date).toLocaleDateString()}</div>
                <div><strong>Type:</strong> ${trip.type.toUpperCase()}</div>
                <div><strong>Seats:</strong> ${trip.seats}</div>
                <div><strong>Budget:</strong> ₹${trip.budget}</div>
                <div><strong>Status:</strong> <span class="badge badge-${trip.status}">${trip.status.toUpperCase()}</span></div>
                <div><strong>Description:</strong> ${trip.description}</div>
            </div>
            <button class="action-btn" onclick="this.parentElement.parentElement.remove()" style="background: linear-gradient(135deg, #6b7280, #4b5563);">
                <i class="fas fa-times"></i> Close
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

function saveSettings() {
    showAlert('Settings saved successfully!', 'success');
}

function resetSettings() {
    showAlert('Settings reset to default values!', 'success');
}

async function toggleUserBlock(userId, block) {
    try {
        const response = await fetch(`http://localhost:8080/api/admin/user/${userId}/block?blocked=${block}`, {
            method: 'PUT'
        });
        
        if (response.ok) {
            showAlert(`User ${block === 'true' ? 'blocked' : 'unblocked'} successfully!`, 'success');
            loadUsers();
        } else {
            throw new Error('API failed');
        }
    } catch (error) {
        // Fallback to localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            users[userIndex].blocked = block === 'true';
            localStorage.setItem('users', JSON.stringify(users));
        }
        
        const trips = JSON.parse(localStorage.getItem('userTrips') || '[]');
        const updatedTrips = trips.map(trip => {
            if (trip.user_id === userId) {
                trip.status = block === 'true' ? 'blocked' : 'pending';
            }
            return trip;
        });
        localStorage.setItem('userTrips', JSON.stringify(updatedTrips));
        
        showAlert(`User ${block === 'true' ? 'blocked' : 'unblocked'} successfully!`, 'success');
        loadUsers();
    }
}

async function viewAadharPhoto(userId) {
    console.log('Viewing Aadhar photo for user ID:', userId);
    let user = null;
    
    // Try backend first
    try {
        const response = await fetch('http://localhost:8080/api/admin/users');
        const backendUsers = await response.json();
        console.log('Backend users:', backendUsers);
        
        // Try to find user with exact match first
        let backendUser = backendUsers.find(u => u.id === userId);
        
        // If not found, try with loose matching (in case of type differences)
        if (!backendUser) {
            backendUser = backendUsers.find(u => u.id == userId);
        }
        
        console.log('Found backend user:', backendUser);
        
        if (backendUser) {
            user = backendUser;
        }
    } catch (error) {
        console.error('Error fetching user from backend:', error);
    }
    
    // If we couldn't get user from backend, try localStorage
    if (!user) {
        const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
        console.log('Local users:', localUsers);
        
        // Try to find user with exact match first
        let localUser = localUsers.find(u => u.id === userId);
        
        // If not found, try with loose matching
        if (!localUser) {
            localUser = localUsers.find(u => u.id == userId);
        }
        
        console.log('Local user:', localUser);
        
        if (localUser) {
            user = localUser;
        }
    }
    
    if (!user) {
        showAlert('User not found.', 'error');
        return;
    }
    
    // Check if user has photo
    const hasPhoto = !!(user.aadhar_photo && user.aadhar_photo.length > 0);
    console.log('User has photo:', hasPhoto);
    console.log('Photo data length:', user.aadhar_photo ? user.aadhar_photo.length : 0);
    
    // If user exists but has no photo, show appropriate message
    if (!hasPhoto) {
        console.log('No photo found for user');
        // Show a modal explaining the issue
        const modal = document.createElement('div');
        modal.className = 'admin-modal';
        modal.innerHTML = `
            <div class="admin-modal-content">
                <span class="admin-modal-close" onclick="this.parentElement.parentElement.remove()">&times;</span>
                <div style="text-align: center; padding: 2rem;">
                    <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem; margin: 0 auto 1rem;">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h2>Aadhar Photo Not Available</h2>
                    <p style="color: #6b7280; margin: 1rem 0;">The Aadhar photo for <strong>${user.username}</strong> is not available in the system.</p>
                    <div style="background: #fef3c7; padding: 1rem; border-radius: 8px; margin: 1rem 0; text-align: left;">
                        <h4 style="color: #92400e; margin: 0 0 0.5rem 0;">User Details:</h4>
                        <p style="margin: 0.25rem 0; color: #92400e;"><strong>Name:</strong> ${user.username}</p>
                        <p style="margin: 0.25rem 0; color: #92400e;"><strong>Email:</strong> ${user.email}</p>
                        <p style="margin: 0.25rem 0; color: #92400e;"><strong>Aadhar:</strong> ${user.aadhar_number}</p>
                        <p style="margin: 0.25rem 0; color: #92400e;"><strong>Phone:</strong> ${user.phone || 'N/A'}</p>
                    </div>
                    <p style="font-size: 0.9rem; color: #6b7280;">This could happen if the photo was not uploaded during registration or was lost during data migration.</p>
                </div>
                <button class="action-btn" onclick="this.parentElement.parentElement.remove()" style="background: linear-gradient(135deg, #6b7280, #4b5563); width: 100%;">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
        `;
        document.body.appendChild(modal);
        return;
    }
    
    console.log('Displaying Aadhar photo for user:', user.username);
    
    // Validate the base64 data
    const isValidBase64 = user.aadhar_photo && user.aadhar_photo.startsWith('data:image/') && user.aadhar_photo.includes('base64,');
    console.log('Valid base64 data:', isValidBase64);
    
    if (!isValidBase64) {
        showAlert('Invalid Aadhar photo data format!', 'error');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.innerHTML = `
        <div class="admin-modal-content">
            <span class="admin-modal-close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h2><i class="fas fa-id-card"></i> Aadhar Card - ${user.username}</h2>
            <div style="text-align: center; margin: 2rem 0;">
                <img src="${user.aadhar_photo}" alt="Aadhar Card" style="max-width: 100%; max-height: 400px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);" onload="console.log('Image loaded successfully')" onerror="console.error('Error loading image')">
                <p style="margin-top: 1rem; font-size: 0.9rem; color: #6b7280;">If image is not visible, try downloading it</p>
            </div>
            <div style="display: flex; gap: 1rem; justify-content: center;">
                <button class="action-btn approve" onclick="downloadAadharPhoto('${userId}')">
                    <i class="fas fa-download"></i> Download
                </button>
                <button class="action-btn" onclick="this.parentElement.parentElement.remove()" style="background: linear-gradient(135deg, #6b7280, #4b5563);">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function downloadAadharPhoto(userId) {
    let user = null;
    let photoData = null;
    
    // Try backend first
    try {
        const response = await fetch('http://localhost:8080/api/admin/users');
        const backendUsers = await response.json();
        
        // Try to find user with exact match first
        let backendUser = backendUsers.find(u => u.id === userId);
        
        // If not found, try with loose matching
        if (!backendUser) {
            backendUser = backendUsers.find(u => u.id == userId);
        }
        
        if (backendUser) {
            user = backendUser;
            // Check if backend user has photo
            if (backendUser.aadhar_photo && backendUser.aadhar_photo.length > 0) {
                photoData = {
                    photo: backendUser.aadhar_photo,
                    name: backendUser.aadhar_photo_name || 'aadhar.jpg'
                };
            }
        }
    } catch (error) {
        console.error('Error fetching user from backend:', error);
    }
    
    // If we couldn't get user from backend, try localStorage
    if (!user) {
        const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Try to find user with exact match first
        let localUser = localUsers.find(u => u.id === userId);
        
        // If not found, try with loose matching
        if (!localUser) {
            localUser = localUsers.find(u => u.id == userId);
        }
        
        if (localUser) {
            user = localUser;
            if (localUser.aadhar_photo && localUser.aadhar_photo.length > 0) {
                photoData = {
                    photo: localUser.aadhar_photo,
                    name: localUser.aadhar_photo_name || 'aadhar.jpg'
                };
            }
        }
    }
    
    if (!user || !photoData) {
        showAlert('Aadhar photo not found!', 'error');
        return;
    }
    
    // Convert base64 to blob and download
    try {
        // Extract the base64 data from the data URI
        const base64Data = photoData.photo.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {type: 'image/jpeg'});
        
        // Create download link
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `aadhar_${user.username}_${user.aadhar_number}.${photoData.name.split('.').pop()}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    } catch (error) {
        console.error('Error downloading image:', error);
        // Fallback to direct download
        const link = document.createElement('a');
        link.href = photoData.photo;
        link.download = `aadhar_${user.username}_${user.aadhar_number}.${photoData.name.split('.').pop()}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    showAlert('Aadhar photo downloaded successfully!', 'success');
}

// Add a global function to manually attach search listener
function attachSearchListener() {
    const searchInput = document.getElementById('userSearchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', function(e) {
            searchUsers(e.target.value);
        });
        console.log('Search listener attached');
    }
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', function() {
    attachSearchListener();
});
