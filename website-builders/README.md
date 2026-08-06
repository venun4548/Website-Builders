# Website Builders - Project Setup

This is a premium static business website designed with HTML5, CSS3, and Vanilla JavaScript. It includes a functional contact form that saves submissions to Google Sheets using Google Apps Script.

## Features Included
- **100% Responsive Design** (Desktop, Tablet, Mobile)
- **Glassmorphism & Modern UI** (Soft shadows, rounded corners, blur effects)
- **Vanilla JavaScript Animations** (Intersection Observer, Typewriter, Counters)
- **No External Frameworks** (No React, Tailwind, or Bootstrap)
- **Google Sheets Backend** (Contact form connected via Fetch API)

## Folder Structure
```text
website-builders/
├── css/
│   ├── style.css         # Core CSS variables, typography, component styles
│   ├── animations.css    # Keyframe animations and scroll reveal states
│   └── responsive.css    # Media queries for tablet/mobile
├── js/
│   ├── main.js           # UI logic (sticky nav, scroll reveal, counters)
│   └── contact.js        # Contact form validation and submission
├── images/               # Image assets folder
├── index.html            # Home page
├── services.html         # Services & Pricing page
├── contact.html          # Contact page with form
├── google-app-script.js  # Apps script backend code
└── README.md             # This file
```

---

## Google Apps Script Setup (Contact Form)

To make the contact form functional, follow these steps to deploy your Google Apps Script Web App:

1. Go to [Google Sheets](https://sheets.google.com) and create a **Blank spreadsheet**.
2. Name the spreadsheet (e.g., `Website Builders Form Submissions`).
3. In the first row, create these exact headers (A1 to F1):
   - `Timestamp`
   - `Name`
   - `Email`
   - `Mobile Number`
   - `Address`
   - `Message`
4. Click on **Extensions > Apps Script** in the top menu.
5. Delete any placeholder code in the script editor.
6. Open the `google-app-script.js` file from this project and copy its entire contents.
7. Paste the code into the Google Apps Script editor.
8. Click the **Save** icon.
9. Select the function `initialSetup` from the dropdown menu in the toolbar (next to "Run" and "Debug").
10. Click **Run**.
    - *Note: Google will ask for permissions. Click "Review permissions", choose your Google account, click "Advanced", and then "Go to [Project Name] (unsafe)". Finally, click "Allow".*
11. In the top right corner, click the **Deploy** button and select **New deployment**.
12. Click the gear icon next to "Select type" and choose **Web app**.
13. Set up the deployment exactly like this:
    - **Description**: `Contact Form v1`
    - **Execute as**: `Me`
    - **Who has access**: `Anyone`
14. Click **Deploy**.
15. **Copy the "Web app URL"** provided.
16. Open `js/contact.js` in this project.
17. Locate this line:
    ```javascript
    const scriptURL = 'https://script.google.com/macros/s/AKfycby-YOUR-WEB-APP-URL-HERE/exec';
    ```
18. Replace the placeholder URL with the actual Web app URL you just copied.

Your contact form is now fully functional! Submissions will appear instantly in your Google Sheet.
