const TARGET_URL = "https://music.163.com/";
const BUFFER_TIME_MS = 2000;
const ALARM_NAME = "smartDailyNetEaseCheck";

// Icon Paths
const ICONS_RED = {
    "16": "images/red16.png",
    "48": "images/red48.png",
    "128": "images/red128.png"
};
const ICONS_GRAY = {
    "16": "images/gray16.png",
    "48": "images/gray48.png",
    "128": "images/gray128.png"
};

/**
 * UI & Icon Manager
 */
function updateUI(isEnabled) {
    if (isEnabled) {
        chrome.action.setIcon({ path: ICONS_RED });
        chrome.action.setTitle({ title: "TuneWake: Active" });
    } else {
        chrome.action.setIcon({ path: ICONS_GRAY });
        chrome.action.setTitle({ title: "TuneWake: Disabled (Click to enable)" });
    }
}

/**
 * Schedule next run at 00:00:05 of the next day
 */
function scheduleNextRun() {
    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setHours(24, 0, 5, 0);
    chrome.alarms.create(ALARM_NAME, { when: nextRun.getTime() });
    console.log("Next check scheduled at:", nextRun.toLocaleString());
}

/**
 * API Check-in Logic
 */
function performCheckIn() {
    chrome.cookies.get({ url: TARGET_URL, name: "__csrf" }, (cookie) => {
        const csrfToken = cookie ? cookie.value : '';
        const apiUrl = "https://music.163.com/api/point/dailyTask?type=1";
        
        const params = new URLSearchParams();
        params.append('type', '1');
        if (csrfToken) params.append('csrf_token', csrfToken);

        fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        })
        .then(res => res.json())
        .then(data => {
            if (data.code === 200) console.log("Check-in success! Points:", data.point);
            else if (data.code === -2) console.log("Already checked in today.");
        })
        .catch(err => console.error("Check-in error:", err));
    });
}

/**
 * Tab Manager (Silent or Manual)
 */
function executeTask(today, isSilent) {
    chrome.tabs.create({ url: TARGET_URL, active: !isSilent }, (tab) => {
        chrome.storage.local.set({ lastOpenedDate: today });
        if (!isSilent) return; // Stay open for manual login

        const tabId = tab.id;
        const listener = (id, info) => {
            if (id === tabId && info.status === 'complete') {
                setTimeout(() => {
                    chrome.tabs.remove(id, () => chrome.runtime.lastError);
                    console.log("Silent task completed and tab closed.");
                }, BUFFER_TIME_MS);
                chrome.tabs.onUpdated.removeListener(listener);
            }
        };
        chrome.tabs.onUpdated.addListener(listener);
    });
}

/**
 * Main Orchestrator
 */
function checkAndRun() {
    chrome.storage.local.get(['isEnabled', 'lastOpenedDate'], (res) => {
        const isEnabled = res.isEnabled !== false;
        updateUI(isEnabled);

        if (!isEnabled) {
            console.log("TuneWake is OFF. Skipping...");
            return;
        }

        const today = new Date().toDateString();
        if (res.lastOpenedDate !== today) {
            chrome.cookies.get({ url: TARGET_URL, name: "MUSIC_U" }, (cookie) => {
                if (cookie) {
                    performCheckIn();
                    executeTask(today, true);
                } else {
                    executeTask(today, false);
                }
            });
        }
        scheduleNextRun();
    });
}

/**
 * Event Listeners
 */

// Toggle Switch on Click
chrome.action.onClicked.addListener(() => {
    chrome.storage.local.get(['isEnabled'], (res) => {
        const newState = res.isEnabled === false;
        chrome.storage.local.set({ isEnabled: newState }, () => {
            updateUI(newState);
            if (newState) checkAndRun();
        });
    });
});

chrome.alarms.onAlarm.addListener((a) => {
    if (a.name === ALARM_NAME) checkAndRun();
});

chrome.runtime.onStartup.addListener(checkAndRun);
chrome.runtime.onInstalled.addListener(checkAndRun);