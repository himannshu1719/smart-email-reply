console.log("Email Writer Extension - Content Script Loading");

function createAIButton() {
    const button = document.createElement('div');
    button.className = 'T-I J-J5-Ji aoO v7 T-I-atl L3';
    button.style.marginRight = '8px';
    button.innerHTML = 'AI-reply';
    button.setAttribute('role', 'button');
    button.setAttribute('data-tooltip', 'Generate AI Reply');
    return button;
}

function createToneSelector() {
    const toneContainer = document.createElement('div');
    toneContainer.className = 'tone-selector';
    toneContainer.style.position = 'absolute';
    toneContainer.style.backgroundColor = 'white';
    toneContainer.style.border = '1px solid #ccc';
    toneContainer.style.borderRadius = '4px';
    toneContainer.style.padding = '8px';
    toneContainer.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    toneContainer.style.zIndex = '999';
    toneContainer.style.display = 'none';

    const tones = ['Professional', 'Friendly', 'Casual', 'Formal', 'Enthusiastic'];
    
    tones.forEach(tone => {
        const option = document.createElement('div');
        option.className = 'tone-option';
        option.innerHTML = tone;
        option.style.padding = '6px 12px';
        option.style.cursor = 'pointer';
        option.style.borderRadius = '2px';
        
        option.addEventListener('mouseover', () => {
            option.style.backgroundColor = '#f1f1f1';
        });
        
        option.addEventListener('mouseout', () => {
            option.style.backgroundColor = 'transparent';
        });
        
        option.addEventListener('click', async () => {
            generateReply(tone.toLowerCase());
            toneContainer.style.display = 'none';
        });
        
        toneContainer.appendChild(option);
    });
    
    return toneContainer;
}

function getEmailContent() {
    const selectors = [
        '.h7',
        '.a3s.aiL',
        '[role="presentation"]',
        '.gmail_quote'
    ];
    
    for (const selector of selectors) {
        const content = document.querySelector(selector);
        if (content) {
            return content.innerText.trim();
        }
    }
    return '';
}

function findComposeToolbar() {
    const selectors = [
        '.btC',
        '.aDh',
        '[role="toolbar"]',
        '.gU.Up'
    ];
    
    for (const selector of selectors) {
        const toolbar = document.querySelector(selector);
        if (toolbar) {
            return toolbar;
        }
    }
    return null;
}

async function generateReply(tone) {
    const button = document.querySelector('.ai-reply-button');
    try {
        button.innerHTML = 'Generating...';
        button.disabled = true;
        
        const emailContent = getEmailContent();
        console.log("Generating reply with tone:", tone, "for content:", emailContent.substring(0, 100) + "...");
        
        // Send message to background script instead of direct fetch
        chrome.runtime.sendMessage({
            action: "generateReply",
            emailContent: emailContent,
            tone: tone
        }, (response) => {
            console.log("Received response from background script:", response);
            
            if (chrome.runtime.lastError) {
                console.error("Runtime error:", chrome.runtime.lastError);
                alert('Extension error: ' + chrome.runtime.lastError.message);
                return;
            }
            
            if (response && response.success) {
                const composeBox = document.querySelector('[role="textbox"][g_editable="true"]');
                if (composeBox) {
                    composeBox.focus();
                    // Use modern method instead of deprecated execCommand
                    if (document.execCommand) {
                        document.execCommand('insertText', false, response.data);
                    } else {
                        composeBox.textContent = response.data;
                    }
                    console.log("Reply inserted successfully");
                } else {
                    console.log('Compose Box not Found');
                    // Fallback: try to find textarea
                    const textarea = document.querySelector('textarea[name="to"], textarea[role="textbox"]');
                    if (textarea) {
                        textarea.value = response.data;
                    }
                }
            } else {
                const errorMsg = response ? response.error : 'Unknown error';
                console.error('API Error:', errorMsg);
                alert('Failed to generate reply: ' + errorMsg);
            }
            
            button.innerHTML = 'AI Reply';
            button.disabled = false;
        });
        
    } catch (error) {
        console.error('Content script error:', error);
        alert('Failed to generate reply: ' + error.message);
        button.innerHTML = 'AI Reply';
        button.disabled = false;
    }
}

function injectButton() {
    const existingButton = document.querySelector('.ai-reply-button');
    if (existingButton) {
        existingButton.remove();
    }
    
    const toolbar = findComposeToolbar();
    if (!toolbar) {
        console.log("Toolbar not found");
        return;
    }
    
    console.log("Toolbar found, creating AI button");
    const button = createAIButton();
    button.classList.add('ai-reply-button');
    
    const toneSelector = createToneSelector();
    document.body.appendChild(toneSelector);
    
    button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const rect = button.getBoundingClientRect();
        toneSelector.style.top = `${rect.bottom + window.scrollY}px`;
        toneSelector.style.left = `${rect.left + window.scrollX}px`;
        toneSelector.style.display = toneSelector.style.display === 'none' ? 'block' : 'none';
    });
    
    // Close tone selector when clicking outside
    document.addEventListener('click', (event) => {
        if (!button.contains(event.target) && !toneSelector.contains(event.target)) {
            toneSelector.style.display = 'none';
        }
    });
    
    toolbar.insertBefore(button, toolbar.firstChild);
}

const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        const addedNodes = Array.from(mutation.addedNodes);
        const hasComposeElements = addedNodes.some(
            node => node.nodeType === Node.ELEMENT_NODE &&
            (node.matches('.aDh, .btC, [role="dialog"]') || 
             node.querySelector('.aDh, .btC, [role="dialog"]'))
        );
        
        if (hasComposeElements) {
            console.log("Compose Window detected");
            setTimeout(injectButton, 500);
        }
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Try to inject button immediately if compose window is already open
setTimeout(injectButton, 1000);
