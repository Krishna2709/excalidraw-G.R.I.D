const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const chokidar = require('chokidar');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const WORKSPACES_DIR = path.join(__dirname, '..', '..', 'workspaces');
const METADATA_FILE = path.join(WORKSPACES_DIR, 'workspace-metadata.json');

function sanitizeAppState(appState) {
  if (!appState || typeof appState !== 'object') return {};
  const clone = { ...appState };
  // Remove fields that can crash the client if deserialized incorrectly
  delete clone.collaborators;
  delete clone.toast;
  delete clone.contextMenu;
  delete clone.openMenu;
  delete clone.openPopup;
  delete clone.openSidebar;
  delete clone.openDialog;
  return clone;
}

// File watching for real-time updates
let fileWatcher = null;
const watchedFiles = new Set();

function startFileWatcher() {
  if (fileWatcher) {
    fileWatcher.close();
  }
  
  fileWatcher = chokidar.watch(path.join(WORKSPACES_DIR, '*.excalidraw'), {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true
  });

  fileWatcher.on('change', async (filePath) => {
    console.log(`\n📝 [FILE WATCHER] Workspace file changed: ${filePath}`);
    console.log(`⏰ [FILE WATCHER] Change detected at: ${new Date().toISOString()}`);
    // Update metadata.updatedAt to file mtime so UI can detect external edits
    try {
      const stats = await fs.stat(filePath);
      const fileName = path.basename(filePath);
      const id = fileName.replace('.excalidraw', '');
      const metadata = await loadMetadata();
      const index = metadata.findIndex((m) => m.id === id);
      if (index >= 0) {
        metadata[index].updatedAt = stats.mtimeMs;
        await saveMetadata(metadata);
        console.log(`🗂️ Metadata updated for ${id} -> updatedAt=${stats.mtimeMs}`);
      }
    } catch (e) {
      console.error('File watcher metadata update failed:', e);
    }
  });

  fileWatcher.on('error', error => {
    console.error('File watcher error:', error);
  });
}

// Start file watcher when server starts
startFileWatcher();

// Ensure workspaces directory exists
async function ensureWorkspacesDir() {
  try {
    await fs.access(WORKSPACES_DIR);
  } catch {
    await fs.mkdir(WORKSPACES_DIR, { recursive: true });
  }
}

