[简体中文](README.md) ｜ **English**

# NetEaseMusicCheck

NetEase Cloud Music daily auto check-in, running silently in the background without disturbing your daily browsing experience. Suitable for overseas users in combination with [NetEaseMusicWorld++](https://github.com/kogamitora/NetEaseMusicWorldNext), the mobile client will also be unlocked synchronously.

## Key Features

- **Auto Check-in**: Automatically opens the NetEase Cloud Music webpage to check in every day.
- **Scheduled Execution**: If the browser is not open or in sleep mode, it will execute the next time it is opened.
- **Background Operation**: The check-in process is completed silently in the background without popping up notifications.

## Installation

Waiting for Chrome Web Store review...

## Usage

1. **Login**: First, **log in** to your account on the [NetEase Cloud Music official website (music.163.com)](https://music.163.com/).
2. **Auto Run**: The extension will automatically read your login status (Cookies) and perform the daily check-in task automatically in the background.
3. **Status Toggle**: Click the logo to disable it when not needed, and the logo will automatically turn gray.

## Privacy Policy

1. No Data Collection: This extension does not collect, store, or transmit any personally identifiable information (PII), music listening history, or private user data to any external servers.

2. The permissions requested by this extension are used strictly for its core functionalities as follows:

- **Storage**: Used locally to save the extension's toggle state and the last execution date to prevent redundant tasks.

- **Tabs**: Used to open the NetEase Music webpage in the background and close it automatically once the page has fully loaded.

- **Alarms**: Used to schedule precise daily triggers, ensuring the extension performs its tasks silently and reliably.

- **Cookies & Host Permissions**: Used locally to detect login status (reading MUSIC_U) and retrieve the CSRF token required for check-ins. All cookie processing is performed within the user's local browser environment and is never leaked.

3. All code is open for use under the GPL-3.0.
