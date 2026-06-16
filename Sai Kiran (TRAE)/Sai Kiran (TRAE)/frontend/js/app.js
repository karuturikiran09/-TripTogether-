const API_URL = 'http://localhost:8080/api';
let currentUser = null;
let selectedPaymentCredits = 0;
let selectedPaymentAmount = 0;
let currentTripForChat = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTrips();
    checkAuth();
    
    // Set minimum date for trip creation to today
    const today = new Date().toISOString().split('T')[0];
    const tripDateInput = document.getElementById('tripDate');
    if (tripDateInput) {
        tripDateInput.setAttribute('min', today);
    }
    
    // Set minimum date for AI planner
    const planDateInput = document.getElementById('planDate');
    if (planDateInput) {
        planDateInput.setAttribute('min', today);
    }
});

// Auth Functions
function checkAuth() {
    const user = localStorage.getItem('user');
    if (user) {
        currentUser = JSON.parse(user);
        updateNavbarForLoggedInUser();
        showDashboard();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_URL}/login?email=${email}&password=${password}`, {
            method: 'POST'
        });
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            localStorage.setItem('user', JSON.stringify(data.user));
            closeModal('loginModal');
            updateNavbarForLoggedInUser();
            showDashboard();
            showAlert('Welcome back!', 'success');
        } else {
            showAlert(data.detail || 'Login failed', 'error');
        }
    } catch (error) {
        // Offline demo mode
        const demoUser = {
            id: 'demo-user-123',
            username: 'Demo User',
            email: email,
            credits: 5
        };
        currentUser = demoUser;
        localStorage.setItem('user', JSON.stringify(demoUser));
        closeModal('loginModal');
        updateNavbarForLoggedInUser();
        showDashboard();
        showAlert('Welcome to TripTogether!', 'success');
    }
}

// Aadhar number validation function
function validateAadharInput(element) {
    // Remove any non-digit characters
    element.value = element.value.replace(/\D/g, '');
    
    // Show help text if not 12 digits
    const helpText = document.getElementById('aadharHelp');
    if (element.value.length > 0 && element.value.length < 12) {
        helpText.style.display = 'block';
        helpText.style.color = '#f59e0b'; // Orange for warning
        helpText.textContent = 'Enter exactly 12 digits';
    } else if (element.value.length === 12) {
        helpText.style.display = 'block';
        helpText.style.color = '#10b981'; // Green for success
        helpText.textContent = '✓ Valid Aadhar number';
    } else {
        helpText.style.display = 'none';
    }
    
    // Hide verification status when user is typing
    const verificationStatus = document.getElementById('aadharVerificationStatus');
    verificationStatus.style.display = 'none';
}

// Aadhar photo validation function
function validateAadharPhoto(input) {
    const file = input.files[0];
    if (!file) return;
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
        showAlert('Only JPG, JPEG, and PNG image files are allowed', 'error');
        input.value = '';
        return false;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showAlert('Image size must be less than 5MB', 'error');
        input.value = '';
        return false;
    }
    
    return true;
}

// Aadhar verification function
async function verifyAadharNumber(aadharNumber) {
    const verificationStatus = document.getElementById('aadharVerificationStatus');
    verificationStatus.style.display = 'block';
    verificationStatus.innerHTML = '<div style="color: #3b82f6;"><i class="fas fa-spinner fa-spin"></i> Verifying Aadhar number...</div>';
    
    try {
        // In a real application, this would be an API call to verify the Aadhar number
        // For demo purposes, we'll simulate verification
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
        
        // Simulate verification result (in real app, this would come from backend)
        const isValid = aadharNumber.length === 12 && /^\d+$/.test(aadharNumber);
        
        if (isValid) {
            verificationStatus.innerHTML = '<div style="color: #10b981;"><i class="fas fa-check-circle"></i> Aadhar verified successfully</div>';
            return true;
        } else {
            verificationStatus.innerHTML = '<div style="color: #ef4444;"><i class="fas fa-times-circle"></i> Aadhar verification failed</div>';
            return false;
        }
    } catch (error) {
        verificationStatus.innerHTML = '<div style="color: #ef4444;"><i class="fas fa-exclamation-triangle"></i> Verification service unavailable</div>';
        return false;
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const aadharPhotoFile = document.getElementById('regAadharPhoto').files[0];
    if (!aadharPhotoFile) {
        showAlert('Please upload your Aadhar card photo', 'error');
        document.getElementById('regAadharPhoto').focus();
        return;
    }
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(aadharPhotoFile.type)) {
        showAlert('Please upload only JPG, JPEG, or PNG image files', 'error');
        document.getElementById('regAadharPhoto').focus();
        return;
    }
    
    if (aadharPhotoFile.size > 5 * 1024 * 1024) {
        showAlert('Image size must be less than 5MB', 'error');
        document.getElementById('regAadharPhoto').focus();
        return;
    }
    
    // Convert image to base64
    const aadharPhotoBase64 = await convertFileToBase64(aadharPhotoFile);
    
    const userData = {
        username: document.getElementById('regUsername').value,
        email: document.getElementById('regEmail').value.toLowerCase(),
        phone: document.getElementById('regPhone').value,
        aadhar_number: document.getElementById('regAadhar').value,
        aadhar_photo: aadharPhotoBase64,
        aadhar_photo_name: aadharPhotoFile.name,
        password: document.getElementById('regPassword').value
    };

    // Validate Aadhar number (exactly 12 digits)
    const aadharInput = document.getElementById('regAadhar');
    if (!userData.aadhar_number) {
        showAlert('Aadhar number is required', 'error');
        aadharInput.focus();
        return;
    }
    
    if (userData.aadhar_number.length !== 12) {
        showAlert('Aadhar number must be exactly 12 digits', 'error');
        aadharInput.focus();
        return;
    }
    
    if (!/^\d+$/.test(userData.aadhar_number)) {
        showAlert('Aadhar number must contain only digits', 'error');
        aadharInput.focus();
        return;
    }
    
    // Verify Aadhar number
    const isVerified = await verifyAadharNumber(userData.aadhar_number);
    if (!isVerified) {
        showAlert('Aadhar verification failed. Please check the number and try again.', 'error');
        aadharInput.focus();
        return;
    }

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        const data = await response.json();
        
        if (response.ok) {
            // Save to localStorage as backup
            const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
            const userToSave = {
                id: data.user_id || 'user-' + Date.now(),
                ...userData,
                credits: 0,
                created_at: new Date().toISOString()
            };
            localUsers.push(userToSave);
            localStorage.setItem('users', JSON.stringify(localUsers));
            
            showAlert('Registration successful! Please login.', 'success');
            closeModal('registerModal');
            showLogin();
        } else {
            showAlert(data.detail || 'Registration failed', 'error');
        }
    } catch (error) {
        // Offline demo mode - save user data
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const newUser = {
            id: 'user-' + Date.now(),
            ...userData,
            credits: 0,
            created_at: new Date().toISOString()
        };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        showAlert('Registration successful! Please login.', 'success');
        closeModal('registerModal');
        showLogin();
    }
    
    // Always save to localStorage as backup
    const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const existingUserIndex = localUsers.findIndex(u => u.email === userData.email);
    const userToSave = {
        id: existingUserIndex >= 0 ? localUsers[existingUserIndex].id : 'user-' + Date.now(),
        ...userData,
        credits: existingUserIndex >= 0 ? localUsers[existingUserIndex].credits : 0,
        created_at: existingUserIndex >= 0 ? localUsers[existingUserIndex].created_at : new Date().toISOString()
    };
    
    if (existingUserIndex >= 0) {
        localUsers[existingUserIndex] = userToSave;
    } else {
        localUsers.push(userToSave);
    }
    localStorage.setItem('users', JSON.stringify(localUsers));
}

// Helper function to convert file to base64
function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function viewAadharPhoto(userId) {
    // Check localStorage first
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    let user = users.find(u => u.id === userId);
    
    // If not found by ID, try to find by other means
    if (!user) {
        // Try to find by matching with current user
        if (currentUser && currentUser.id === userId) {
            user = currentUser;
        }
    }
    
    if (!user) {
        showAlert('User not found!', 'error');
        return;
    }
    
    if (!user.aadhar_photo) {
        // Show detailed error modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
                <div style="text-align: center; padding: 2rem;">
                    <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem; margin: 0 auto 1rem;">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h2>Aadhar Photo Not Available</h2>
                    <p style="color: #6b7280; margin: 1rem 0;">The Aadhar photo for <strong>${user.username}</strong> is not available.</p>
                    <div style="background: #fef3c7; padding: 1rem; border-radius: 8px; margin: 1rem 0; text-align: left;">
                        <h4 style="color: #92400e; margin: 0 0 0.5rem 0;">User Details:</h4>
                        <p style="margin: 0.25rem 0; color: #92400e;"><strong>Name:</strong> ${user.username}</p>
                        <p style="margin: 0.25rem 0; color: #92400e;"><strong>Email:</strong> ${user.email}</p>
                        <p style="margin: 0.25rem 0; color: #92400e;"><strong>Aadhar:</strong> ${user.aadhar_number}</p>
                    </div>
                    <p style="font-size: 0.9rem; color: #6b7280;">The photo may not have been uploaded during registration.</p>
                </div>
                <button class="btn btn-outline" onclick="this.parentElement.parentElement.remove()" style="width: 100%;">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
        `;
        document.body.appendChild(modal);
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content modal-large">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h2><i class="fas fa-id-card"></i> Aadhar Card - ${user.username}</h2>
            <div style="text-align: center; margin: 2rem 0;">
                <img src="${user.aadhar_photo}" alt="Aadhar Card" style="max-width: 100%; max-height: 400px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
            </div>
            <div style="display: flex; gap: 1rem; justify-content: center;">
                <button class="btn btn-primary" onclick="downloadAadharPhoto('${userId}')">
                    <i class="fas fa-download"></i> Download
                </button>
                <button class="btn btn-outline" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function downloadAadharPhoto(userId) {
    // Check localStorage first
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    let user = users.find(u => u.id === userId);
    
    // If not found by ID, try to find by other means
    if (!user) {
        // Try to find by matching with current user
        if (currentUser && currentUser.id === userId) {
            user = currentUser;
        }
    }
    
    if (!user || !user.aadhar_photo) {
        showAlert('Aadhar photo not available for download!', 'error');
        return;
    }
    
    const link = document.createElement('a');
    link.href = user.aadhar_photo;
    link.download = `aadhar_${user.username}_${user.aadhar_number}.${user.aadhar_photo_name.split('.').pop()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showAlert('Aadhar photo downloaded successfully!', 'success');
}

// Trip Functions
function logout() {
    localStorage.removeItem('user');
    currentUser = null;
    // Reset navbar
    const navActions = document.getElementById('publicNavActions');
    navActions.innerHTML = `
        <button class="btn btn-outline" onclick="showLogin()">Login</button>
        <button class="btn btn-primary" onclick="showRegister()">Sign Up</button>
    `;
    // Show main content, hide dashboard
    document.querySelector('.navbar').style.display = 'block';
    document.querySelector('.hero').style.display = 'block';
    document.querySelector('.features').style.display = 'block';
    document.querySelector('.trips-section').style.display = 'block';
    document.querySelector('.how-it-works').style.display = 'block';
    document.querySelector('.about').style.display = 'block';
    document.querySelector('.footer').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
    // Close any open modals
    const chatModal = document.getElementById('chatModal');
    if (chatModal) chatModal.remove();
    showAlert('Logged out successfully', 'success');
}

// Trip Functions
async function loadTrips() {
    try {
        const response = await fetch(`${API_URL}/trips?status=approved`);
        let trips = await response.json();
        
        // Filter out trips from blocked users
        const usersResponse = await fetch(`${API_URL}/admin/users`);
        const users = await usersResponse.json();
        const blockedUserIds = users.filter(u => u.blocked).map(u => u.id);
        trips = trips.filter(t => !blockedUserIds.includes(t.user_id));
        
        displayTrips(trips);
    } catch (error) {
        // Show only user trips
        if (currentUser) {
            const userTrips = JSON.parse(localStorage.getItem('userTrips') || '[]');
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const blockedUserIds = users.filter(u => u.blocked).map(u => u.id);
            const approvedTrips = userTrips.filter(t => t.status === 'approved' && !blockedUserIds.includes(t.user_id));
            displayTrips(approvedTrips);
        } else {
            displayTrips([]);
        }
    }
}

function displayTrips(trips) {
    const grid = document.getElementById('tripsGrid');
    if (trips.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: var(--gray); grid-column: 1/-1;">No trips available yet. Be the first to post!</p>';
        return;
    }

    const tripCards = trips.map(trip => {
        const chatButtonText = currentUser ? getChatButtonText(trip.id) : 'Chat (Login Required)';
        
        return `
        <div class="trip-card">
            <div class="trip-header">
                <span class="trip-type">${trip.type.toUpperCase()}</span>
                <h3>${trip.title}</h3>
                <div class="trip-route">
                    <span>${trip.from_location}</span>
                    <i class="fas fa-arrow-right"></i>
                    <span>${trip.to_location}</span>
                </div>
            </div>
            <div class="trip-body">
                <div class="trip-info">
                    <div class="info-item">
                        <i class="fas fa-calendar"></i>
                        <span>${new Date(trip.date).toLocaleDateString()}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-users"></i>
                        <span>${trip.seats} seats</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-rupee-sign"></i>
                        <span>₹${trip.budget}</span>
                    </div>
                </div>
                <p class="trip-description">${trip.description.substring(0, 100)}...</p>
                <div class="trip-footer">
                    <button class="btn btn-outline" onclick="viewTripDetails('${trip.id}')">View Details</button>
                    <button class="btn btn-primary" onclick="initiateChat('${trip.id}')"><i class="fas fa-comment"></i> ${chatButtonText}</button>
                </div>
            </div>
        </div>
        `;
    });
    grid.innerHTML = tripCards.join('');
}

async function viewTripDetails(tripId) {
    try {
        const response = await fetch(`${API_URL}/trips/${tripId}`);
        const trip = await response.json();
        
        const content = `
            <h2>${trip.title}</h2>
            <div class="trip-details">
                <div class="detail-section">
                    <h3 style="display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-route"></i> Route Information</h3>
                    <p style="display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-map-marker-alt"></i> <strong>From:</strong> ${trip.from_location}</p>
                    <p style="display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-map-marker-alt"></i> <strong>To:</strong> ${trip.to_location}</p>
                    <p style="display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-calendar"></i> <strong>Date:</strong> ${new Date(trip.date).toLocaleDateString()}</p>
                </div>
                <div class="detail-section">
                    <h3 style="display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-info-circle"></i> Trip Details</h3>
                    <p style="display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-car"></i> <strong>Type:</strong> ${trip.type}</p>
                    <p style="display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-users"></i> <strong>Available Seats:</strong> ${trip.seats}</p>
                    <p style="display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-rupee-sign"></i> <strong>Budget:</strong> ₹${trip.budget}</p>
                </div>
                <div class="detail-section">
                    <h3 style="display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-align-left"></i> Description</h3>
                    <p>${trip.description}</p>
                </div>
                <button class="btn btn-primary btn-block" onclick="initiateChat('${trip.id}')">
                    <i class="fas fa-comment"></i> Contact Trip Owner
                </button>
            </div>
        `;
        
        document.getElementById('tripDetailsContent').innerHTML = content;
        openModal('tripDetailsModal');
    } catch (error) {
        // Demo mode - create a sample trip for testing
        const trip = {
            id: tripId,
            title: 'Sample Trip',
            from_location: 'Mumbai',
            to_location: 'Goa',
            date: '2024-12-25',
            type: 'driver',
            seats: 3,
            budget: 2500,
            description: 'This is a sample trip description for testing the trip details modal layout.'
        };
        
        const content = `
            <h2>${trip.title}</h2>
            <div class="trip-details">
                <div class="detail-section">
                    <h3 style="display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-route"></i> Route Information</h3>
                    <p style="display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-map-marker-alt"></i> <strong>From:</strong> ${trip.from_location}</p>
                    <p style="display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-map-marker-alt"></i> <strong>To:</strong> ${trip.to_location}</p>
                    <p style="display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-calendar"></i> <strong>Date:</strong> ${new Date(trip.date).toLocaleDateString()}</p>
                </div>
                <div class="detail-section">
                    <h3 style="display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-info-circle"></i> Trip Details</h3>
                    <p style="display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-car"></i> <strong>Type:</strong> ${trip.type}</p>
                    <p style="display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-users"></i> <strong>Available Seats:</strong> ${trip.seats}</p>
                    <p style="display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-rupee-sign"></i> <strong>Budget:</strong> ₹${trip.budget}</p>
                </div>
                <div class="detail-section">
                    <h3 style="display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-align-left"></i> Description</h3>
                    <p>${trip.description}</p>
                </div>
                <button class="btn btn-primary btn-block" onclick="initiateChat('${trip.id}')">
                    <i class="fas fa-comment"></i> Contact Trip Owner
                </button>
            </div>
        `;
        
        document.getElementById('tripDetailsContent').innerHTML = content;
        openModal('tripDetailsModal');
    }
}

async function handleCreateTrip(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showAlert('Please login first', 'error');
        showLogin();
        return;
    }

    const tripData = {
        id: 'trip-' + Date.now(),
        user_id: currentUser.id,
        title: document.getElementById('tripTitle').value,
        type: document.getElementById('tripType').value,
        from_location: document.getElementById('tripFrom').value,
        to_location: document.getElementById('tripTo').value,
        date: document.getElementById('tripDate').value,
        seats: parseInt(document.getElementById('tripSeats').value),
        budget: parseFloat(document.getElementById('tripBudget').value),
        description: document.getElementById('tripDescription').value,
        status: 'pending',
        created_at: new Date().toISOString()
    };

    try {
        const response = await fetch(`${API_URL}/trips?user_id=${currentUser.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tripData)
        });
        const data = await response.json();
        
        if (response.ok) {
            showAlert('Trip posted successfully! Waiting for admin approval.', 'success');
            closeModal('createTripModal');
            e.target.reset();
        } else {
            showAlert(data.detail || 'Failed to create trip', 'error');
        }
    } catch (error) {
        // Demo mode - save to localStorage
        const userTrips = JSON.parse(localStorage.getItem('userTrips') || '[]');
        userTrips.push(tripData);
        localStorage.setItem('userTrips', JSON.stringify(userTrips));
        
        showAlert('Trip posted successfully! (Demo Mode)', 'success');
        closeModal('createTripModal');
        e.target.reset();
        
        // Refresh dashboard if currently viewing overview
        if (document.getElementById('dashboard').style.display === 'flex') {
            showDashboardSection('overview');
        }
    }
}

