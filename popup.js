// Popup functionality
document.addEventListener('DOMContentLoaded', function() {
    const forceDetectionBtn = document.getElementById('forceDetection');
    const toggleBtn = document.getElementById('togglePanel');
    const resetBtn = document.getElementById('resetPosition');
    const exportBtn = document.getElementById('exportData');
    const status = document.getElementById('status');

    // Force detection scan
    forceDetectionBtn.addEventListener('click', async function() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            chrome.tabs.sendMessage(tab.id, { action: 'forceDetection' }, function(response) {
                if (chrome.runtime.lastError) {
                    status.textContent = 'Detection not available on this page';
                    status.style.color = '#e17055';
                } else {
                    const foundCount = Object.values(response.results || {}).filter(Boolean).length;
                    status.textContent = `Detection forced! Found: ${foundCount} CAPTCHAs`;
                    status.style.color = '#00b894';
                }
            });
        } catch (error) {
            status.textContent = 'Error: Cannot access this page';
            status.style.color = '#e17055';
        }
    });

    // Toggle panel visibility (minimize/expand)
    toggleBtn.addEventListener('click', async function() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            chrome.tabs.sendMessage(tab.id, { action: 'togglePanel' }, function(response) {
                if (chrome.runtime.lastError) {
                    status.textContent = 'Panel not available on this page';
                    status.style.color = '#e17055';
                } else {
                    status.textContent = response ? response.message : 'Panel toggled';
                    status.style.color = '#00b894';
                }
            });
        } catch (error) {
            status.textContent = 'Error: Cannot access this page';
            status.style.color = '#e17055';
        }
    });

    // Reset panel position
    resetBtn.addEventListener('click', async function() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            chrome.tabs.sendMessage(tab.id, { action: 'resetPosition' }, function(response) {
                if (chrome.runtime.lastError) {
                    status.textContent = 'Panel not available on this page';
                    status.style.color = '#e17055';
                } else {
                    status.textContent = 'Panel position reset';
                    status.style.color = '#00b894';
                }
            });
        } catch (error) {
            status.textContent = 'Error: Cannot access this page';
            status.style.color = '#e17055';
        }
    });

    // Export detection data
    exportBtn.addEventListener('click', async function() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            chrome.tabs.sendMessage(tab.id, { action: 'exportData' }, function(response) {
                if (chrome.runtime.lastError) {
                    status.textContent = 'No detection data available';
                    status.style.color = '#e17055';
                } else {
                    status.textContent = 'Detection data exported';
                    status.style.color = '#00b894';
                }
            });
        } catch (error) {
            status.textContent = 'Error: Cannot access this page';
            status.style.color = '#e17055';
        }
    });

    // Check if content script is loaded and get real-time status
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'ping' }, function(response) {
                if (chrome.runtime.lastError) {
                    status.textContent = 'Extension not active on this page';
                    status.style.color = '#e17055';
                } else {
                    status.textContent = 'Real-time detection active!';
                    status.style.color = '#00b894';
                    
                    // Update status every 3 seconds while popup is open
                    const statusInterval = setInterval(() => {
                        chrome.tabs.sendMessage(tabs[0].id, { action: 'ping' }, function(response) {
                            if (!chrome.runtime.lastError && response) {
                                const now = new Date().toLocaleTimeString();
                                status.textContent = `Live monitoring active - ${now}`;
                            }
                        });
                    }, 3000);
                    
                    // Clear interval when popup might be closed
                    window.addEventListener('beforeunload', () => {
                        clearInterval(statusInterval);
                    });
                }
            });
        }
    });
});// Popup functionality
document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.getElementById('togglePanel');
    const resetBtn = document.getElementById('resetPosition');
    const exportBtn = document.getElementById('exportData');
    const status = document.getElementById('status');

    // Toggle panel visibility
    toggleBtn.addEventListener('click', async function() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            chrome.tabs.sendMessage(tab.id, { action: 'togglePanel' }, function(response) {
                if (chrome.runtime.lastError) {
                    status.textContent = 'Panel not available on this page';
                    status.style.color = '#e17055';
                } else {
                    status.textContent = response ? response.message : 'Panel toggled';
                    status.style.color = '#00b894';
                }
            });
        } catch (error) {
            status.textContent = 'Error: Cannot access this page';
            status.style.color = '#e17055';
        }
    });

    // Reset panel position
    resetBtn.addEventListener('click', async function() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            chrome.tabs.sendMessage(tab.id, { action: 'resetPosition' }, function(response) {
                if (chrome.runtime.lastError) {
                    status.textContent = 'Panel not available on this page';
                    status.style.color = '#e17055';
                } else {
                    status.textContent = 'Panel position reset';
                    status.style.color = '#00b894';
                }
            });
        } catch (error) {
            status.textContent = 'Error: Cannot access this page';
            status.style.color = '#e17055';
        }
    });

    // Export detection data
    exportBtn.addEventListener('click', async function() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            chrome.tabs.sendMessage(tab.id, { action: 'exportData' }, function(response) {
                if (chrome.runtime.lastError) {
                    status.textContent = 'No detection data available';
                    status.style.color = '#e17055';
                } else {
                    status.textContent = 'Detection data exported';
                    status.style.color = '#00b894';
                }
            });
        } catch (error) {
            status.textContent = 'Error: Cannot access this page';
            status.style.color = '#e17055';
        }
    });

    // Check if content script is loaded
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'ping' }, function(response) {
                if (chrome.runtime.lastError) {
                    status.textContent = 'Extension not active on this page';
                    status.style.color = '#e17055';
                } else {
                    status.textContent = 'Extension active - Ready to detect!';
                    status.style.color = '#00b894';
                }
            });
        }
    });
});