# Measurement Form (Page 2) Setup - SINGLE SHEET VERSION

## What's Been Updated

✅ Google Apps Script now handles **both forms** (Page 1 and Page 2)
✅ **All data saves to Sheet1** in a single row
✅ Page 1 creates a new row with Name, Mobile, Email
✅ Page 2 updates the same row with all 9 measurements
✅ `script.js` updated to track row numbers and update the correct row

## Sheet Structure

**Sheet1 Headers (12 columns):**
```
Name | Mobile | Email | Bust (inches) | Natural Waist (inches) | Pant Waist (Mid Rise) (inches) | Hip (inches) | Thigh (inches) | Jacket Length Preference | Jacket Width Preference | Pants Length Preference | Pants Width Preference
```

## Setup Instructions

### Step 1: Update Google Apps Script

1. Go to your Google Sheet
2. Open **Extensions** → **Apps Script**
3. **Replace ALL the code** with the new complete script (see the code block in the chat above)
4. Click **Save** (💾)

### Step 2: Verify Sheet Headers

Make sure **Sheet1** has these headers in row 1:
- Column A: `Name`
- Column B: `Mobile`
- Column C: `Email`
- Column D: `Bust (inches)`
- Column E: `Natural Waist (inches)`
- Column F: `Pant Waist (Mid Rise) (inches)`
- Column G: `Hip (inches)`
- Column H: `Thigh (inches)`
- Column I: `Jacket Length Preference`
- Column J: `Jacket Width Preference`
- Column K: `Pants Length Preference`
- Column L: `Pants Width Preference`

### Step 3: Redeploy

1. Click **Deploy** → **Manage deployments**
2. Click the **pencil icon** ✏️ 
3. Change **Version** to **New version**
4. Click **Deploy**
5. The URL stays the same (no need to update `script.js` again)

### Step 4: Test Both Forms

#### Test Page 1:
1. Open `page1.html`
2. Fill in name, phone, email
3. Click "Reserve My Spot"
4. Check **Sheet1** - should have a new row with Name, Mobile, Email (columns D-L empty)

#### Test Page 2:
1. After submitting page 1, you'll be redirected to `page2.html`
2. Fill in all measurements
3. Click "Get My Measurements"
4. Check **Sheet1** - the same row should now have all measurements filled in (columns D-L)

## How It Works

### Page 1 Submission:
```
User fills form → POST to Google Apps Script with formType: 'page1' 
→ Creates new row with Name, Mobile, Email (+ 9 empty columns)
→ Returns row number (e.g., 2)
→ Row number saved to localStorage
→ User redirected to page2.html
```

### Page 2 Submission:
```
User fills measurements → Retrieves row number from localStorage
→ POST to Google Apps Script with formType: 'page2' and rowNumber
→ Updates the same row (columns D-L) with measurements
→ User redirected to thanks.html
```

## Example Result in Sheet1

After both forms are submitted, you'll have one complete row:

| Name | Mobile | Email | Bust | Natural Waist | Pant Waist | Hip | Thigh | Jacket Length | Jacket Width | Pants Length | Pants Width |
|------|--------|-------|------|---------------|------------|-----|-------|---------------|--------------|--------------|-------------|
| John Doe | +63 912 345 6789 | john@example.com | 35.5 | 28.5 | 30 | 38 | 22 | Regular | Slim | Regular | Regular |

## Testing in Apps Script Editor

You can test each form independently:

**Test Page 1:**
1. Select `testPage1` from the function dropdown
2. Click **Run** (▶️)
3. Check Sheet1 - should create a new row with contact info only
4. Note the row number in the logs

**Test Page 2:**
1. Update the `rowNumber` in `testPage2` function with the actual row from testPage1
2. Select `testPage2` from the function dropdown
3. Click **Run** (▶️)
4. Check Sheet1 - the same row should now have measurements

## Troubleshooting

### "Sheet not found" error
- Verify the sheet tab name is exactly "Sheet1" (case-sensitive)
- Or update the `sheetName` in CONFIG if your tab has a different name

### "Invalid row number" error on page 2
- This means you didn't complete page 1 first
- Always start from page 1, which creates the row and saves the row number

### Measurements save to wrong row
- Clear your browser's localStorage and start fresh from page 1
- Make sure you're not clicking browser "back" button between pages

### Data overwrites previous submission
- This is expected if you submit page 1 again - it creates a NEW row
- Each page 1 submission creates a new row
- Page 2 only updates the most recent row number

## Data Flow Summary

1. **User submits Page 1** → New row created in Sheet1 (columns A-C filled)
2. **Row number stored** → In browser localStorage as `essatoLeadRowId`
3. **User submits Page 2** → Same row updated (columns D-L filled)
4. **Complete row** → All 12 columns now have data

---

**Questions?** Check the browser console (F12) for detailed error messages.