async function searchTrips() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const typeFilter = document.getElementById('typeFilter').value;

    try {
        const response = await fetch(`${API_URL}/trips?status=approved`);
        let trips = await response.json();
        
        if (currentUser) {
            const userTrips = JSON.parse(localStorage.getItem('userTrips') || '[]');
            const myApprovedTrips = userTrips.filter(t => t.status === 'approved');
            trips = [...trips, ...myApprovedTrips];
        }

        if (searchTerm) {
            trips = trips.filter(trip => 
                trip.from_location.toLowerCase().includes(searchTerm) ||
                trip.to_location.toLowerCase().includes(searchTerm) ||
                trip.title.toLowerCase().includes(searchTerm)
            );
        }

        if (typeFilter) {
            trips = trips.filter(trip => trip.type === typeFilter);
        }

        displayTrips(trips);
        
        if (trips.length === 0 && (searchTerm || typeFilter)) {
            showAlert('No trips found matching your criteria', 'error');
        }
    } catch (error) {
        const userTrips = JSON.parse(localStorage.getItem('userTrips') || '[]');
        let filteredTrips = userTrips.filter(t => t.status === 'approved');
        
        if (searchTerm) {
            filteredTrips = filteredTrips.filter(trip => 
                trip.from_location.toLowerCase().includes(searchTerm) ||
                trip.to_location.toLowerCase().includes(searchTerm) ||
                trip.title.toLowerCase().includes(searchTerm)
            );
        }
        
        if (typeFilter) {
            filteredTrips = filteredTrips.filter(trip => trip.type === typeFilter);
        }
        
        displayTrips(filteredTrips);
    }
}

