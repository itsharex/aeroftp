# Changelog - Sessione OpenCode

**Date**: 2025-12-24
**Author**: OpenCode
**Version**: 0.6.4

---

## ✨ New Features

### 📁 Recursive Folder Download/Upload
Implemented complete support for downloading and uploading entire folder structures recursively:

- **Backend (Rust)**: Added `download_folder_recursive` and `upload_folder_recursive` functions to `src-tauri/src/ftp.rs`
  - Iterative stack-based approach to avoid recursion depth limits
  - Automatic directory creation on both local and remote sides
  - Real-time progress tracking for each file in the folder structure
  - Event emission for transfer start, progress, completion, and errors

- **Tauri Commands**: Added `download_folder` and `upload_folder` commands to `src-tauri/src/lib.rs`
  - Progress events with transfer_id, filename, percentage, speed, ETA
  - Error handling with detailed error messages
  - Integration with existing transfer event system

- **Frontend (TypeScript)**: Updated `downloadFile` and `uploadFile` functions in `src/App.tsx`
  - Added `isDir` parameter to distinguish between files and folders
  - Automatic folder detection and recursive handling
  - Seamless integration with existing UI components

---

## 🐛 Bug Fixes

### 🎯 Double-Click File Operations
Fixed double-click behavior for both local and remote files:

**Remote File Double-Click**:
- ❌ **Before**: Opened file selection dialog to choose download location
- ✅ **After**: Downloads directly to `currentLocalPath` (currently open local directory)

**Local File Double-Click**:
- ❌ **Before**: Did nothing (no action on non-directory files)
- ✅ **After**: Uploads directly to `currentRemotePath` when connected to FTP server
- ✅ **Fallback**: Opens in system file manager when not connected

**Context Menu Download/Upload**:
- Download from context menu now uses `currentLocalPath` instead of showing dialog
- Maintains existing dialog fallback for cases where explicit location is needed

**Files Modified**:
- `src/App.tsx`:
  - `downloadFile`: Added optional `destinationPath` parameter
  - `handleRemoteFileAction`: Passes `currentLocalPath` to download
  - `downloadMultipleFiles`: Passes `currentLocalPath` for all files
  - Local file double-click handlers (List View & Grid View): Upload when connected

---

### 🗑️ Recursive Folder Deletion (Remote)
Fixed inability to delete remote folders containing files:

**Root Cause**:
- FTP `RMD` command only deletes empty directories
- Previous implementation used `rmdir()` which fails on non-empty folders
- Local deletion worked fine because `remove_dir_all` already handles recursion

**Solution**:
- **Backend (Rust)**: Implemented `delete_folder_recursive` function in `src-tauri/src/ftp.rs`
  - Iterative approach using stack to avoid async recursion limitations
  - Navigates through directory tree
  - Deletes all files first, then recursively processes subdirectories
  - Returns to original path after completion
  - Graceful error handling for inaccessible directories

- **Tauri Command**: Updated `delete_remote_file` in `src-tauri/src/lib.rs`
  - Calls `delete_folder_recursive` for directories
  - Calls `remove` for files
  - Unified error handling

**Files Modified**:
- `src-tauri/src/ftp.rs`: Added `delete_folder_recursive` (lines 499-585)
- `src-tauri/src/lib.rs`: Updated `delete_remote_file` command (line 516)

---

### 📝 Improved Deletion Notifications
Enhanced feedback messages for file/folder deletion operations:

**Before**:
- Generic message: "Selected items deleted"
- No distinction between files and folders

**After**:
- Specific messages:
  - "1 file deleted" / "5 files deleted"
  - "1 folder deleted" / "3 folders deleted"
  - "2 folders and 5 files deleted"
- Proper pluralization for all cases
- Clear distinction between file and folder operations

**Files Modified**:
- `src/App.tsx`:
  - `deleteMultipleRemoteFiles`: Enhanced toast messages (lines 841-846)
  - `deleteMultipleLocalFiles`: Enhanced toast messages (lines 867-872)

---

## 🔧 Technical Details

### Recursive Operations Implementation
All recursive folder operations (download, upload, delete) use an **iterative stack-based approach** instead of recursion to avoid:
- Stack overflow on deeply nested directory structures
- Rust's async function boxing requirements
- Performance overhead of recursive calls

### Progress Tracking
Folder operations emit progress events for each individual file, providing:
- Real-time transfer statistics
- Per-file progress updates
- Transfer speed calculations
- Estimated time remaining (ETA)

### Error Handling
- Graceful degradation when directories cannot be accessed
- Warnings logged for failed individual file operations
- Overall operation continues even when some files fail
- Detailed error messages in toast notifications

---

## 📊 Impact

### User Experience
- ✅ Eliminated unnecessary file selection dialogs for common operations
- ✅ Natural double-click behavior for file transfers
- ✅ Complete folder operations support (previously missing feature)
- ✅ Clear, informative notifications for all operations

### Code Quality
- ✅ No warnings or errors in Rust (cargo build)
- ✅ No errors in TypeScript (tsc build)
- ✅ Consistent error handling across all operations
- ✅ Clean separation of concerns (frontend/backend)

### Performance
- ✅ Iterative algorithms avoid recursion limits
- ✅ Efficient stack-based directory traversal
- ✅ Minimal filesystem operations (single pass per directory)

---

## 🔄 Migration Notes

### Breaking Changes
None. All changes are backward compatible.

### API Changes
- `downloadFile(path, name, destinationPath?, isDir?)` - Added optional parameters
- `uploadFile(path, name, isDir?)` - Added `isDir` parameter
- Backend Tauri commands now support folder operations

### Behavior Changes
- Double-click on remote file now downloads directly to current local folder
- Double-click on local file (when connected) now uploads directly to current remote folder
- Remote folder deletion now works recursively (previously failed silently)

---

## ✅ Verification

```bash
# Backend
✅ cargo build: Clean (0 warnings, 0 errors)

# Frontend
✅ npm run build: Clean (0 errors)

# Features Tested
✅ Double-click remote file → downloads to currentLocalPath
✅ Double-click local file → uploads to currentRemotePath (when connected)
✅ Download folder → recursive download with progress
✅ Upload folder → recursive upload with progress
✅ Delete remote folder → recursive deletion (was broken)
✅ Delete local folder → works (already working)
✅ Deletion notifications → specific to file/folder type
```

---

## 🎯 Next Steps (Suggestions)

1. **Cancel Support for Folder Operations**: Add cancellation support for recursive folder transfers
2. **Folder Size Calculation**: Pre-calculate total folder size for accurate progress percentages
3. **Partial Retry**: Resume failed folder operations from last successful file
4. **Folder Compression**: Option to compress folders before transfer
5. **Parallel Transfers**: Multi-threaded folder uploads/downloads for large folders

---

## 📝 Notes

- All recursive operations use iterative stack-based algorithms for reliability
- Progress tracking is file-based (not byte-based) for folder operations
- Error handling is permissive - continues operation on individual file failures
- TypeScript interfaces added for folder operation parameters
- Rust compile-time safety ensured with Result types

---

**Generated by**: OpenCode (GLM-4.7)
**Model Name**: GLM-4.7
**Session Date**: 2025-12-24
**Commit Ready**: ✅ All builds passing, ready for commit

---

*This changelog documents all changes made during the OpenCode session (model: GLM-4.7) focused on file transfer operations, folder support, and deletion fixes.*
