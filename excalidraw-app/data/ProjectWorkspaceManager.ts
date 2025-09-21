import type { ExcalidrawElement } from "@excalidraw/element/types";
import type { AppState, BinaryFiles } from "@excalidraw/excalidraw/types";

export interface Workspace {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  elements: ExcalidrawElement[];
  appState: Partial<AppState>;
  files: BinaryFiles;
  filePath: string;
  drawingName?: string;
  version?: number;
}

export interface WorkspaceMetadata {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  filePath: string;
  drawingName?: string;
}

const API_BASE_URL = "http://localhost:3001/api";

class ProjectWorkspaceStorage {
  private static async apiCall(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log("ProjectWorkspaceManager.apiCall() - URL:", url);
    console.log("ProjectWorkspaceManager.apiCall() - options:", options);
    
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        // Add cache-busting for GET requests
        ...(options.method === 'GET' || !options.method ? {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        } : {}),
        ...options.headers,
      },
      ...options,
    });

    console.log("ProjectWorkspaceManager.apiCall() - response status:", response.status);
    console.log("ProjectWorkspaceManager.apiCall() - response ok:", response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ProjectWorkspaceManager.apiCall() - error response:", errorText);
      throw new Error(`API call failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("ProjectWorkspaceManager.apiCall() - result:", result);
    return result;
  }

  static async createWorkspace(name: string): Promise<Workspace> {
    const metadata = await this.apiCall("/workspaces", {
      method: "POST",
      body: JSON.stringify({ name }),
    });

    return {
      id: metadata.id,
      name: metadata.name,
      createdAt: metadata.createdAt,
      updatedAt: metadata.updatedAt,
      elements: [],
      appState: {},
      files: {},
      filePath: metadata.filePath,
    };
  }

  static async saveWorkspace(workspace: Workspace): Promise<void> {
    console.log("ProjectWorkspaceManager.saveWorkspace() - Saving workspace:", workspace.id);
    console.log("ProjectWorkspaceManager.saveWorkspace() - Elements count:", workspace.elements.length);

    // Log text elements specifically
    const textElements = workspace.elements.filter(el => el.type === 'text');
    console.log("ProjectWorkspaceManager.saveWorkspace() - Text elements found:", textElements.length);
    textElements.forEach((el, index) => {
      console.log(`ProjectWorkspaceManager.saveWorkspace() - Text element ${index}:`, {
        id: el.id,
        text: (el as any).text,
        originalText: (el as any).originalText,
        type: el.type
      });
    });

    // sanitize appState to avoid passing non-serializable or incompatible fields
    const { appState, ...rest } = workspace as any;
    const sanitizedAppState = { ...(appState || {}) } as any;
    if (sanitizedAppState && typeof sanitizedAppState === 'object') {
      if ('collaborators' in sanitizedAppState && !Array.isArray(sanitizedAppState.collaborators)) {
        delete sanitizedAppState.collaborators;
      }
      // drop UI-only flags that may cause issues
      delete sanitizedAppState.toast;
      delete sanitizedAppState.contextMenu;
      delete sanitizedAppState.openMenu;
      delete sanitizedAppState.openPopup;
      delete sanitizedAppState.openSidebar;
      delete sanitizedAppState.openDialog;
    }

    const result = await this.apiCall(`/workspaces/${workspace.id}`, {
      method: "PUT",
      body: JSON.stringify({
        elements: workspace.elements,
        appState: sanitizedAppState,
        files: workspace.files,
        version: workspace.version,
      }),
    });
    if ((result as any)?.version) {
      workspace.version = (result as any).version;
    }
  }

  static async loadWorkspace(id: string): Promise<Workspace | null> {
    try {
      const workspace = await this.apiCall(`/workspaces/${id}`);
      // Capture server version for optimistic concurrency
      if ((workspace as any)?.version) {
        (workspace as any).version = (workspace as any).version;
      }
      return workspace;
    } catch (error) {
      console.error("Error loading workspace:", error);
      return null;
    }
  }

  static async getAllWorkspaces(): Promise<WorkspaceMetadata[]> {
    console.log("ProjectWorkspaceManager.getAllWorkspaces() called");
    try {
      const result = await this.apiCall("/workspaces");
      console.log("ProjectWorkspaceManager.getAllWorkspaces() result:", result);
      return result;
    } catch (error) {
      console.error("ProjectWorkspaceManager.getAllWorkspaces() error:", error);
      throw error;
    }
  }

  static async deleteWorkspace(id: string): Promise<void> {
    await this.apiCall(`/workspaces/${id}`, {
      method: "DELETE",
    });
  }

  static async updateWorkspaceName(id: string, name: string): Promise<void> {
    await this.apiCall(`/workspaces/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
  }

  static async updateDrawingName(id: string, drawingName: string): Promise<void> {
    await this.apiCall(`/workspaces/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ drawingName }),
    });
  }
}

export class ProjectWorkspaceManager {
  private static currentWorkspaceId: string | null = null;
  private static autoSaveInterval: number | null = null;
  private static lastSavedElements: readonly ExcalidrawElement[] = [];
  private static lastSavedAppState: AppState | null = null;
  private static lastSavedFiles: BinaryFiles = {};
  private static autoSaveCallback: (() => void) | null = null;

  static async createWorkspace(name: string): Promise<Workspace> {
    const workspace = await ProjectWorkspaceStorage.createWorkspace(name);
    this.currentWorkspaceId = workspace.id;
    this.startAutoSave();
    return workspace;
  }

  static async loadWorkspace(id: string): Promise<Workspace | null> {
    const workspace = await ProjectWorkspaceStorage.loadWorkspace(id);
    if (workspace) {
      this.currentWorkspaceId = id;
      this.startAutoSave();
    }
    return workspace;
  }

  static async saveCurrentWorkspace(
    elements: readonly ExcalidrawElement[],
    appState: AppState,
    files: BinaryFiles,
  ): Promise<void> {
    if (!this.currentWorkspaceId) {
      return;
    }

    const workspace = await ProjectWorkspaceStorage.loadWorkspace(
      this.currentWorkspaceId,
    );
    if (workspace) {
      workspace.elements = [...elements];
      workspace.appState = { ...appState };
      workspace.files = { ...files };
      await ProjectWorkspaceStorage.saveWorkspace(workspace);
      
      // Update last saved state
      this.lastSavedElements = [...elements];
      this.lastSavedAppState = { ...appState };
      this.lastSavedFiles = { ...files };
    }
  }

  static setAutoSaveCallback(callback: () => void): void {
    this.autoSaveCallback = callback;
  }

  static hasUnsavedChanges(
    elements: readonly ExcalidrawElement[],
    appState: AppState,
    files: BinaryFiles,
  ): boolean {
    if (!this.currentWorkspaceId) {
      return elements.length > 0;
    }

    // Check if elements have changed
    if (elements.length !== this.lastSavedElements.length) {
      return true;
    }

    // Check if any element has changed
    for (let i = 0; i < elements.length; i++) {
      if (JSON.stringify(elements[i]) !== JSON.stringify(this.lastSavedElements[i])) {
        return true;
      }
    }

    // Check if app state has changed (excluding viewport changes)
    const currentAppState = { ...appState };
    const lastAppState = this.lastSavedAppState || {};
    
    // Remove viewport-related properties that change frequently
    if ('zoom' in currentAppState) {
      delete (currentAppState as any).zoom;
    }
    if ('scrollX' in currentAppState) {
      delete (currentAppState as any).scrollX;
    }
    if ('scrollY' in currentAppState) {
      delete (currentAppState as any).scrollY;
    }
    if ('zoom' in lastAppState) {
      delete (lastAppState as any).zoom;
    }
    if ('scrollX' in lastAppState) {
      delete (lastAppState as any).scrollX;
    }
    if ('scrollY' in lastAppState) {
      delete (lastAppState as any).scrollY;
    }

    if (JSON.stringify(currentAppState) !== JSON.stringify(lastAppState)) {
      return true;
    }

    // Check if files have changed
    if (JSON.stringify(files) !== JSON.stringify(this.lastSavedFiles)) {
      return true;
    }

    return false;
  }

  static async getAllWorkspaces(): Promise<WorkspaceMetadata[]> {
    return await ProjectWorkspaceStorage.getAllWorkspaces();
  }

  static async deleteWorkspace(id: string): Promise<void> {
    await ProjectWorkspaceStorage.deleteWorkspace(id);
    if (this.currentWorkspaceId === id) {
      this.currentWorkspaceId = null;
      this.stopAutoSave();
    }
  }

  static async updateWorkspaceName(id: string, name: string): Promise<void> {
    await ProjectWorkspaceStorage.updateWorkspaceName(id, name);
  }

  static async updateDrawingName(id: string, drawingName: string): Promise<void> {
    await ProjectWorkspaceStorage.updateDrawingName(id, drawingName);
  }

  static async forceRefreshWorkspace(id: string): Promise<Workspace | null> {
    // Force reload workspace by adding cache-busting parameter
    const timestamp = Date.now();
    const response = await fetch(`${API_BASE_URL}/workspaces/${id}?t=${timestamp}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (response.status === 404) {
      // Workspace not found; stop polling by returning null so caller can handle gracefully
      console.warn(`forceRefreshWorkspace: workspace ${id} not found (404)`);
      return null;
    }
    if (!response.ok) {
      // For 5xx or other errors, backoff: return null instead of throwing to avoid loop spam
      console.warn(`forceRefreshWorkspace: HTTP ${response.status} ${response.statusText}`);
      return null;
    }
    
    const workspace = await response.json();
    console.log(`Force refreshed workspace ${id}:`, workspace);
    return workspace;
  }

  static getCurrentWorkspaceId(): string | null {
    return this.currentWorkspaceId;
  }

  static setCurrentWorkspaceId(id: string | null): void {
    this.currentWorkspaceId = id;
    if (id) {
      this.startAutoSave();
    } else {
      this.stopAutoSave();
    }
  }

  private static startAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    // Auto-save every 10 seconds
    this.autoSaveInterval = window.setInterval(() => {
      if (this.autoSaveCallback) {
        this.autoSaveCallback();
      }
    }, 10000);
  }

  private static stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  static cleanup(): void {
    this.stopAutoSave();
  }
}
