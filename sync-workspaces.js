// Script to sync workspace files with metadata
const fs = require('fs');
const path = require('path');

const WORKSPACES_DIR = path.join(__dirname, 'workspaces');
const METADATA_FILE = path.join(WORKSPACES_DIR, 'workspace-metadata.json');

async function syncWorkspaces() {
  try {
    // Get all .excalidraw files
    const files = fs.readdirSync(WORKSPACES_DIR).filter(file => file.endsWith('.excalidraw'));
    
    // Load existing metadata
    let metadata = [];
    try {
      const metadataContent = fs.readFileSync(METADATA_FILE, 'utf8');
      metadata = JSON.parse(metadataContent);
    } catch (error) {
      console.log('No existing metadata found, creating new...');
    }
    
    // Check each file and add to metadata if missing
    files.forEach(fileName => {
      const id = fileName.replace('.excalidraw', '');
      const existing = metadata.find(m => m.id === id);
      
      if (!existing) {
        const stats = fs.statSync(path.join(WORKSPACES_DIR, fileName));
        const newEntry = {
          id,
          name: `Workspace ${id.split('_')[1]}`,
          createdAt: stats.birthtimeMs || stats.ctimeMs,
          updatedAt: stats.mtimeMs,
          filePath: fileName
        };
        metadata.push(newEntry);
        console.log(`Added ${fileName} to metadata`);
      }
    });
    
    // Remove metadata entries for files that no longer exist
    metadata = metadata.filter(entry => {
      const fileExists = fs.existsSync(path.join(WORKSPACES_DIR, entry.filePath));
      if (!fileExists) {
        console.log(`Removed ${entry.filePath} from metadata (file not found)`);
      }
      return fileExists;
    });
    
    // Save updated metadata
    fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
    console.log(`Synced ${metadata.length} workspaces`);
    
  } catch (error) {
    console.error('Error syncing workspaces:', error);
  }
}

if (require.main === module) {
  syncWorkspaces();
}

module.exports = { syncWorkspaces };
