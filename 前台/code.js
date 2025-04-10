function doGet() {
  try {
    // 嘗試讀取試算表
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const museumSheet = ss.getSheetByName("Museums");
    // 返回HTML頁面
    return HtmlService.createHtmlOutputFromFile('cursor')
      .setTitle('博物館觀眾行為記錄介面')
      .setFaviconUrl('https://www.google.com/favicon.ico')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      
  } catch (error) {
    console.error('doGet執行錯誤:', error.toString());
    // 即使發生錯誤也返回頁面，但會在控制台顯示錯誤信息
     return HtmlService.createHtmlOutputFromFile('frontend')
      .setTitle('博物館觀眾行為記錄介面')
      .setFaviconUrl('https://www.google.com/favicon.ico')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}
const SPREADSHEET_ID = '1NoGwkVzUjgufEMTJ4cvUDZHWA8dsv90y3cQn681rZyE';
//回傳部分
/**
 * 保存前端傳來的數據到試算表
 * @param {Object} data - 包含記錄和訪客信息的數據對象
 * @return {Object} 處理結果
 */
function saveData(data) {
  try {
    // 記錄開始處理時間
    const startTime = new Date();
    
    // 記錄請求數據到日誌
    console.log('接收到的數據:', JSON.stringify(data));
    
    // 獲取試算表
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const visitorInteractionsSheet = ss.getSheetByName("VisitorInteractions");
    const visitorInfoSheet = ss.getSheetByName("VisitorInfo");
    
    if (!visitorInteractionsSheet || !visitorInfoSheet) {
      throw new Error("找不到必要的試算表");
    }
    
    // 處理互動記錄數據
    const records = data.records || [];
    let interactionsCount = 0;
    
    if (records.length > 0) {
      // 獲取表頭以確保數據對應正確的列
      const headers = visitorInteractionsSheet.getRange(1, 1, 1, visitorInteractionsSheet.getLastColumn()).getValues()[0];
      
      // 準備數據行
      const interactionsData = records.map(record => {
        // 創建一個與表頭長度相同的數組，初始值為空字符串
        const row = Array(headers.length).fill('');
        
        // 根據表頭填充數據
        headers.forEach((header, index) => {
          switch(header.toLowerCase()) {
            case 'recordid':
              row[index] = record.recordId || '';
              break;
            case 'museumid':
              row[index] = record.museumId || '';
              break;
            case 'userid':
              row[index] = record.userId || '';
              break;
            case 'pointid':
              row[index] = record.location || ''; // 前端使用location作為pointId
              break;
            case 'arrivetime':
              row[index] = record.arriveTime || '';
              break;
            case 'leavetime':
              row[index] = record.leaveTime || '';
              break;
            case 'stayseconds':
              row[index] = record.staySeconds || 0;
              break;
            case 'interactioncount':
              row[index] = record.interactionCount || 0;
              break;
            case 'interactiontype':
              row[index] = record.interactionType || '';
              break;
            case 'notes':
              row[index] = record.notes || '';
              break;
            // 可以根據需要添加更多字段
          }
        });
        
        return row;
      });
      
      // 獲取最後一行
      const lastRow = visitorInteractionsSheet.getLastRow();
      
      // 寫入數據
      if (interactionsData.length > 0) {
        visitorInteractionsSheet.getRange(lastRow + 1, 1, interactionsData.length, headers.length)
          .setValues(interactionsData);
        
        interactionsCount = interactionsData.length;
        console.log(`成功寫入 ${interactionsCount} 條互動記錄`);
      }
    }
    
    // 處理訪客資訊數據
    const visitorInfo = data.visitorInfo || {};
    let visitorInfoSaved = false;
    
    if (Object.keys(visitorInfo).length > 0) {
      // 獲取表頭以確保數據對應正確的列
      const headers = visitorInfoSheet.getRange(1, 1, 1, visitorInfoSheet.getLastColumn()).getValues()[0];
      
      // 創建一個與表頭長度相同的數組，初始值為空字符串
      const visitorData = Array(headers.length).fill('');
      
      // 根據表頭填充數據
      headers.forEach((header, index) => {
        switch(header.toLowerCase()) {
          case 'visitorid':
            visitorData[index] = visitorInfo.visitorId || '';
            break;
          case 'recordid':
            visitorData[index] = visitorInfo.recordId || '';
            break;
          case 'formversion':
            visitorData[index] = visitorInfo.formVersion || '1.0';
            break;
          case 'gender':
            visitorData[index] = visitorInfo.gender || '';
            break;
          case 'agegroup':
            visitorData[index] = visitorInfo.ageGroup || '';
            break;
          case 'education':
            visitorData[index] = visitorInfo.education || '';
            break;
          case 'residence':
            visitorData[index] = visitorInfo.residence || '';
            break;
          case 'visitpurpose':
            visitorData[index] = visitorInfo.visitPurpose || '';
            break;
          case 'visitfrequency':
            visitorData[index] = visitorInfo.visitFrequency || '';
            break;
          case 'consent':
            visitorData[index] = true; // 用戶已同意授權
            break;
          case 'totalseconds':
            visitorData[index] = visitorInfo.totalSeconds || 0;
            break;
          case 'extradata':
            visitorData[index] = JSON.stringify(visitorInfo.extraData || {});
            break;
          // 可以根據需要添加更多字段
        }
      });
      
      // 獲取最後一行
      const lastRow = visitorInfoSheet.getLastRow();
      
      // 寫入數據
      visitorInfoSheet.getRange(lastRow + 1, 1, 1, headers.length)
        .setValues([visitorData]);
      
      visitorInfoSaved = true;
      console.log('成功寫入訪客信息');
    }
    
    // 記錄處理時間
    const endTime = new Date();
    const processingTime = (endTime - startTime) / 1000; // 秒
    
    // 記錄操作日誌
    logActivity('數據保存', {
      interactionsCount: interactionsCount,
      visitorInfoSaved: visitorInfoSaved,
      processingTime: processingTime
    });
    
    // 返回處理結果
    return {
      success: true,
      message: "數據保存成功",
      details: {
        interactionsCount: interactionsCount,
        visitorInfoSaved: visitorInfoSaved,
        processingTime: processingTime
      }
    };
    
  } catch (error) {
    console.error("保存數據時發生錯誤:", error.toString());
    
    // 記錄錯誤日誌
    logActivity('數據保存錯誤', {
      error: error.toString(),
      stack: error.stack
    });
    
    // 返回錯誤信息
    return {
      success: false,
      message: "保存數據失敗: " + error.message,
      error: error.toString()
    };
  }
}

/**
 * 記錄系統活動日誌
 * @param {string} action - 操作類型
 * @param {Object} details - 詳細信息
 */
function logActivity(action, details) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const logSheet = ss.getSheetByName("SystemLogs");
    
    if (logSheet) {
      // 獲取當前用戶郵箱，如果無法獲取則使用'系統'
      let userEmail = '系統';
      try {
        userEmail = Session.getActiveUser().getEmail() || '系統';
      } catch (e) {
        console.warn('無法獲取當前用戶郵箱:', e.toString());
      }
      
      // 添加日誌記錄
      logSheet.appendRow([
        new Date(),
        userEmail,
        action,
        JSON.stringify(details)
      ]);
    }
  } catch (error) {
    console.error('記錄活動日誌時發生錯誤:', error.toString());
    // 即使記錄日誌失敗也不拋出異常，避免影響主要功能
  }
}