// Load workspace metadata
async function loadMetadata() {
  try {
    const data = await fs.readFile(METADATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save workspace metadata (atomic)
async function saveMetadata(metadata) {
  const data = JSON.stringify(metadata, null, 2);
  const tmp = `${METADATA_FILE}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
  await fs.writeFile(tmp, data);
  await fs.rename(tmp, METADATA_FILE);
}

// Atomic write helper for workspace files
async function atomicWriteJson(targetPath, obj) {
  const jsonData = JSON.stringify(obj, null, 2);
  const tmp = `${targetPath}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
  await fs.writeFile(tmp, jsonData);
  await fs.rename(tmp, targetPath);
}

// Generate workspace ID
function generateWorkspaceId() {
  return `workspace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Sync metadata with actual files in directory
async function syncMetadataWithFiles() {
  try {
    console.log('🔍 Starting metadata synchronization...');
    
    // Get all .excalidraw files in directory
    const files = await fs.readdir(WORKSPACES_DIR);
    const excalidrawFiles = files.filter(file => file.endsWith('.excalidraw'));
    console.log(`📁 Found ${excalidrawFiles.length} .excalidraw files:`, excalidrawFiles);
    
    // Load current metadata
    const metadata = await loadMetadata();
    console.log(`📋 Current metadata entries: ${metadata.length}`);
    
    const existingIds = new Set(metadata.map(m => m.id));
    let addedCount = 0;
    
    // Check each file and add missing metadata
    for (const fileName of excalidrawFiles) {
      const id = fileName.replace('.excalidraw', '');
      
      if (!existingIds.has(id)) {
        console.log(`🆕 Found orphaned workspace file: ${fileName}`);
        
        try {
          // Read the workspace file to get the name
          const filePath = path.join(WORKSPACES_DIR, fileName);
          const fileContent = await fs.readFile(filePath, 'utf8');
          const workspaceData = JSON.parse(fileContent);
          
          // Extract name from appState or use default
          const name = workspaceData.appState?.name || 'Untitled Workspace';
          
          // Get file stats for timestamps
          const stats = await fs.stat(filePath);
          
          // Create metadata entry
          const metadataEntry = {
            id,
            name,
            createdAt: stats.birthtime.getTime(),
            updatedAt: stats.mtime.getTime(),
            filePath: fileName
          };
          
          metadata.push(metadataEntry);
          addedCount++;
          console.log(`✅ Added metadata for: ${id} (${name})`);
          
        } catch (error) {
          console.error(`❌ Error processing ${fileName}:`, error.message);
        }
      }
    }
    
    // Save updated metadata if changes were made
    if (addedCount > 0) {
      await saveMetadata(metadata);
      console.log(`💾 Saved metadata with ${addedCount} new entries`);
    } else {
      console.log('✨ Metadata is already in sync');
    }
    
    return metadata;
  } catch (error) {
    console.error('❌ Error syncing metadata:', error);
    throw error;
  }
}

// Routes

// Get all workspaces
app.get('/api/workspaces', async (req, res) => {
  try {
    await ensureWorkspacesDir();
    
    // Sync metadata with actual files before returning
    const metadata = await syncMetadataWithFiles();
    
    console.log(`📤 Returning ${metadata.length} workspaces to client`);
    res.json(metadata.sort((a, b) => b.updatedAt - a.updatedAt));
  } catch (error) {
    console.error('Error loading workspaces:', error);
    res.status(500).json({ error: 'Failed to load workspaces' });
  }
});

// Create new workspace
app.post('/api/workspaces', async (req, res) => {
  try {
    await ensureWorkspacesDir();
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Workspace name is required' });
    }

    const id = generateWorkspaceId();
    const now = Date.now();
    const filePath = path.join(WORKSPACES_DIR, `${id}.excalidraw`);

    // Create empty workspace file
    const emptyWorkspace = {
      type: "excalidraw",
      version: 2,
      source: "https://excalidraw.com",
      elements: [],
      appState: {},
      files: {}
    };

    // Write atomically to prevent corruption
    await atomicWriteJson(filePath, emptyWorkspace);

    // Update metadata
    const metadata = await loadMetadata();
    const workspaceMetadata = {
      id,
      name,
      createdAt: now,
      updatedAt: now,
      filePath: `${id}.excalidraw`
    };
    
    metadata.push(workspaceMetadata);
    await saveMetadata(metadata);

    res.json(workspaceMetadata);
  } catch (error) {
    console.error('Error creating workspace:', error);
    res.status(500).json({ error: 'Failed to create workspace' });
  }
});

// Get workspace by ID
app.get('/api/workspaces/:id', async (req, res) => {
  try {
    await ensureWorkspacesDir();
    const { id } = req.params;
    const filePath = path.join(WORKSPACES_DIR, `${id}.excalidraw`);

    console.log(`🔍 DEBUG: Attempting to load workspace ${id}`);
    console.log(`📁 DEBUG: File path: ${filePath}`);
    
    // Check if file exists
    try {
      await fs.access(filePath);
      console.log(`✅ DEBUG: File exists at ${filePath}`);
    } catch (accessError) {
      console.log(`❌ DEBUG: File does not exist at ${filePath}`);
      console.log(`🔍 DEBUG: Checking directory contents...`);
      const files = await fs.readdir(WORKSPACES_DIR);
      console.log(`📂 DEBUG: Directory contents:`, files);
      return res.status(404).json({ error: 'Workspace not found' });
    }

    try {
      const data = await fs.readFile(filePath, 'utf8');
      console.log(`📄 DEBUG: File read successfully, length: ${data.length}`);

      let workspace;
      try {
        workspace = JSON.parse(data);
        console.log(`🔧 DEBUG: JSON parsed successfully, elements count: ${workspace.elements?.length || 0}`);
      } catch (parseError) {
        console.error(`❌ JSON parse error for ${id}: ${parseError.message}`);
        // Robust recovery: scan backwards to find the largest valid JSON prefix
        let pos = data.lastIndexOf('}');
        let recovered = null;
        while (pos > -1) {
          const candidate = data.slice(0, pos + 1);
          try {
            recovered = JSON.parse(candidate);
            break;
          } catch (_) {
            pos = data.lastIndexOf('}', pos - 1);
          }
        }
        if (!recovered) {
          return res.status(500).json({ error: 'Invalid workspace file (unable to recover JSON)' });
        }
        console.warn(`⚠️ Recovered workspace ${id} by trimming to ${pos + 1} bytes. Elements: ${recovered.elements?.length || 0}`);
        workspace = recovered;
        // Persist recovered content atomically to prevent repeated failures
        try {
          const tempFilePath = filePath + '.recovered.tmp';
          await fs.writeFile(tempFilePath, JSON.stringify(workspace, null, 2));
          await fs.rename(tempFilePath, filePath);
          console.warn(`✅ Persisted recovered JSON for ${id}`);
        } catch (persistErr) {
          console.error('Failed to persist recovered JSON:', persistErr);
        }
      }

      // Get metadata
      const metadata = await loadMetadata();
      const meta = metadata.find(m => m.id === id);
      const stats = await fs.stat(filePath);
      
      // Add cache-busting headers to prevent browser caching
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Last-Modified': new Date().toUTCString()
      });
      
      res.json({
        id,
        name: meta?.name || 'Untitled',
        createdAt: meta?.createdAt || 0,
        updatedAt: meta?.updatedAt || 0,
        elements: workspace.elements || [],
        appState: sanitizeAppState(workspace.appState || {}),
        files: workspace.files || {},
        filePath: `${id}.excalidraw`,
        drawingName: meta?.drawingName || null,
        // Add timestamp to help with cache busting
        _timestamp: Date.now(),
        version: stats.mtimeMs
      });
    } catch (err) {
      console.error('Error while loading workspace file:', err);
      res.status(500).json({ error: 'Failed to load workspace file' });
    }
  } catch (error) {
    console.error('Error loading workspace:', error);
    res.status(500).json({ error: 'Failed to load workspace' });
  }
});

// Save workspace
app.put('/api/workspaces/:id', async (req, res) => {
  try {
    await ensureWorkspacesDir();
    const { id } = req.params;
    const { elements, appState, files, version } = req.body;

    console.log(`API SAVE: Saving workspace ${id}`);
    console.log(`API SAVE: Elements count: ${elements?.length || 0}`);

    // Log text elements specifically
    const textElements = elements?.filter(el => el.type === 'text') || [];
    console.log(`API SAVE: Text elements found: ${textElements.length}`);
    textElements.forEach((el, index) => {
      console.log(`API SAVE: Text element ${index}:`, {
        id: el.id,
        text: el.text,
        originalText: el.originalText,
        type: el.type
      });
    });

    const filePath = path.join(WORKSPACES_DIR, `${id}.excalidraw`);
    const now = Date.now();

    // Create workspace data
    const workspaceData = {
      type: "excalidraw",
      version: 2,
      source: "https://excalidraw.com",
      elements: elements || [],
      appState: sanitizeAppState(appState || {}),
      files: files || {}
    };

    // If client sent version, enforce optimistic concurrency
    try {
      const stats = await fs.stat(filePath);
      const currentVersion = stats.mtimeMs;
      if (version && Number.isFinite(version) && version < currentVersion) {
        return res.status(409).json({ error: 'Conflict', currentVersion });
      }
    } catch (_) {
      // file may not exist yet; ignore
    }

    // Save workspace file atomically to prevent corruption
    await atomicWriteJson(filePath, workspaceData);

    // Update metadata
    const metadata = await loadMetadata();
    const index = metadata.findIndex(m => m.id === id);
    
    if (index >= 0) {
      metadata[index].updatedAt = now;
    }

    await saveMetadata(metadata);

    const savedStats = await fs.stat(filePath);
    res.json({ success: true, updatedAt: now, version: savedStats.mtimeMs });
  } catch (error) {
    console.error('Error saving workspace:', error);
    res.status(500).json({ error: 'Failed to save workspace' });
  }
});

// Update workspace name or drawing name
app.patch('/api/workspaces/:id', async (req, res) => {
  try {
    await ensureWorkspacesDir();
    const { id } = req.params;
    const { name, drawingName } = req.body;

    if (!name && drawingName === undefined) {
      return res.status(400).json({ error: 'At least one field (name or drawingName) is required' });
    }

    const metadata = await loadMetadata();
    const index = metadata.findIndex(m => m.id === id);
    
    if (index >= 0) {
      if (name) {
        metadata[index].name = name;
      }
      if (drawingName !== undefined) {
        metadata[index].drawingName = drawingName;
      }
      metadata[index].updatedAt = Date.now();
      await saveMetadata(metadata);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Workspace not found' });
    }
  } catch (error) {
    console.error('Error updating workspace:', error);
    res.status(500).json({ error: 'Failed to update workspace' });
  }
});

// Delete workspace
app.delete('/api/workspaces/:id', async (req, res) => {
  try {
    await ensureWorkspacesDir();
    const { id } = req.params;
    const filePath = path.join(WORKSPACES_DIR, `${id}.excalidraw`);

    // Delete workspace file
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.warn('Workspace file not found:', error.message);
    }

    // Remove from metadata
    const metadata = await loadMetadata();
    const filteredMetadata = metadata.filter(m => m.id !== id);
    await saveMetadata(filteredMetadata);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting workspace:', error);
    res.status(500).json({ error: 'Failed to delete workspace' });
  }
});

// Enhanced logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🔍 [${timestamp}] ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`📦 Request body:`, JSON.stringify(req.body, null, 2));
  }
  next();
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Workspace API server running on http://localhost:${PORT}`);
  console.log(`📁 Workspaces directory: ${WORKSPACES_DIR}`);
  console.log(`📋 Metadata file: ${METADATA_FILE}`);
  console.log(`🔄 File watcher started\n`);
});

module.exports = app;