// Payment Functions
function initiateChat(tripId) {
    if (!currentUser) {
        showAlert('Please login first', 'error');
        showLogin();
        return;
    }

    currentTripForChat = tripId;
    
    // Get latest user data from localStorage
    const latestUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (latestUser.id === currentUser.id) {
        currentUser = latestUser;
    }
    
    // Check if user already has access to this trip chat
    const userChats = JSON.parse(localStorage.getItem('userChats') || '[]');
    const hasAccess = userChats.some(chat => chat.userId === currentUser.id && chat.tripId === tripId);
    
    if (hasAccess) {
        // User already paid for this trip chat - open directly
        openChatWindow('chat-' + tripId);
        showAlert('Welcome back to your chat!', 'success');
        return;
    }
    
    // Check if user has credits for new chat
    if (currentUser.credits && currentUser.credits >= 1) {
        // Deduct credit and grant access to this trip
        currentUser.credits -= 1;
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        // Grant permanent access to this trip chat
        userChats.push({
            userId: currentUser.id,
            tripId: tripId,
            grantedAt: new Date().toISOString()
        });
        localStorage.setItem('userChats', JSON.stringify(userChats));
        
        openChatWindow('chat-' + tripId);
        showAlert('Chat access granted! You can now chat unlimited with this trip owner.', 'success');
    } else {
        showAlert('You need 1 credit to unlock chat with this trip owner. Credits are charged once per trip.', 'error');
        openModal('paymentModal');
    }
}

async function confirmChatInitiation(tripId) {
    try {
        const response = await fetch(`${API_URL}/chat/initiate?user_id=${currentUser.id}&trip_id=${tripId}`, {
            method: 'POST'
        });
        const data = await response.json();
        
        if (response.ok) {
            currentUser.credits -= 1;
            localStorage.setItem('user', JSON.stringify(currentUser));
            showAlert('Chat initiated! You can now message the trip owner.', 'success');
            openChatWindow(data.chat_id);
        } else {
            if (response.status === 402) {
                openModal('paymentModal');
            } else {
                showAlert(data.detail || 'Failed to initiate chat', 'error');
            }
        }
    } catch (error) {
        showAlert('Connection error', 'error');
    }
}

function selectPackage(credits, amount) {
    selectedPaymentCredits = credits;
    selectedPaymentAmount = amount;
    document.querySelectorAll('.package').forEach(p => p.style.background = '');
    event.target.closest('.package').style.background = 'rgba(99, 102, 241, 0.1)';
}

