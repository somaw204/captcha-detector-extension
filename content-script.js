(function() {
    'use strict';

    // Detection results
    let detectionResults = {
        reCAPTCHA: false,
        hCaptcha: false,
        Turnstile: false,
        FunCAPTCHA: false,
        ArkoseLabs: false,
        CloudflareChallenge: false
    };

    // UI Elements
    let floatingPanel = null;
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    let isCollapsed = false;
    let isDarkMode = true;
    let isAlwaysVisible = true;
    let detectionInterval = null;

    // Detection patterns
    const detectionPatterns = {
        reCAPTCHA: {
            scripts: ['recaptcha/api.js', 'www.google.com/recaptcha', 'www.gstatic.com/recaptcha'],
            iframes: ['recaptcha'],
            variables: ['grecaptcha', '__recaptcha_api']
        },
        hCaptcha: {
            scripts: ['hcaptcha.com/1/api.js', 'hcaptcha.com'],
            iframes: ['hcaptcha'],
            variables: ['hcaptcha']
        },
        Turnstile: {
            scripts: ['challenges.cloudflare.com/turnstile', 'cloudflare.com/turnstile'],
            iframes: ['turnstile'],
            variables: ['turnstile']
        },
        FunCAPTCHA: {
            scripts: ['funcaptcha.com', 'arkoselabs.com'],
            iframes: ['funcaptcha', 'arkose'],
            variables: ['funcaptcha']
        },
        ArkoseLabs: {
            scripts: ['arkoselabs.com', 'arkose-labs.com'],
            iframes: ['arkose'],
            variables: ['arkose']
        }
    };

    // Initialize detection
    function init() {
        // Force panel to always be visible
        chrome.storage.local.get(['captchaDetectorSettings'], (result) => {
            const settings = result.captchaDetectorSettings || {};
            if (settings.isAlwaysVisible !== false) {
                isAlwaysVisible = true;
            }
        });

        performDetection();
        createFloatingUI();
        setupMutationObserver();
        setupRealtimeDetection();
        loadSettings();
        
        // Ensure panel stays visible
        ensurePanelVisibility();
    }

    // Setup real-time detection
    function setupRealtimeDetection() {
        // Continuous detection every 2 seconds
        detectionInterval = setInterval(() => {
            const previousResults = { ...detectionResults };
            performDetection();
            
            // Check if any detection status changed
            let hasChanges = false;
            Object.keys(detectionResults).forEach(key => {
                if (previousResults[key] !== detectionResults[key]) {
                    hasChanges = true;
                    showNotification(key, detectionResults[key]);
                }
            });
            
            if (hasChanges) {
                updateUI();
            }
        }, 2000);

        // Also check on page interactions
        document.addEventListener('click', () => setTimeout(performDetection, 500));
        document.addEventListener('scroll', () => setTimeout(performDetection, 500));
        
        // Monitor for new network requests that might load CAPTCHAs
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            return originalFetch.apply(this, args).then(response => {
                setTimeout(performDetection, 1000);
                return response;
            });
        };
    }

    // Show notification when CAPTCHA status changes
    function showNotification(captchaType, isFound) {
        if (!floatingPanel) return;
        
        const notification = document.createElement('div');
        notification.className = 'captcha-detector-notification';
        notification.innerHTML = `
            <span class="notification-icon">${isFound ? '🔍' : '❌'}</span>
            <span class="notification-text">
                ${formatCaptchaName(captchaType)} ${isFound ? 'DETECTED' : 'REMOVED'}
            </span>
        `;
        
        floatingPanel.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Ensure panel stays visible
    function ensurePanelVisibility() {
        if (!isAlwaysVisible) return;
        
        setInterval(() => {
            if (!floatingPanel || !document.body.contains(floatingPanel)) {
                createFloatingUI();
            }
            
            // Make sure panel is visible
            if (floatingPanel) {
                floatingPanel.style.display = 'block';
                if (!floatingPanel.classList.contains('captcha-detector-visible')) {
                    floatingPanel.classList.add('captcha-detector-visible');
                }
            }
        }, 1000);
        
        // Prevent panel from being hidden by other scripts
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.target === floatingPanel) {
                    if (floatingPanel.style.display === 'none' && isAlwaysVisible) {
                        floatingPanel.style.display = 'block';
                    }
                }
            });
        });
        
        if (floatingPanel) {
            observer.observe(floatingPanel, { attributes: true });
        }
    }
    function performDetection() {
        // Reset results
        Object.keys(detectionResults).forEach(key => {
            if (key !== 'CloudflareChallenge') {
                detectionResults[key] = false;
            }
        });

        // Detect Cloudflare challenge page
        detectionResults.CloudflareChallenge = detectCloudflareChallenge();

        // Detect CAPTCHA systems
        Object.keys(detectionPatterns).forEach(captchaType => {
            detectionResults[captchaType] = detectCaptchaType(captchaType);
        });

        updateUI();
    }

    // Detect specific CAPTCHA type
    function detectCaptchaType(type) {
        const patterns = detectionPatterns[type];

        // Check scripts
        const scripts = document.querySelectorAll('script[src]');
        for (let script of scripts) {
            const src = script.src.toLowerCase();
            if (patterns.scripts.some(pattern => src.includes(pattern.toLowerCase()))) {
                return true;
            }
        }

        // Check iframes
        const iframes = document.querySelectorAll('iframe[src]');
        for (let iframe of iframes) {
            const src = iframe.src.toLowerCase();
            if (patterns.iframes.some(pattern => src.includes(pattern.toLowerCase()))) {
                return true;
            }
        }

        // Check window variables
        if (patterns.variables.some(variable => window[variable])) {
            return true;
        }

        // Check for data attributes and classes
        const elements = document.querySelectorAll('*');
        for (let element of elements) {
            const className = element.className.toLowerCase();
            const id = element.id.toLowerCase();
            
            if (patterns.iframes.some(pattern => 
                className.includes(pattern) || id.includes(pattern)
            )) {
                return true;
            }
        }

        return false;
    }

    // Detect Cloudflare challenge
    function detectCloudflareChallenge() {
        // Check for challenge page title
        const title = document.title.toLowerCase();
        if (title.includes('just a moment') || title.includes('checking your browser')) {
            return true;
        }

        // Check for Cloudflare challenge elements
        const challengeElements = [
            '.cf-browser-verification',
            '.cf-checking-browser',
            '#challenge-running',
            '.challenge-running'
        ];

        for (let selector of challengeElements) {
            if (document.querySelector(selector)) {
                return true;
            }
        }

        // Check for Cloudflare meta tags
        const metaTags = document.querySelectorAll('meta[name="description"]');
        for (let meta of metaTags) {
            if (meta.content && meta.content.toLowerCase().includes('cloudflare')) {
                return true;
            }
        }

        return false;
    }

    // Create floating UI
    function createFloatingUI() {
        if (floatingPanel) return;

        // Create main container
        floatingPanel = document.createElement('div');
        floatingPanel.id = 'captcha-detector-panel';
        floatingPanel.className = 'captcha-detector-panel';

        // Create header
        const header = document.createElement('div');
        header.className = 'captcha-detector-header';
        header.innerHTML = `
            <div class="captcha-detector-title">
                <span class="captcha-detector-icon">🛡️</span>
                <span>CAPTCHA Detector</span>
                <span class="captcha-detector-status-badge" id="realtime-status">LIVE</span>
            </div>
            <div class="captcha-detector-controls">
                <button class="captcha-detector-btn theme-toggle" title="Toggle Theme">🌙</button>
                <button class="captcha-detector-btn export-btn" title="Export Results">📊</button>
                <button class="captcha-detector-btn toggle-btn" title="Minimize">−</button>
            </div>
        `;

        // Create content area
        const content = document.createElement('div');
        content.className = 'captcha-detector-content';

        const detectionList = document.createElement('div');
        detectionList.className = 'captcha-detector-list';

        // Add detection items
        Object.keys(detectionResults).forEach(type => {
            const item = document.createElement('div');
            item.className = 'captcha-detector-item';
            item.innerHTML = `
                <span class="captcha-detector-name">${formatCaptchaName(type)}</span>
                <span class="captcha-detector-status" data-type="${type}">NOT FOUND</span>
            `;
            detectionList.appendChild(item);
        });

        content.appendChild(detectionList);

        // Assemble panel
        floatingPanel.appendChild(header);
        floatingPanel.appendChild(content);

        // Add to page
        document.body.appendChild(floatingPanel);

        // Add event listeners
        setupEventListeners();

        // Initial animation
        setTimeout(() => {
            floatingPanel.classList.add('captcha-detector-visible');
        }, 100);
    }

    // Setup event listeners
    function setupEventListeners() {
        const header = floatingPanel.querySelector('.captcha-detector-header');
        const toggleBtn = floatingPanel.querySelector('.toggle-btn');
        const themeBtn = floatingPanel.querySelector('.theme-toggle');
        const exportBtn = floatingPanel.querySelector('.export-btn');

        // Dragging functionality
        header.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);

        // Update live status indicator
    function updateLiveStatus() {
        const statusBadge = floatingPanel.querySelector('#realtime-status');
        if (statusBadge) {
            statusBadge.classList.add('pulse');
            statusBadge.textContent = 'LIVE';
            
            // Update timestamp
            const now = new Date();
            statusBadge.title = `Last updated: ${now.toLocaleTimeString()}`;
        }
    }
        toggleBtn.addEventListener('click', toggleCollapse);

        // Theme toggle
        themeBtn.addEventListener('click', toggleTheme);

        // Export results
        exportBtn.addEventListener('click', exportResults);
        
        // Update live status indicator
        updateLiveStatus();
    }

    // Dragging functions
    function startDrag(e) {
        if (e.target.classList.contains('captcha-detector-btn')) return;
        
        isDragging = true;
        const rect = floatingPanel.getBoundingClientRect();
        dragOffset.x = e.clientX - rect.left;
        dragOffset.y = e.clientY - rect.top;
        
        floatingPanel.style.transition = 'none';
        document.body.style.userSelect = 'none';
    }

    function drag(e) {
        if (!isDragging) return;
        
        e.preventDefault();
        const x = e.clientX - dragOffset.x;
        const y = e.clientY - dragOffset.y;
        
        // Keep within viewport
        const maxX = window.innerWidth - floatingPanel.offsetWidth;
        const maxY = window.innerHeight - floatingPanel.offsetHeight;
        
        const clampedX = Math.max(0, Math.min(x, maxX));
        const clampedY = Math.max(0, Math.min(y, maxY));
        
        floatingPanel.style.left = clampedX + 'px';
        floatingPanel.style.top = clampedY + 'px';
        floatingPanel.style.right = 'auto';
        floatingPanel.style.bottom = 'auto';
    }

    function stopDrag() {
        isDragging = false;
        floatingPanel.style.transition = '';
        document.body.style.userSelect = '';
    }

    // Toggle collapse
    function toggleCollapse() {
        isCollapsed = !isCollapsed;
        const content = floatingPanel.querySelector('.captcha-detector-content');
        const toggleBtn = floatingPanel.querySelector('.toggle-btn');
        
        if (isCollapsed) {
            content.style.display = 'none';
            toggleBtn.textContent = '+';
            floatingPanel.classList.add('collapsed');
        } else {
            content.style.display = 'block';
            toggleBtn.textContent = '−';
            floatingPanel.classList.remove('collapsed');
        }
        
        saveSettings();
    }

    // Close panel - Modified to respect always visible setting
    function closePanel() {
        // Only allow closing if not set to always visible
        if (!isAlwaysVisible) {
            floatingPanel.classList.remove('captcha-detector-visible');
            setTimeout(() => {
                if (floatingPanel && floatingPanel.parentNode) {
                    floatingPanel.parentNode.removeChild(floatingPanel);
                    floatingPanel = null;
                }
            }, 300);
        } else {
            // Just minimize instead of closing
            toggleCollapse();
        }
    }

    // Toggle theme
    function toggleTheme() {
        isDarkMode = !isDarkMode;
        const themeBtn = floatingPanel.querySelector('.theme-toggle');
        
        if (isDarkMode) {
            floatingPanel.classList.remove('light-theme');
            themeBtn.textContent = '🌙';
        } else {
            floatingPanel.classList.add('light-theme');
            themeBtn.textContent = '☀️';
        }
        
        saveSettings();
    }

    // Export results
    function exportResults() {
        const results = {
            url: window.location.href,
            timestamp: new Date().toISOString(),
            detections: detectionResults,
            userAgent: navigator.userAgent
        };

        const blob = new Blob([JSON.stringify(results, null, 2)], { 
            type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `captcha-detection-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Update UI with detection results
    function updateUI() {
        if (!floatingPanel) return;

        Object.keys(detectionResults).forEach(type => {
            const statusElement = floatingPanel.querySelector(`[data-type="${type}"]`);
            if (statusElement) {
                const isFound = detectionResults[type];
                statusElement.textContent = isFound ? 'FOUND' : 'NOT FOUND';
                statusElement.className = `captcha-detector-status ${isFound ? 'found' : 'not-found'}`;
                
                // Add animation when status changes
                statusElement.classList.add('status-update');
                setTimeout(() => statusElement.classList.remove('status-update'), 500);
            }
        });
        
        // Update live status
        updateLiveStatus();
        
        // Update total count
        const foundCount = Object.values(detectionResults).filter(Boolean).length;
        const totalCount = Object.keys(detectionResults).length;
        
        const statusBadge = floatingPanel.querySelector('#realtime-status');
        if (statusBadge) {
            statusBadge.textContent = `LIVE (${foundCount}/${totalCount})`;
        }
    }

    // Format CAPTCHA names for display
    function formatCaptchaName(type) {
        const names = {
            reCAPTCHA: 'reCAPTCHA',
            hCaptcha: 'hCaptcha',
            Turnstile: 'Cloudflare Turnstile',
            FunCAPTCHA: 'FunCAPTCHA',
            ArkoseLabs: 'Arkose Labs',
            CloudflareChallenge: 'Cloudflare Challenge'
        };
        return names[type] || type;
    }

    // Setup mutation observer for dynamic content
    function setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            let shouldRecheck = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check if added node contains CAPTCHA elements
                            if (node.tagName === 'SCRIPT' || 
                                node.tagName === 'IFRAME' ||
                                node.querySelector('script, iframe')) {
                                shouldRecheck = true;
                            }
                        }
                    });
                }
            });
            
            if (shouldRecheck) {
                setTimeout(performDetection, 500);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Save settings to storage
    function saveSettings() {
        const settings = {
            isDarkMode,
            isCollapsed,
            isAlwaysVisible: true, // Always keep true
            position: {
                left: floatingPanel.style.left,
                top: floatingPanel.style.top,
                right: floatingPanel.style.right,
                bottom: floatingPanel.style.bottom
            }
        };
        
        chrome.storage.local.set({ captchaDetectorSettings: settings });
    }

    // Load settings from storage
    function loadSettings() {
        chrome.storage.local.get(['captchaDetectorSettings'], (result) => {
            if (result.captchaDetectorSettings) {
                const settings = result.captchaDetectorSettings;
                
                isDarkMode = settings.isDarkMode !== false;
                isCollapsed = settings.isCollapsed || false;
                
                if (settings.position && floatingPanel) {
                    Object.keys(settings.position).forEach(key => {
                        if (settings.position[key]) {
                            floatingPanel.style[key] = settings.position[key];
                        }
                    });
                }
                
                // Apply theme
                if (!isDarkMode && floatingPanel) {
                    floatingPanel.classList.add('light-theme');
                    const themeBtn = floatingPanel.querySelector('.theme-toggle');
                    if (themeBtn) themeBtn.textContent = '☀️';
                }
                
                // Apply collapse state
                if (isCollapsed && floatingPanel) {
                    const content = floatingPanel.querySelector('.captcha-detector-content');
                    const toggleBtn = floatingPanel.querySelector('.toggle-btn');
                    if (content) content.style.display = 'none';
                    if (toggleBtn) toggleBtn.textContent = '+';
                    floatingPanel.classList.add('collapsed');
                }
            }
        });
    }

    // Message listener for popup communication
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        switch (request.action) {
            case 'ping':
                sendResponse({ status: 'active', alwaysVisible: isAlwaysVisible });
                break;
            case 'togglePanel':
                // Panel is always visible, just toggle collapse state
                toggleCollapse();
                sendResponse({ message: isCollapsed ? 'Panel minimized' : 'Panel expanded' });
                break;
            case 'resetPosition':
                if (floatingPanel) {
                    floatingPanel.style.top = '20px';
                    floatingPanel.style.right = '20px';
                    floatingPanel.style.left = 'auto';
                    floatingPanel.style.bottom = 'auto';
                    sendResponse({ message: 'Position reset' });
                } else {
                    sendResponse({ message: 'Panel not found' });
                }
                break;
            case 'exportData':
                exportResults();
                sendResponse({ message: 'Data exported' });
                break;
            case 'forceDetection':
                performDetection();
                sendResponse({ message: 'Detection forced', results: detectionResults });
                break;
            default:
                sendResponse({ error: 'Unknown action' });
        }
    });

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();