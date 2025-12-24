// ========================================
// 1. DOM ELEMENTS - Getting references to HTML elements
// ========================================
// You already know: document.querySelector
const scriptInput = document.querySelector('#scriptInput');
const voiceSelect = document.querySelector('#voiceSelect');
const speedRange = document.querySelector('#speedRange');
const speedValue = document.querySelector('#speedValue');
const charCount = document.querySelector('#charCount');
const generateBtn = document.querySelector('#generateBtn');
const loadingState = document.querySelector('#loadingState');
const errorMessage = document.querySelector('#errorMessage');
const errorText = document.querySelector('#errorText');
const successMessage = document.querySelector('#successMessage');
const downloadBtn = document.querySelector('#downloadBtn');
const audioPreview = document.querySelector('#audioPreview');
const audioPlayer = document.querySelector('#audioPlayer');

// ========================================
// 2. VARIABLE TO STORE AUDIO DATA
// ========================================
// This will store the audio file we get from the API
let currentAudioBlob = null; // Blob = Binary Large Object (audio file data)

// ========================================
// 3. EVENT LISTENERS - You already know this!
// ========================================

// Update character count as user types
scriptInput.addEventListener('input', () => {
    const count = scriptInput.value.length;
    charCount.textContent = count;
});

// Update speed display when slider moves
speedRange.addEventListener('input', () => {
    speedValue.textContent = speedRange.value;
});

// Main generate button click
generateBtn.addEventListener('click', generateAudio);

// Download button click
downloadBtn.addEventListener('click', downloadAudio);

// ========================================
// 4. HELPER FUNCTIONS
// ========================================

// Function to show loading state
const showLoading = () => {
    loadingState.classList.add('show');
    errorMessage.classList.remove('show');
    successMessage.classList.remove('show');
    audioPreview.classList.remove('show');
    generateBtn.disabled = true;
};

// Function to hide loading state
const hideLoading = () => {
    loadingState.classList.remove('show');
    generateBtn.disabled = false;
};

// Function to show error
const showError = (message) => {
    errorText.textContent = message;
    errorMessage.classList.add('show');
    hideLoading();
};

// Function to show success
const showSuccess = () => {
    successMessage.classList.add('show');
    audioPreview.classList.add('show');
    hideLoading();
};

// ========================================
// 5. MAIN FUNCTION - Generate Audio
// ========================================
// NEW CONCEPTS HERE: async/await, try/catch, fetch()

// 'async' keyword: This tells JavaScript that this function will do something
// that takes time (like calling an API). It allows us to use 'await' inside.
async function generateAudio() {
    // Get values from form
    const text = scriptInput.value.trim(); // trim() removes spaces from start/end
    const voice = voiceSelect.value;
    const speed = speedRange.value;

    // Validation (you know conditionals!)
    if (!text) {
        showError('Please enter some text for your script');
        return; // Stop function if no text
    }

    if (text.length < 10) {
        showError('Script is too short. Please add more text.');
        return;
    }

    showLoading();

    // ========================================
    // TRY/CATCH - NEW CONCEPT FOR YOU
    // ========================================
    // try/catch is used for ERROR HANDLING
    // try { } = "Try to do this code"
    // catch { } = "If something goes wrong, do this instead"

    try {
        // ========================================
        // FETCH API CALL - NEW CONCEPT
        // ========================================
        // fetch() is used to make HTTP requests (call APIs)
        // It returns a PROMISE (something that will complete in the future)
        // 'await' waits for the promise to complete before moving to next line

        const response = await fetch('/api/generate-speech', {
            method: 'POST', // POST = sending data to server
            headers: {
                'Content-Type': 'application/json' // Telling server we're sending JSON
            },
            // body = the data we're sending
            // JSON.stringify() converts JavaScript object to JSON string
            body: JSON.stringify({
                text: text,
                voice: voice,
                speed: parseFloat(speed) // parseFloat converts string to decimal number
            })
        });

        // ========================================
        // HANDLING THE RESPONSE
        // ========================================

        // Check if request was successful
        // response.ok is true if status code is 200-299
        if (!response.ok) {
            // If not ok, get error message from response
            const errorData = await response.json(); // .json() converts JSON string to object
            throw new Error(errorData.error || 'Failed to generate audio');
            // 'throw' creates an error that will be caught by 'catch' block
        }

        // Get the audio data as a Blob (binary data)
        // await because this also takes time
        const audioBlob = await response.blob();

        // Store the blob for download later
        currentAudioBlob = audioBlob;

        // Create a URL for the audio blob so we can play it
        // URL.createObjectURL creates a temporary URL for the blob
        const audioUrl = URL.createObjectURL(audioBlob);

        // Set the audio player source to our new audio
        audioPlayer.src = audioUrl;

        // Show success message and audio player
        showSuccess();

    } catch (error) {
        // ========================================
        // CATCH BLOCK - Handles any errors
        // ========================================
        // If ANYTHING goes wrong in the try block, code jumps here
        // 'error' is an object containing error information

        console.error('Error:', error); // Log error to console for debugging
        showError(error.message); // Show error message to user
    }
}

// ========================================
// 6. DOWNLOAD FUNCTION
// ========================================
function downloadAudio() {
    // Check if we have audio to download
    if (!currentAudioBlob) {
        showError('No audio to download. Please generate audio first.');
        return;
    }

    // Create a temporary URL for the blob
    const url = URL.createObjectURL(currentAudioBlob);

    // Create an invisible <a> tag to trigger download
    const a = document.createElement('a'); // createElement makes new HTML element
    a.href = url; // Set the link
    a.download = `voiceover-${Date.now()}.mp3`; // Filename (Date.now() = current timestamp)
    a.click(); // Simulate clicking the link to start download

    // Clean up: remove the temporary URL from memory
    URL.revokeObjectURL(url);
}

// ========================================
// EXPLANATION OF NEW CONCEPTS YOU HAVEN'T LEARNED:
// ========================================

/*
1. ASYNC/AWAIT:
   - async function = function that can wait for things
   - await = pause here until this finishes
   - Makes asynchronous code look synchronous (easier to read)

2. PROMISES:
   - fetch() returns a Promise
   - Promise = "I promise to give you data... eventually"
   - await waits for the promise to resolve (complete)

3. FETCH API:
   - fetch(url, options) = make HTTP request
   - Returns a Promise that resolves to a Response object
   - response.ok = boolean, true if status 200-299
   - response.json() = converts JSON response to JavaScript object
   - response.blob() = gets binary data (like audio, images)

4. TRY/CATCH:
   - try { code } = attempt to run this code
   - catch (error) { code } = if error happens, run this instead
   - Prevents app from crashing when errors occur

5. THROW:
   - throw new Error('message') = create an error
   - Jumps immediately to catch block

6. BLOB:
   - Binary Large Object
   - Used for file data (audio, video, images)
   - URL.createObjectURL(blob) = creates temporary URL to access blob

7. JSON.stringify():
   - Converts JavaScript object → JSON string
   - Needed because HTTP requests send strings, not objects

8. parseFloat():
   - Converts string to decimal number
   - "1.5" → 1.5
*/