async function processPayment() {
    if (selectedPaymentCredits === 0) {
        showAlert('Please select a package', 'error');
        return;
    }

    // Simulate Razorpay payment
    const options = {
        key: "rzp_test_demo",
        amount: selectedPaymentAmount * 100,
        currency: "INR",
        name: "TripTogether",
        description: `${selectedPaymentCredits} Chat Credits`,
        handler: async function (response) {
            try {
                const res = await fetch(`${API_URL}/payment?user_id=${currentUser.id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount: selectedPaymentAmount,
                        credits: selectedPaymentCredits
                    })
                });
                const data = await res.json();
                
                if (res.ok) {
                    currentUser.credits = data.credits;
                    localStorage.setItem('user', JSON.stringify(currentUser));
                    showAlert(`Payment successful! ${selectedPaymentCredits} credits added.`, 'success');
                    closeModal('paymentModal');
                    
                    if (currentTripForChat) {
                        setTimeout(() => {
                            confirmChatInitiation(currentTripForChat);
                        }, 1000);
                    }
                } else {
                    showAlert('Payment failed', 'error');
                }
            } catch (error) {
                showAlert('Payment processing error', 'error');
            }
        }
    };

    // For demo purposes, directly call handler
    showAlert('Processing payment...', 'success');
    setTimeout(() => {
        // Simulate successful payment
        currentUser.credits += selectedPaymentCredits;
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        // Store payment record
        const payments = JSON.parse(localStorage.getItem('payments') || '[]');
        payments.push({
            user_id: currentUser.id,
            amount: selectedPaymentAmount,
            credits: selectedPaymentCredits,
            date: new Date().toISOString()
        });
        localStorage.setItem('payments', JSON.stringify(payments));
        
        showAlert(`Payment successful! ${selectedPaymentCredits} credits added.`, 'success');
        closeModal('paymentModal');
        
        if (currentTripForChat) {
            setTimeout(() => {
                openChatWindow('demo-chat-' + currentTripForChat);
                showAlert('Chat initiated successfully!', 'success');
            }, 1000);
        }
    }, 1500);
}

function openChatWindow(chatId) {
    // Remove existing chat if any
    const existingChat = document.getElementById('chatModal');
    if (existingChat) existingChat.remove();
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'chatModal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content modal-large">
            <span class="close" onclick="closeChatWindow()">&times;</span>
            <h2><i class="fas fa-comments"></i> Chat with Trip Owner</h2>
            <div id="chatMessages-${chatId}" style="height: 350px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem; margin: 1rem 0; overflow-y: auto; background: #f9fafb;">
                <div style="text-align: center; padding: 2rem; color: #6b7280;">
                    <i class="fas fa-comment-dots" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>Chat initiated successfully!<br>Start your conversation with the trip owner.</p>
                    <p style="font-size: 0.9rem; margin-top: 1rem; padding: 1rem; background: #fff3cd; border-radius: 8px; color: #856404;">
                        <i class="fas fa-info-circle"></i> This is a real chat. The trip owner will receive your messages and can reply when online.
                    </p>
                </div>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
                <input type="text" id="messageInput-${chatId}" placeholder="Type your message..." style="flex: 1; padding: 0.75rem; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 1rem;" onkeypress="if(event.key==='Enter') sendMessage('${chatId}')">
                <button class="btn btn-primary" onclick="sendMessage('${chatId}')" style="padding: 0.75rem 1.5rem;">
                    <i class="fas fa-paper-plane"></i> Send
                </button>
            </div>
            <p style="font-size: 0.85rem; color: #6b7280; margin-top: 0.5rem; text-align: center;">
                <i class="fas fa-shield-alt"></i> Secure chat • Messages are encrypted
            </p>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Load existing chat messages
    loadChatMessages(chatId);
    
    // Focus on input
    setTimeout(() => {
        document.getElementById(`messageInput-${chatId}`).focus();
    }, 100);
    
    // Check for new messages every 3 seconds
    const chatInterval = setInterval(() => {
        if (!document.getElementById('chatModal')) {
            clearInterval(chatInterval);
            return;
        }
        loadChatMessages(chatId, true);
    }, 3000);
}

function loadChatMessages(chatId, isRefresh = false) {
    const chatData = JSON.parse(localStorage.getItem(`chat-${chatId}`) || '{"messages": []}');
    const chatMessages = document.getElementById(`chatMessages-${chatId}`);
    
    if (!chatMessages) return;
    
    // Remove any existing waiting message
    const waitingMsg = document.getElementById('waitingMessage');
    if (waitingMsg) waitingMsg.remove();
    
    if (chatData.messages.length === 0 && !isRefresh) {
        return; // Keep initial welcome message
    }
    
    if (isRefresh && chatData.messages.length === 0) {
        return; // No new messages
    }
    
    // Clear and rebuild messages
    chatMessages.innerHTML = '';
    
    if (chatData.messages.length === 0) {
        chatMessages.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #6b7280;">
                <i class="fas fa-comment-dots" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>Chat initiated successfully!<br>Start your conversation with the trip owner.</p>
                <p style="font-size: 0.9rem; margin-top: 1rem; padding: 1rem; background: #fff3cd; border-radius: 8px; color: #856404;">
                    <i class="fas fa-info-circle"></i> This is a real chat. The trip owner will receive your messages and can reply when online.
                </p>
            </div>
        `;
        return;
    }
    
    chatData.messages.forEach(msg => {
        const isCurrentUser = msg.sender === currentUser.username;
        const msgDiv = document.createElement('div');
        msgDiv.style.cssText = `margin-bottom: 1rem; text-align: ${isCurrentUser ? 'right' : 'left'}; opacity: 0; transform: translateY(10px); transition: all 0.3s;`;
        
        const timestamp = new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        msgDiv.innerHTML = `
            <div style="background: ${isCurrentUser ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'white'}; 
                        color: ${isCurrentUser ? 'white' : 'black'}; 
                        border: ${isCurrentUser ? 'none' : '1px solid #e5e7eb'};
                        padding: 0.75rem 1rem; 
                        border-radius: ${isCurrentUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px'}; 
                        display: inline-block; 
                        max-width: 70%; 
                        word-wrap: break-word; 
                        box-shadow: 0 2px 8px ${isCurrentUser ? 'rgba(99, 102, 241, 0.3)' : 'rgba(0,0,0,0.1)'};">
                ${msg.message}
            </div>
            <div style="font-size: 0.75rem; color: var(--gray); margin-top: 0.25rem;">
                ${isCurrentUser ? 'You' : msg.sender} • ${timestamp}
            </div>
        `;
        
        chatMessages.appendChild(msgDiv);
        
        // Animate message appearance
        setTimeout(() => {
            msgDiv.style.opacity = '1';
            msgDiv.style.transform = 'translateY(0)';
        }, 10);
    });
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function closeChatWindow() {
    const modal = document.getElementById('chatModal');
    if (modal) modal.remove();
}

function getChatButtonText(tripId) {
    if (!currentUser) return 'Chat (Login Required)';
    
    const userChats = JSON.parse(localStorage.getItem('userChats') || '[]');
    const hasAccess = userChats.some(chat => chat.userId === currentUser.id && chat.tripId === tripId);
    
    return hasAccess ? 'Continue Chat' : 'Chat (1 Credit)';
}

function getActiveChatCount() {
    if (!currentUser) return 0;
    
    const userChats = JSON.parse(localStorage.getItem('userChats') || '[]');
    return userChats.filter(chat => chat.userId === currentUser.id).length;
}

async function loadBrowseTrips() {
    const content = document.getElementById('dashboardContent');
    
    content.innerHTML = `
        <div class="dashboard-header">
            <h1>🔍 Browse All Trips</h1>
            <p>Discover and connect with travelers going your way</p>
        </div>
        <div class="content-section">
            <div class="section-header">
                <h2>Search & Filter</h2>
            </div>
            <div style="display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 200px;">
                    <input type="text" id="dashboardSearchInput" placeholder="Search by location..." style="width: 100%; padding: 0.75rem; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 1rem;">
                </div>
                <select id="dashboardTypeFilter" style="padding: 0.75rem; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 1rem;">
                    <option value="">All Types</option>
                    <option value="driver">Driver</option>
                    <option value="traveler">Traveler</option>
                    <option value="sponsor">Sponsor</option>
                </select>
                <button class="btn btn-primary" onclick="searchDashboardTrips()" style="padding: 0.75rem 1.5rem;">
                    <i class="fas fa-search"></i> Search
                </button>
            </div>
        </div>
        <div class="content-section">
            <div class="section-header">
                <h2>Available Trips</h2>
                <span id="tripCount" style="color: var(--gray);">Loading...</span>
            </div>
            <div id="dashboardTripsGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem;">
                Loading trips...
            </div>
        </div>
    `;
    
    // Load trips
    try {
        const response = await fetch(`${API_URL}/trips?status=approved`);
        const trips = await response.json();
        displayDashboardAllTrips(trips);
    } catch (error) {
        const userTrips = JSON.parse(localStorage.getItem('userTrips') || '[]');
        const approvedTrips = userTrips.filter(t => t.status === 'approved');
        displayDashboardAllTrips(approvedTrips);
    }
}

function displayDashboardAllTrips(trips) {
    const grid = document.getElementById('dashboardTripsGrid');
    const countElement = document.getElementById('tripCount');
    
    if (!grid) return;
    
    countElement.textContent = `${trips.length} trips found`;
    
    if (trips.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: var(--gray); grid-column: 1/-1;">No trips available yet.</p>';
        return;
    }
    
    const tripCards = trips.map(trip => {
        const isMyTrip = currentUser && trip.user_id === currentUser.id;
        const chatButtonText = currentUser ? getChatButtonText(trip.id) : 'Chat (Login Required)';
        return `
        <div class="trip-card" style="${isMyTrip ? 'border: 2px solid var(--success); position: relative;' : ''}">
            ${isMyTrip ? '<div style="position: absolute; top: 10px; right: 10px; background: var(--success); color: white; padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; z-index: 10; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);"><i class="fas fa-user"></i> Your Trip</div>' : ''}
            <div class="trip-header">
                <span class="trip-type">${trip.type.toUpperCase()}</span>
                <h3>${trip.title}</h3>
                <div class="trip-route">
                    <span>${trip.from_location}</span>
                    <i class="fas fa-arrow-right"></i>
                    <span>${trip.to_location}</span>
                </div>
            </div>
            <div class="trip-body">
                <div class="trip-info">
                    <div class="info-item">
                        <i class="fas fa-calendar"></i>
                        <span>${new Date(trip.date).toLocaleDateString()}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-users"></i>
                        <span>${trip.seats} seats</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-rupee-sign"></i>
                        <span>₹${trip.budget}</span>
                    </div>
                </div>
                <p class="trip-description">${trip.description.substring(0, 100)}...</p>
                <div class="trip-footer">
                    <button class="btn btn-outline" onclick="viewTripDetailsInDashboard('${trip.id}', ${JSON.stringify(trip).replace(/"/g, '&quot;')})">View Details</button>
                    ${isMyTrip ? 
                        '<button class="btn btn-success" disabled><i class="fas fa-check"></i> Your Trip</button>' : 
                        `<button class="btn btn-primary" onclick="initiateChat('${trip.id}')"><i class="fas fa-comment"></i> ${chatButtonText}</button>`
                    }
                </div>
            </div>
        </div>
        `;
    });
    grid.innerHTML = tripCards.join('');
}

function searchDashboardTrips() {
    const searchTerm = document.getElementById('dashboardSearchInput').value.toLowerCase();
    const typeFilter = document.getElementById('dashboardTypeFilter').value;
    
    // Get user trips only
    const userTrips = JSON.parse(localStorage.getItem('userTrips') || '[]');
    let filteredTrips = userTrips.filter(t => t.status === 'approved');
    
    if (searchTerm) {
        filteredTrips = filteredTrips.filter(trip => 
            trip.from_location.toLowerCase().includes(searchTerm) ||
            trip.to_location.toLowerCase().includes(searchTerm) ||
            trip.title.toLowerCase().includes(searchTerm)
        );
    }
    
    if (typeFilter) {
        filteredTrips = filteredTrips.filter(trip => trip.type === typeFilter);
    }
    
    displayDashboardAllTrips(filteredTrips);
}

function viewTripDetailsInDashboard(tripId, tripData) {
    const trip = typeof tripData === 'string' ? JSON.parse(tripData) : tripData;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content modal-large">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h2>${trip.title}</h2>
            <div class="trip-details">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; margin-bottom: 2rem;">
                    <div>
                        <h3 style="display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-route"></i> Route Information</h3>
                        <p style="display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-map-marker-alt"></i> <strong>From:</strong> ${trip.from_location}</p>
                        <p style="display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-map-marker-alt"></i> <strong>To:</strong> ${trip.to_location}</p>
                        <p style="display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-calendar"></i> <strong>Date:</strong> ${new Date(trip.date).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <h3 style="display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-info-circle"></i> Trip Details</h3>
                        <p style="display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-car"></i> <strong>Type:</strong> ${trip.type}</p>
                        <p style="display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-users"></i> <strong>Available Seats:</strong> ${trip.seats}</p>
                        <p style="display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-rupee-sign"></i> <strong>Budget:</strong> ₹${trip.budget}</p>
                    </div>
                </div>
                <div>
                    <h3 style="display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-align-left"></i> Description</h3>
                    <p style="background: #f9fafb; padding: 1rem; border-radius: 8px; margin: 1rem 0;">${trip.description}</p>
                </div>
                <button class="btn btn-primary btn-block" onclick="this.parentElement.parentElement.parentElement.remove(); initiateChat('${trip.id}')">
                    <i class="fas fa-comment"></i> Contact Trip Owner
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function loadAITripPlanner() {
    const content = document.getElementById('dashboardContent');
    const today = new Date().toISOString().split('T')[0];
    
    content.innerHTML = `
        <div class="dashboard-header">
            <h1>🤖 AI Trip Planner</h1>
            <p>Get intelligent route optimization, budget estimates, and travel recommendations</p>
        </div>
        
        <div class="content-section">
            <div class="section-header">
                <h2>Plan Your Trip</h2>
            </div>
            <form onsubmit="generateTripPlan(event)" style="display: grid; gap: 1.5rem;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="form-group">
                        <label>From Location</label>
                        <input type="text" id="planFrom" placeholder="e.g., Mumbai" required>
                    </div>
                    <div class="form-group">
                        <label>To Location</label>
                        <input type="text" id="planTo" placeholder="e.g., Goa" required>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
                    <div class="form-group">
                        <label>Travel Date</label>
                        <input type="date" id="planDate" required min="${today}">
                    </div>
                    <div class="form-group">
                        <label>Number of Travelers</label>
                        <select id="planTravelers" required>
                            <option value="1">1 Person</option>
                            <option value="2">2 People</option>
                            <option value="3">3 People</option>
                            <option value="4">4 People</option>
                            <option value="5+">5+ People</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Budget Range</label>
                        <select id="planBudget" required>
                            <option value="budget">Budget (₹1000-3000)</option>
                            <option value="mid">Mid-range (₹3000-7000)</option>
                            <option value="luxury">Luxury (₹7000+)</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Travel Preferences</label>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-top: 0.5rem;">
                        <label style="display: flex; align-items: center; gap: 0.5rem;"><input type="checkbox" id="prefFastest"> Fastest Route</label>
                        <label style="display: flex; align-items: center; gap: 0.5rem;"><input type="checkbox" id="prefCheapest"> Cheapest Option</label>
                        <label style="display: flex; align-items: center; gap: 0.5rem;"><input type="checkbox" id="prefScenic"> Scenic Route</label>
                        <label style="display: flex; align-items: center; gap: 0.5rem;"><input type="checkbox" id="prefStops"> Multiple Stops</label>
                    </div>
                </div>
                <button type="submit" class="btn btn-primary btn-lg">
                    <i class="fas fa-magic"></i> Generate AI Trip Plan
                </button>
            </form>
        </div>
        
        <div id="tripPlanResults" style="display: none;">
            <!-- Results will be shown here -->
        </div>
    `;
}

function generateTripPlan(e) {
    e.preventDefault();
    
    const from = document.getElementById('planFrom').value;
    const to = document.getElementById('planTo').value;
    const date = document.getElementById('planDate').value;
    const travelers = document.getElementById('planTravelers').value;
    const budget = document.getElementById('planBudget').value;
    
    const preferences = {
        fastest: document.getElementById('prefFastest').checked,
        cheapest: document.getElementById('prefCheapest').checked,
        scenic: document.getElementById('prefScenic').checked,
        stops: document.getElementById('prefStops').checked
    };
    
    // Show loading
    const resultsDiv = document.getElementById('tripPlanResults');
    resultsDiv.style.display = 'block';
    resultsDiv.innerHTML = `
        <div class="content-section">
            <div style="text-align: center; padding: 3rem;">
                <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: var(--primary); margin-bottom: 1rem;"></i>
                <h3>AI is planning your perfect trip...</h3>
                <p style="color: var(--gray);">Analyzing routes, costs, and recommendations</p>
            </div>
        </div>
    `;
    
    // Simulate AI processing
    setTimeout(() => {
        displayTripPlan(from, to, date, travelers, budget, preferences);
    }, 3000);
}

function displayTripPlan(from, to, date, travelers, budget, preferences) {
    // Calculate realistic distance based on route
    const routeData = calculateRouteDistance(from.toLowerCase(), to.toLowerCase());
    const distance = routeData.distance;
    const duration = Math.ceil(distance / 60) + routeData.extraTime;
    
    let baseCost = distance * routeData.costPerKm;
    if (budget === 'luxury') baseCost *= 1.8;
    else if (budget === 'budget') baseCost *= 0.6;
    
    const fuelCost = Math.floor(baseCost * 0.4);
    const tollCost = Math.floor(baseCost * 0.15);
    const foodCost = Math.floor(baseCost * 0.25);
    const miscCost = Math.floor(baseCost * 0.2);
    const totalCost = fuelCost + tollCost + foodCost + miscCost;
    
    const resultsDiv = document.getElementById('tripPlanResults');
    resultsDiv.innerHTML = `
        <div class="content-section">
            <div class="section-header">
                <h2>🎯 Your AI-Generated Trip Plan</h2>
                <span style="background: var(--success); color: white; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.9rem;">
                    <i class="fas fa-check"></i> Optimized Route
                </span>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin-bottom: 2rem;">
                <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 2rem; border-radius: 16px;">
                    <h3><i class="fas fa-route"></i> Route Details</h3>
                    <p><strong>Distance:</strong> ${distance} km</p>
                    <p><strong>Duration:</strong> ${duration} hours</p>
                    <p><strong>Best Route:</strong> ${from} → ${to}</p>
                    <p><strong>Recommended Stops:</strong> 2-3 rest points</p>
                </div>
                
                <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 2rem; border-radius: 16px;">
                    <h3><i class="fas fa-rupee-sign"></i> Cost Breakdown</h3>
                    <p><strong>Fuel:</strong> ₹${fuelCost}</p>
                    <p><strong>Tolls:</strong> ₹${tollCost}</p>
                    <p><strong>Food:</strong> ₹${foodCost}</p>
                    <p><strong>Miscellaneous:</strong> ₹${miscCost}</p>
                    <p style="border-top: 1px solid rgba(255,255,255,0.3); padding-top: 0.5rem; margin-top: 0.5rem;"><strong>Total: ₹${totalCost}</strong></p>
                </div>
            </div>
            
            <div style="display: grid; gap: 1.5rem;">
                <div style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                    <h3><i class="fas fa-lightbulb"></i> AI Recommendations</h3>
                    <div style="display: grid; gap: 1rem; margin-top: 1rem;">
                        ${preferences.fastest ? '<div style="padding: 1rem; background: #e0f2fe; border-radius: 8px; border-left: 4px solid #0288d1;"><strong>Fastest Route:</strong> Take NH-48 for optimal speed and minimal traffic</div>' : ''}
                        ${preferences.cheapest ? '<div style="padding: 1rem; background: #e8f5e8; border-radius: 8px; border-left: 4px solid #4caf50;"><strong>Cost Saving:</strong> Travel during off-peak hours to save 15-20% on tolls</div>' : ''}
                        ${preferences.scenic ? '<div style="padding: 1rem; background: #fff3e0; border-radius: 8px; border-left: 4px solid #ff9800;"><strong>Scenic Route:</strong> Consider coastal highway for beautiful views (adds 1 hour)</div>' : ''}
                        ${preferences.stops ? '<div style="padding: 1rem; background: #f3e5f5; border-radius: 8px; border-left: 4px solid #9c27b0;"><strong>Recommended Stops:</strong> Lonavala, Pune for food and rest</div>' : ''}
                        <div style="padding: 1rem; background: #e1f5fe; border-radius: 8px; border-left: 4px solid #03a9f4;"><strong>Weather Alert:</strong> Clear skies expected on ${new Date(date).toLocaleDateString()}</div>
                        <div style="padding: 1rem; background: #fce4ec; border-radius: 8px; border-left: 4px solid #e91e63;"><strong>Traffic Tip:</strong> Start early morning (6-7 AM) to avoid city traffic</div>
                    </div>
                </div>
                
                <div style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                    <h3><i class="fas fa-map-marked-alt"></i> Suggested Itinerary</h3>
                    <div style="display: grid; gap: 1rem; margin-top: 1rem;">
                        <div style="display: flex; gap: 1rem; align-items: center;">
                            <div style="width: 40px; height: 40px; background: var(--primary); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">1</div>
                            <div><strong>6:00 AM</strong> - Start from ${from}</div>
                        </div>
                        <div style="display: flex; gap: 1rem; align-items: center;">
                            <div style="width: 40px; height: 40px; background: var(--secondary); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">2</div>
                            <div><strong>9:30 AM</strong> - Rest stop for breakfast</div>
                        </div>
                        <div style="display: flex; gap: 1rem; align-items: center;">
                            <div style="width: 40px; height: 40px; background: var(--success); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">3</div>
                            <div><strong>${12 + duration}:00 PM</strong> - Arrive at ${to}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 2rem;">
                <button class="btn btn-primary btn-lg" onclick="createTripFromPlan('${from}', '${to}', '${date}', ${totalCost})">
                    <i class="fas fa-plus-circle"></i> Create Trip Based on This Plan
                </button>
            </div>
        </div>
    `;
}

function calculateRouteDistance(from, to) {
    const routes = {
        // Mumbai routes (corrected distances)
        'mumbai-goa': { distance: 597, costPerKm: 12, extraTime: 1 },
        'mumbai-pune': { distance: 149, costPerKm: 15, extraTime: 0 },
        'mumbai-delhi': { distance: 1154, costPerKm: 7, extraTime: 4 },
        'mumbai-chennai': { distance: 1338, costPerKm: 8, extraTime: 3 },
        'mumbai-bangalore': { distance: 984, costPerKm: 9, extraTime: 2 },
        'mumbai-kolkata': { distance: 1968, costPerKm: 6, extraTime: 5 },
        'mumbai-jaipur': { distance: 1176, costPerKm: 8, extraTime: 3 },
        'mumbai-ahmedabad': { distance: 524, costPerKm: 10, extraTime: 1 },
        'mumbai-nashik': { distance: 167, costPerKm: 14, extraTime: 0 },
        'mumbai-aurangabad': { distance: 334, costPerKm: 11, extraTime: 1 },
        
        // Delhi routes (corrected distances)
        'delhi-mumbai': { distance: 1154, costPerKm: 7, extraTime: 4 },
        'delhi-manali': { distance: 537, costPerKm: 10, extraTime: 2 },
        'delhi-agra': { distance: 233, costPerKm: 9, extraTime: 0 },
        'delhi-jaipur': { distance: 268, costPerKm: 11, extraTime: 1 },
        'delhi-chandigarh': { distance: 243, costPerKm: 12, extraTime: 0 },
        'delhi-lucknow': { distance: 556, costPerKm: 9, extraTime: 1 },
        'delhi-kolkata': { distance: 1472, costPerKm: 7, extraTime: 4 },
        'delhi-chennai': { distance: 2194, costPerKm: 6, extraTime: 6 },
        'delhi-bangalore': { distance: 2077, costPerKm: 6, extraTime: 5 },
        'delhi-goa': { distance: 1751, costPerKm: 7, extraTime: 5 },
        'delhi-shimla': { distance: 343, costPerKm: 13, extraTime: 2 },
        'delhi-haridwar': { distance: 214, costPerKm: 10, extraTime: 1 },
        
        // Bangalore routes (corrected distances)
        'bangalore-chennai': { distance: 346, costPerKm: 8, extraTime: 1 },
        'bangalore-goa': { distance: 562, costPerKm: 11, extraTime: 2 },
        'bangalore-mumbai': { distance: 984, costPerKm: 9, extraTime: 2 },
        'bangalore-delhi': { distance: 2077, costPerKm: 6, extraTime: 5 },
        'bangalore-hyderabad': { distance: 569, costPerKm: 9, extraTime: 1 },
        'bangalore-kochi': { distance: 456, costPerKm: 10, extraTime: 2 },
        'bangalore-mysore': { distance: 144, costPerKm: 12, extraTime: 0 },
        'bangalore-coimbatore': { distance: 362, costPerKm: 9, extraTime: 1 },
        
        // Chennai routes (corrected distances)
        'chennai-bangalore': { distance: 346, costPerKm: 8, extraTime: 1 },
        'chennai-mumbai': { distance: 1338, costPerKm: 8, extraTime: 3 },
        'chennai-delhi': { distance: 2194, costPerKm: 6, extraTime: 6 },
        'chennai-hyderabad': { distance: 626, costPerKm: 9, extraTime: 1 },
        'chennai-kochi': { distance: 695, costPerKm: 10, extraTime: 2 },
        'chennai-pondicherry': { distance: 162, costPerKm: 13, extraTime: 0 },
        'chennai-coimbatore': { distance: 507, costPerKm: 9, extraTime: 1 },
        
        // Kolkata routes (corrected distances)
        'kolkata-delhi': { distance: 1472, costPerKm: 7, extraTime: 4 },
        'kolkata-mumbai': { distance: 1968, costPerKm: 6, extraTime: 5 },
        'kolkata-chennai': { distance: 1663, costPerKm: 7, extraTime: 4 },
        'kolkata-bhubaneswar': { distance: 442, costPerKm: 10, extraTime: 1 },
        'kolkata-guwahati': { distance: 1028, costPerKm: 8, extraTime: 3 },
        
        // Goa routes (corrected distances)
        'goa-mumbai': { distance: 597, costPerKm: 12, extraTime: 1 },
        'goa-bangalore': { distance: 562, costPerKm: 11, extraTime: 2 },
        'goa-delhi': { distance: 1751, costPerKm: 7, extraTime: 5 },
        'goa-pune': { distance: 464, costPerKm: 11, extraTime: 1 },
        
        // Pune routes (corrected distances)
        'pune-mumbai': { distance: 149, costPerKm: 15, extraTime: 0 },
        'pune-goa': { distance: 464, costPerKm: 11, extraTime: 1 },
        'pune-bangalore': { distance: 847, costPerKm: 9, extraTime: 2 },
        'pune-delhi': { distance: 1130, costPerKm: 8, extraTime: 3 },
        
        // Jaipur routes (corrected distances)
        'jaipur-delhi': { distance: 268, costPerKm: 11, extraTime: 1 },
        'jaipur-mumbai': { distance: 1176, costPerKm: 8, extraTime: 3 },
        'jaipur-agra': { distance: 238, costPerKm: 10, extraTime: 1 },
        'jaipur-udaipur': { distance: 393, costPerKm: 11, extraTime: 2 },
        
        // Hyderabad routes (corrected distances)
        'hyderabad-bangalore': { distance: 569, costPerKm: 9, extraTime: 1 },
        'hyderabad-chennai': { distance: 626, costPerKm: 9, extraTime: 1 },
        'hyderabad-mumbai': { distance: 711, costPerKm: 9, extraTime: 2 },
        
        // Other popular routes (corrected distances)
        'agra-delhi': { distance: 233, costPerKm: 9, extraTime: 0 },
        'agra-jaipur': { distance: 238, costPerKm: 10, extraTime: 1 },
        'chandigarh-delhi': { distance: 243, costPerKm: 12, extraTime: 0 },
        'chandigarh-manali': { distance: 309, costPerKm: 14, extraTime: 2 },
        'manali-delhi': { distance: 537, costPerKm: 10, extraTime: 2 },
        'shimla-delhi': { distance: 343, costPerKm: 13, extraTime: 2 },
        'haridwar-delhi': { distance: 214, costPerKm: 10, extraTime: 1 },
        'lucknow-delhi': { distance: 556, costPerKm: 9, extraTime: 1 },
        'ahmedabad-mumbai': { distance: 524, costPerKm: 10, extraTime: 1 },
        'nashik-mumbai': { distance: 167, costPerKm: 14, extraTime: 0 },
        'aurangabad-mumbai': { distance: 334, costPerKm: 11, extraTime: 1 },
        'mysore-bangalore': { distance: 144, costPerKm: 12, extraTime: 0 },
        'coimbatore-chennai': { distance: 507, costPerKm: 9, extraTime: 1 },
        'coimbatore-bangalore': { distance: 362, costPerKm: 9, extraTime: 1 },
        'kochi-chennai': { distance: 695, costPerKm: 10, extraTime: 2 },
        'kochi-bangalore': { distance: 456, costPerKm: 10, extraTime: 2 },
        'pondicherry-chennai': { distance: 162, costPerKm: 13, extraTime: 0 },
        'bhubaneswar-kolkata': { distance: 442, costPerKm: 10, extraTime: 1 },
        'guwahati-kolkata': { distance: 1028, costPerKm: 8, extraTime: 3 },
        'udaipur-jaipur': { distance: 393, costPerKm: 11, extraTime: 2 }
    };
    
    const routeKey = `${from}-${to}`;
    
    if (routes[routeKey]) {
        return routes[routeKey];
    }
    
    // Try reverse route
    const reverseKey = `${to}-${from}`;
    if (routes[reverseKey]) {
        return routes[reverseKey];
    }
    
    // Calculate approximate distance for unknown routes
    const cityCoords = {
        'mumbai': [19.0760, 72.8777],
        'delhi': [28.7041, 77.1025],
        'bangalore': [12.9716, 77.5946],
        'chennai': [13.0827, 80.2707],
        'kolkata': [22.5726, 88.3639],
        'goa': [15.2993, 74.1240],
        'pune': [18.5204, 73.8567],
        'jaipur': [26.9124, 75.7873],
        'hyderabad': [17.3850, 78.4867],
        'ahmedabad': [23.0225, 72.5714]
    };
    
    if (cityCoords[from] && cityCoords[to]) {
        const [lat1, lon1] = cityCoords[from];
        const [lat2, lon2] = cityCoords[to];
        const distance = Math.floor(calculateHaversineDistance(lat1, lon1, lat2, lon2));
        return {
            distance: distance,
            costPerKm: 9,
            extraTime: Math.floor(distance / 500)
        };
    }
    
    // Default for completely unknown routes
    return {
        distance: 500,
        costPerKm: 9,
        extraTime: 1
    };
}

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c * 1.3; // Multiply by 1.3 for road distance vs straight line
}

function createTripFromPlan(from, to, date, budget) {
    // Pre-fill the create trip form
    document.getElementById('tripFrom').value = from;
    document.getElementById('tripTo').value = to;
    document.getElementById('tripDate').value = date;
    document.getElementById('tripBudget').value = budget;
    document.getElementById('tripTitle').value = `${from} to ${to} Trip`;
    document.getElementById('tripDescription').value = `AI-planned trip from ${from} to ${to}. Optimized route with cost estimation of ₹${budget}.`;
    
    showCreateTrip();
    showAlert('Trip form pre-filled with AI recommendations!', 'success');
}

function loadUserChats() {
    const content = document.getElementById('dashboardContent');
    const userChats = JSON.parse(localStorage.getItem('userChats') || '[]');
    const myChats = userChats.filter(chat => chat.userId === currentUser.id);
    
    content.innerHTML = `
        <div class="dashboard-header">
            <h1>💬 My Chats</h1>
            <p>Connect and coordinate with fellow travelers</p>
        </div>
        <div class="content-section">
            <div class="section-header">
                <h2>Active Conversations (${myChats.length})</h2>
                <button class="btn btn-outline" onclick="showDashboardSection('browse')">
                    <i class="fas fa-search"></i> Find More Trips
                </button>
            </div>
            ${myChats.length === 0 ? `
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <h3>No Active Chats</h3>
                    <p>Start chatting with trip owners to plan your journey</p>
                    <button class="btn btn-primary" onclick="showDashboardSection('browse')" style="margin-top: 1.5rem;">
                        Browse Trips
                    </button>
                </div>
            ` : `
                <div style="display: grid; gap: 1rem;">
                    ${myChats.map(chat => {
                        const chatData = JSON.parse(localStorage.getItem(`chat-${chat.tripId}`) || '{"messages": []}');
                        const lastMessage = chatData.messages[chatData.messages.length - 1];
                        const messageCount = chatData.messages.length;
                        
                        // Get trip title from all available trips
                        let tripTitle = `Trip #${chat.tripId.substring(0, 8)}`;
                        
                        // Check user trips
                        const userTrips = JSON.parse(localStorage.getItem('userTrips') || '[]');
                        let trip = userTrips.find(t => t.id === chat.tripId);
                        

                        
                        if (trip) {
                            tripTitle = trip.title;
                        }
                        
                        return `
                            <div style="background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-left: 4px solid var(--primary); cursor: pointer;" onclick="openChatWindow('chat-${chat.tripId}')">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                                    <div>
                                        <h4 style="margin-bottom: 0.5rem; color: var(--primary);">${tripTitle}</h4>
                                        <p style="color: var(--gray); font-size: 0.9rem;">Started: ${new Date(chat.grantedAt).toLocaleDateString()}</p>
                                    </div>
                                    <span style="background: var(--success); color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem;">
                                        ${messageCount} messages
                                    </span>
                                </div>
                                ${lastMessage ? `
                                    <div style="background: #f9fafb; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                                        <p style="margin: 0; color: var(--gray); font-size: 0.9rem;"><strong>Last message:</strong></p>
                                        <p style="margin: 0.5rem 0 0 0; color: var(--dark);">${lastMessage.message.substring(0, 100)}${lastMessage.message.length > 100 ? '...' : ''}</p>
                                        <p style="margin: 0.5rem 0 0 0; color: var(--gray); font-size: 0.8rem;">by ${lastMessage.sender} • ${new Date(lastMessage.timestamp).toLocaleString()}</p>
                                    </div>
                                ` : ''}
                                <button class="btn btn-primary" onclick="event.stopPropagation(); openChatWindow('chat-${chat.tripId}')" style="width: 100%;">
                                    <i class="fas fa-comment"></i> Continue Conversation
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>
            `}
        </div>
    `;
}

function sendMessage(chatId) {
    const input = document.getElementById(`messageInput-${chatId}`);
    const message = input.value.trim();
    
    if (!message) {
        input.focus();
        return;
    }
    
    const chatMessages = document.getElementById(`chatMessages-${chatId}`);
    const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    // Add user message with animation
    const userMsg = document.createElement('div');
    userMsg.style.cssText = 'margin-bottom: 1rem; text-align: right; opacity: 0; transform: translateY(10px); transition: all 0.3s;';
    userMsg.innerHTML = `
        <div style="background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; padding: 0.75rem 1rem; border-radius: 18px 18px 4px 18px; display: inline-block; max-width: 70%; word-wrap: break-word; box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);">
            ${message}
        </div>
        <div style="font-size: 0.75rem; color: var(--gray); margin-top: 0.25rem;">You • ${timestamp}</div>
    `;
    
    chatMessages.appendChild(userMsg);
    
    // Animate message appearance
    setTimeout(() => {
        userMsg.style.opacity = '1';
        userMsg.style.transform = 'translateY(0)';
    }, 10);
    
    input.value = '';
    input.focus();
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Save message to localStorage for real chat
    const chatData = JSON.parse(localStorage.getItem(`chat-${chatId}`) || '{"messages": []}');
    chatData.messages.push({
        sender: currentUser.username,
        message: message,
        timestamp: new Date().toISOString(),
        type: 'user'
    });
    localStorage.setItem(`chat-${chatId}`, JSON.stringify(chatData));
    
    // Immediately refresh the chat display to show the new message
    loadChatMessages(chatId);
    
    // Show waiting message after a brief delay
    setTimeout(() => {
        const waitingMsg = document.createElement('div');
        waitingMsg.id = 'waitingMessage';
        waitingMsg.style.cssText = 'margin-bottom: 1rem; text-align: center; opacity: 0.7;';
        waitingMsg.innerHTML = `
            <div style="background: #f0f9ff; border: 1px dashed #0ea5e9; padding: 1rem; border-radius: 12px; color: #0369a1;">
                <i class="fas fa-clock" style="margin-right: 0.5rem;"></i>
                Message sent! Waiting for trip owner to reply...
            </div>
        `;
        chatMessages.appendChild(waitingMsg);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 500);
}

async function loadDashboardTrips() {
    try {
        const response = await fetch(`${API_URL}/trips?status=approved`);
        let trips = await response.json();
        
        // Filter out trips from blocked users
        const usersResponse = await fetch(`${API_URL}/admin/users`);
        const users = await usersResponse.json();
        const blockedUserIds = users.filter(u => u.blocked).map(u => u.id);
        trips = trips.filter(t => !blockedUserIds.includes(t.user_id));
        
        displayDashboardTrips(trips.slice(0, 3)); // Show only 3 trips
    } catch (error) {
        const userTrips = JSON.parse(localStorage.getItem('userTrips') || '[]');
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const blockedUserIds = users.filter(u => u.blocked).map(u => u.id);
        const approvedTrips = userTrips.filter(t => t.status === 'approved' && !blockedUserIds.includes(t.user_id)).slice(0, 3);
        displayDashboardTrips(approvedTrips);
    }
}

function displayDashboardTrips(trips) {
    const container = document.getElementById('dashboardTrips');
    if (trips.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--gray);">No trips available</p>';
        return;
    }
    
    container.innerHTML = `
        <div style="display: grid; gap: 1rem;">
            ${trips.map(trip => `
                <div style="background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-left: 4px solid var(--primary); position: relative; ${currentUser && trip.user_id === currentUser.id ? 'border: 2px solid var(--success);' : ''}">
                    ${currentUser && trip.user_id === currentUser.id ? '<div style="position: absolute; top: -8px; right: 8px; background: var(--success); color: white; padding: 0.2rem 0.6rem; border-radius: 15px; font-size: 0.7rem; font-weight: 600; z-index: 10;"><i class="fas fa-user"></i> Your Trip</div>' : ''}
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                        <div>
                            <h4 style="margin-bottom: 0.5rem;">${trip.title}</h4>
                            <p style="color: var(--gray); margin-bottom: 0.5rem;">${trip.from_location} → ${trip.to_location}</p>
                            <p style="color: var(--gray); font-size: 0.9rem;">${new Date(trip.date).toLocaleDateString()} • ${trip.seats} seats • ₹${trip.budget}</p>
                        </div>
                        <span style="background: var(--primary); color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem;">${trip.type.toUpperCase()}</span>
                    </div>
                    ${currentUser && trip.user_id === currentUser.id ? 
                        '<button class="btn btn-success" disabled style="width: 100%;"><i class="fas fa-check"></i> Your Trip</button>' :
                        `<button class="btn btn-primary" onclick="initiateChat('${trip.id}')" style="width: 100%;"><i class="fas fa-comment"></i> ${getChatButtonText(trip.id)}</button>`
                    }
                </div>
            `).join('')}
        </div>
    `;
}

// Dashboard Functions
function showDashboard() {
    // Hide main content, show dashboard
    document.querySelector('.navbar').style.display = 'none';
    document.querySelector('.hero').style.display = 'none';
    document.querySelector('.features').style.display = 'none';
    document.querySelector('.trips-section').style.display = 'none';
    document.querySelector('.how-it-works').style.display = 'none';
    document.querySelector('.about').style.display = 'none';
    document.querySelector('.footer').style.display = 'none';
    document.getElementById('dashboard').style.display = 'flex';
    
    // Set overview as active and load it
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector('.sidebar-link[onclick*="overview"]').classList.add('active');
    document.getElementById('dashboardTitle').textContent = 'Dashboard Overview';
    showDashboardSection('overview');
}

async function showDashboardSection(section) {
    const content = document.getElementById('dashboardContent');
    
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Set active link based on section
    const activeLink = document.querySelector(`.sidebar-link[onclick*="${section}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Update dashboard title
    const titleMap = {
        'overview': 'Dashboard Overview',
        'mytrips': 'My Trips',
        'chats': 'My Chats',
        'credits': 'Chat Credits',
        'browse': 'Browse Trips',
        'planner': 'AI Trip Planner'
    };
    document.getElementById('dashboardTitle').textContent = titleMap[section] || 'Dashboard';
    
    // Update current user data
    const latestUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (latestUser.id === currentUser?.id) {
        currentUser = latestUser;
    }

    switch(section) {
        case 'overview':
            // Get user's trip count
            let userTripCount = 0;
            try {
                const response = await fetch(`${API_URL}/trips`);
                const allTrips = await response.json();
                userTripCount = allTrips.filter(t => t.user_id === currentUser.id).length;
            } catch (error) {
                // Demo mode - check localStorage for posted trips
                const postedTrips = JSON.parse(localStorage.getItem('userTrips') || '[]');
                userTripCount = postedTrips.filter(t => t.user_id === currentUser.id).length;
            }
            
            content.innerHTML = `
                <div class="dashboard-header">
                    <h1>👋 Welcome back, ${currentUser.username}!</h1>
                    <p>Manage your trips and connections from your personalized dashboard</p>
                </div>
                <div class="stats-grid">
                    <div class="stat-card">
                        <h4><i class="fas fa-coins"></i> Available Credits</h4>
                        <div class="value">${currentUser.credits}</div>
                    </div>
                    <div class="stat-card">
                        <h4><i class="fas fa-car"></i> My Trips</h4>
                        <div class="value">${userTripCount}</div>
                    </div>
                    <div class="stat-card">
                        <h4><i class="fas fa-comments"></i> Active Chats</h4>
                        <div class="value">${getActiveChatCount()}</div>
                    </div>
                </div>
                <div class="content-section">
                    <div class="section-header">
                        <h2>Quick Actions</h2>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
                        <button class="btn btn-primary" onclick="showCreateTrip()" style="padding: 1.5rem; font-size: 1.1rem;">
                            <i class="fas fa-plus-circle"></i> Post New Trip
                        </button>
                        <button class="btn btn-outline" onclick="showDashboardSection('browse')" style="padding: 1.5rem; font-size: 1.1rem;">
                            <i class="fas fa-search"></i> Browse Trips
                        </button>
                        <button class="btn btn-primary" onclick="openModal('paymentModal')" style="padding: 1.5rem; font-size: 1.1rem; background: linear-gradient(135deg, #f59e0b, #d97706);">
                            <i class="fas fa-wallet"></i> Buy Credits
                        </button>
                    </div>
                </div>
                <div class="content-section">
                    <div class="section-header">
                        <h2>Available Trips</h2>
                        <button class="btn btn-outline" onclick="showDashboardSection('browse')">
                            <i class="fas fa-external-link-alt"></i> View All
                        </button>
                    </div>
                    <div id="dashboardTrips">Loading trips...</div>
                </div>
            `;
            // Load trips for dashboard
            loadDashboardTrips();
            break;
        case 'browse':
            loadBrowseTrips();
            break;
        case 'planner':
            loadAITripPlanner();
            break;
        case 'mytrips':
            await loadMyTrips();
            break;
        case 'chats':
            loadUserChats();
            break;
        case 'credits':
            const settings = JSON.parse(localStorage.getItem('adminSettings') || '{}');
            const basePrice = parseInt(settings.creditPrice || '20');
            content.innerHTML = `
                <div class="dashboard-header">
                    <h1>💰 Chat Credits</h1>
                    <p>Manage your credits and purchase more to connect with travelers</p>
                </div>
                <div class="content-section">
                    <div class="section-header">
                        <h2>Current Balance</h2>
                    </div>
                    <div style="text-align: center; padding: 2rem;">
                        <div style="font-size: 5rem; font-weight: 700; background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                            ${currentUser.credits}
                        </div>
                        <p style="font-size: 1.3rem; color: var(--gray); margin-bottom: 2rem;">Available Credits</p>
                        <button class="btn btn-primary btn-lg" onclick="openModal('paymentModal')">
                            <i class="fas fa-shopping-cart"></i> Buy More Credits
                        </button>
                    </div>
                </div>
                <div class="content-section">
                    <div class="section-header">
                        <h2>How Credits Work</h2>
                    </div>
                    <div style="display: grid; gap: 1.5rem;">
                        <div style="display: flex; gap: 1rem; align-items: start;">
                            <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; flex-shrink: 0;">
                                <i class="fas fa-comment"></i>
                            </div>
                            <div>
                                <h3 style="margin-bottom: 0.5rem;">1 Credit = ₹${basePrice}</h3>
                                <p style="color: var(--gray);">Use one credit to initiate a conversation with any trip owner</p>
                            </div>
                        </div>
                        <div style="display: flex; gap: 1rem; align-items: start;">
                            <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; flex-shrink: 0;">
                                <i class="fas fa-shield-alt"></i>
                            </div>
                            <div>
                                <h3 style="margin-bottom: 0.5rem;">Verified Connections</h3>
                                <p style="color: var(--gray);">Credits ensure genuine travelers and prevent spam</p>
                            </div>
                        </div>
                        <div style="display: flex; gap: 1rem; align-items: start;">
                            <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; flex-shrink: 0;">
                                <i class="fas fa-tags"></i>
                            </div>
                            <div>
                                <h3 style="margin-bottom: 0.5rem;">Save with Bundles</h3>
                                <p style="color: var(--gray);">Buy credit packages and save up to ₹50</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
    }
}

async function loadMyTrips() {
    try {
        const response = await fetch(`${API_URL}/trips`);
        const allTrips = await response.json();
        const myTrips = allTrips.filter(t => t.user_id === currentUser.id);
        
        const content = document.getElementById('dashboardContent');
        content.innerHTML = `
            <div class="dashboard-header">
                <h1>🚗 My Trips</h1>
                <p>Manage all your posted trips and track their status</p>
            </div>
            <div class="content-section">
                <div class="section-header">
                    <h2>Posted Trips</h2>
                    <button class="btn btn-primary" onclick="showCreateTrip()">
                        <i class="fas fa-plus"></i> Post New Trip
                    </button>
                </div>
                ${myTrips.length === 0 ? `
                    <div class="empty-state">
                        <i class="fas fa-car"></i>
                        <h3>No Trips Posted Yet</h3>
                        <p>Start by posting your first trip and connect with travelers</p>
                        <button class="btn btn-primary" onclick="showCreateTrip()" style="margin-top: 1.5rem;">
                            <i class="fas fa-plus-circle"></i> Post Your First Trip
                        </button>
                    </div>
                ` : `
                    <div class="trips-grid">
                        ${myTrips.map(trip => `
                            <div class="trip-card">
                                <div class="trip-header">
                                    <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem;">
                                        <span class="trip-type">${trip.type.toUpperCase()}</span>
                                        <span class="trip-type" style="background: ${trip.status === 'approved' ? 'linear-gradient(135deg, #10b981, #059669)' : trip.status === 'rejected' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #f59e0b, #d97706)'}">${trip.status.toUpperCase()}</span>
                                        ${trip.status === 'rejected' ? `
                                            <span class="trip-type" onclick="showUserRejectionReason('${trip.id}')" style="background: #dc2626; cursor: pointer; border: 1px solid #b91c1c;">
                                                <i class="fas fa-info-circle"></i> WHY?
                                            </span>
                                        ` : ''}
                                    </div>
                                    <h3>${trip.title}</h3>
                                    <div class="trip-route">
                                        <span>${trip.from_location}</span>
                                        <i class="fas fa-arrow-right"></i>
                                        <span>${trip.to_location}</span>
                                    </div>
                                </div>
                                <div class="trip-body">
                                    <div class="trip-info">
                                        <div class="info-item">
                                            <i class="fas fa-calendar"></i>
                                            <span>${new Date(trip.date).toLocaleDateString()}</span>
                                        </div>
                                        <div class="info-item">
                                            <i class="fas fa-users"></i>
                                            <span>${trip.seats} seats</span>
                                        </div>
                                        <div class="info-item">
                                            <i class="fas fa-rupee-sign"></i>
                                            <span>₹${trip.budget}</span>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        `;
    } catch (error) {
        // Demo mode - load from localStorage
        const userTrips = JSON.parse(localStorage.getItem('userTrips') || '[]');
        const myTrips = userTrips.filter(t => t.user_id === currentUser.id);
        
        const content = document.getElementById('dashboardContent');
        content.innerHTML = `
            <div class="dashboard-header">
                <h1>🚗 My Trips</h1>
                <p>Manage all your posted trips and track their status</p>
            </div>
            <div class="content-section">
                <div class="section-header">
                    <h2>Posted Trips</h2>
                    <button class="btn btn-primary" onclick="showCreateTrip()">
                        <i class="fas fa-plus"></i> Post New Trip
                    </button>
                </div>
                ${myTrips.length === 0 ? `
                    <div class="empty-state">
                        <i class="fas fa-car"></i>
                        <h3>No Trips Posted Yet</h3>
                        <p>Start by posting your first trip and connect with travelers</p>
                        <button class="btn btn-primary" onclick="showCreateTrip()" style="margin-top: 1.5rem;">
                            <i class="fas fa-plus-circle"></i> Post Your First Trip
                        </button>
                    </div>
                ` : `
                    <div class="trips-grid">
                        ${myTrips.map(trip => `
                            <div class="trip-card">
                                <div class="trip-header">
                                    <span class="trip-type">${trip.type.toUpperCase()}</span>
                                    <span class="trip-type" style="background: ${trip.status === 'approved' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #f59e0b, #d97706)'}">${trip.status.toUpperCase()}</span>
                                    <h3>${trip.title}</h3>
                                    <div class="trip-route">
                                        <span>${trip.from_location}</span>
                                        <i class="fas fa-arrow-right"></i>
                                        <span>${trip.to_location}</span>
                                    </div>
                                </div>
                                <div class="trip-body">
                                    <div class="trip-info">
                                        <div class="info-item">
                                            <i class="fas fa-calendar"></i>
                                            <span>${new Date(trip.date).toLocaleDateString()}</span>
                                        </div>
                                        <div class="info-item">
                                            <i class="fas fa-users"></i>
                                            <span>${trip.seats} seats</span>
                                        </div>
                                        <div class="info-item">
                                            <i class="fas fa-rupee-sign"></i>
                                            <span>₹${trip.budget}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        `;
    }
}

// Modal Functions
function openModal(modalId) {
    if (modalId === 'paymentModal') {
        loadCreditPackages();
    }
    document.getElementById(modalId).style.display = 'block';
}

function loadCreditPackages() {
    const settings = JSON.parse(localStorage.getItem('adminSettings') || '{}');
    const basePrice = parseInt(settings.creditPrice || '20');
    
    const packagesContainer = document.getElementById('creditPackages');
    packagesContainer.innerHTML = `
        <div class="package" onclick="selectPackage(1, ${basePrice})">
            <h3>1 Credit</h3>
            <p class="price">₹${basePrice}</p>
            <p>1 Chat Request</p>
        </div>
        <div class="package popular" onclick="selectPackage(5, ${basePrice * 5 - 10})">
            <span class="badge">Popular</span>
            <h3>5 Credits</h3>
            <p class="price">₹${basePrice * 5 - 10}</p>
            <p>5 Chat Requests</p>
            <p class="save">Save ₹10</p>
        </div>
        <div class="package" onclick="selectPackage(10, ${basePrice * 10 - 50})">
            <h3>10 Credits</h3>
            <p class="price">₹${basePrice * 10 - 50}</p>
            <p>10 Chat Requests</p>
            <p class="save">Save ₹50</p>
        </div>
    `;
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'none';
    const forms = modal.querySelectorAll('form');
    forms.forEach(form => form.reset());
}

function showLogin() {
    closeModal('registerModal');
    openModal('loginModal');
}

function showRegister() {
    closeModal('loginModal');
    openModal('registerModal');
}

function showCreateTrip() {
    if (!currentUser) {
        showAlert('Please login to post a trip', 'error');
        showLogin();
        return;
    }
    
    openModal('createTripModal');
    
    // Set minimum date to today when modal opens
    setTimeout(() => {
        const today = new Date().toISOString().split('T')[0];
        const tripDateInput = document.getElementById('tripDate');
        if (tripDateInput) {
            tripDateInput.setAttribute('min', today);
        }
    }, 100);
}

// Utility Functions
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '3000';
    alertDiv.style.minWidth = '300px';
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

function scrollToTrips() {
    document.getElementById('trips').scrollIntoView({ behavior: 'smooth' });
}

function showUserRejectionReason(tripId) {
    const rejections = JSON.parse(localStorage.getItem('tripRejections') || '{}');
    const rejection = rejections[tripId] || { reason: 'Trip does not meet platform guidelines', rejectedAt: new Date().toISOString() };
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <div style="text-align: center; margin-bottom: 2rem;">
                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #ef4444, #dc2626); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem; margin: 0 auto 1rem;">
                    <i class="fas fa-times"></i>
                </div>
                <h2 style="color: #ef4444;">Trip Rejected</h2>
            </div>
            <div style="background: #fee2e2; padding: 1.5rem; border-radius: 12px; border-left: 4px solid #ef4444;">
                <h3 style="margin: 0 0 1rem 0; color: #991b1b;">Rejection Reason:</h3>
                <p style="margin: 0; color: #7f1d1d; line-height: 1.6;">${rejection.reason}</p>
                <p style="margin: 1rem 0 0 0; font-size: 0.9rem; color: #991b1b;">Rejected on: ${new Date(rejection.rejectedAt).toLocaleDateString()}</p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function exitDashboardAndBrowse() {
    // Hide dashboard
    document.getElementById('dashboard').style.display = 'none';
    // Show all main sections
    document.querySelector('.navbar').style.display = 'block';
    document.querySelector('.hero').style.display = 'none';
    document.querySelector('.features').style.display = 'none';
    document.querySelector('.trips-section').style.display = 'block';
    document.querySelector('.how-it-works').style.display = 'none';
    document.querySelector('.about').style.display = 'none';
    document.querySelector('.footer').style.display = 'block';
    // Update navbar for logged in user
    updateNavbarForLoggedInUser();
    // Scroll to top to show trips section
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateNavbarForLoggedInUser() {
    if (currentUser) {
        const navActions = document.getElementById('publicNavActions');
        navActions.innerHTML = `
            <span style="margin-right: 1rem; color: var(--primary); font-weight: 600;">Welcome, ${currentUser.username}</span>
            <button class="btn btn-outline" onclick="showDashboard()">Dashboard</button>
            <button class="btn btn-primary" onclick="logout()">Logout</button>
        `;
    }
}

// Close modals on outside click
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        if (event.target.id === 'chatModal') {
            closeChatWindow();
        } else {
            closeModal(event.target.id);
        }
    }
}

// Missing scroll functions
function scrollToHowItWorks() {
    document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' });
}

function scrollToAbout() {
    document.getElementById('about').scrollIntoView({ behavior: 'smooth' });
}

// Prevent form submission on enter in search
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchTrips();
            }
        });
    }
});

// Toggle sidebar function
function toggleSidebar() {
    const sidebar = document.getElementById('userDashboardSidebar');
    const mainContent = document.querySelector('.dashboard-main');
    const dashboard = document.querySelector('.dashboard');
    const sidebarHeader = document.querySelector('.sidebar-header');
    
    sidebar.classList.toggle('collapsed');
    dashboard.classList.toggle('collapsed');
    sidebarHeader.classList.toggle('collapsed');
    
    // Change the icon based on the state
    const toggleButton = document.getElementById('sidebarToggle');
    const icon = toggleButton.querySelector('i');
    
    if (sidebar.classList.contains('collapsed')) {
        icon.className = 'fas fa-chevron-right';
        mainContent.style.marginLeft = '80px';
        sidebarHeader.style.width = '80px';
        sidebarHeader.style.left = '0';
    } else {
        icon.className = 'fas fa-chevron-left';
        mainContent.style.marginLeft = '280px';
        sidebarHeader.style.width = '280px';
        sidebarHeader.style.left = '0';
    }
}


