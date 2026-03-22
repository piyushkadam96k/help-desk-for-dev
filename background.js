let isFocusMode = false;

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'startFocus') {
        isFocusMode = true;
        updateRules();
    } else if (request.action === 'stopFocus') {
        isFocusMode = false;
        clearRules();
    }
    // Required to keep the message channel open for async response
    sendResponse({ success: true });
    return true;
});

async function updateRules() {
    // Get blocked sites from storage
    const data = await chrome.storage.local.get('blockedSites');
    const sites = data.blockedSites || [];
    
    if (sites.length === 0) return;

    // Create rules
    const rules = sites.map((site, index) => {
        // Extract domain
        let domain = site.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '');
        try {
            domain = new URL(site.includes('://') ? site : 'https://' + site).hostname.replace(/^www\./, '');
        } catch(e) {}
        
        return {
            id: index + 1,
            priority: 1,
            action: { type: 'block' },
            condition: {
                urlFilter: `||${domain}`,
                resourceTypes: ['main_frame', 'sub_frame']
            }
        };
    });

    // Clear old rules first
    await clearRules();
    
    await chrome.declarativeNetRequest.updateDynamicRules({
        addRules: rules
    });
}

async function clearRules() {
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const ruleIds = existingRules.map(rule => rule.id);
    
    if (ruleIds.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: ruleIds
        });
    }
}