/**
 * 驗證記錄數據
 * @param {Object} record - 記錄數據
 * @return {Object} 驗證結果
 */
function validateRecord(record) {
  // 檢查必要字段
  const requiredFields = ['recordId', 'museumId', 'location', 'arriveTime', 'leaveTime'];
  const missingFields = [];
  
  for (const field of requiredFields) {
    if (!record[field]) {
      missingFields.push(field);
    }
  }
  
  if (missingFields.length > 0) {
    return {
      valid: false,
      message: `缺少必要字段: ${missingFields.join(', ')}`
    };
  }
  
  return { valid: true };
}

/**
 * 批量處理數據，避免超過執行時間限制
 * @param {Object} data - 包含記錄和訪客信息的數據對象
 * @return {Object} 處理結果
 */
function saveDataInBatches(data) {
  try {
    const batchSize = 50; // 每批處理的記錄數
    const records = data.records || [];
    const visitorInfo = data.visitorInfo || {};
    
    // 獲取試算表
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const visitorInteractionsSheet = ss.getSheetByName("VisitorInteractions");
    
    if (!visitorInteractionsSheet) {
      throw new Error("找不到必要的試算表");
    }
    
    let totalProcessed = 0;
    
    // 分批處理記錄
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      // 構建批次數據
      const batchData = {
        records: batch,
        visitorInfo: i === 0 ? visitorInfo : {} // 只在第一批處理訪客信息
      };
      
      // 處理這一批數據
      const result = saveData(batchData);
      
      if (result.success) {
        totalProcessed += result.details.interactionsCount;
      } else {
        throw new Error(`批次處理失敗: ${result.message}`);
      }
    }
    
    return {
      success: true,
      message: "批次數據處理成功",
      details: {
        totalProcessed: totalProcessed
      }
    };
    
  } catch (error) {
    console.error("批次處理數據時發生錯誤:", error.toString());
    
    return {
      success: false,
      message: "批次處理失敗: " + error.message,
      error: error.toString()
    };
  }
}

