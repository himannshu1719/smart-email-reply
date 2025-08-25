console.log("Email Writer Extension - Background Script Loading");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Background script received message:", request);
    
    if (request.action === "generateReply") {
        // Make API call from background script (no CORS restrictions)
        fetch('http://localhost:8080/api/email/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                emailContent: request.emailContent,
                tone: request.tone
            })
        })
        .then(response => {
            console.log("API response status:", response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
            console.log("API response data:", data);
            sendResponse({ success: true, data: data });
        })
        .catch(error => {
            console.error('Background script API error:', error);
            sendResponse({ success: false, error: error.message });
        });
        
        return true; // Keep message channel open for async response
    }
});

// Listen for extension installation/startup
chrome.runtime.onInstalled.addListener(() => {
    console.log("Email Writer Extension installed");
});
