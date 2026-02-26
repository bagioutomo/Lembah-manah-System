
# ☁️ Panduan Integrasi Google Drive (Universal LMK Bridge v3.2)

Gunakan script ini agar Google Sheet Bapak otomatis terisi data dan foto resep muncul di Cook Book.

## Langkah 1: Update Google Apps Script
1. Buka [Google Apps Script](https://script.google.com/home).
2. Buka proyek `LMK_Drive_Bridge` Bapak.
3. **Hapus semua kode lama** dan ganti dengan kode di bawah ini:

```javascript
/**
 * LEMBAH MANAH UNIVERSAL CLOUD BRIDGE v3.2
 * Fitur: Smart Sheet Selector, Overwrite Sync, High-Speed Image Proxy.
 */

function doGet(e) {
  var action = e.parameter.action;
  if (action === 'GET_LATEST') {
    var folder = getFolder("BACKUP_JSON");
    var files = folder.getFilesByName("LATEST_SNAPSHOT.json");
    if (files.hasNext()) {
      return ContentService.createTextOutput(files.next().getBlob().getDataAsString())
             .setMimeType(ContentService.MimeType.JSON);
    }
    return response({status: 'error', msg: 'No snapshot found'});
  }
  return ContentService.createTextOutput("LMK Cloud Bridge v3.2 Aktif!");
}

function doPost(e) {
  try {
    var request = JSON.parse(e.postData.contents);
    var action = request.action;
    var data = request.data;

    // 1. ACTION: SYNC KE GOOGLE SHEET (Mirror 1)
    if (action === 'sync') {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      // Proteksi jika script tidak menempel pada file sheet
      if (!ss) return response({status: 'error', message: 'Script tidak terhubung ke Sheet. Buka Sheet Bapak > Extensions > Apps Script.'});
      
      if (data.incomes) updateSheet(ss, "PEMASUKAN", data.incomes);
      if (data.expenses) updateSheet(ss, "PENGELUARAN", data.expenses);
      if (data.inventoryItems) updateSheet(ss, "INVENTARIS", data.inventoryItems);
      if (data.reservations) updateSheet(ss, "RESERVASI", data.reservations);
      if (data.employees) updateSheet(ss, "DATABASE_STAFF", data.employees);
      if (data.recipes) updateSheet(ss, "RESEP_HPP", data.recipes);
      
      return response({ status: 'success', message: 'Sheets Updated' });
    }

    // 2. ACTION: SNAPSHOT JSON (Mirror 2)
    if (action === 'SYNC_JSON') {
      var folder = getFolder("BACKUP_JSON");
      var jsonStr = JSON.stringify(data);
      var oldFiles = folder.getFilesByName("LATEST_SNAPSHOT.json");
      while (oldFiles.hasNext()) oldFiles.next().setTrashed(true);
      folder.createFile("LATEST_SNAPSHOT.json", jsonStr, ContentService.MimeType.JSON);
      return response({ status: 'success' });
    }

    // 3. ACTION: UPLOAD FOTO RESEP
    if (action === 'UPLOAD_IMAGE') {
      var folder = getFolder("FOTO_RESEP");
      var decoded = Utilities.base64Decode(data);
      var blob = Utilities.newBlob(decoded, "image/webp", request.filename + ".webp");
      var file = folder.createFile(blob);
      // Memberikan akses publik agar bisa tampil di aplikasi
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return response({ status: 'success', fileId: file.getId() });
    }

    // 4. ACTION: AUTO-EXCEL (Mirror 5)
    if (action === 'UPLOAD_EXCEL') {
      var folder = getFolder("LAPORAN_EXCEL");
      var decoded = Utilities.base64Decode(data);
      var blob = Utilities.newBlob(decoded, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", request.filename);
      folder.createFile(blob);
      return response({ status: 'success' });
    }

  } catch (err) {
    return response({ status: 'error', message: err.toString() });
  }
}

function updateSheet(ss, sheetName, dataArray) {
  if (!dataArray || dataArray.length === 0) return;
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  sheet.clear(); 
  var headers = Object.keys(dataArray[0]);
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f0fdf4");
  var rows = dataArray.map(function(item) {
    return headers.map(function(key) {
      var val = item[key];
      if (typeof val === 'object' && val !== null) return JSON.stringify(val);
      return val;
    });
  });
  if (rows.length > 0) sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  sheet.autoResizeColumns(1, headers.length);
}

function getFolder(name) {
  var rootName = "DATABASE_LEMBAH_MANAH";
  var roots = DriveApp.getFoldersByName(rootName);
  var root = roots.hasNext() ? roots.next() : DriveApp.createFolder(rootName);
  var targets = root.getFoldersByName(name);
  return targets.hasNext() ? targets.next() : root.createFolder(name);
}

function response(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
```

## Langkah 2: Deploy Ulang (WAJIB)
1. Klik **Deploy** -> **Manage Deployments**.
2. Klik ikon pensil (Edit).
3. Pilih **"New Version"**.
4. Klik **Deploy**.