/**
 * 檢查試算表結構，確保所需的工作表和欄位存在
 * @return {Object} 檢查結果
 */
function checkSpreadsheetStructure() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const requiredSheets = ["VisitorInteractions", "VisitorInfo", "SystemLogs"];
    const missingSheets = [];
    
    // 檢查必要的工作表
    for (const sheetName of requiredSheets) {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        missingSheets.push(sheetName);
      }
    }
    
    if (missingSheets.length > 0) {
      return {
        valid: false,
        message: `缺少必要的工作表: ${missingSheets.join(', ')}`
      };
    }
    
    // 檢查 VisitorInteractions 工作表的欄位
    const viSheet = ss.getSheetByName("VisitorInteractions");
    const viHeaders = viSheet.getRange(1, 1, 1, viSheet.getLastColumn()).getValues()[0];
    const requiredViFields = ["recordId", "museumId", "userId", "pointId", "arriveTime", "leaveTime", "staySeconds"];
    const missingViFields = [];
    
    for (const field of requiredViFields) {
      if (!viHeaders.some(header => header.toLowerCase() === field.toLowerCase())) {
        missingViFields.push(field);
      }
    }
    
    if (missingViFields.length > 0) {
      return {
        valid: false,
        message: `VisitorInteractions 工作表缺少必要欄位: ${missingViFields.join(', ')}`
      };
    }
    
    // 檢查 VisitorInfo 工作表的欄位
    const viInfoSheet = ss.getSheetByName("VisitorInfo");
    const viInfoHeaders = viInfoSheet.getRange(1, 1, 1, viInfoSheet.getLastColumn()).getValues()[0];
    const requiredViInfoFields = ["visitorId", "recordId", "gender", "ageGroup", "education", "residence"];
    const missingViInfoFields = [];
    
    for (const field of requiredViInfoFields) {
      if (!viInfoHeaders.some(header => header.toLowerCase() === field.toLowerCase())) {
        missingViInfoFields.push(field);
      }
    }
    
    if (missingViInfoFields.length > 0) {
      return {
        valid: false,
        message: `VisitorInfo 工作表缺少必要欄位: ${missingViInfoFields.join(', ')}`
      };
    }
    
    return {
      valid: true,
      message: "試算表結構檢查通過"
    };
    
  } catch (error) {
    console.error("檢查試算表結構時發生錯誤:", error.toString());
    
    return {
      valid: false,
      message: "檢查試算表結構失敗: " + error.message,
      error: error.toString()
    };
  }
}

/**
 * 初始化試算表結構，如果不存在則創建必要的工作表和欄位
 * @return {Object} 初始化結果
 */
function initializeSpreadsheetStructure() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // 檢查並創建 VisitorInteractions 工作表
    let viSheet = ss.getSheetByName("VisitorInteractions");
    if (!viSheet) {
      viSheet = ss.insertSheet("VisitorInteractions");
      viSheet.appendRow([
        "recordId", "museumId", "userId", "pointId", "arriveTime", "leaveTime", 
        "staySeconds", "totalSeconds", "interactionCount", "interactionType", "notes"
      ]);
      viSheet.getRange(1, 1, 1, 11).setFontWeight("bold");
    }
    
    // 檢查並創建 VisitorInfo 工作表
    let viInfoSheet = ss.getSheetByName("VisitorInfo");
    if (!viInfoSheet) {
      viInfoSheet = ss.insertSheet("VisitorInfo");
      viInfoSheet.appendRow([
        "visitorId", "recordId", "formVersion", "gender", "ageGroup", "education", 
        "residence", "visitPurpose", "visitFrequency", "consent", "extraData"
      ]);
      viInfoSheet.getRange(1, 1, 1, 11).setFontWeight("bold");
    }
    
    // 檢查並創建 SystemLogs 工作表
    let logSheet = ss.getSheetByName("SystemLogs");
    if (!logSheet) {
      logSheet = ss.insertSheet("SystemLogs");
      logSheet.appendRow([
        "timestamp", "user", "action", "details"
      ]);
      logSheet.getRange(1, 1, 1, 4).setFontWeight("bold");
    }
    
    return {
      success: true,
      message: "試算表結構初始化成功"
    };
    
  } catch (error) {
    console.error("初始化試算表結構時發生錯誤:", error.toString());
    
    return {
      success: false,
      message: "初始化試算表結構失敗: " + error.message,
      error: error.toString()
    };
  }
}

