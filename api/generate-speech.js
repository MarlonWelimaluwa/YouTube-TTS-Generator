// ========================================
// SERVERLESS FUNCTION - This runs on Vercel's server (Node.js)
// ========================================

// This is a serverless function (also called API route or endpoint)
// When someone visits: yoursite.vercel.app/api/generate-speech
// This code runs on Vercel's server (not in browser)

// ========================================
// MAIN FUNCTION - Export default is required for Vercel
// ========================================
export default async function handler(req, res) {
    // 'req' = request (what the user sent)
    // 'res' = response (what we send back)

    // ========================================
    // 1. CORS HEADERS - Allow requests from browser
    // ========================================
    // CORS = Cross-Origin Resource Sharing
    // Browsers block requests to different domains for security
    // We tell browser: "It's okay, allow this request"
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); // Allow these methods
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // Allow these headers

    // ========================================
    // 2. HANDLE OPTIONS REQUEST
    // ========================================
    // Browsers send an OPTIONS request BEFORE the real request (preflight)
    // We need to respond to it
    if (req.method === 'OPTIONS') {
        res.status(200).end(); // Just say "OK" and exit
        return;
    }

    // ========================================
    // 3. ONLY ALLOW POST METHOD
    // ========================================
    if (req.method !== 'POST') {
        // If not POST, reject with 405 (Method Not Allowed)
        res.status(405).json({ error: 'Method not allowed. Use POST.' });
        return;
    }

    // ========================================
    // 4. GET DATA FROM REQUEST
    // ========================================
    // req.body contains the data sent from frontend
    // Remember: your script.js sent {text, voice, speed}
    const { text, voice, speed } = req.body;

    // ========================================
    // 5. VALIDATE INPUT
    // ========================================
    if (!text || !voice) {
        res.status(400).json({ error: 'Missing required fields: text and voice' });
        return;
    }

    // ========================================
    // 6. GET API KEY FROM ENVIRONMENT VARIABLE
    // ========================================
    // process.env = Node.js way to access environment variables
    // This is YOUR secret Google Cloud API key (set in Vercel settings)
    const apiKey = process.env.GOOGLE_CLOUD_API_KEY;

    if (!apiKey) {
        res.status(500).json({
            error: 'Server configuration error: API key not found'
        });
        return;
    }

    // ========================================
    // 7. PREPARE REQUEST TO GOOGLE CLOUD
    // ========================================
    // This is the data Google Cloud expects
    const googleRequestBody = {
        input: {
            text: text // The script text
        },
        voice: {
            languageCode: voice.split('-').slice(0, 2).join('-'), // "en-US-Neural2-A" → "en-US"
            name: voice // Full voice name
        },
        audioConfig: {
            audioEncoding: 'MP3', // We want MP3 file
            speakingRate: speed || 1.0, // Speech speed (default 1.0)
            pitch: 0.0, // Voice pitch (0 = normal)
            volumeGainDb: 0.0 // Volume (0 = normal)
        }
    };

    // ========================================
    // 8. CALL GOOGLE CLOUD TTS API
    // ========================================
    try {
        // Make POST request to Google Cloud
        const response = await fetch(
            `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(googleRequestBody)
            }
        );

        // ========================================
        // 9. CHECK IF GOOGLE RESPONDED SUCCESSFULLY
        // ========================================
        if (!response.ok) {
            // Get error details from Google
            const errorData = await response.json();
            console.error('Google API Error:', errorData);

            res.status(response.status).json({
                error: errorData.error?.message || 'Failed to generate speech'
            });
            return;
        }

        // ========================================
        // 10. GET AUDIO DATA FROM GOOGLE
        // ========================================
        const data = await response.json();

        // Google returns audio as base64 string
        // base64 = way to represent binary data (audio) as text
        const audioContent = data.audioContent;

        if (!audioContent) {
            res.status(500).json({ error: 'No audio content received from Google' });
            return;
        }

        // ========================================
        // 11. CONVERT BASE64 TO BUFFER
        // ========================================
        // Buffer = Node.js way to handle binary data
        // We convert base64 string → binary audio data
        const audioBuffer = Buffer.from(audioContent, 'base64');

        // ========================================
        // 12. SEND AUDIO BACK TO BROWSER
        // ========================================
        // Set headers to tell browser this is an MP3 file
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', audioBuffer.length);

        // Send the audio buffer
        res.status(200).send(audioBuffer);

    } catch (error) {
        // ========================================
        // 13. HANDLE ANY ERRORS
        // ========================================
        console.error('Error:', error);
        res.status(500).json({
            error: 'Internal server error: ' + error.message
        });
    }
}

// ========================================
// EXPLANATION OF NEW CONCEPTS:
// ========================================

/*
1. EXPORT DEFAULT:
   - Vercel requires this format for serverless functions
   - 'export default function' makes this the main function

2. REQ & RES:
   - req (request) = what user sent (data, headers, method)
   - res (response) = what we send back (audio, errors, status codes)

3. HTTP STATUS CODES:
   - 200 = Success
   - 400 = Bad Request (user sent wrong data)
   - 405 = Method Not Allowed (used GET instead of POST)
   - 500 = Server Error (something broke on our side)

4. CORS (Cross-Origin Resource Sharing):
   - Security feature in browsers
   - Blocks requests to different domains
   - We set headers to allow our requests

5. OPTIONS METHOD:
   - Browsers send OPTIONS before actual request (preflight check)
   - We respond with "200 OK" to allow the real request

6. PROCESS.ENV:
   - Node.js way to access environment variables
   - Variables set in Vercel dashboard
   - Keeps secrets safe (not in code)

7. BASE64:
   - Way to encode binary data (audio) as text
   - Example: audio bytes → "SGVsbG8gV29ybGQ="
   - Buffer.from() converts it back to binary

8. BUFFER:
   - Node.js object for handling binary data
   - Like a container for raw bytes
   - Used for files, audio, images

9. RES.STATUS():
   - Sets HTTP status code
   - res.status(200) = Success
   - res.status(500) = Error

10. RES.JSON():
    - Sends JSON response
    - Automatically sets Content-Type header
    - Converts object to JSON string

11. RES.SEND():
    - Sends raw data (like audio buffer)
    - We use this instead of .json() for binary data
*/