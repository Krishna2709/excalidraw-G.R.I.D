import { serializeAsJSON } from "@excalidraw/excalidraw/data/json";
import { loadFromBlob } from "@excalidraw/excalidraw/data/blob";
import { normalizeFile } from "@excalidraw/excalidraw/data/blob";

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
  filePath: string; // Path to the .excalidraw file
}

export interface WorkspaceMetadata {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  filePath: string;
}

class FileSystemWorkspaceStorage {
  private static readonly WORKSPACES_DIR = "workspaces";
  private static readonly METADATA_FILE = "workspace-metadata.json";

  private static getWorkspaceFilePath(id: string): string {
    return `${this.WORKSPACES_DIR}/${id}.excalidraw`;
  }

  private static getMetadataFilePath(): string {
    return `${this.WORKSPACES_DIR}/${this.METADATA_FILE}`;
  }

  private static async loadMetadata(): Promise<WorkspaceMetadata[]> {
    try {
      const response = await fetch(this.getMetadataFilePath());
      if (!response.ok) {
        return [];
      }
      const metadata = await response.json();
      return Array.isArray(metadata) ? metadata : [];
    } catch (error) {
      console.error("Error loading workspace metadata:", error);
      return [];
    }
  }

  private static async saveMetadata(metadata: WorkspaceMetadata[]): Promise<void> {
    try {
      const response = await fetch(this.getMetadataFilePath(), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata, null, 2),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save metadata: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error saving workspace metadata:", error);
      throw error;
    }
  }

  static async createWorkspace(name: string): Promise<Workspace> {
    const id = this.generateWorkspaceId();
    const now = Date.now();
    const filePath = this.getWorkspaceFilePath(id);

    const workspace: Workspace = {
      id,
      name,
      createdAt: now,
      updatedAt: now,
      elements: [],
      appState: {},
      files: {},
      filePath,
    };

    // Save the workspace file
    await this.saveWorkspaceFile(workspace);

    // Update metadata
    const metadata = await this.loadMetadata();
    const workspaceMetadata: WorkspaceMetadata = {
      id,
      name,
      createdAt: now,
      updatedAt: now,
      filePath,
    };
    
    metadata.push(workspaceMetadata);
    await this.saveMetadata(metadata);

    return workspace;
  }

  static async saveWorkspace(workspace: Workspace): Promise<void> {
    workspace.updatedAt = Date.now();
    
    // Save the workspace file
    await this.saveWorkspaceFile(workspace);

    // Update metadata
    const metadata = await this.loadMetadata();
    const index = metadata.findIndex(m => m.id === workspace.id);
    
    if (index >= 0) {
      metadata[index] = {
        id: workspace.id,
        name: workspace.name,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
        filePath: workspace.filePath,
      };
    }
    
    await this.saveMetadata(metadata);
  }

  private static async saveWorkspaceFile(workspace: Workspace): Promise<void> {
    try {
      const serialized = serializeAsJSON(
        workspace.elements,
        workspace.appState,
        workspace.files,
        "local"
      );

      const response = await fetch(workspace.filePath, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: serialized,
      });

      if (!response.ok) {
        throw new Error(
          `Failed to save workspace file: ${response.statusText}`,
        );
      }
    } catch (error) {
      console.error("Error saving workspace file:", error);
      throw error;
    }
  }

  static async loadWorkspace(id: string): Promise<Workspace | null> {
    try {
      const filePath = this.getWorkspaceFilePath(id);
      const response = await fetch(filePath);

      if (!response.ok) {
        return null;
      }

      const blob = await response.blob();
      const file = new File([blob], `${id}.excalidraw`, { type: 'application/json' });

      const data = await loadFromBlob(file, null, null, null);

      if (!data) {
        return null;
      }

      return {
        id,
        name: "", // Will be filled from metadata
        createdAt: 0, // Will be filled from metadata
        updatedAt: 0, // Will be filled from metadata
        elements: data.elements || [],
        appState: data.appState || {},
        files: data.files || {},
        filePath,
      };
    } catch (error) {
      console.error("Error loading workspace:", error);
      return null;
    }
  }

  static async getAllWorkspaces(): Promise<WorkspaceMetadata[]> {
    const metadata = await this.loadMetadata();
    return metadata.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  static async deleteWorkspace(id: string): Promise<void> {
    try {
      // Delete the workspace file
      const filePath = this.getWorkspaceFilePath(id);
      const response = await fetch(filePath, {
        method: "DELETE",
      });

      if (!response.ok && response.status !== 404) {
        console.warn(`Failed to delete workspace file: ${response.statusText}`);
      }

      // Remove from metadata
      const metadata = await this.loadMetadata();
      const filteredMetadata = metadata.filter((m) => m.id !== id);
      await this.saveMetadata(filteredMetadata);
    } catch (error) {
      console.error("Error deleting workspace:", error);
      throw error;
    }
  }

  static async updateWorkspaceName(id: string, name: string): Promise<void> {
    try {
      const workspace = await this.loadWorkspace(id);
      if (workspace) {
        workspace.name = name;
        workspace.updatedAt = Date.now();
        await this.saveWorkspace(workspace);
      }
    } catch (error) {
      console.error("Error updating workspace name:", error);
      throw error;
    }
  }

  private static generateWorkspaceId(): string {
    return `workspace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export class FileSystemWorkspaceManager {
  private static currentWorkspaceId: string | null = null;
  private static autoSaveInterval: number | null = null;

  static async createWorkspace(name: string): Promise<Workspace> {
    const workspace = await FileSystemWorkspaceStorage.createWorkspace(name);
    this.currentWorkspaceId = workspace.id;
    this.startAutoSave();
    return workspace;
  }

  static async loadWorkspace(id: string): Promise<Workspace | null> {
    const workspace = await FileSystemWorkspaceStorage.loadWorkspace(id);
    if (workspace) {
      // Fill in metadata
      const metadata = await FileSystemWorkspaceStorage.getAllWorkspaces();
      const meta = metadata.find((m) => m.id === id);
      if (meta) {
        workspace.name = meta.name;
        workspace.createdAt = meta.createdAt;
        workspace.updatedAt = meta.updatedAt;
      }

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

    const workspace = await FileSystemWorkspaceStorage.loadWorkspace(
      this.currentWorkspaceId,
    );
    if (workspace) {
      workspace.elements = [...elements];
      workspace.appState = { ...appState };
      workspace.files = { ...files };
      await FileSystemWorkspaceStorage.saveWorkspace(workspace);
    }
  }

  static async getAllWorkspaces(): Promise<WorkspaceMetadata[]> {
    return await FileSystemWorkspaceStorage.getAllWorkspaces();
  }

  static async deleteWorkspace(id: string): Promise<void> {
    await FileSystemWorkspaceStorage.deleteWorkspace(id);
    if (this.currentWorkspaceId === id) {
      this.currentWorkspaceId = null;
      this.stopAutoSave();
    }
  }

  static async updateWorkspaceName(id: string, name: string): Promise<void> {
    await FileSystemWorkspaceStorage.updateWorkspaceName(id, name);
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
    // Auto-save every 30 seconds
    this.autoSaveInterval = window.setInterval(() => {
      // This will be called from the onChange handler
    }, 30000);
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
