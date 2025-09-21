# Excalidraw Workspace API

This API server manages Excalidraw workspaces by saving drawings as `.excalidraw` files in the project directory.

## Features

- **File-based Storage**: Drawings are saved as `.excalidraw` files in the `workspaces/` directory
- **Version Control Friendly**: All drawings are stored as text files that can be tracked in Git
- **RESTful API**: Simple HTTP endpoints for workspace management
- **Auto-save**: Workspaces are automatically saved every 30 seconds
- **Atomic writes**: All writes go through unique temp files + rename to prevent corruption
- **JSON recovery**: Attempts to trim trailing garbage and persist recovered JSON
- **Versioning**: `GET` returns `version` (mtime); `PUT` accepts `version` and returns `409` on conflicts
- **Sanitized appState**: Server removes incompatible UI-only fields to avoid client crashes

## API Endpoints

### Get All Workspaces
```
GET /api/workspaces
```

### Create New Workspace
```
POST /api/workspaces
Content-Type: application/json

{
  "name": "My Workspace"
}
```

### Get Workspace by ID
```
GET /api/workspaces/:id
```

Response includes `version` (mtime):
```
{
  "id": "workspace_...",
  "elements": [...],
  "appState": {...},
  "files": {...},
  "version": 1758430000000
}
```

### Save Workspace
```
PUT /api/workspaces/:id
Content-Type: application/json

{
  "elements": [...],
  "appState": {...},
  "files": {...},
  "version": 1758430000000
}
```

### Update Workspace Name
```
PATCH /api/workspaces/:id
Content-Type: application/json

{
  "name": "New Name"
}
```

### Delete Workspace
```
DELETE /api/workspaces/:id
```

## File Structure

```
workspaces/
├── workspace-metadata.json          # Workspace metadata
├── workspace_1234567890_abc123.excalidraw  # Workspace files
├── workspace_1234567891_def456.excalidraw
└── ...
```

## Running the API

1. Install dependencies:
   ```bash
   cd excalidraw-app/api
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

The API server will run on `http://localhost:3001`

## Integration

The main Excalidraw application automatically connects to this API when using the workspace management features. Drawings are saved as `.excalidraw` files in the project directory, making them part of your codebase and version controllable.
