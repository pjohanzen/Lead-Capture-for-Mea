# Google Sheets Integration Setup

This guide will help you connect your lead capture form to Google Sheets.

## Prerequisites

✅ You have a Google Sheet created with headers: **Name**, **Mobile**, **Email**

## Step 1: Open Google Apps Script

1. Open your Google Sheet
2. Click on **Extensions** → **Apps Script**
3. A new tab will open with the Apps Script editor

## Step 2: Add the Script Code

1. Delete any existing code in the editor
2. Copy **ALL** the code from `backend/googleAppScript.js`
3. Paste it into the Apps Script editor
4. **IMPORTANT**: Update the sheet name if needed:
   ```javascript
   const CONFIG = {
     sheetName: 'Sheet1', // Change this to your actual sheet tab name
     ...
   }
   ```

## Step 3: Deploy as Web App

1. Click the **Deploy** button (top right) → **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Configure the deployment:
   - **Description**: "Lead Capture Form v1" (or any name)
   - **Execute as**: **Me** (your email)
   - **Who has access**: **Anyone** (this allows the form to submit data)
5. Click **Deploy**
6. **Review permissions**:
   - Click **Authorize access**
   - Choose your Google account
   - Click **Advanced** → **Go to [Your Project Name] (unsafe)**
   - Click **Allow**
7. **COPY THE WEB APP URL** - it will look like:
   ```
   https://script.google.com/macros/s/AKfycbz.../exec
   ```

## Step 4: Connect the Form

1. Open `script.js` in your project
2. Find this line (near the top):
   ```javascript
   const GOOGLE_APPS_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
   ```
3. Replace `'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE'` with the URL you copied
4. Save the file

## Step 5: Test the Form

1. Open `page1.html` in your browser
2. Fill out the form with test data
3. Click "Reserve My Spot"
4. Check your Google Sheet - you should see a new row with the data!

## Troubleshooting

### Form shows "Failed to save lead"

- **Check the URL**: Make sure you copied the complete Web App URL (ending in `/exec`)
- **Check permissions**: The deployment must be set to "Anyone" access
- **Check the console**: Open browser DevTools (F12) and look for error messages

### Data not appearing in sheet

- **Check sheet name**: Verify the `sheetName` in the script matches your tab name
- **Check headers**: Make sure your sheet has **Name**, **Mobile**, **Email** headers in row 1

### "Script not authorized" error

- Redeploy the script and go through the authorization flow again
- Make sure you're signed into the correct Google account

## Testing the Script Directly

You can test if the Google Apps Script is working:

1. In Apps Script editor, select the `testAppendData` function from the dropdown
2. Click **Run** (▶️ button)
3. Check your Google Sheet - you should see a test row added

## Important Notes

- **URL Security**: The Web App URL is public but only accepts POST requests from your form
- **Data Validation**: The script validates that all three fields (name, mobile, email) are present
- **Error Handling**: Any errors are logged and returned to the form

## Need to Update the Script?

If you make changes to `googleAppScript.js`:

1. Copy the updated code
2. Paste it in the Apps Script editor
3. Save (Ctrl+S or Cmd+S)
4. Deploy → **Manage deployments**
5. Click the pencil icon ✏️ on your deployment
6. Update the **Version** to "New version"
7. Click **Deploy**
8. The URL stays the same - no need to update `script.js`

## What Happens When Someone Submits?

1. User fills out the form on `page1.html`
2. Form data is sent to your Google Apps Script URL
3. Script validates the data
4. Script appends a new row to your Google Sheet
5. User is redirected to `page2.html`

---

**Questions?** Check the browser console (F12) for detailed error messages.
