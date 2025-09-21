# Excalidraw with Workspace Management

A fork of Excalidraw with enhanced workspace management features for organizing and managing multiple drawings locally.

## ✨ New Features

### 🗂️ **Workspace Management**
- **Create multiple workspaces** to organize your drawings
- **Save drawings locally** - all data persists when you close the browser
- **Switch between workspaces** easily with a dropdown menu
- **Move drawings** between workspaces with drag-and-drop simplicity

### 🎨 **Smart Drawing Workflow**
- **Welcome Dialog**: Choose how to start - quick drawing, new workspace, or open existing
- **New Drawing Button**: Create fresh drawings within any workspace or create new workspaces
- **Auto-save**: All changes are automatically saved to your current workspace
- **Unsaved Changes Indicator**: See when you have work that needs saving
- **Persistent Sessions**: Your current workspace is remembered across app restarts

### 🔄 **Move & Organize**
- **Move Current Drawing**: Transfer your work to another workspace
- **Save to Workspace**: Save quick drawings to any workspace later
- **Create & Move**: Create new workspaces and move drawings in one step

## 🚀 Quick Start

1. **Install dependencies**:
   ```bash
   yarn install
   ```

2. **Install API server dependencies**:
   ```bash
   cd excalidraw-app/api
   npm install
   cd ../..
   ```

3. **Start the application with workspace management**:
   ```bash
   node start-workspace-server.js
   ```

4. **Open your browser** to `http://localhost:3000`

   The workspace API will run on `http://localhost:3001` automatically.

## 📁 How to Use Workspaces

### **Getting Started**
1. When you first open the app, you'll see a welcome dialog
2. Choose from three options:
   - **Quick Drawing**: Start drawing immediately
   - **Create New Workspace**: Create a new organized workspace
   - **Open Existing Workspace**: Continue working on previous projects

### **Managing Your Work**
- **Current workspace** is shown in the top-right corner
- **Click the workspace name** to switch workspaces or move drawings
- **"New Drawing" button** creates fresh drawings in the current workspace
- **All drawings are automatically saved** to your browser's local storage

### **Moving Drawings**
- **Click workspace name** → **"Move Current Drawing"** section
- Choose to move to existing workspace or create a new one
- Your drawing will be saved to the target workspace

## 💾 Data Persistence

- **All workspaces and drawings are saved as files** in the `workspaces/` directory
- **Version control friendly** - drawings are stored as `.excalidraw` files that can be tracked in Git
- **Data persists** when you close the browser or restart the server
- **Project-based storage** - drawings are part of your codebase
- **Works offline** - no external dependencies required

## 🔁 Manual File Edit Reflection (G.R.I.D)

We added reliable live reflection of manual edits to `.excalidraw` files plus server hardening.

### What’s included

- Live polling of the active workspace. UI refreshes when file content changes
- Atomic writes for workspace files and `workspace-metadata.json` (tmp + rename)
- JSON self-healing (trim trailing garbage and persist recovered content)
- Versioning/optimistic concurrency (server returns `version`, PUT sends it; 409 on stale writes)
- AppState sanitization on server to prevent client crashes
- File watcher updates metadata `updatedAt` from file mtime
- Auto-resize heuristic: rectangles enclosing text expand to keep padding around edited text

### How to test

1. Run API: `cd excalidraw-app/api && node workspaces.js` (port 3001)
2. Run UI: `yarn start` (port 3000)
3. Create/select a workspace, then edit `workspaces/<id>.excalidraw`:
   - For text elements, set `text` and `originalText` to the same string
   - Optionally set `containerId` to the rectangle id to auto-expand the rectangle
4. Save; within ~2s the canvas updates.

API changes:

- `GET /api/workspaces/:id` → `{ ..., version: <mtimeMs> }`
- `PUT /api/workspaces/:id` accepts `{ elements, appState, files, version }`, returns `{ success, version }` or `409 { error: "Conflict", currentVersion }`

## 🛠️ Development

This is a fork of the original [Excalidraw](https://excalidraw.com) project with workspace management enhancements. The core Excalidraw features remain unchanged:

- ✍️ Hand-drawn style whiteboard
- 🎨 Infinite canvas
- 🌓 Dark/light mode
- 📷 Image support
- 🖼️ Export to PNG, SVG
- 🔙 Undo/Redo
- 🔍 Zoom and panning

## 📝 License

MIT License - same as the original Excalidraw project.

---

**Original Excalidraw**: [excalidraw.com](https://excalidraw.com) | [GitHub](https://github.com/excalidraw/excalidraw)
