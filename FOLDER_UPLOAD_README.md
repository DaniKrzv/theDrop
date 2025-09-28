# Folder Upload Implementation

This implementation adds folder upload functionality to theDrop, allowing users to upload entire folders containing .mp3 tracks to Walrus storage via Tusky.

## Features

### 1. Folder Structure Processing
- **File**: `src/utils/folderUpload.ts`
- Processes FileList from folder selection
- Creates hierarchical folder structure
- Validates audio files (.mp3, .wav)
- Provides utility functions for folder manipulation

### 2. Enhanced Upload Hook
- **File**: `src/trusky/useTuskyUpload.ts`
- Added `uploadFolder` function
- Recursively creates folders in Tusky
- Maintains folder hierarchy in Walrus storage
- Generates folder-specific manifests

### 3. Folder Upload UI
- **File**: `src/components/trusky/FolderUploadPanel.tsx`
- Drag-and-drop folder selection
- Visual folder structure display
- Upload progress tracking
- Error handling and validation

### 4. Integration
- **File**: `src/pages/ExplorePage.tsx`
- Added FolderUploadPanel to the explore page
- Seamless integration with existing upload functionality

## Usage

### For Users
1. Navigate to the Explore page
2. Scroll down to the "Upload Folders to Walrus" section
3. Either:
   - Drag and drop folders onto the upload area
   - Click to select folders using the file picker
4. Review the folder structure and file count
5. Click "Upload to Walrus" to start the upload process

### For Developers

#### Processing Folder Uploads
```typescript
import { processFolderUpload } from '@/utils/folderUpload'

const folders = processFolderUpload(fileList)
// Returns ProcessedFolder[] with hierarchical structure
```

#### Uploading Folders
```typescript
import { useTuskyUpload } from '@/trusky/useTuskyUpload'

const { uploadFolder } = useTuskyUpload()

const result = await uploadFolder({
  name: 'My Album',
  structure: folderStructure
})
```

## Technical Details

### Folder Structure
The implementation maintains the original folder hierarchy when uploading to Walrus:
- Root folder becomes the album name
- Subfolders are preserved in Tusky
- Files maintain their relative paths
- Manifest includes folder structure metadata

### File Validation
- Only .mp3 and .wav files are processed
- Invalid files are filtered out
- File size and count are displayed
- Error messages for unsupported files

### Error Handling
- Network retry logic for failed uploads
- Tusky connection validation
- Individual folder upload status tracking
- User-friendly error messages

## Browser Compatibility

The folder upload functionality uses the `webkitdirectory` attribute, which is supported in:
- Chrome 13+
- Firefox 50+
- Safari 11.1+
- Edge 79+

## Future Enhancements

1. **Batch Upload Progress**: Show overall progress across multiple folders
2. **Folder Preview**: Allow users to preview folder contents before upload
3. **Selective Upload**: Allow users to exclude certain files/folders
4. **Resume Upload**: Resume interrupted uploads
5. **Folder Templates**: Predefined folder structures for common use cases

## Testing

To test the folder upload functionality:

1. Create a test folder with .mp3 files
2. Optionally create subfolders with more .mp3 files
3. Use the folder upload interface to select the folder
4. Verify the folder structure is displayed correctly
5. Upload to Walrus and verify the files are stored with proper hierarchy

## Dependencies

- `@tusky-io/ts-sdk/web` - Tusky SDK for Walrus integration
- `lucide-react` - Icons for the UI
- `clsx` - CSS class management
- `framer-motion` - Animation support
