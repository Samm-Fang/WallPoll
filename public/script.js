document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const loginSection = document.getElementById('login-section');
    const gallerySection = document.getElementById('gallery-section');
    const uploadSection = document.getElementById('upload-section');
    const userInfo = document.getElementById('user-info');
    const userIdInput = document.getElementById('user-id-input');
    const loginButton = document.getElementById('login-button');
    const loginError = document.getElementById('login-error');
    const userIdDisplay = document.getElementById('user-id-display');
    const logoutButton = document.getElementById('logout-button');
    const galleryGrid = document.getElementById('gallery-grid');
    const imageUploadInput = document.getElementById('image-upload-input');
    const uploadButton = document.getElementById('upload-button');
    const uploadStatus = document.getElementById('upload-status');
    const cropModal = document.getElementById('crop-modal');
    const imageToCrop = document.getElementById('image-to-crop');
    const cancelCropButton = document.getElementById('cancel-crop-button');
    const confirmCropButton = document.getElementById('confirm-crop-button');

    let currentUserId = null;
    let cropper = null;
    let originalFile = null;

    // --- Functions ---

    // Show/Hide Sections based on login state
    function updateUI() {
        if (currentUserId) {
            loginSection.classList.add('hidden');
            gallerySection.classList.remove('hidden');
            uploadSection.classList.remove('hidden');
            userInfo.classList.remove('hidden');
            userIdDisplay.textContent = currentUserId;
            // Check if user has already uploaded to disable upload
            // TODO: Add check based on gallery data or a separate user status endpoint
            uploadButton.disabled = false; // Enable upload by default after login for now
        } else {
            loginSection.classList.remove('hidden');
            gallerySection.classList.add('hidden');
            uploadSection.classList.add('hidden');
            userInfo.classList.add('hidden');
            userIdDisplay.textContent = '';
            galleryGrid.innerHTML = ''; // Clear gallery on logout
            uploadStatus.classList.add('hidden');
            uploadStatus.textContent = '';
            imageUploadInput.value = ''; // Clear file input
            uploadButton.disabled = true;
        }
        loginError.classList.add('hidden'); // Hide login error on UI update
    }

    // Handle Login
    async function handleLogin() {
        const userId = userIdInput.value.trim();
        if (!userId) {
            loginError.textContent = 'Please enter a User ID.';
            loginError.classList.remove('hidden');
            return;
        }

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userId })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                currentUserId = result.userId;
                localStorage.setItem('wallpollUserId', currentUserId); // Store user ID
                updateUI();
                loadGallery(); // Load gallery after successful login
            } else {
                loginError.textContent = result.message || 'Login failed.';
                loginError.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Login error:', error);
            loginError.textContent = 'An error occurred during login.';
            loginError.classList.remove('hidden');
        }
    }

    // Handle Logout
    function handleLogout() {
        currentUserId = null;
        localStorage.removeItem('wallpollUserId'); // Clear stored user ID
        updateUI();
    }

    // Load Gallery
    async function loadGallery() {
        if (!currentUserId) return;
        galleryGrid.innerHTML = '<p>Loading gallery...</p>'; // Show loading state
        try {
            const response = await fetch('/api/gallery');
            const result = await response.json();

            if (response.ok && result.success) {
                renderGallery(result.gallery);
            } else {
                galleryGrid.innerHTML = `<p class="error-message">Failed to load gallery: ${result.message || 'Unknown error'}</p>`;
            }
        } catch (error) {
            console.error('Gallery load error:', error);
            galleryGrid.innerHTML = '<p class="error-message">An error occurred while loading the gallery.</p>';
        }
    }

    // Render Gallery Images
    function renderGallery(images) {
        galleryGrid.innerHTML = ''; // Clear previous content
        if (!images || images.length === 0) {
            galleryGrid.innerHTML = '<p>No images uploaded yet.</p>';
            return;
        }

        images.forEach(image => {
            const canVote = image.uploaderId !== currentUserId;
            // TODO: Check if user already voted max times or for this image based on user data
            const alreadyVotedMax = false; // Placeholder
            const votesForThis = 0; // Placeholder

            const imageElement = document.createElement('div');
            imageElement.classList.add('gallery-item');
            // Use the r2Key to construct the image URL served by the worker
            const imageUrl = `/images/${image.r2Key}`;
            imageElement.innerHTML = `
                <img src="${imageUrl}" alt="Wallpaper by User ${image.uploaderId}" loading="lazy">
                <div class="image-info">
                    <p>Uploaded by: User ${image.uploaderId}</p>
                    <p>Votes: <span id="votes-${image.imageId}">${image.votes}</span></p>
                    <button class="vote-button" data-image-id="${image.imageId}" ${!canVote || alreadyVotedMax ? 'disabled' : ''}>
                        ${!canVote ? 'Your Image' : (votesForThis > 0 ? 'Vote Again' : 'Vote')}
                    </button>
                    <a href="${imageUrl}" download="${image.r2Key}" class="download-button">Download</a>
                </div>
            `;
            // Add vote button event listener
            const voteButton = imageElement.querySelector('.vote-button');
            if (voteButton) {
                voteButton.addEventListener('click', () => handleVote(image.imageId));
            }

            galleryGrid.appendChild(imageElement);
        });
    }

    // Handle Voting
    async function handleVote(imageId) {
        if (!currentUserId) return;

        const voteButton = document.querySelector(`button[data-image-id="${imageId}"]`);
        voteButton.disabled = true; // Disable button during request
        voteButton.textContent = 'Voting...';

        try {
            const response = await fetch('/api/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUserId, imageId: imageId })
            });
            const result = await response.json();

            if (response.ok && result.success) {
                // Update vote count visually (optimistic update or re-fetch)
                const votesSpan = document.getElementById(`votes-${imageId}`);
                if (votesSpan) {
                    votesSpan.textContent = parseInt(votesSpan.textContent, 10) + 1;
                }
                // TODO: Update button text/state based on vote limits (e.g., disable if max votes reached)
                voteButton.textContent = 'Voted!'; // Simple feedback for now
                // Consider re-fetching gallery or user status to get accurate vote counts/limits
            } else {
                alert(`Vote failed: ${result.message || 'Unknown error'}`);
                voteButton.textContent = 'Vote Failed'; // Indicate error
                // Re-enable button after a delay or based on error type?
                setTimeout(() => {
                     voteButton.disabled = false;
                     // TODO: Reset text based on actual vote status
                     voteButton.textContent = 'Vote';
                }, 2000);
            }
        } catch (error) {
            console.error('Vote error:', error);
            alert('An error occurred while voting.');
            voteButton.disabled = false;
            voteButton.textContent = 'Vote Error';
        }
    }

    // Handle Image Upload (now accepts blob and filename)
    async function handleUpload(imageBlob, fileName) {
        if (!currentUserId || !imageBlob) {
            uploadStatus.textContent = 'No image data to upload.';
            uploadStatus.classList.remove('hidden');
            return;
        }

        uploadButton.disabled = true;
        uploadStatus.textContent = 'Uploading...';
        uploadStatus.classList.remove('hidden');

        const formData = new FormData();
        formData.append('userId', currentUserId);
        // Use the provided blob and filename
        formData.append('image', imageBlob, fileName);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData // No 'Content-Type' header needed, browser sets it for FormData
            });

            const result = await response.json();

            if (response.ok && result.success) {
                uploadStatus.textContent = `Upload successful! Image ID: ${result.imageId}`;
                imageUploadInput.value = ''; // Clear file input
                // Optionally disable upload section or button after successful upload
                // uploadSection.classList.add('hidden');
                loadGallery(); // Refresh gallery to show the new image
            } else {
                uploadStatus.textContent = `Upload failed: ${result.message || 'Unknown error'}`;
                uploadButton.disabled = false; // Re-enable on failure
            }
        } catch (error) {
            console.error('Upload error:', error);
            uploadStatus.textContent = 'An error occurred during upload.';
            uploadButton.disabled = false; // Re-enable on error
        }
    }

    // --- Event Listeners ---
    loginButton.addEventListener('click', handleLogin);
    userIdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
    logoutButton.addEventListener('click', handleLogout);
    uploadButton.addEventListener('click', handleUpload);
    imageUploadInput.addEventListener('change', (event) => {
        const files = event.target.files;
        if (files && files.length > 0 && currentUserId) {
            originalFile = files[0];
            const reader = new FileReader();

            reader.onload = (e) => {
                imageToCrop.src = e.target.result;
                cropModal.classList.remove('hidden');

                // Destroy previous cropper instance if exists
                if (cropper) {
                    cropper.destroy();
                }

                // Initialize Cropper
                cropper = new Cropper(imageToCrop, {
                    aspectRatio: 16 / 9,
                    viewMode: 1, // Restrict crop box to canvas
                    // autoCropArea: 0.8, // Adjust initial crop area size if needed
                    // responsive: true,
                    // checkOrientation: false, // Handle orientation if needed
                });
            };

            reader.readAsDataURL(originalFile);
            uploadStatus.classList.add('hidden');
            uploadButton.disabled = true; // Disable direct upload, use modal confirm instead
        } else {
            // Reset if no file or not logged in
            uploadButton.disabled = true;
            if (cropper) {
                cropper.destroy();
                cropper = null;
            }
            imageToCrop.src = '#';
            originalFile = null;
        }
    });

    // --- Cropping Modal Event Listeners ---

    cancelCropButton.addEventListener('click', () => {
        cropModal.classList.add('hidden');
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
        imageUploadInput.value = ''; // Reset file input
        imageToCrop.src = '#';
        originalFile = null;
        uploadButton.disabled = true; // Keep upload disabled
    });

    confirmCropButton.addEventListener('click', () => {
        if (cropper && originalFile) {
            // Get cropped canvas
            const canvas = cropper.getCroppedCanvas({
                // Optional: Specify output dimensions if needed, maintain aspect ratio
                // width: 1920,
                // height: 1080,
                // fillColor: '#fff' // Optional background for non-opaque images
            });

            confirmCropButton.disabled = true;
            confirmCropButton.textContent = 'Processing...';

            canvas.toBlob(async (blob) => {
                if (blob) {
                    // Use original filename or generate a new one
                    const fileName = originalFile.name; // Or generate like `cropped-${Date.now()}.png`
                    await handleUpload(blob, fileName); // Call upload with the blob
                } else {
                    uploadStatus.textContent = 'Failed to create cropped image blob.';
                    uploadStatus.classList.remove('hidden');
                }
                // Hide modal and cleanup regardless of upload success/failure
                cropModal.classList.add('hidden');
                if (cropper) {
                    cropper.destroy();
                    cropper = null;
                }
                imageUploadInput.value = '';
                imageToCrop.src = '#';
                originalFile = null;
                confirmCropButton.disabled = false;
                confirmCropButton.textContent = 'Confirm & Upload';
                // Keep upload button disabled as upload is handled here
                uploadButton.disabled = true;

            }, originalFile.type || 'image/png'); // Pass original mime type
        }
    });

    // --- Initial Load ---
    const storedUserId = localStorage.getItem('wallpollUserId');
    if (storedUserId) {
        // Optional: Verify stored ID with backend? For now, just use it.
        currentUserId = parseInt(storedUserId, 10);
        updateUI();
        loadGallery();
    } else {
        updateUI(); // Show login section if no stored ID
    }
});