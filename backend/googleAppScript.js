// Google Apps Script for Lead Capture Form
// This code should be deployed as a Web App in your Google Sheet

// Configuration
const CONFIG = {
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
    const { name, phone, email } = data;
    
    // Validate required fields
    if (!name || !phone || !email) {
      return createResponse(400, { 
        success: false, 
        error: 'Name, phone, and email are required.' 
      });
    }
    
    // Get the active spreadsheet and sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.sheetName);
    
    if (!sheet) {
      return createResponse(500, { 
        success: false, 
        error: 'Sheet not found. Please check the sheetName in CONFIG.' 
      });
    }
    
    // Append the data to the sheet
    sheet.appendRow([name, phone, email]);
    
    // Get the row number that was just added
    const lastRow = sheet.getLastRow();
    
    return createResponse(200, { 
      success: true, 
      rowNumber: lastRow,
      message: 'Lead captured successfully!' 
    });
    
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return createResponse(500, { 
      success: false, 
      error: 'Internal server error: ' + error.toString() 
    });
  }
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
 * Test function to verify the script works
 * Run this from the Script Editor to test
 */
function testAppendData() {
  const testData = {
    name: 'Test User',
    phone: '+63 912 345 6789',
    email: 'test@example.com'
  };
  
  const mockEvent = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };
  
  const result = doPost(mockEvent);
  Logger.log(result.getContent());
}
