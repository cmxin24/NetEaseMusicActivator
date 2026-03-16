const TARGET_URL = "https://music.163.com/";
const BUFFER_TIME_MS = 2000;
const ALARM_NAME = "smartDailyNetEaseCheck";

function scheduleNextRun() {
    const now = new Date();
    const nextRun = new Date(now);
    
    // Set to exactly 00:00:05 of the next day
    nextRun.setHours(24, 0, 5, 0);

    const whenToRun = nextRun.getTime();
    chrome.alarms.create(ALARM_NAME, { when: whenToRun });
    console.log("Next cross-day check scheduled at:", nextRun.toLocaleString());
}

function performCheckIn() {
    // NetEase API requires the CSRF token from cookies to prevent cross-site forgery
    chrome.cookies.get({ url: TARGET_URL, name: "__csrf" }, function(cookie) {
        const csrfToken = cookie ? cookie.value : '';
        const apiUrl = "https://music.163.com/api/point/dailyTask?type=1";
        
        // Build the payload
        const params = new URLSearchParams();
        params.append('type', '1'); // 1 stands for web check-in
        if (csrfToken) {
            params.append('csrf_token', csrfToken);
        }

        // Send the POST request directly to the check-in API
        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        })
        .then(response => response.json())
        .then(data => {
            if (data.code === 200) {
                console.log("Check-in successful! Points gained:", data.point);
            } else if (data.code === -2) {
                console.log("Already checked in today. Skipping.");
            } else {
                console.log("Check-in returned unexpected status:", data);
            }
        })
        .catch(error => {
            console.error("Check-in request failed:", error);
        });
    });
}

function executeSilentMode(today) {
    // Open in background to trigger the proxy extension
    chrome.tabs.create({ url: TARGET_URL, active: false }, function(tab) {
        const targetTabId = tab.id;
        chrome.storage.local.set({ lastOpenedDate: today });
        
        const tabUpdateListener = function(tabId, changeInfo, updatedTab) {
            if (tabId === targetTabId && changeInfo.status === 'complete') {
                console.log("Page fully loaded. Preparing to close silent tab...");
                
                setTimeout(() => {
                    chrome.tabs.remove(tabId, () => {
                        if (chrome.runtime.lastError) {
                            console.log("Tab closed manually before auto-close.");
                        } else {
                            console.log("Successfully closed NetEase background tab.");
                        }
                    });
                }, BUFFER_TIME_MS);
                
                chrome.tabs.onUpdated.removeListener(tabUpdateListener);
            }
        };
        chrome.tabs.onUpdated.addListener(tabUpdateListener);
    });
}

function executeManualLoginMode(today) {
    // Open in foreground (active: true) and do NOT auto-close
    chrome.tabs.create({ url: TARGET_URL, active: true });
    chrome.storage.local.set({ lastOpenedDate: today });
    console.log("Opened NetEase Music in foreground for manual login.");
}

function checkAndOpenNetEase() {
    const today = new Date().toDateString();

    chrome.storage.local.get(['lastOpenedDate'], function(result) {
        if (result.lastOpenedDate !== today) {
            console.log("Not awakened today yet. Checking login status...");
            
            // Check for the specific login cookie 'MUSIC_U'
            chrome.cookies.get({ url: TARGET_URL, name: "MUSIC_U" }, function(cookie) {
                if (cookie) {
                    console.log("User is logged in. Executing check-in and silent mode.");
                    
                    // 1. Perform the silent API check-in
                    performCheckIn();
                    
                    // 2. Open the background tab to trigger the proxy extension
                    executeSilentMode(today);
                } else {
                    console.log("User is NOT logged in. Executing manual login mode.");
                    executeManualLoginMode(today);
                }
            });
            
        } else {
            console.log("Already awakened NetEase today. Staying asleep.");
        }

        // Always ensure the next alarm is set for the upcoming midnight
        scheduleNextRun();
    });
}

// Listen for the midnight timer
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_NAME) {
        console.log("Midnight alarm triggered. Executing cross-day check...");
        checkAndOpenNetEase();
    }
});

// Trigger when the browser starts
chrome.runtime.onStartup.addListener(() => {
    checkAndOpenNetEase();
});

// Trigger when installed or reloaded
chrome.runtime.onInstalled.addListener(() => {
    checkAndOpenNetEase();
});