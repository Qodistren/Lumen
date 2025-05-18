// --- Supabase Initialization ---
const SUPABASE_URL = 'https://dabojjuotzpcnkqahezl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhYm9qanVvdHpwY25rcWFoZXpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxNzkxNzQsImV4cCI6MjA2MTc1NTE3NH0.0NxRfJg7xgKXrQ8J5W8B8wCX7KtfxBpYx9wC8qt6F_0';

let _supabase; // Declare _supabase in the outer scope

// Check if Supabase is loaded before creating client
if (typeof supabase === 'undefined') {
    console.error('Supabase library not loaded. Make sure the CDN link is correct in index.html.');
    alert('Error: Could not connect to backend services. Please refresh the page.');
} else {
    _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); // Assign the client instance
    console.log('Supabase Initialized:', _supabase); // Optional: Check console to confirm
}


document.addEventListener('DOMContentLoaded', () => {
    // Ensure Supabase client is available before accessing it
    if (typeof _supabase === 'undefined') {
        console.error('Supabase client not available on DOMContentLoaded.');
        alert('Critical Error: Cannot connect to services. Please refresh.');
        return; // Stop execution if Supabase isn't ready
    }

    // --- Element References ---
    // Auth Elements
    const authContainer = document.getElementById('auth-container');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginEmailInput = document.getElementById('login-email');
    const loginPasswordInput = document.getElementById('login-password');
    const registerEmailInput = document.getElementById('register-email');
    const registerPasswordInput = document.getElementById('register-password');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const authErrorElement = document.getElementById('auth-error');
    const registerUsernameInput = document.getElementById('register-username');

    // App Layout Elements
    const appLayout = document.getElementById('app-layout');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    const profileSection = document.getElementById('profile-section');
    const displayUsername = document.getElementById('display-username'); // In profile section now
    const logoutBtn = document.getElementById('logout-btn');
    const chatListSection = document.getElementById('chat-list-section');
    const chatList = document.getElementById('chat-list'); // UL element for chat links
    // const addFriendBtn = document.getElementById('add-friend-btn'); // Keep for later
    const chatHeader = document.getElementById('chat-header');
    const chatTitle = document.getElementById('chat-title');
    const chatBox = document.getElementById('chat-box');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const charCounter = document.getElementById('char-counter'); // New
    const addFriendUsernameInput = document.getElementById('add-friend-username');
    const sendFriendRequestBtn = document.getElementById('send-friend-request-btn');
    const friendRequestStatusElement = document.getElementById('friend-request-status');
    const pendingRequestsList = document.getElementById('pending-requests-list'); 
    const profileAvatarImg = document.getElementById('profile-avatar'); // The actual image
    const profileAvatarWrapper = profileAvatarImg ? profileAvatarImg.closest('.profile-avatar-wrapper') : null; // The new wrapper
    const sidebarProfileStatusDot = document.getElementById('sidebar-profile-status-dot'); // New
    const avatarUploadInput = document.getElementById('avatar-upload'); 
    // References for the new status button/popup UI
    const statusButton = document.getElementById('status-button');
    const statusPopup = document.getElementById('status-popup');
    const statusButtonDot = document.getElementById('status-button-dot');
    const statusButtonText = document.getElementById('status-button-text');

    // User Profile View Elements
    const userProfileViewContainer = document.getElementById('user-profile-view-container');
    const userProfileContent = document.getElementById('user-profile-content');
    const closeProfileViewBtn = document.getElementById('close-profile-view-btn');
    const profileViewAvatar = document.getElementById('profile-view-avatar');
    const profileViewUsername = document.getElementById('profile-view-username');
    const profileViewStatus = document.getElementById('profile-view-status'); 
    const profileViewStatusDotP = profileViewStatus ? profileViewStatus.querySelector('.status-dot') : null; 
    const fullProfileStatusDot = document.getElementById('full-profile-status-dot'); 
    const profileViewStatusText = document.getElementById('profile-view-status-text');
    const profileViewLastSeen = document.getElementById('profile-view-last-seen'); // New
    const profileViewDescriptionArea = document.getElementById('profile-view-description-area');
    const profileViewDescriptionText = document.getElementById('profile-view-description-text');
    const profileEditDescriptionInput = document.getElementById('profile-edit-description-input');
    const editDescriptionBtn = document.getElementById('edit-description-btn');
    const saveDescriptionBtn = document.getElementById('save-description-btn');
    // Removed references to old status elements (statusIcon, profileStatusText, statusSelect)


    // --- Debugging: Check Element References ---
    console.log('Element Check: logoutBtn', logoutBtn);
    console.log('Element Check: sendBtn', sendBtn);
    console.log('Element Check: messageInput', messageInput);
    // --- End Debugging ---

    // --- State ---
    let currentUser = null; // Store user session info
    let currentUsername = ''; // Store user profile username
    let messageSubscription = null; // Store the message subscription channel
    let friendshipSubscription = null; // Store the friendship subscription channel
    let currentChatId = null; // Will be set after login
    let currentUserProfile = null; // Store fetched profile details for current user
    const profileCache = {}; // Cache for other users' profiles

    // --- Profile Fetching Helper (Fetches full profile, caches by ID and username) ---
    async function getSenderProfile(identifier, isId = false) {
        const cacheKey = isId ? `id_${identifier}` : `user_${identifier}`;
        if (profileCache[cacheKey]) {
            return profileCache[cacheKey]; 
        }

        let query = _supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url, status, description, last_seen_at'); // Added last_seen_at

        if (isId) {
            query = query.eq('id', identifier);
        } else {
            query = query.eq('username', identifier);
        }

        try {
            const { data: profile, error } = await query.maybeSingle(); // Use maybeSingle

            if (error) {
                console.error(`Error fetching profile for ${cacheKey}:`, error);
                profileCache[cacheKey] = null; // Cache failure
                return null;
            }

            // If profile found, cache it by both ID and username for future lookups
            if (profile) {
                // console.log(`Fetched profile for ${cacheKey}:`, profile);
                profileCache[`id_${profile.id}`] = profile;
                profileCache[`user_${profile.username}`] = profile;
            } else {
                // console.log(`Profile not found for ${cacheKey}`);
                profileCache[cacheKey] = null; // Cache null if not found
            }
            return profile; // Return the profile object or null

        } catch (err) {
            console.error(`Unexpected error fetching profile for ${cacheKey}:`, err);
            profileCache[cacheKey] = null; // Cache failure on unexpected error
            return null;
        }
    }

    // --- Auth Form Switching ---
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        showRegisterForm();
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showLoginForm();
    });

    // --- UI Switching Functions ---
    function showAuthView() {
        authContainer.style.display = 'flex'; // Or 'block', depending on desired centering
        appLayout.style.display = 'none';
        clearAuthError();
    }

    function showAppLayout() {
        authContainer.style.display = 'none';
        appLayout.style.display = 'flex'; // Show the main app layout
        messageInput.focus(); // Focus message input when chat loads
        // Initial setup for the default chat
        populateChatList(); // Add chats to the sidebar
        // Set default chat view to self-chat after populating list
        const selfChatId = `self_${currentUser.id}`;
        setActiveChat(selfChatId, currentUsername); // Use username for self-chat title
    }

    // --- Auth Form Specific Switching ---
    function showLoginForm() {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        showAuthView(); // Ensure the auth container is visible
    }

    function showRegisterForm() {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        showAuthView(); // Ensure the auth container is visible
    }

    function showAuthError(message) {
        authErrorElement.textContent = message;
        authErrorElement.style.display = 'block';
    }

    function clearAuthError() {
        authErrorElement.textContent = '';
        authErrorElement.style.display = 'none';
    }

    // --- Friend Request Logic ---
    async function handleSendFriendRequest() {
        let targetUsername = addFriendUsernameInput.value.trim(); // Use let
        setFriendRequestStatus(''); // Clear previous status

        if (!targetUsername) {
            setFriendRequestStatus('Please enter a username.', 'error');
            return;
        }

        if (targetUsername === currentUsername) {
            setFriendRequestStatus("You can't add yourself as a friend.", 'error');
            return;
        }

        if (!currentUser) {
            setFriendRequestStatus('Error: Not logged in.', 'error'); // Should not happen
            return;
        }

        // Convert to lowercase for case-insensitive search
        targetUsername = targetUsername.toLowerCase();
        console.log(`Attempting friend request for: ${targetUsername} (lowercase)`);

        try {
            // 1. Find the target user's ID (searching with lowercase username)
            const { data: targetProfile, error: findError } = await _supabase
                .from('profiles')
                .select('id')
                .eq('username', targetUsername) // Search using the lowercase version
                .single(); // Expect only one user with that username

            if (findError || !targetProfile) {
                console.error('Error finding user or user not found:', findError);
                setFriendRequestStatus(`User "${targetUsername}" not found.`, 'error');
                return;
            }

            const user1Id = currentUser.id;
            const user2Id = targetProfile.id;

            // 2. Check if friendship already exists or is pending
            const { data: existingFriendship, error: checkError } = await _supabase
                .from('friendships')
                .select('status')
                .or(`and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`) // Check both directions
                .maybeSingle(); // It might not exist

            if (checkError) {
                console.error('Error checking existing friendship:', checkError);
                setFriendRequestStatus('Error checking friendship status.', 'error');
                return;
            }

            if (existingFriendship) {
                if (existingFriendship.status === 'accepted') {
                    setFriendRequestStatus(`You are already friends with ${targetUsername}.`, 'info');
                } else if (existingFriendship.status === 'pending') {
                    setFriendRequestStatus(`Friend request already pending with ${targetUsername}.`, 'info');
                } else {
                     setFriendRequestStatus(`Friendship status with ${targetUsername}: ${existingFriendship.status}.`, 'info');
                }
                return;
            }

            // 3. Insert the new friend request
            const { error: insertError } = await _supabase
                .from('friendships')
                .insert({
                    user1_id: user1Id,
                    user2_id: user2Id,
                    status: 'pending' // Default status
                });

            if (insertError) {
                console.error('Error sending friend request:', insertError);
                // Handle potential unique constraint violation if check failed somehow
                if (insertError.code === '23505') { // Postgres unique violation code
                     setFriendRequestStatus(`Friend request already exists or is pending.`, 'info');
                } else {
                     setFriendRequestStatus('Error sending friend request.', 'error');
                }
                return;
            }

            // Success
            setFriendRequestStatus(`Friend request sent to ${targetUsername}.`, 'success');
            addFriendUsernameInput.value = ''; // Clear input on success

        } catch (error) {
            console.error('Unexpected error sending friend request:', error);
            setFriendRequestStatus('An unexpected error occurred.', 'error');
        }
    }

    function setFriendRequestStatus(message, type = 'info') { // type can be 'info', 'success', 'error'
        friendRequestStatusElement.textContent = message;
        friendRequestStatusElement.className = 'status-message'; // Reset classes
        if (type === 'success') {
            friendRequestStatusElement.classList.add('success');
        } else if (type === 'error') {
            friendRequestStatusElement.classList.add('error');
        }
        // 'info' uses default styling
    }

    // --- Auth Event Listeners ---
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    sendFriendRequestBtn.addEventListener('click', handleSendFriendRequest); // Listener now added *after* function definition

    // --- Authentication Functions ---
    async function handleLogin(event) {
        event.preventDefault(); // Prevent default form submission
        clearAuthError();
        const email = loginEmailInput.value.trim();
        const password = loginPasswordInput.value.trim();
        console.log(`Attempting login for: ${email}`);

        try {
            const { data, error } = await _supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                console.error('Login error:', error);
                showAuthError(error.message);
                return;
            }

            console.log('Login successful:', data.user);
            currentUser = data.user;
            try {
                const { data: profile, error: profileError } = await _supabase
                    .from('profiles')
                    .select('username, display_name, avatar_url, status, description')
                    .eq('id', currentUser.id)
                    .single();

                if (profileError) {
                    console.error('Error fetching profile:', profileError);
                    currentUsername = currentUser.email.split('@')[0]; // Fallback
                    displayUsername.textContent = currentUsername;
                    if (profileAvatarImg) profileAvatarImg.src = 'placeholder-avatar.png';
                    updateProfileStatusUIDisplay('Offline'); 
                } else if (profile) {
                    currentUsername = profile.username; 
                    displayUsername.textContent = profile.display_name || profile.username;
                    if (profileAvatarImg) profileAvatarImg.src = profile.avatar_url || 'placeholder-avatar.png';
                    updateProfileStatusUIDisplay(profile.status); 
                    currentUserProfile = profile; 
                    console.log("Fetched profile:", profile);
                } else { // Profile not found but no Supabase error
                    currentUserProfile = null; 
                    console.warn('Profile not found for user, falling back to email part.');
                    currentUsername = currentUser.email.split('@')[0]; 
                    displayUsername.textContent = currentUsername;
                    if (profileAvatarImg) profileAvatarImg.src = 'placeholder-avatar.png';
                    updateProfileStatusUIDisplay('Offline'); 
                }
            } catch (error) { // This is the catch block for profile fetching
                currentUserProfile = null; 
                console.error('Unexpected error during profile processing after login:', error); // Clarified error source
                // Fallback UI updates even if profile fetch fails unexpectedly
                currentUsername = currentUser.email.split('@')[0]; 
                displayUsername.textContent = currentUsername;
                if (profileAvatarImg) profileAvatarImg.src = 'placeholder-avatar.png';
                updateProfileStatusUIDisplay('Offline'); 
                // Do not show generic "unexpected login error" here, let it proceed to showAppLayout
                // If this part is critical and should stop login, then re-throw or call showAuthError
            }
            showAppLayout(); 

        } catch (error) {
            console.error('Unexpected login error:', error);
            showAuthError('An unexpected error occurred during login.');
        }
    }

    async function handleRegister(event) {
        event.preventDefault();
        clearAuthError();
        const email = registerEmailInput.value.trim();
        let username = registerUsernameInput.value.trim(); // Use let to allow modification
        const password = registerPasswordInput.value.trim();

        // --- Username Validation ---
        const minUsernameLength = 3;
        const maxUsernameLength = 20;
        if (username.length < minUsernameLength || username.length > maxUsernameLength) {
            showAuthError(`Username must be between ${minUsernameLength} and ${maxUsernameLength} characters long.`);
            return;
        }
        // Basic validation for allowed characters (optional, example: alphanumeric + underscore)
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
             showAuthError('Username can only contain letters, numbers, and underscores (_).');
             return;
        }
        // Convert to lowercase for case-insensitivity
        username = username.toLowerCase();
        console.log(`Attempting registration for: ${email} with username: ${username} (lowercase)`);
        // --- End Username Validation ---


        // Basic password validation (optional but recommended)
        if (password.length < 6) {
            showAuthError('Password must be at least 6 characters long.');
            return;
        }

        try {
            const { data, error } = await _supabase.auth.signUp({
                email: email,
                password: password,
                // Options can be added here later, e.g., for email confirmation
            });

            if (error) {
                console.error('Registration error:', error);
                showAuthError(error.message);
                return;
            }

            // By default, Supabase might require email confirmation.
            // For simplicity now, we'll assume it's off or handle it as logged in.
            // In a real app, you'd likely inform the user to check their email.
            console.log('Registration successful (check email if confirmation is enabled):', data.user);

            // You might want to automatically log the user in or show a confirmation message.
            // Let's automatically log them in for now.
            if (data.user) {
                currentUser = data.user;
                try {
                    // Create user profile in the profiles table
                    const { data: profileData, error: profileError } = await _supabase
                        .from('profiles')
                        .insert([
                            { id: currentUser.id, username: username }
                        ]);

                    if (profileError) {
                        console.error('Error creating profile:', profileError);
                        currentUsername = username;
                    } else {
                        console.log('Profile created successfully:', profileData);
                        currentUsername = username;
                    }
                    // Removed potentially buggy/unnecessary check for usernameError and profile fetching here,
                    // as currentUsername is already set from the input or profile creation result.
                } catch (error) {
                    // If profile creation fails, we should still inform the user about email verification.
                    console.error('Unexpected error during profile creation/setting username:', error);
                    // Don't transition to chat here if profile fails, just show verification message below.
                }
                // Do not automatically log in or show chat here.
                // Instead, inform the user to check their email for verification.
                // displayUsername.textContent = currentUsername; // No need to display yet
                // showChat(); // Don't transition to chat view yet
                showLoginForm(); // Go back to the login form
                // Display a persistent message indicating verification is needed
                // Use the auth error element for better UI consistency than alert()
                showAuthError('Registration successful! Please check your email for a verification link to activate your account.');
                // showLoginForm(); // Already called above

            } else if (data.session === null && data.user) {
                 // Handle case where user exists but session is null (likely needs confirmation)
                 showAuthError('Registration successful! Please check your email for a verification link.');
                 showLoginForm(); // Go back to login form
            } else {
                 // Handle other unexpected cases from signUp response
                 console.warn("Registration response indicates user might already exist or another issue:", data);
                 showAuthError('Registration might require email confirmation or user already exists.');
                 showLoginForm(); // Go back to login form
            }


        } catch (error) {
            console.error('Unexpected registration error:', error);
            showAuthError('An unexpected error occurred during registration.');
        }
    }


    // --- Profile Status UI Update Function (Consolidated) ---
    function updateProfileStatusUIDisplay(statusString) {
        if (!statusButton || !statusButtonDot || !statusButtonText || !sidebarProfileStatusDot) {
            console.warn('Status button UI elements or sidebar status dot not found, cannot update display.');
            return;
        }

        const S_OFFLINE = 'Offline'; // Default status
        let displayStatus = statusString || S_OFFLINE;
        let iconClassSuffix = 'offline'; // Default icon class suffix

        // Map status string to CSS class suffix for the dot
        // Ensure these cases match the data-status values in index.html and CSS classes
        switch (displayStatus) {
            case 'Online':
                iconClassSuffix = 'available'; // CSS class uses 'available'
                break;
            case 'Busy':
                iconClassSuffix = 'busy';
                break;
            case 'Be Right Back':
                iconClassSuffix = 'brb';
                break;
            case 'Do Not Disturb':
                iconClassSuffix = 'dnd';
                break;
            case 'Offline':
            default: // Handles null, undefined, or explicit 'Offline'
                displayStatus = S_OFFLINE; // Ensure it's explicitly 'Offline' for text
                iconClassSuffix = 'offline';
                break;
        }

        statusButtonText.textContent = displayStatus;
        statusButtonDot.className = `status-dot ${iconClassSuffix}`; 
        sidebarProfileStatusDot.className = `status-dot ${iconClassSuffix}`; // Update sidebar PFP status dot

        console.log(`Status button UI updated: Text="${displayStatus}", IconClass="status-dot ${iconClassSuffix}"`);
    }

    // --- Profile Status Update (Supabase) ---
    async function updateUserStatus(newStatus) {
        if (!currentUser || !currentUser.id) {
            console.error('Cannot update status: User not logged in.');
            alert('Error: You must be logged in to change your status.');
            return; // Don't proceed
        }

        const oldStatusToRevertTo = statusButtonText.textContent || 'Offline'; // Get current status from button text
        console.log(`Attempting to update status to: ${newStatus} for user: ${currentUser.id}. Old status was: ${oldStatusToRevertTo}`);

        // Optimistically update UI first for responsiveness
        updateProfileStatusUIDisplay(newStatus);

        try {
            let updatePayload = { status: newStatus, updated_at: new Date().toISOString() };
            if (newStatus === 'Offline') {
                updatePayload.last_seen_at = new Date().toISOString();
            }

            const { data, error } = await _supabase
                .from('profiles')
                .update(updatePayload)
                .eq('id', currentUser.id)
                .select('status, last_seen_at') // Select status and last_seen_at
                .single();

            if (error) {
                console.error('Error updating status in Supabase:', error);
                alert(`Failed to update status: ${error.message}. Please try again.`);
                updateProfileStatusUIDisplay(oldStatusToRevertTo); // Revert UI to the status before attempt
                return;
            }

            if (data && data.status) {
                console.log('Status updated successfully in Supabase. Confirmed new status:', data.status);
                // UI should already be updated, but confirm with data from DB if different (should not be)
                if (data.status !== newStatus) {
                    console.warn(`DB status ${data.status} differs from optimistic update ${newStatus}. Correcting UI.`);
                    updateProfileStatusUIDisplay(data.status);
                }
            } else {
                 // Handle cases where update might succeed but select returns null/no error (e.g., RLS)
                 console.warn('Status update presumed successful (no specific status returned, but no error). UI remains as optimistically set.');
            }

        } catch (err) {
            console.error('Unexpected error during status update:', err);
            alert('An unexpected error occurred while updating your status. Please try again.');
            updateProfileStatusUIDisplay(oldStatusToRevertTo); // Revert UI on unexpected error
        }
    }


    // --- Message Handling (Will need adjustments based on auth user) ---
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); 
            sendMessage();
        }
    });

    // Character counter for message input
    if (messageInput && charCounter) {
        const maxLength = messageInput.getAttribute('maxlength');
        charCounter.textContent = `0/${maxLength}`; // Initialize
        messageInput.addEventListener('input', () => {
            const currentLength = messageInput.value.length;
            charCounter.textContent = `${currentLength}/${maxLength}`;
            if (currentLength > maxLength) {
                charCounter.style.color = 'var(--error-color)'; // Turn red if over limit
            } else {
                charCounter.style.color = '#777'; // Default color
            }
        });
    }


    async function sendMessage() { 
        console.log('sendMessage called.'); 
        const messageText = messageInput.value.trim();
        console.log(`sendMessage: messageText = "${messageText}"`); // Debug log
        console.log(`sendMessage: currentUsername = "${currentUsername}"`); // Debug log
        console.log(`sendMessage: currentChatId = "${currentChatId}"`); // Debug log
        // Ensure currentChatId is also checked
        if (messageText && currentUsername && currentChatId) {
            // Clear the input field immediately for better UX
            messageInput.value = '';
            console.log('sendMessage: Input cleared.'); // Debug log

            try {
                console.log('sendMessage: Attempting Supabase insert...'); // Debug log
                // Insert the message into the Supabase 'messages' table
                const { data, error } = await _supabase
                    .from('messages')
                    .insert([
                        // Include chat_id and sender_id when sending
                        { username: currentUsername, content: messageText, chat_id: currentChatId, sender_id: currentUser.id }
                    ]);
                console.log('sendMessage: Supabase insert completed.'); // Debug log

                if (error) {
                    console.error('Error sending message:', error);
                    alert(`Error sending message: ${error.message}`);
                    // Optional: Re-populate input if sending failed
                    // messageInput.value = messageText;
                } else {
                    // Message sent successfully
                    console.log('Message sent successfully to Supabase.');

                    // --- Workaround: Display the sent message locally immediately ---
                    // Create a message object similar to what the subscription/fetch would provide
                    const locallyDisplayedMessage = {
                        username: currentUsername,
                        content: messageText,
                        created_at: new Date().toISOString(), // Use current time
                        chat_id: currentChatId, // Include chat_id
                        sender_id: currentUser.id // Include sender_id
                    };
                    console.log('Displaying sent message locally (workaround):', locallyDisplayedMessage);
                    displayMessage(locallyDisplayedMessage); // Pass the object with sender_id
                    // --- End Workaround ---

                }
            } catch (error) {
                console.error('Unexpected error sending message:', error);
                alert('An unexpected error occurred while sending the message.');
                // messageInput.value = messageText;
            }

            // Real-time subscription might handle displaying new messages if RLS is fixed.
            // The local display workaround ensures the sender sees it immediately regardless.
        } else {
             console.warn('sendMessage: Aborted. Conditions not met.', { messageText, currentUsername, currentChatId }); // Debug log
        }
    }

    // Function to display a single message object from Supabase
    async function displayMessage(message) { 

        const isMyMessage = message.username === currentUsername;
        let senderProfileDetails = null;

        if (isMyMessage) {
            senderProfileDetails = currentUserProfile; // Use current user's cached profile
        } else {
            // Try fetching profile using sender_id if available, otherwise fallback to username
            if (message.sender_id) {
                 senderProfileDetails = await getSenderProfile(message.sender_id, true); // Fetch by ID
            } else {
                 // Fallback if sender_id is missing (less ideal)
                 senderProfileDetails = await getSenderProfile(message.username); 
                 console.warn(`Message from ${message.username} is missing sender_id. Profile click might not work.`);
            }
        }

        const avatarUrl = senderProfileDetails?.avatar_url || 'placeholder-avatar.png';
        const senderStatus = senderProfileDetails?.status || 'offline';
        
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.classList.add(isMyMessage ? 'my-message' : 'other-message');
        if (senderProfileDetails && senderProfileDetails.id) {
            messageElement.dataset.senderId = senderProfileDetails.id; // Add sender ID to message element
        }

         // --- Create Avatar Element (for all messages) ---
        const avatarContainer = document.createElement('div');
        avatarContainer.classList.add('message-avatar-container');
        
        const avatarElement = document.createElement('img');
        avatarElement.src = avatarUrl;
        avatarElement.alt = `${message.username}'s avatar`;
        avatarElement.classList.add('message-avatar');

        const statusDotElement = document.createElement('span');
        statusDotElement.classList.add('status-dot', 'message-avatar-status-dot');
        // Map status string to CSS class suffix for the dot
        let statusClassSuffix = 'offline';
        switch (senderStatus.toLowerCase()) {
            case 'online': statusClassSuffix = 'available'; break;
            case 'busy': statusClassSuffix = 'busy'; break;
            case 'be right back': statusClassSuffix = 'brb'; break;
            case 'do not disturb': statusClassSuffix = 'dnd'; break;
        }
        statusDotElement.classList.add(statusClassSuffix);
        
        avatarContainer.appendChild(avatarElement);
        avatarContainer.appendChild(statusDotElement);
            
        // Make avatar clickable to view profile
        if (senderProfileDetails && senderProfileDetails.id) { 
            avatarContainer.style.cursor = 'pointer';
            avatarContainer.title = `View ${message.username}'s profile`;
            avatarContainer.addEventListener('click', () => showUserProfileView(senderProfileDetails.id));
        } else if (!isMyMessage) { // Only warn if it's not the current user and details are missing
             console.warn(`Could not attach profile click listener for ${message.username}, sender ID missing or profile fetch failed.`);
        }


        // --- Create Content Container ---
        const contentContainer = document.createElement('div');
        contentContainer.classList.add('message-content-container');

        // Format timestamp
        let timestamp = 'N/A';
        if (message.created_at) {
            try {
                timestamp = new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } catch (e) {
                console.error("Error parsing timestamp:", message.created_at, e);
            }
        }

        // Use the username from the message object
        let username = message.username || 'Unknown';

        // Create meta and text elements
        const metaSpan = document.createElement('span');
        metaSpan.classList.add('message-meta');
        metaSpan.textContent = `${username} - ${timestamp}`;

        const textSpan = document.createElement('span');
        textSpan.classList.add('text');
        textSpan.textContent = message.content || ''; 

    // Append to content container
    contentContainer.appendChild(metaSpan);
    contentContainer.appendChild(textSpan);

    // --- Add Reaction Button (Shows on hover) ---
    // Note: Styling needed in CSS to hide/show on hover
    const reactionButton = document.createElement('button');
    reactionButton.classList.add('add-reaction-btn');
    reactionButton.innerHTML = '&#x1F642;'; // Simple smiley face emoji
    reactionButton.title = 'Add reaction';
    if (message.id) { // Ensure message has an ID
        reactionButton.dataset.messageId = message.id;
        reactionButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent message click events if any
            handleReactionClick(message.id, reactionButton); // Pass the button element
        });
        // Append button to the main message element so it can be positioned absolutely/relatively
        messageElement.appendChild(reactionButton); 
    } else {
        console.warn("Message missing ID, cannot add reaction button:", message);
    }

    // --- Create Reactions Container ---
    const reactionsContainer = document.createElement('div');
    reactionsContainer.classList.add('message-reactions');
    reactionsContainer.dataset.messageId = message.id; // Store message ID for easy lookup
    // TODO: Populate this container with actual reactions later
    contentContainer.appendChild(reactionsContainer); // Append below text

    // Append avatar and content to message element
    // For 'other-message', avatar is first. For 'my-message', content is first.
    if (isMyMessage) {
        messageElement.appendChild(contentContainer);
        messageElement.appendChild(avatarContainer); // Own avatar on the right
    } else {
        messageElement.appendChild(avatarContainer); // Other's avatar on the left
        messageElement.appendChild(contentContainer);
    }

    // Add to chat box
    chatBox.appendChild(messageElement);

        // Scroll logic
        const isScrolledToBottom = chatBox.scrollHeight - chatBox.clientHeight <= chatBox.scrollTop + 1; 
        if (isScrolledToBottom) {
             chatBox.scrollTop = chatBox.scrollHeight;
        }
    }

    // --- Example of receiving a message (for demonstration) ---
    // In a real app, this would be triggered by server events
    // setTimeout(() => {
    //     displayMessage('ChatBot', 'Welcome to the chat!', false);
    // }, 1500);

    // --- Fetch initial messages ---
    async function fetchMessages() {
        // Fetch messages only for the current chat
        console.log(`Fetching messages for chat_id: ${currentChatId}`);
        try {
            const { data: messages, error } = await _supabase
                .from('messages')
                .select('*')
                .eq('chat_id', currentChatId) // Filter by current chat ID
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching messages:', error);
                alert(`Error fetching messages: ${error.message}`);
                return;
            }

            // Clear existing messages in chat box before loading new ones
            chatBox.innerHTML = '';

            console.log('Fetched messages:', messages); // Log fetched messages

            // Display each fetched message
            messages.forEach(message => {
                console.log('Displaying fetched message:', message); // Log each message being displayed
                displayMessage(message);
            });

        } catch (error) {
            console.error('Unexpected error fetching messages:', error);
            alert('An unexpected error occurred while fetching messages.');
        }
    }

    // --- Chat List Population ---
    async function populateChatList() { // Make async
        chatList.innerHTML = ''; // Clear existing list items

        if (!currentUser) return;

        // 1. Add Self-Chat
        const selfChatId = `self_${currentUser.id}`;
        // Use display name from UI for consistency, or fallback to currentUsername
        const selfChatName = displayUsername.textContent || currentUsername;
        addChatItem(selfChatId, selfChatName); 

        // 2. Fetch Accepted Friends
        try {
            const { data: friends, error } = await _supabase
                .from('friendships')
                .select(`
                    user1_id,
                    user2_id,
                    user1:profiles!friendships_user1_id_fkey ( username ),
                    user2:profiles!friendships_user2_id_fkey ( username )
                `)
                .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`) // Current user is user1 OR user2
                .eq('status', 'accepted'); // Only accepted friends

            if (error) {
                console.error('Error fetching friends:', error);
                return; // Don't proceed if fetching friends fails
            }

            console.log("Fetched friends:", friends);

            // 3. Add Friend DMs to List
            friends.forEach(friendship => {
                let friendId = null;
                let friendUsername = null;

                // Determine the friend's ID and username (the one who ISN'T the current user)
                if (friendship.user1_id === currentUser.id) {
                    friendId = friendship.user2_id;
                    friendUsername = friendship.user2?.username; // Use optional chaining
                } else {
                    friendId = friendship.user1_id;
                    friendUsername = friendship.user1?.username; // Use optional chaining
                }

                if (friendId && friendUsername) {
                    // Create a unique chat ID for the DM
                    // Sort IDs consistently to ensure both users get the same DM ID
                    const dmChatId = `dm_${[currentUser.id, friendId].sort().join('_')}`;
                    addChatItem(dmChatId, friendUsername); // REMOVED @ prefix
                } else {
                    console.warn("Could not determine friend details for friendship:", friendship);
                }
            });

        } catch (error) {
            console.error('Unexpected error populating chat list with friends:', error);
        }
    }

    // Helper function to add an item to the chat list UI
    function addChatItem(chatId, chatName) {
        // Check if an item with this chat ID already exists to prevent duplicates
        if (document.querySelector(`#chat-list li a[data-chat-id="${chatId}"]`)) {
            // console.log(`Chat item for ${chatId} (${chatName}) already exists. Skipping.`);
            return; 
        }

        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = chatName;
        link.dataset.chatId = chatId; // Store chat ID on the link
        // Check if this is the currently active chat
        if (chatId === currentChatId) {
            link.classList.add('active');
        }
        listItem.appendChild(link);
        chatList.appendChild(listItem);
    }


    // --- Chat Switching Logic ---
    function setActiveChat(chatId, chatTitleText) {
        currentChatId = chatId;
        chatTitle.textContent = chatTitleText;
        messageInput.placeholder = `Type your message in ${chatTitleText}...`;

        // Update active class in chat list (basic implementation)
        document.querySelectorAll('#chat-list li a').forEach(link => {
            if (link.dataset.chatId === chatId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Fetch messages for the new chat
        fetchMessages(); // Will use the updated currentChatId
        // Re-subscribe to the new chat's messages
        subscribeToMessages(); // Will use the updated currentChatId
    }

    // Add event listener for chat list clicks (delegated) - Already Correct
    chatList.addEventListener('click', (e) => {
        if (e.target.tagName === 'A' && e.target.closest('li')) {
            e.preventDefault();
            const chatId = e.target.dataset.chatId; // Get chat ID from data attribute
            const chatName = e.target.textContent;
            if (chatId && chatId !== currentChatId) {
                setActiveChat(chatId, chatName);
            }
        }
    });


    // --- Subscribe to real-time message updates ---
    function subscribeToMessages() {
        // For now, assumes a single public 'messages' table and channel.
        // Needs modification if using different tables/channels/filters per chat.
        // For now, we listen to all inserts on the 'messages' table and filter client-side,
        // OR rely on RLS + server-side filtering if RLS is properly set up.
        const channelName = `public:messages`; // Listen to the main table channel

        // Ensure existing subscription is removed before creating a new one
        if (messageSubscription) {
            _supabase.removeChannel(messageSubscription);
            messageSubscription = null;
            console.log('Removed existing message subscription.');
        }

        console.log(`Attempting to subscribe to channel: ${channelName}...`);
        messageSubscription = _supabase
            .channel(channelName) // Subscribe to the main messages table channel
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    // Server-side filtering (Requires RLS to be effective for security)
                    // If RLS is not set correctly, this filter might not work as expected,
                    // and the client might receive messages it shouldn't.
                    // The client-side check below provides an additional layer.
                    filter: `chat_id=eq.${currentChatId}`
                },
                async (payload) => { // Made this callback async
                    console.log('Real-time: New message payload received (raw):', payload);
                    if (payload.new) {
                        // Client-side check: Ensure the message belongs to the currently active chat
                        if (payload.new.chat_id === currentChatId) {
                            console.log(`Real-time: Message matches current chat (${currentChatId}). Calling displayMessage for:`, payload.new);
                            
                            const isOwnMessageJustSent = payload.new.username === currentUsername && 
                                                         (Date.now() - new Date(payload.new.created_at).getTime()) < 2000; 

                            if (!isOwnMessageJustSent) {
                                await displayMessage(payload.new); 
                                if (payload.new.id) {
                                    await fetchAndDisplayReactionsForMessage(payload.new.id); 
                                }
                            } else {
                                console.log("Real-time: Skipping display of own message likely already shown by workaround or just sent.");
                                if (payload.new.id) {
                                     await fetchAndDisplayReactionsForMessage(payload.new.id);
                                }
                            }
                        } else {
                            console.log(`Real-time: Received message for different chat (${payload.new.chat_id}), ignoring.`);
                        }
                    } else {
                        console.warn('Real-time: Received insert event with no payload.new data.');
                    }
                }
            )
            .subscribe((status, err) => { // Handle subscription status/errors
                 if (status === 'SUBSCRIBED') {
                    console.log('Real-time message subscription active!');
                }
                if (status === 'CHANNEL_ERROR') {
                    console.error('Real-time subscription error:', err);
                    alert('Error connecting to real-time chat updates. Please refresh.');
                }
                 if (status === 'TIMED_OUT') {
                    console.warn('Real-time subscription timed out. Attempting to reconnect...');
                    // Supabase client often handles reconnection automatically, but you could add manual logic here if needed.
                }
            });

        console.log('Message subscription setup:', messageSubscription);
    }

    // --- Subscribe to real-time friendship updates ---
    function subscribeToFriendships() {
        if (!currentUser) return;

        const channelName = `public:friendships:userId=eq.${currentUser.id}`; // Unique channel name per user

        // Ensure existing subscription is removed
        if (friendshipSubscription) {
            _supabase.removeChannel(friendshipSubscription);
            friendshipSubscription = null;
            console.log('Removed existing friendship subscription.');
        }

        console.log(`Attempting to subscribe to friendship channel: ${channelName}...`);
        friendshipSubscription = _supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen for INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'friendships',
                    // Filter where the current user is either sender or receiver
                    filter: `or(user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id})`
                },
                (payload) => {
                    console.log('Real-time: Friendship change payload received:', payload);

                    // Determine if we need to refresh pending requests or the main chat list
                    let refreshPending = false;
                    let refreshChats = false;

                    if (payload.eventType === 'INSERT') {
                        // New request potentially arrived for the current user
                        if (payload.new.user2_id === currentUser.id && payload.new.status === 'pending') {
                            console.log("Real-time: New pending request received.");
                            refreshPending = true;
                        }
                        // If a friendship is immediately accepted on insert (less common)
                        else if (payload.new.status === 'accepted' && (payload.new.user1_id === currentUser.id || payload.new.user2_id === currentUser.id)) {
                             console.log("Real-time: Friendship accepted on insert.");
                             refreshChats = true;
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        const oldStatus = payload.old?.status;
                        const newStatus = payload.new?.status;
                        // Request accepted involving current user? Refresh chat list.
                        if (newStatus === 'accepted' && oldStatus !== 'accepted') {
                             console.log("Real-time: Friendship accepted on update.");
                             refreshChats = true;
                             // Also refresh pending list in case it was there
                             refreshPending = true;
                        }
                        // Request involving current user changed status (e.g., rejected)? Refresh pending list.
                        else if (oldStatus === 'pending' && (newStatus === 'rejected' || newStatus === 'blocked')) {
                             console.log("Real-time: Pending request status updated.");
                             refreshPending = true;
                        }
                    } else if (payload.eventType === 'DELETE') {
                        // If a friendship is deleted (e.g., unfriend), refresh both lists
                         console.log("Real-time: Friendship deleted.");
                         // Check if the deleted friendship was 'accepted' to refresh chat list
                         if (payload.old?.status === 'accepted') {
                            refreshChats = true;
                         }
                         // Always refresh pending list in case it was a pending one deleted
                         refreshPending = true;
                    }

                    // Perform refreshes if needed
                    if (refreshPending) {
                        fetchPendingFriendRequests();
                    }
                    if (refreshChats) {
                        populateChatList();
                    }
                }
            )
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Real-time friendship subscription active!');
                }
                if (status === 'CHANNEL_ERROR') {
                    console.error('Real-time friendship subscription error:', err);
                    // Maybe alert user or attempt reconnect
                }
                 if (status === 'TIMED_OUT') {
                    console.warn('Real-time friendship subscription timed out.');
                }
            });

        console.log('Friendship subscription setup:', friendshipSubscription);
    }


    // --- Initialization and Session Check ---
    async function initializeApp() {
        // Check for existing user session
        const { data: { session }, error } = await _supabase.auth.getSession();

        if (error) {
            console.error("Error getting session:", error);
            showAuthError("Error checking login status. Please refresh.");
            showLoginForm(); // Show login form by default on error
            return;
        }

        if (session) {
            console.log("User session found:", session);
            // Add check for email confirmation before proceeding
            if (!session.user.email_confirmed_at && session.user.email) {
                 console.warn("User logged in but email not confirmed:", session.user.email);
                 // Optionally log the user out or show a message
                 // await _supabase.auth.signOut(); // Example: Force logout if email not confirmed
                 showAuthError(`Please confirm your email (${session.user.email}) via the link sent to you.`);
                 showLoginForm(); // Stay on login/auth screen
                 return; // Stop further initialization
            }

            console.log("User logged in and email confirmed (or no email):", session.user);
            currentUser = session.user;
            // Fetch user profile data on initial load
            try {
                const { data: profile, error: profileError } = await _supabase
                    .from('profiles')
                    .select('username, display_name, avatar_url, status, description')
                    .eq('id', currentUser.id)
                    .single();

                if (profileError) {
                    console.error('Error fetching profile on init:', profileError);
                    currentUsername = currentUser.email.split('@')[0]; 
                    displayUsername.textContent = currentUsername;
                    if (profileAvatarImg) profileAvatarImg.src = 'placeholder-avatar.png';
                    updateProfileStatusUIDisplay('Offline'); 
                } else if (profile) {
                    currentUsername = profile.username; 
                    displayUsername.textContent = profile.display_name || profile.username;
                    if (profileAvatarImg) profileAvatarImg.src = profile.avatar_url || 'placeholder-avatar.png';
                    updateProfileStatusUIDisplay(profile.status); 
                    currentUserProfile = profile; 
                    console.log("Fetched profile on init:", profile);
                } else {
                    currentUserProfile = null; 
                    console.warn('Profile not found for user on init, falling back to email part.');
                    currentUsername = currentUser.email.split('@')[0]; 
                    displayUsername.textContent = currentUsername;
                    if (profileAvatarImg) profileAvatarImg.src = 'placeholder-avatar.png';
                    updateProfileStatusUIDisplay('Offline'); 
                }
            } catch (error) {
                currentUserProfile = null; 
                console.error('Unexpected error during profile processing on init:', error); // Clarified
                currentUsername = currentUser.email.split('@')[0]; 
                displayUsername.textContent = currentUsername;
                if (profileAvatarImg) profileAvatarImg.src = 'placeholder-avatar.png';
                updateProfileStatusUIDisplay('Offline'); 
            }
            showAppLayout(); 
            subscribeToFriendships(); // Start friendship subscription after login
        } else {
            console.log("No active session found.");
            showAuthView(); // Show login/register view
        }
    }

    // --- Logout ---
    logoutBtn.addEventListener('click', async () => {
        console.log('Logout button clicked.'); // Existing log
        console.log('Current User before logout:', currentUser); // Debug log
        console.log('Attempting Supabase sign out...'); // Existing log
        const { error } = await _supabase.auth.signOut();
        if (error) {
            console.error('Supabase signOut error:', error); // Enhanced log
            console.error('Error logging out:', error);
            alert('Error logging out. Check console for details.'); // Modified alert
        } else {
            console.log('Supabase signOut successful.'); // Enhanced log
            currentUser = null;
            currentUsername = '';
            console.log('User state cleared.'); // Added log
            // Clean up UI state
            chatBox.innerHTML = '';
            if (messageSubscription) {
                _supabase.removeChannel(messageSubscription);
                messageSubscription = null;
            }
            // Also remove friendship subscription on logout
            if (friendshipSubscription) {
                _supabase.removeChannel(friendshipSubscription);
                friendshipSubscription = null;
                console.log('Removed friendship subscription on logout.');
            }
            showAuthView(); // Go back to auth view
            console.log('Switched back to auth view.'); // Added log
        }
    });


    // --- Pending Friend Request Handling ---

    async function fetchPendingFriendRequests() {
        if (!currentUser) return;

        try {
            // Fetch requests where the current user is user2 and status is pending
            // Also fetch the username of the sender (user1) using a join
            const { data: requests, error } = await _supabase
                .from('friendships')
                .select(`
                    id,
                    created_at,
                    user1_id,
                    profiles:user1_id ( username )
                `)
                .eq('user2_id', currentUser.id)
                .eq('status', 'pending');

            if (error) {
                console.error('Error fetching pending friend requests:', error);
                // Optionally display an error in the UI
                return;
            }

            console.log("Fetched pending requests:", requests);
            displayPendingRequests(requests);

        } catch (error) {
            console.error('Unexpected error fetching pending requests:', error);
        }
    }

    function displayPendingRequests(requests) {
        pendingRequestsList.innerHTML = ''; // Clear current list

        if (!requests || requests.length === 0) {
            const noRequestsItem = document.createElement('li');
            noRequestsItem.textContent = 'No pending requests.';
            noRequestsItem.style.fontStyle = 'italic';
            noRequestsItem.style.color = 'var(--secondary-color)';
            pendingRequestsList.appendChild(noRequestsItem);
            return;
        }

        requests.forEach(request => {
            const listItem = document.createElement('li');
            const senderUsername = request.profiles?.username || 'Unknown User'; // Use optional chaining

            listItem.innerHTML = `
                <span>${senderUsername}</span>
                <div>
                    <button class="accept-btn" data-request-id="${request.id}">Accept</button>
                    <button class="reject-btn" data-request-id="${request.id}">Reject</button>
                </div>
            `;
            pendingRequestsList.appendChild(listItem);
        });
    }

    async function handleFriendRequestResponse(requestId, action) {
        if (!requestId || !action) return;

        const newStatus = action === 'accept' ? 'accepted' : 'rejected'; // Or handle deletion for reject

        try {
            const { error } = await _supabase
                .from('friendships')
                .update({ status: newStatus })
                .eq('id', requestId)
                .eq('user2_id', currentUser.id); // Ensure only the recipient can update

            if (error) {
                console.error(`Error ${action}ing friend request:`, error);
                alert(`Failed to ${action} request. Please try again.`);
                return;
            }

            console.log(`Friend request ${requestId} ${newStatus}.`);
            // Refresh the list after action
            fetchPendingFriendRequests();

            // TODO: If accepted, potentially update the main chat list as well
            // to add the new friend/DM channel.

        } catch (error) {
            console.error(`Unexpected error ${action}ing friend request:`, error);
            alert(`An unexpected error occurred while ${action}ing the request.`);
        }
    }

    // Event listener for accept/reject buttons (delegated)
    pendingRequestsList.addEventListener('click', (e) => {
        const target = e.target;
        const requestId = target.dataset.requestId;

        if (target.classList.contains('accept-btn') && requestId) {
            handleFriendRequestResponse(requestId, 'accept');
        } else if (target.classList.contains('reject-btn') && requestId) {
            handleFriendRequestResponse(requestId, 'reject');
        }
    });

    // Also refresh chat list when a request is accepted
    async function handleFriendRequestResponse(requestId, action) {
        if (!requestId || !action) return;

        const newStatus = action === 'accept' ? 'accepted' : 'rejected';

        try {
            const { error } = await _supabase
                .from('friendships')
                .update({ status: newStatus })
                .eq('id', requestId)
                .eq('user2_id', currentUser.id);

            if (error) {
                console.error(`Error ${action}ing friend request:`, error);
                alert(`Failed to ${action} request. Please try again.`);
                return;
            }

            console.log(`Friend request ${requestId} ${newStatus}.`);
            // Refresh the pending list
            fetchPendingFriendRequests();

            // If accepted, refresh the main chat list to show the new friend
            if (newStatus === 'accepted') {
                populateChatList();
            }

        } catch (error) {
            console.error(`Unexpected error ${action}ing friend request:`, error);
            alert(`An unexpected error occurred while ${action}ing the request.`);
        }
    }


    // --- Modify Initialization and Login to fetch requests ---

    function showAppLayout() {
        authContainer.style.display = 'none';
        appLayout.style.display = 'flex';
        messageInput.focus();
        populateChatList();
        const selfChatId = `self_${currentUser.id}`;
        setActiveChat(selfChatId, currentUsername);
        fetchPendingFriendRequests(); // Fetch requests when app layout is shown
    }

    async function initializeApp() {
        const { data: { session }, error } = await _supabase.auth.getSession();

        if (error) {
            console.error("Error getting session:", error);
            showAuthError("Error checking login status. Please refresh.");
            showLoginForm();
            return;
        }

        if (session) {
            if (!session.user.email_confirmed_at && session.user.email) {
                 console.warn("User logged in but email not confirmed:", session.user.email);
                 showAuthError(`Please confirm your email (${session.user.email}) via the link sent to you.`);
                 showLoginForm();
                 return;
            }

            console.log("User logged in and email confirmed (or no email):", session.user);
            currentUser = session.user;
            try {
                const { data: profile, error: profileError } = await _supabase
                    .from('profiles')
                    .select('username, display_name, avatar_url, status, description') // Fetch full profile
                    .eq('id', currentUser.id)
                    .single();

                if (profileError) {
                    console.error('Error fetching profile on init:', profileError);
                    currentUsername = currentUser.email.split('@')[0]; // Fallback
                    displayUsername.textContent = currentUsername;
                    profileAvatar.src = 'placeholder-avatar.png';
                    updateProfileStatusUIDisplay('Offline'); // Use helper function for button
                } else if (profile) {
                    currentUsername = profile.username;
                    displayUsername.textContent = profile.display_name || profile.username;
                    profileAvatar.src = profile.avatar_url || 'placeholder-avatar.png';
                    updateProfileStatusUIDisplay(profile.status); // Use helper function for button
                    currentUserProfile = profile; // Store the fetched profile
                    console.log("Initialized with profile:", profile);
                } else {
                    currentUserProfile = null; // Ensure it's null if profile not found
                    // Fallback if profile not found
                    console.warn('Profile not found for user on init, falling back to email part.');
                    currentUsername = currentUser.email.split('@')[0];
                    displayUsername.textContent = currentUsername;
                    profileAvatar.src = 'placeholder-avatar.png';
                    updateProfileStatusUIDisplay('Offline'); // Use helper function for button
                }
            } catch (error) {
                currentUserProfile = null; // Ensure it's null on error
                console.error('Unexpected error fetching profile on init:', error);
                currentUsername = currentUser.email.split('@')[0]; // Fallback
                displayUsername.textContent = currentUsername;
                profileAvatar.src = 'placeholder-avatar.png';
                updateProfileStatusUIDisplay('Offline'); // Use helper function for button
            }
            // displayUsername.textContent is set inside the try-catch now
            showAppLayout(); // This now calls fetchPendingFriendRequests
        } else {
            console.log("No active session found.");
            showAuthView();
        }
    }

    // Start the app initialization process
    initializeApp();

    // --- Status Popup Logic ---
    if (statusButton && statusPopup) {
        // Toggle popup display on button click
        statusButton.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent click from immediately closing popup via document listener
            const isVisible = statusPopup.style.display === 'block';
            statusPopup.style.display = isVisible ? 'none' : 'block';
        });

        // Handle status selection from popup links
        statusPopup.addEventListener('click', async (event) => {
            if (event.target.tagName === 'A' || event.target.closest('a')) {
                event.preventDefault();
                const link = event.target.closest('a');
                const newStatus = link.dataset.status;

                if (newStatus) {
                    console.log(`Status selected from popup: ${newStatus}`);
                    await updateUserStatus(newStatus); // Update UI optimistically and save to DB
                    statusPopup.style.display = 'none'; // Hide popup after selection
                }
            }
        });

        // Close popup if clicking outside of it
        document.addEventListener('click', (event) => {
            if (statusPopup.style.display === 'block' && !statusButton.contains(event.target) && !statusPopup.contains(event.target)) {
                statusPopup.style.display = 'none';
            }
        });

    } else {
        console.warn('Status button or popup element not found. Status functionality will be limited.');
    }

    // --- Avatar Update Logic (Sidebar PFP click triggers file input) ---
    // Listener is now on the wrapper
    if (profileAvatarWrapper && avatarUploadInput) {
        profileAvatarWrapper.addEventListener('click', () => {
            if (!currentUser) {
                alert("Please log in to change your avatar.");
                return;
            }
            avatarUploadInput.click(); 
        });

        avatarUploadInput.addEventListener('change', async (event) => {
            if (!currentUser) return;

            const file = event.target.files[0];
            if (!file) {
                return;
            }

            console.log("Selected file for avatar:", file.name, file.type);
            // Placeholder for Supabase upload logic
            // For now, let's just log it and maybe update the src to a local blob URL for preview
            const oldAvatarSrc = profileAvatar.src; // Store old src for potential revert
            profileAvatar.src = URL.createObjectURL(file); // Temporary local preview

            const MAX_AVATAR_SIZE_MB = 2; // 2MB limit
            const MAX_AVATAR_SIZE_BYTES = MAX_AVATAR_SIZE_MB * 1024 * 1024;

            if (file.size > MAX_AVATAR_SIZE_BYTES) {
                alert(`File is too large. Maximum size is ${MAX_AVATAR_SIZE_MB}MB. Your file is ${Math.round(file.size / 1024 / 1024 * 100) / 100}MB.`);
                avatarUploadInput.value = ''; // Reset the input
                profileAvatar.src = oldAvatarSrc; // Revert preview
                return;
            }

            // Show a temporary loading state or disable button if you have one
            profileAvatar.style.opacity = '0.5'; // Example: dim the avatar during upload

            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${currentUser.id}.${fileExt}`;
            const filePath = `public/${currentUser.id}/${fileName}`; // Store in a user-specific folder within 'public'

            try {
                // Upload file to Supabase Storage
                const { data: uploadData, error: uploadError } = await _supabase.storage
                    .from('avatars') // Your bucket name
                    .upload(filePath, file, {
                        cacheControl: '3600', // Optional: cache for 1 hour
                        upsert: false // True to overwrite, false to error if file exists (safer with unique names)
                    });

                if (uploadError) {
                    console.error('Error uploading avatar to Supabase Storage:', uploadError);
                    alert(`Failed to upload avatar: ${uploadError.message}`);
                    profileAvatar.src = oldAvatarSrc; // Revert UI
                    profileAvatar.style.opacity = '1';
                    avatarUploadInput.value = '';
                    return;
                }

                console.log('Upload successful:', uploadData);

                // Get public URL of the uploaded file
                const { data: publicUrlData, error: urlError } = _supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);

                if (urlError) {
                    console.error('Error getting public URL:', urlError);
                    // Even if URL fetch fails, the file is uploaded. Might need manual fix or retry.
                    // For now, we won't update the profile if we can't get the URL.
                    alert(`Avatar uploaded, but failed to get public URL: ${urlError.message}`);
                    profileAvatar.src = oldAvatarSrc; // Revert UI as we can't use it
                    profileAvatar.style.opacity = '1';
                    avatarUploadInput.value = '';
                    return;
                }

                const newAvatarUrl = publicUrlData.publicUrl;
                console.log('New avatar public URL:', newAvatarUrl);

                // Update the user's profile in the 'profiles' table
                const { error: profileUpdateError } = await _supabase
                    .from('profiles')
                    .update({ avatar_url: newAvatarUrl, updated_at: new Date().toISOString() })
                    .eq('id', currentUser.id);

                if (profileUpdateError) {
                    console.error('Error updating profile with new avatar URL:', profileUpdateError);
                    alert(`Avatar uploaded, but failed to update profile: ${profileUpdateError.message}`);
                    // Consider deleting the uploaded file from storage if profile update fails to prevent orphans
                    // await _supabase.storage.from('avatars').remove([filePath]);
                    profileAvatar.src = oldAvatarSrc; // Revert UI
                } else {
                    console.log('Profile updated successfully with new avatar URL.');
                    profileAvatarImg.src = newAvatarUrl; // Update the actual image src
                    if (currentUserProfile) {
                        currentUserProfile.avatar_url = newAvatarUrl; 
                    }
                }

            } catch (err) {
                console.error('Unexpected error during avatar upload process:', err);
                alert('An unexpected error occurred while uploading the avatar.');
                profileAvatar.src = oldAvatarSrc; // Revert UI
            } finally {
                profileAvatar.style.opacity = '1'; // Restore avatar opacity
                avatarUploadInput.value = ''; // Reset file input
            }
        });

    } else {
        console.warn('#profile-avatar or #avatar-upload element not found. Avatar functionality will be affected.');
    }

    // --- User Profile View Show/Hide Logic ---
    if (closeProfileViewBtn && userProfileViewContainer) {
        closeProfileViewBtn.addEventListener('click', () => {
            userProfileViewContainer.style.display = 'none';
        });
    }

    // --- Show User Profile View Function ---
    async function showUserProfileView(userIdToShow) {
        if (!userProfileViewContainer || !profileViewAvatar || !profileViewUsername || !profileViewStatusText || !profileViewDescriptionText || !editDescriptionBtn || !saveDescriptionBtn || !profileEditDescriptionInput || !profileViewStatusDotP || !fullProfileStatusDot || !profileViewLastSeen) {
            console.error("One or more profile view elements are missing.");
            return;
        }

        // Show loading state (optional)
        userProfileViewContainer.style.display = 'flex';
        profileViewUsername.textContent = 'Loading...';
        profileViewAvatar.src = 'placeholder-avatar.png'; // The image inside the wrapper
        profileViewStatusText.textContent = '...'; 
        profileViewStatusDotP.className = 'status-dot offline'; 
        fullProfileStatusDot.className = 'status-dot offline'; 
        profileViewLastSeen.style.display = 'none'; // Hide by default
        profileViewDescriptionText.textContent = '...';
        profileEditDescriptionInput.style.display = 'none';
        saveDescriptionBtn.style.display = 'none';


        let profileToDisplay = null;
        let isCurrentUserProfile = false;

        if (currentUser && userIdToShow === currentUser.id) {
            profileToDisplay = currentUserProfile; // Use cached current user's full profile
            isCurrentUserProfile = true;
        } else {
            // Fetch profile for another user
            try {
                const { data, error } = await _supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url, status, description, last_seen_at') // Added last_seen_at
            .eq('id', userIdToShow)
            .single();
                if (error) throw error;
                profileToDisplay = data;
            } catch (error) {
                console.error("Error fetching profile for view:", error);
                profileViewUsername.textContent = 'Error loading profile.';
                // Hide container or show error message
                // For now, we'll leave it open with an error.
                return;
            }
        }

        if (profileToDisplay) {
            profileViewAvatar.src = profileToDisplay.avatar_url || 'placeholder-avatar.png';
            profileViewUsername.textContent = profileToDisplay.display_name || profileToDisplay.username || 'Unknown User';
            
            // Update status display in the profile view
            const status = profileToDisplay.status || 'Offline';
            profileViewStatusText.textContent = status; // Update text status
            let statusClassSuffix = 'offline'; // Default
            switch (status.toLowerCase()) {
                case 'online': statusClassSuffix = 'available'; break;
                case 'busy': statusClassSuffix = 'busy'; break;
                case 'be right back': statusClassSuffix = 'brb'; break;
                case 'do not disturb': statusClassSuffix = 'dnd'; break;
            }
            profileViewStatusDotP.className = `status-dot ${statusClassSuffix}`; 
            fullProfileStatusDot.className = `status-dot ${statusClassSuffix}`; 

            if (status.toLowerCase() === 'offline' && profileToDisplay.last_seen_at) {
                const lastSeenDate = new Date(profileToDisplay.last_seen_at);
                // Simple date formatting, can be improved with a library like date-fns if needed
                const formattedLastSeen = lastSeenDate.toLocaleString(undefined, { 
                    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
                });
                profileViewLastSeen.textContent = `Last seen: ${formattedLastSeen}`;
                profileViewLastSeen.style.display = 'block';
            } else {
                profileViewLastSeen.style.display = 'none';
            }

            profileViewDescriptionText.textContent = profileToDisplay.description || 'No description yet.';
            profileViewDescriptionText.style.display = 'block';
            profileEditDescriptionInput.style.display = 'none';
            saveDescriptionBtn.style.display = 'none';

            if (isCurrentUserProfile) {
                editDescriptionBtn.style.display = 'inline-block';
                editDescriptionBtn.dataset.userId = userIdToShow; // Store for save action
            } else {
                editDescriptionBtn.style.display = 'none';
            }
        } else {
            profileViewUsername.textContent = 'Profile not found.';
            profileViewAvatar.src = 'placeholder-avatar.png';
            profileViewStatusText.textContent = 'Unknown';
            profileViewDescriptionText.textContent = 'Could not load profile details.';
        }
    }

    // --- Edit/Save Description Logic ---
    if (editDescriptionBtn && saveDescriptionBtn && profileViewDescriptionText && profileEditDescriptionInput && currentUserProfile) {
        editDescriptionBtn.addEventListener('click', () => {
            // Only allow editing if it's the current user's profile being viewed
            if (profileViewUsername.textContent === (currentUserProfile.display_name || currentUserProfile.username)) {
                profileViewDescriptionText.style.display = 'none';
                profileEditDescriptionInput.value = currentUserProfile.description || '';
                profileEditDescriptionInput.style.display = 'block';
                editDescriptionBtn.style.display = 'none';
                saveDescriptionBtn.style.display = 'inline-block';
                profileEditDescriptionInput.focus();
            }
        });

        saveDescriptionBtn.addEventListener('click', async () => {
            const newDescription = profileEditDescriptionInput.value.trim();
            // Optimistically update UI
            profileViewDescriptionText.textContent = newDescription || "No description yet.";
            profileViewDescriptionText.style.display = 'block';
            profileEditDescriptionInput.style.display = 'none';
            saveDescriptionBtn.style.display = 'none';
            editDescriptionBtn.style.display = 'inline-block';

            try {
                const { error } = await _supabase
                    .from('profiles')
                    .update({ description: newDescription, updated_at: new Date().toISOString() })
                    .eq('id', currentUser.id);

                if (error) {
                    console.error("Error updating description:", error);
                    alert(`Failed to save description: ${error.message}`);
                    // Revert UI (optional, or just let user try again)
                    profileViewDescriptionText.textContent = currentUserProfile.description || "No description yet."; // Revert to old
                } else {
                    console.log("Description updated successfully.");
                    currentUserProfile.description = newDescription; // Update local cache
                }
            } catch (err) {
                console.error("Unexpected error saving description:", err);
                alert("An unexpected error occurred while saving the description.");
                profileViewDescriptionText.textContent = currentUserProfile.description || "No description yet."; // Revert
            }
        });
    }


    // --- Reaction Handling ---
    const COMMON_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
    let activeEmojiBar = null; // To ensure only one is open

    function showEmojiBar(messageId, buttonElement) {
        if (activeEmojiBar) {
            activeEmojiBar.remove();
            activeEmojiBar = null;
        }

        const emojiBar = document.createElement('div');
        emojiBar.classList.add('emoji-reaction-bar');
        
        COMMON_REACTIONS.forEach(emoji => {
            const emojiButton = document.createElement('button');
            emojiButton.classList.add('emoji-reaction-bar-button');
            emojiButton.textContent = emoji;
            emojiButton.addEventListener('click', async (e) => {
                e.stopPropagation();
                await addReactionToMessage(messageId, emoji);
                if (activeEmojiBar) activeEmojiBar.remove();
                activeEmojiBar = null;
            });
            emojiBar.appendChild(emojiButton);
        });

        // Position the bar near the button
        document.body.appendChild(emojiBar); // Append to body to avoid clipping issues
        const buttonRect = buttonElement.getBoundingClientRect();
        const chatBoxRect = chatBox.getBoundingClientRect(); // Get chatBox bounds for relative positioning

        // Calculate position relative to the chatBox scroll container if possible
        // This helps if the page scrolls but chatBox itself is the scrollable part
        let topPosition = buttonRect.top - emojiBar.offsetHeight - 5 + chatBox.scrollTop;
        let leftPosition = buttonRect.left + (buttonRect.width / 2) - (emojiBar.offsetWidth / 2) + chatBox.scrollLeft;

        // Adjust if too close to top/left of viewport (simple adjustment)
        if (topPosition < chatBoxRect.top + chatBox.scrollTop) { // If above visible area of chatbox
            topPosition = buttonRect.bottom + 5 + chatBox.scrollTop; // Position below
        }
         if (leftPosition < chatBoxRect.left + chatBox.scrollLeft) {
            leftPosition = chatBoxRect.left + 5 + chatBox.scrollLeft;
        }
        if (leftPosition + emojiBar.offsetWidth > chatBoxRect.right + chatBox.scrollLeft) {
            leftPosition = chatBoxRect.right - emojiBar.offsetWidth - 5 + chatBox.scrollLeft;
        }


        emojiBar.style.position = 'absolute'; // Position absolutely within a relative parent or viewport
        emojiBar.style.top = `${topPosition}px`; 
        emojiBar.style.left = `${leftPosition}px`;
        
        activeEmojiBar = emojiBar;

        // Clicking anywhere else closes the bar
        setTimeout(() => { 
            document.addEventListener('click', closeEmojiBarOnClickOutside, { once: true });
        }, 0);
    }

    function closeEmojiBarOnClickOutside(event) {
        if (activeEmojiBar && !activeEmojiBar.contains(event.target) && !event.target.classList.contains('add-reaction-btn')) {
            activeEmojiBar.remove();
            activeEmojiBar = null;
        } else if (activeEmojiBar && activeEmojiBar.contains(event.target)) {
            // If click is inside the bar, re-add listener because it was {once: true}
             setTimeout(() => { 
                document.addEventListener('click', closeEmojiBarOnClickOutside, { once: true });
            }, 0);
        }
    }

    async function handleReactionClick(messageId, buttonElement) { // Added buttonElement
        if (!currentUser) {
            alert("Please log in to react.");
            return;
        }
        console.log(`Reaction button clicked for message ID: ${messageId}`);
        showEmojiBar(messageId, buttonElement); // Pass the button element for positioning
    }

    async function addReactionToMessage(messageId, emoji) {
        if (!currentUser || !messageId || !emoji) return;

        try {
            // Check if user already reacted with this emoji on this message
            const { data: existingReaction, error: checkError } = await _supabase
                .from('reactions')
                .select('id')
                .eq('message_id', messageId)
                .eq('user_id', currentUser.id)
                .eq('emoji', emoji)
                .maybeSingle();

            if (checkError) {
                console.error("Error checking existing reaction:", checkError);
                alert("Could not add reaction. Please try again.");
                return;
            }

            if (existingReaction) {
                // User already reacted with this emoji, so remove it (toggle)
                console.log("User already reacted with this emoji. Removing reaction.");
                await removeReactionFromMessage(existingReaction.id, messageId, emoji);
            } else {
                // Add new reaction
                const { data, error } = await _supabase
                    .from('reactions')
                    .insert({
                        message_id: messageId,
                        user_id: currentUser.id,
                        emoji: emoji
                    })
                    .select(); // Select the inserted row to get its data

                if (error) {
                    console.error("Error adding reaction:", error);
                    if (error.code === '23505') { // Unique constraint violation
                        alert("You've already reacted with this emoji!");
                    } else {
                        alert(`Failed to add reaction: ${error.message}`);
                    }
                    return;
                }
                console.log("Reaction added successfully:", data);
                // Manually update UI for now. Real-time subscription will handle this better.
                if (data && data.length > 0) {
                    await fetchAndDisplayReactionsForMessage(messageId);
                }
            }
        } catch (err) {
            console.error("Unexpected error adding/removing reaction:", err);
            alert("An unexpected error occurred while reacting.");
        }
    }

    async function removeReactionFromMessage(reactionId, messageId, emoji) {
        try {
            const { error } = await _supabase
                .from('reactions')
                .delete()
                .eq('id', reactionId); // Delete by reaction's own ID

            if (error) {
                console.error("Error removing reaction:", error);
                alert(`Failed to remove reaction: ${error.message}`);
                return;
            }
            console.log("Reaction removed successfully for ID:", reactionId);
            await fetchAndDisplayReactionsForMessage(messageId); // Refresh reactions for the message
        } catch (err) {
            console.error("Unexpected error removing reaction:", err);
            alert("An unexpected error occurred while removing the reaction.");
        }
    }


    async function fetchAndDisplayReactionsForMessage(messageId) {
        if (!messageId) return;
        try {
            const { data: reactions, error } = await _supabase
                .from('reactions')
                .select('emoji, user_id, id') // Select id for potential deletion
                .eq('message_id', messageId);

            if (error) {
                console.error(`Error fetching reactions for message ${messageId}:`, error);
                return;
            }
            renderReactions(messageId, reactions || []);
        } catch (err) {
            console.error(`Unexpected error fetching reactions for message ${messageId}:`, err);
        }
    }

    function renderReactions(messageId, reactions) {
        const reactionsContainer = document.querySelector(`.message-reactions[data-message-id="${messageId}"]`);
        if (!reactionsContainer) {
            // console.warn(`Reactions container not found for message ${messageId}`);
            return;
        }
        reactionsContainer.innerHTML = ''; // Clear existing reactions

        // Group reactions by emoji
        const groupedReactions = reactions.reduce((acc, reaction) => {
            acc[reaction.emoji] = acc[reaction.emoji] || { count: 0, users: [], reaction_ids: [] };
            acc[reaction.emoji].count++;
            acc[reaction.emoji].users.push(reaction.user_id);
            acc[reaction.emoji].reaction_ids.push(reaction.id); // Store reaction ID
            return acc;
        }, {});

        for (const emoji in groupedReactions) {
            const group = groupedReactions[emoji];
            const reactionEmojiElement = document.createElement('div');
            reactionEmojiElement.classList.add('reaction-emoji');
            reactionEmojiElement.textContent = emoji;
            
            const countSpan = document.createElement('span');
            countSpan.classList.add('count');
            countSpan.textContent = group.count;
            reactionEmojiElement.appendChild(countSpan);

            // Check if current user reacted with this emoji
            if (currentUser && group.users.includes(currentUser.id)) {
                reactionEmojiElement.classList.add('reacted-by-user');
            }

            reactionEmojiElement.title = `Reacted by: ${group.users.length} user(s)`; // Simple tooltip for now

            // Add click listener to toggle reaction (remove if already reacted by current user)
            reactionEmojiElement.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (!currentUser) return;

                const userReactedWithThisEmoji = group.users.includes(currentUser.id);
                if (userReactedWithThisEmoji) {
                    // Find the specific reaction ID for this user and emoji to delete
                    const reactionToDelete = reactions.find(r => r.emoji === emoji && r.user_id === currentUser.id);
                    if (reactionToDelete) {
                        await removeReactionFromMessage(reactionToDelete.id, messageId, emoji);
                    }
                } else {
                    await addReactionToMessage(messageId, emoji);
                }
            });
            reactionsContainer.appendChild(reactionEmojiElement);
        }
    }
    
    // Modify fetchMessages to also fetch reactions
    async function fetchMessages() {
        console.log(`Fetching messages for chat_id: ${currentChatId}`);
        try {
            const { data: messages, error } = await _supabase
                .from('messages')
                .select('*') // Ensure 'id' and 'sender_id' are selected if not using '*'
                .eq('chat_id', currentChatId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching messages:', error);
                alert(`Error fetching messages: ${error.message}`);
                return;
            }

            chatBox.innerHTML = '';
            console.log('Fetched messages:', messages);

            for (const message of messages) {
                console.log('Displaying fetched message:', message);
                await displayMessage(message); // displayMessage is async
                if (message.id) {
                    await fetchAndDisplayReactionsForMessage(message.id); // Fetch and display reactions
                }
            }
        } catch (error) {
            console.error('Unexpected error fetching messages:', error);
            alert('An unexpected error occurred while fetching messages.');
        }
    }

    // Modify real-time message subscription to fetch reactions for new messages
    // Inside subscribeToMessages, within the payload handling:
    // if (payload.new && payload.new.chat_id === currentChatId) {
    //     ...
    //     await displayMessage(payload.new); // Make sure displayMessage is awaited
    //     if (payload.new.id) {
    //         await fetchAndDisplayReactionsForMessage(payload.new.id);
    //     }
    //     ...
    // }
    // This change will be applied in a separate step to keep diffs smaller.


    // --- Subscribe to real-time reaction updates ---
    let reactionSubscription = null;

    function subscribeToReactions() {
        if (!currentChatId) return; // Don't subscribe if no chat is active

        const reactionChannelName = `public:reactions`; // Listen to the main table channel

        if (reactionSubscription) {
            _supabase.removeChannel(reactionSubscription);
            reactionSubscription = null;
            console.log('Removed existing reaction subscription.');
        }

        console.log(`Attempting to subscribe to reaction channel: ${reactionChannelName}...`);
        reactionSubscription = _supabase
            .channel(reactionChannelName)
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen for INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'reactions',
                    // We can't easily filter by chat_id here as reactions are linked to message_id.
                    // We'll fetch the message for the reaction and check its chat_id.
                },
                async (payload) => {
                    console.log('Real-time: Reaction change payload received:', payload);
                    let messageIdToUpdate = null;

                    if (payload.eventType === 'INSERT' && payload.new) {
                        messageIdToUpdate = payload.new.message_id;
                    } else if (payload.eventType === 'DELETE' && payload.old) {
                        messageIdToUpdate = payload.old.message_id;
                    } else if (payload.eventType === 'UPDATE' && payload.new) {
                        // Though we don't allow updates, good to handle if policies change
                        messageIdToUpdate = payload.new.message_id;
                    }

                    if (messageIdToUpdate) {
                        // Check if the affected message is in the current chat
                        // This requires an extra query but ensures we only update relevant messages.
                        // A more optimized way might involve joining reactions with messages if possible in a view
                        // or denormalizing chat_id onto reactions (but that adds complexity).
                        const { data: messageData, error: msgError } = await _supabase
                            .from('messages')
                            .select('chat_id')
                            .eq('id', messageIdToUpdate)
                            .single();
                        
                        if (msgError) {
                            console.error("Error fetching message for reaction update:", msgError);
                            return;
                        }

                        if (messageData && messageData.chat_id === currentChatId) {
                            console.log(`Reaction change for message ${messageIdToUpdate} in current chat. Refreshing its reactions.`);
                            await fetchAndDisplayReactionsForMessage(messageIdToUpdate);
                        } else {
                            // console.log(`Reaction change for message ${messageIdToUpdate} not in current chat. Ignoring.`);
                        }
                    }
                }
            )
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Real-time reaction subscription active!');
                }
                if (status === 'CHANNEL_ERROR') {
                    console.error('Real-time reaction subscription error:', err);
                }
                if (status === 'TIMED_OUT') {
                    console.warn('Real-time reaction subscription timed out.');
                }
            });
    }

    // Modify setActiveChat to also manage reaction subscriptions
    function setActiveChat(chatId, chatTitleText) {
        currentChatId = chatId;
        chatTitle.textContent = chatTitleText;
        messageInput.placeholder = `Type your message in ${chatTitleText}...`;

        document.querySelectorAll('#chat-list li a').forEach(link => {
            link.classList.toggle('active', link.dataset.chatId === chatId);
        });

        fetchMessages(); // Fetches messages and their reactions
        subscribeToMessages(); // Subscribes to new messages for this chat
        subscribeToReactions(); // Subscribes to reaction changes (will re-subscribe or filter internally)
    }
    
    // --- Real-time Profile Updates (for status) ---
    let profileSubscription = null;

    function subscribeToProfileUpdates() {
        if (profileSubscription) {
            _supabase.removeChannel(profileSubscription);
            profileSubscription = null;
        }

        profileSubscription = _supabase
            .channel('public:profiles')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'profiles' },
                (payload) => {
                    console.log('Profile update received:', payload);
                    const updatedProfile = payload.new;
                    if (!updatedProfile) return;

                    // Update profile cache
                    profileCache[`id_${updatedProfile.id}`] = updatedProfile;
                    if (updatedProfile.username) {
                        profileCache[`user_${updatedProfile.username}`] = updatedProfile;
                    }
                    
                    // If it's the current user, update their main status display
                    if (currentUser && updatedProfile.id === currentUser.id) {
                        currentUserProfile = updatedProfile; // Update current user's cached profile
                        updateProfileStatusUIDisplay(updatedProfile.status);
                        // If their own full profile view is open, update it too
                        if (userProfileViewContainer.style.display === 'flex' && 
                            profileViewUsername.textContent === (updatedProfile.display_name || updatedProfile.username)) {
                            showUserProfileView(updatedProfile.id); // Re-render to show new status/last_seen
                        }
                    }

                    // Update status dots in messages
                    document.querySelectorAll(`.message-avatar-container`).forEach(container => {
                        // This is a bit tricky as we don't store user_id directly on avatar container in messages
                        // We'd need to re-render messages or find a way to associate user_id with avatar elements
                        // For now, this part will be less effective without a direct link.
                        // A better approach would be to iterate through visible messages and update if sender_id matches.
                        console.log("Attempting to update status in messages for user:", updatedProfile.id);
                    });
                    
                    // If the updated user's profile view is open, refresh it
                    if (userProfileViewContainer.style.display === 'flex') {
                        const displayedUserId = editDescriptionBtn.dataset.userId || (profileViewAvatar.dataset.userId); // Assuming we store it
                        if (displayedUserId === updatedProfile.id) {
                            console.log("Updating open profile view for user:", updatedProfile.id);
                            showUserProfileView(updatedProfile.id);
                        }
                    }
                    
                    // Update status dots on any visible PFPs in the chat list (if we implement PFPs there)
                    // For now, this mainly affects the current user's own display and open profile views.
                    // And message avatars if we enhance displayMessage to store user_id on them.
                    
                    // Re-render messages if a visible user's status changed (simplistic approach)
                    // This is inefficient but ensures visible statuses are updated.
                    // A more targeted update would be better.
                    if (currentChatId) { // Only if a chat is active
                        const messagesInChat = Array.from(chatBox.querySelectorAll('.message'));
                        let refreshNeeded = false;
                        for (const msgElement of messagesInChat) {
                            // This requires displayMessage to add a data-sender-id attribute to messageElement
                            const senderId = msgElement.dataset.senderId; 
                            console.log(`Checking message with senderId: ${senderId} against updated user: ${updatedProfile.id}`);
                            if (senderId === updatedProfile.id) {
                                refreshNeeded = true;
                                break;
                            }
                        }
                        if (refreshNeeded) {
                            console.log(`Status changed for user ${updatedProfile.username} in current chat. Re-fetching messages.`);
                            fetchMessages(); // Re-fetches all messages and their reactions/statuses
                        }
                    }
                }
            )
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Real-time profile subscription active!');
                } else if (err) {
                    console.error('Profile subscription error:', err);
                }
            });
    }


    // Modify setActiveChat to also manage reaction and profile subscriptions
    function setActiveChat(chatId, chatTitleText) {
        currentChatId = chatId;
        chatTitle.textContent = chatTitleText;
        messageInput.placeholder = `Type your message in ${chatTitleText}...`;

        document.querySelectorAll('#chat-list li a').forEach(link => {
            link.classList.toggle('active', link.dataset.chatId === chatId);
        });

        fetchMessages(); 
        subscribeToMessages(); 
        subscribeToReactions(); 
        subscribeToProfileUpdates(); // Add profile subscription management
    }
    
    // Modify logout to remove reaction and profile subscription
    logoutBtn.addEventListener('click', async () => {
        console.log('Logout button clicked.'); 
        console.log('Current User before logout:', currentUser); 
        console.log('Attempting Supabase sign out...'); 
        const { error } = await _supabase.auth.signOut();
        if (error) {
            console.error('Supabase signOut error:', error); 
            console.error('Error logging out:', error);
            alert('Error logging out. Check console for details.'); 
        } else {
            console.log('Supabase signOut successful.'); 
            currentUser = null;
            currentUsername = '';
            currentUserProfile = null; // Clear profile cache
            console.log('User state cleared.'); 
            
            chatBox.innerHTML = '';
            if (messageSubscription) {
                _supabase.removeChannel(messageSubscription);
                messageSubscription = null;
            }
            if (friendshipSubscription) {
                _supabase.removeChannel(friendshipSubscription);
                friendshipSubscription = null;
            }
            if (reactionSubscription) { 
                _supabase.removeChannel(reactionSubscription);
                reactionSubscription = null;
                console.log('Removed reaction subscription on logout.');
            }
            if (profileSubscription) { // Remove profile subscription on logout
                _supabase.removeChannel(profileSubscription);
                profileSubscription = null;
                console.log('Removed profile subscription on logout.');
            }
            showAuthView(); 
            console.log('Switched back to auth view.'); 
        }
    });

    // Modify initializeApp and handleLogin to start profile subscription
    async function initializeApp() {
        const { data: { session }, error } = await _supabase.auth.getSession();

        if (error) {
            console.error("Error getting session:", error);
            showAuthError("Error checking login status. Please refresh.");
            showLoginForm();
            return;
        }

        if (session) {
            if (!session.user.email_confirmed_at && session.user.email) {
                 console.warn("User logged in but email not confirmed:", session.user.email);
                 showAuthError(`Please confirm your email (${session.user.email}) via the link sent to you.`);
                 showLoginForm();
                 return;
            }

            console.log("User logged in and email confirmed (or no email):", session.user);
            currentUser = session.user;
            try {
                const { data: profile, error: profileError } = await _supabase
                    .from('profiles')
                    .select('username, display_name, avatar_url, status, description, last_seen_at') // Ensure last_seen_at is here
                    .eq('id', currentUser.id)
                    .single();

                if (profileError) {
                    console.error('Error fetching profile on init:', profileError);
                    currentUsername = currentUser.email.split('@')[0]; 
                    displayUsername.textContent = currentUsername;
                    if (profileAvatarImg) profileAvatarImg.src = 'placeholder-avatar.png';
                    updateProfileStatusUIDisplay('Offline'); 
                } else if (profile) {
                    currentUsername = profile.username; 
                    displayUsername.textContent = profile.display_name || profile.username;
                    if (profileAvatarImg) profileAvatarImg.src = profile.avatar_url || 'placeholder-avatar.png';
                    updateProfileStatusUIDisplay(profile.status); 
                    currentUserProfile = profile; 
                    console.log("Initialized with profile:", profile);
                } else {
                    currentUserProfile = null; 
                    console.warn('Profile not found for user on init, falling back to email part.');
                    currentUsername = currentUser.email.split('@')[0]; 
                    displayUsername.textContent = currentUsername;
                    if (profileAvatarImg) profileAvatarImg.src = 'placeholder-avatar.png';
                    updateProfileStatusUIDisplay('Offline'); 
                }
            } catch (error) {
                currentUserProfile = null; 
                console.error('Unexpected error during profile processing on init:', error);
                currentUsername = currentUser.email.split('@')[0]; 
                displayUsername.textContent = currentUsername;
                if (profileAvatarImg) profileAvatarImg.src = 'placeholder-avatar.png';
                updateProfileStatusUIDisplay('Offline'); 
            }
            
            showAppLayout(); // This calls setActiveChat, which calls subscribeToProfileUpdates
            // No need to call subscribeToProfileUpdates() directly here as setActiveChat will do it.
            subscribeToFriendships(); // Keep this
        } else {
            console.log("No active session found.");
            showAuthView();
        }
    }

     async function handleLogin(event) {
        event.preventDefault();
        clearAuthError();
        const email = loginEmailInput.value.trim();
        const password = loginPasswordInput.value.trim();
        console.log(`Attempting login for: ${email}`);

        try {
            const { data, error } = await _supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                console.error('Login error:', error);
                showAuthError(error.message);
                return;
            }

            console.log('Login successful:', data.user);
            currentUser = data.user; // currentUser is set here

            try {
                const { data: profile, error: profileError } = await _supabase
                    .from('profiles')
                    .select('username, display_name, avatar_url, status, description, last_seen_at') // Ensure last_seen_at
                    .eq('id', currentUser.id)
                    .single();

                if (profileError) {
                    console.error('Error fetching profile after login:', profileError);
                    currentUsername = currentUser.email.split('@')[0];
                    displayUsername.textContent = currentUsername;
                    if (profileAvatarImg) profileAvatarImg.src = 'placeholder-avatar.png';
                    updateProfileStatusUIDisplay('Offline');
                } else if (profile) {
                    currentUsername = profile.username;
                    displayUsername.textContent = profile.display_name || profile.username;
                    if (profileAvatarImg) profileAvatarImg.src = profile.avatar_url || 'placeholder-avatar.png';
                    updateProfileStatusUIDisplay(profile.status);
                    currentUserProfile = profile;
                    console.log("Fetched profile after login:", profile);
                } else {
                    currentUserProfile = null;
                    console.warn('Profile not found for user after login, falling back.');
                    currentUsername = currentUser.email.split('@')[0];
                    displayUsername.textContent = currentUsername;
                    if (profileAvatarImg) profileAvatarImg.src = 'placeholder-avatar.png';
                    updateProfileStatusUIDisplay('Offline');
                }
            } catch (profileProcessingError) {
                currentUserProfile = null;
                console.error('Unexpected error during profile processing after login:', profileProcessingError);
                currentUsername = currentUser.email.split('@')[0];
                displayUsername.textContent = currentUsername;
                if (profileAvatarImg) profileAvatarImg.src = 'placeholder-avatar.png';
                updateProfileStatusUIDisplay('Offline');
            }
            
            showAppLayout(); // This calls setActiveChat, which calls all subscriptions
            subscribeToFriendships(); // Keep this
            // No need to call subscribeToProfileUpdates() directly here.

        } catch (error) {
            console.error('Unexpected login error:', error);
            showAuthError('An unexpected error occurred during login.');
        }
    }


});
