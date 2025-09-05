import { createStore, entries, del, get, set } from "idb-keyval";

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
}

export interface WorkspaceMetadata {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

class WorkspaceStorage {
  private static workspaceStore = createStore(
    "workspaces-db",
    "workspaces-store",
  );
  private static metadataStore = createStore(
    "workspace-metadata-db",
    "workspace-metadata-store",
  );

  static async createWorkspace(name: string): Promise<Workspace> {
    const id = this.generateWorkspaceId();
    const now = Date.now();

    const workspace: Workspace = {
      id,
      name,
      createdAt: now,
      updatedAt: now,
      elements: [],
      appState: {},
      files: {},
    };

    await set(id, workspace, this.workspaceStore);
    await set(
      id,
      {
        id,
        name,
        createdAt: now,
        updatedAt: now,
      },
      this.metadataStore,
    );

    return workspace;
  }

  static async saveWorkspace(workspace: Workspace): Promise<void> {
    workspace.updatedAt = Date.now();
    await set(workspace.id, workspace, this.workspaceStore);
    await set(
      workspace.id,
      {
        id: workspace.id,
        name: workspace.name,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
      },
      this.metadataStore,
    );
  }

  static async loadWorkspace(id: string): Promise<Workspace | null> {
    try {
      const workspace = await get(id, this.workspaceStore);
      return workspace || null;
    } catch (error) {
      console.error("Error loading workspace:", error);
      return null;
    }
  }

  static async getAllWorkspaces(): Promise<WorkspaceMetadata[]> {
    try {
      const entriesList = await entries(this.metadataStore);
      return entriesList
        .map(([key, value]) => value as WorkspaceMetadata)
        .sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
      console.error("Error loading workspaces:", error);
      return [];
    }
  }

  static async deleteWorkspace(id: string): Promise<void> {
    try {
      await del(id, this.workspaceStore);
      await del(id, this.metadataStore);
    } catch (error) {
      console.error("Error deleting workspace:", error);
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
    }
  }

  private static generateWorkspaceId(): string {
    return `workspace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export class WorkspaceManager {
  private static currentWorkspaceId: string | null = null;
  private static autoSaveInterval: number | null = null;

  static async createWorkspace(name: string): Promise<Workspace> {
    const workspace = await WorkspaceStorage.createWorkspace(name);
    this.currentWorkspaceId = workspace.id;
    this.startAutoSave();
    return workspace;
  }

  static async loadWorkspace(id: string): Promise<Workspace | null> {
    const workspace = await WorkspaceStorage.loadWorkspace(id);
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

    const workspace = await WorkspaceStorage.loadWorkspace(
      this.currentWorkspaceId,
    );
    if (workspace) {
      workspace.elements = [...elements];
      workspace.appState = { ...appState };
      workspace.files = { ...files };
      await WorkspaceStorage.saveWorkspace(workspace);
    }
  }

  static async getAllWorkspaces(): Promise<WorkspaceMetadata[]> {
    return await WorkspaceStorage.getAllWorkspaces();
  }

  static async deleteWorkspace(id: string): Promise<void> {
    await WorkspaceStorage.deleteWorkspace(id);
    if (this.currentWorkspaceId === id) {
      this.currentWorkspaceId = null;
      this.stopAutoSave();
    }
  }

  static async updateWorkspaceName(id: string, name: string): Promise<void> {
    await WorkspaceStorage.updateWorkspaceName(id, name);
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
