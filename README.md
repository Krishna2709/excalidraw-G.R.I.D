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

2. **Start the development server**:
   ```bash
   yarn start
   ```

3. **Open your browser** to `http://localhost:3000`

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

- **All workspaces and drawings are saved locally** in your browser
- **Data persists** when you close the browser or restart the server
- **No server-side storage** - everything stays on your device
- **Works offline** - no internet connection required

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
