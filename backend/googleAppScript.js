// Google Apps Script for Lead Capture Form
// This code should be deployed as a Web App in your Google Sheet

// Configuration
const CONFIG = {
  spreadsheetId: '1QU360aRaL47SYpR7JzdPJC2-g6_ucQ1eRkpaPPF56lM', // OPTIONAL: Leave empty to use the spreadsheet this script is attached to
                     // OR add your spreadsheet ID from the URL: https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/edit
  sheetName: 'Sheet1', // Change this to match your sheet tab name if different
  columns: {
    name: 1,    // Column A
    mobile: 2,  // Column B
    email: 3    // Column C
  }
};

/**
 * Handle POST requests from the form
 */
function doPost(e) {
  try {
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);
    const { formType } = data;
    
    // Route to appropriate handler based on form type
    if (formType === 'page1') {
      return handlePage1(data);
    } else if (formType === 'page2') {
      return handlePage2(data);
    } else {
      return createResponse(400, { 
        success: false, 
        error: 'Invalid form type.' 
      });
    }
    
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return createResponse(500, { 
      success: false, 
      error: 'Internal server error: ' + error.toString() 
    });
  }
}

/**
 * Handle Page 1 (Contact Info) submission
 */
function handlePage1(data) {
  const { name, phone, email } = data;
  
  // Validate required fields
  if (!name || !phone || !email) {
    return createResponse(400, { 
      success: false, 
      error: 'Name, phone, and email are required.' 
    });
  }
  
  // Get the spreadsheet
  const ss = CONFIG.spreadsheetId 
    ? SpreadsheetApp.openById(CONFIG.spreadsheetId)
    : SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.sheetName);
  
  if (!sheet) {
    return createResponse(500, { 
      success: false, 
      error: 'Sheet not found. Please check the sheetName in CONFIG.' 
    });
  }
  
  // Append the contact data to the sheet
  sheet.appendRow([name, phone, email]);
  
  // Get the row number that was just added
  const lastRow = sheet.getLastRow();
  
  // Send confirmation email
  try {
    sendConfirmationEmail(email, name, phone);
    Logger.log('Confirmation email sent successfully to: ' + email);
  } catch (emailError) {
    Logger.log('Email sending failed: ' + emailError.toString());
    // Don't fail the entire request if email fails
  }
  
  return createResponse(200, { 
    success: true, 
    rowNumber: lastRow,
    message: 'Lead captured successfully!' 
  });
}

/**
 * Handle Page 2 (Measurements) submission
 */
function handlePage2(data) {
  const { rowNumber, measurements, sizes } = data;
  
  // Validate required fields
  if (!rowNumber || !measurements) {
    return createResponse(400, { 
      success: false, 
      error: 'Row number and measurements are required.' 
    });
  }
  
  // Get the spreadsheet
  const ss = CONFIG.spreadsheetId 
    ? SpreadsheetApp.openById(CONFIG.spreadsheetId)
    : SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.sheetName);
  
  if (!sheet) {
    return createResponse(500, { 
      success: false, 
      error: 'Sheet not found. Please check the sheetName in CONFIG.' 
    });
  }
  
  try {
    // Update the row with measurements (starting from column D)
    const measurementData = [
      measurements.bust,
      measurements.naturalWaist,
      measurements.pantWaist,
      measurements.hip,
      measurements.thigh,
      measurements.jacketLength,
      measurements.jacketWidth,
      measurements.pantsLength,
      measurements.pantsWidth,
      sizes.jacket,
      sizes.pant
    ];
    
    // Update columns D through N (4 through 14)
    const range = sheet.getRange(rowNumber, 4, 1, measurementData.length);
    range.setValues([measurementData]);
    
    return createResponse(200, { 
      success: true, 
      message: 'Measurements saved successfully!' 
    });
  } catch (error) {
    Logger.log('Error updating measurements: ' + error.toString());
    return createResponse(500, { 
      success: false, 
      error: 'Failed to save measurements. Please contact support.' 
    });
  }
}

