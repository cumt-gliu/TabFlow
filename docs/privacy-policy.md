# TabFlow Privacy Policy

Last updated: May 12, 2026

## Overview

TabFlow is a Chrome extension for browsing history management and search. This privacy policy explains what data TabFlow accesses and how it handles your information.

## Data Collection and Usage

### Browsing History

TabFlow accesses your Chrome browsing history (`chrome.history` API) solely to provide its core functionality:
- Searching your browsing history by title and URL
- Viewing history grouped by domain or time period
- Exporting history data in CSV or JSON format (only when you explicitly trigger an export)
- Batch deleting history records (only when you explicitly select and delete)

All history data is accessed directly from Chrome's built-in history engine. TabFlow does **not**:
- Store your browsing history on external servers
- Send your browsing data over the network
- Track your browsing activity
- Collect analytics or telemetry

### Local Storage

TabFlow uses `chrome.storage.local` to cache your recent search queries and user preferences. This data stays entirely on your local device and is never transmitted anywhere.

### Active Tab Access

TabFlow uses the `tabs` permission only to open the management page when you use the keyboard shortcut (`Ctrl+Shift+L` / `Cmd+Shift+L`).

## Data Sharing

TabFlow does **not** collect, transmit, or share any personal data. There are no third-party analytics, tracking scripts, or external services integrated into this extension.

## Data Retention

TabFlow does not maintain its own database of your history. All history data is retrieved on-demand from Chrome's native history system. Locally cached preferences (such as recent searches) can be cleared at any time via Chrome's extension management page.

## Third-Party Services

TabFlow does not communicate with any third-party services or external servers. The extension operates entirely client-side within your browser.

## Updates

This privacy policy may be updated occasionally. Any changes will be reflected in the extension's Chrome Web Store listing and the `docs/privacy-policy.md` file in the extension's source repository.

## Contact

For questions about this privacy policy, please open an issue on the TabFlow GitHub repository.
