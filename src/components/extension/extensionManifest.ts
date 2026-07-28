export const MANIFEST_JSON = `{
  "manifest_version": 3,
  "name": "SalesPilot - CRM Lead Capture & AI SDR",
  "version": "2.4.0",
  "description": "Capture LinkedIn leads, detect business emails, and sync contacts to SalesPilot CRM in 1 click.",
  "permissions": [
    "activeTab",
    "scripting",
    "storage"
  ],
  "host_permissions": [
    "https://*/*",
    "http://*/*"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": "icon.png"
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["https://www.linkedin.com/in/*", "https://*/*"],
      "js": ["content.js"]
    }
  ]
}`;

export const CONTENT_JS = `// SalesPilot Content Script - LinkedIn & Website Scraper
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "SCRAPE_PAGE") {
    const isLinkedin = window.location.hostname.includes("linkedin.com");
    let scrapedData = {};

    if (isLinkedin) {
      const nameEl = document.querySelector(".text-heading-xlarge") || document.querySelector("h1");
      const titleEl = document.querySelector(".text-body-medium") || document.querySelector(".pv-text-details__left-panel div");
      const fullName = nameEl ? nameEl.innerText.trim() : "";
      const parts = fullName.split(" ");
      
      scrapedData = {
        type: "linkedin",
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" ") || "",
        title: titleEl ? titleEl.innerText.trim() : "Executive",
        company: "Detected Company",
        url: window.location.href
      };
    } else {
      scrapedData = {
        type: "website",
        title: document.title,
        url: window.location.href,
        company: window.location.hostname.replace("www.", "").split(".")[0]
      };
    }

    sendResponse({ success: true, data: scrapedData });
  }
  return true;
});`;

export const POPUP_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SalesPilot Extension</title>
  <style>
    body { width: 340px; font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 12px; }
    .btn { background: #6366f1; color: white; border: none; padding: 8px 12px; border-radius: 8px; font-weight: bold; width: 100%; cursor: pointer; }
    .btn:hover { background: #4f46e5; }
    input { width: 100%; padding: 6px; margin: 4px 0; background: #1e293b; border: 1px solid #334155; color: white; border-radius: 6px; box-sizing: border-box; }
  </style>
</head>
<body>
  <div style="display:flex; align-items:center; justify-between; border-bottom:1px solid #334155; padding-bottom:8px; margin-bottom:8px;">
    <h3 style="margin:0; font-size:14px;">SalesPilot SDR</h3>
    <span style="font-size:10px; color:#10b981;">CONNECTED</span>
  </div>
  <div>
    <input id="firstName" placeholder="First Name">
    <input id="company" placeholder="Company">
    <input id="email" placeholder="Business Email">
    <button id="saveBtn" class="btn" style="margin-top:8px;">1-Click Save to CRM</button>
  </div>
  <script src="popup.js"></script>
</body>
</html>`;