/**
 * Send confirmation email to the user
 */
function sendConfirmationEmail(email, name, phone) {
  const subject = "Your Entry is Confirmed - Mea 8-Pocket Suit Giveaway";
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Montserrat', Arial, sans-serif; color: #1a1a1a; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #FFE8E2 0%, #FFFFFF 100%); padding: 30px; text-align: center; border-radius: 12px; }
        .content { background: #ffffff; padding: 30px; border: 1px solid rgba(0, 0, 0, 0.08); border-radius: 12px; margin-top: 20px; }
        .info-box { background: #FFE8E2; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .info-item { margin: 10px 0; }
        .label { font-weight: 600; color: #1a1a1a; }
        .value { color: rgba(0, 0, 0, 0.75); }
        .button { background: #FEB6A3; color: #000000; padding: 12px 28px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: rgba(0, 0, 0, 0.65); font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">✓ Entry Confirmed!</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Great news! Your entry for the Mea 8-Pocket Suit Giveaway has been successfully saved.</p>
          
          <div class="info-box">
            <h3 style="margin-top: 0;">Your Information:</h3>
            <div class="info-item">
              <span class="label">Name:</span> <span class="value">${name}</span>
            </div>
            <div class="info-item">
              <span class="label">Phone:</span> <span class="value">${phone}</span>
            </div>
            <div class="info-item">
              <span class="label">Email:</span> <span class="value">${email}</span>
            </div>
          </div>
          
          <p><strong>What's Next?</strong></p>
          <ul>
            <li>We'll officially launch the giveaway in January 2026</li>
            <li>You'll get first access to earn extra entries</li>
            <li>You'll skip the line for our launch sale</li>
          </ul>
          
          <p>Questions? Feel free to reply to this email or reach out at <a href="mailto:hello@measuit.com">hello@measuit.com</a></p>
          
          <p>With love,<br><strong>Team Mea</strong></p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Mea</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const plainTextBody = `
Hi ${name},

Great news! Your entry for the Mea 8-Pocket Suit Giveaway has been successfully saved.

YOUR INFORMATION:
Name: ${name}
Phone: ${phone}
Email: ${email}

WHAT'S NEXT?
• We'll officially launch the giveaway in January 2026
• You'll get first access to earn extra entries
• You'll skip the line for our launch sale

Questions? Feel free to reply to this email or reach out at hello@measuit.com

With love,
Team Mea

© ${new Date().getFullYear()} Mea
  `;
  
  MailApp.sendEmail({
    to: email,
    subject: subject,
    htmlBody: htmlBody,
    body: plainTextBody,
    name: 'Mea',
    replyTo: 'brandon.jonbeck@gmail.com'
  });
  
  Logger.log('Email sent to: ' + email + ' from account: ' + Session.getActiveUser().getEmail());
}

/**
 * Handle GET requests (for testing)
 */
function doGet(e) {
  return createResponse(200, { 
    success: true, 
    message: 'Google Apps Script is running! Use POST to submit form data.',
    timestamp: new Date().toISOString()
  });
}

/**
 * Create a JSON response
 */
function createResponse(statusCode, data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Simple test function - Run this to verify the script is working
 * Select "testScript" from dropdown and click Run
 */
function testScript() {
  Logger.log('Script is working!');
  Logger.log('Spreadsheet ID: ' + CONFIG.spreadsheetId);
  Logger.log('Sheet Name: ' + CONFIG.sheetName);
  Logger.log('Running as: ' + Session.getActiveUser().getEmail());
  
  try {
    const ss = CONFIG.spreadsheetId 
      ? SpreadsheetApp.openById(CONFIG.spreadsheetId)
      : SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.sheetName);
    
    if (sheet) {
      Logger.log('✓ Sheet found successfully!');
      Logger.log('Last row: ' + sheet.getLastRow());
    } else {
      Logger.log('✗ Sheet not found. Check CONFIG.sheetName');
    }
  } catch (error) {
    Logger.log('✗ Error: ' + error.toString());
  }
}
