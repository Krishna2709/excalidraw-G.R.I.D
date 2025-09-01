import React, { useState, useEffect, useCallback } from "react";

import { Dialog } from "@excalidraw/excalidraw/components/Dialog";
import { TextField } from "@excalidraw/excalidraw/components/TextField";
import { ToolButton } from "@excalidraw/excalidraw/components/ToolButton";
import {
  TrashIcon,
  PlusIcon,
  DotsIcon,
  LibraryIcon,
  LoadIcon,
  collapseDownIcon,
} from "@excalidraw/excalidraw/components/icons";

import { t } from "@excalidraw/excalidraw/i18n";

// eslint-disable-next-line import/order
import { WorkspaceManager } from "../data/WorkspaceManager";
import type { WorkspaceMetadata } from "../data/WorkspaceManager";

// eslint-disable-next-line import/order
import "./WorkspaceSelector.scss";

interface WorkspaceSelectorProps {
  onWorkspaceChange: (workspaceId: string | null) => void;
  currentWorkspaceId: string | null;
  onQuickDrawingStart: () => void;
  onSaveToWorkspace?: (workspaceId: string) => void;
  hasUnsavedChanges?: boolean;
  onNewDrawing?: () => void;
}

export const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({
  onWorkspaceChange,
  currentWorkspaceId,
  onQuickDrawingStart,
  onSaveToWorkspace,
  hasUnsavedChanges = false,
  onNewDrawing,
}) => {
  const [workspaces, setWorkspaces] = useState<WorkspaceMetadata[]>([]);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [showWorkspaceList, setShowWorkspaceList] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showNewDrawingDialog, setShowNewDrawingDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [editingWorkspace, setEditingWorkspace] =
    useState<WorkspaceMetadata | null>(null);
  const [editWorkspaceName, setEditWorkspaceName] = useState("");

  const loadWorkspaces = useCallback(async () => {
    const workspacesList = await WorkspaceManager.getAllWorkspaces();
    setWorkspaces(workspacesList);
  }, []);

  useEffect(() => {
    loadWorkspaces();
    // Show welcome dialog if no workspace is selected
    if (!currentWorkspaceId) {
      setShowWelcomeDialog(true);
    }
  }, [loadWorkspaces, currentWorkspaceId]);

  const handleCreateWorkspace = async () => {
    if (newWorkspaceName.trim()) {
      const workspace = await WorkspaceManager.createWorkspace(
        newWorkspaceName.trim(),
      );
      setNewWorkspaceName("");
      setShowCreateDialog(false);
      setShowWelcomeDialog(false);
      await loadWorkspaces();
      onWorkspaceChange(workspace.id);
    }
  };

  const handleSelectWorkspace = async (workspaceId: string) => {
    await WorkspaceManager.loadWorkspace(workspaceId);
    onWorkspaceChange(workspaceId);
    setShowWorkspaceList(false);
    setShowWelcomeDialog(false);
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    if (confirm(t("workspace.deleteConfirm"))) {
      await WorkspaceManager.deleteWorkspace(workspaceId);
      await loadWorkspaces();
      if (currentWorkspaceId === workspaceId) {
        onWorkspaceChange(null);
        setShowWelcomeDialog(true);
      }
    }
  };

  const handleEditWorkspace = async () => {
    if (editingWorkspace && editWorkspaceName.trim()) {
      await WorkspaceManager.updateWorkspaceName(
        editingWorkspace.id,
        editWorkspaceName.trim(),
      );
      setEditWorkspaceName("");
      setShowEditDialog(false);
      setEditingWorkspace(null);
      await loadWorkspaces();
    }
  };

  const openEditDialog = (workspace: WorkspaceMetadata) => {
    setEditingWorkspace(workspace);
    setEditWorkspaceName(workspace.name);
    setShowEditDialog(true);
  };

  const handleQuickDrawingStart = () => {
    setShowWelcomeDialog(false);
    onQuickDrawingStart();
  };

  const handleOpenExistingWorkspace = () => {
    setShowWelcomeDialog(false);
    setShowWorkspaceList(true);
  };

  const handleCreateNewWorkspace = () => {
    setShowWelcomeDialog(false);
    setShowCreateDialog(true);
  };

  const handleSaveToWorkspace = async (workspaceId: string) => {
    if (onSaveToWorkspace) {
      onSaveToWorkspace(workspaceId);
    }
    setShowSaveDialog(false);
  };

  const handleSaveToNewWorkspace = async () => {
    if (newWorkspaceName.trim()) {
      const workspace = await WorkspaceManager.createWorkspace(
        newWorkspaceName.trim(),
      );
      setNewWorkspaceName("");
      setShowSaveDialog(false);
      await loadWorkspaces();
      if (onSaveToWorkspace) {
        onSaveToWorkspace(workspace.id);
      }
    }
  };

  const handleNewDrawing = () => {
    setShowNewDrawingDialog(true);
  };

  const handleNewDrawingInCurrentWorkspace = () => {
    setShowNewDrawingDialog(false);
    if (onNewDrawing) {
      onNewDrawing();
    }
  };

  const handleNewDrawingInNewWorkspace = async () => {
    if (newWorkspaceName.trim()) {
      const workspace = await WorkspaceManager.createWorkspace(
        newWorkspaceName.trim(),
      );
      setNewWorkspaceName("");
      setShowNewDrawingDialog(false);
      await loadWorkspaces();
      onWorkspaceChange(workspace.id);
      if (onNewDrawing) {
        onNewDrawing();
      }
    }
  };

  const handleMoveToNewWorkspace = async () => {
    if (newWorkspaceName.trim()) {
      const workspace = await WorkspaceManager.createWorkspace(
        newWorkspaceName.trim(),
      );
      setNewWorkspaceName("");
      setShowNewDrawingDialog(false);
      await loadWorkspaces();
      if (onSaveToWorkspace) {
        onSaveToWorkspace(workspace.id);
      }
    }
  };

  const handleMoveToWorkspace = async (targetWorkspaceId: string) => {
    if (onSaveToWorkspace) {
      onSaveToWorkspace(targetWorkspaceId);
    }
    setShowMoveDialog(false);
  };

  const handleMoveToNewWorkspaceFromDialog = async () => {
    if (newWorkspaceName.trim()) {
      const workspace = await WorkspaceManager.createWorkspace(
        newWorkspaceName.trim(),
      );
      setNewWorkspaceName("");
      setShowMoveDialog(false);
      await loadWorkspaces();
      if (onSaveToWorkspace) {
        onSaveToWorkspace(workspace.id);
      }
    }
  };

  const toggleWorkspaceDropdown = () => {
    setShowWorkspaceDropdown(!showWorkspaceDropdown);
  };

  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  // Filter out current workspace from move options
  const availableWorkspaces = workspaces.filter(
    (w) => w.id !== currentWorkspaceId,
  );

  return (
    <>
      {/* Current Workspace Display */}
      {currentWorkspace && (
        <div className="workspace-selector">
          <div className="workspace-selector__dropdown-container">
            <button
              type="button"
              onClick={toggleWorkspaceDropdown}
              className="workspace-selector__button"
              aria-label={currentWorkspace.name}
              title="Click to switch workspace or move drawing"
            >
              {LibraryIcon}
              <span>{currentWorkspace.name}</span>
              {hasUnsavedChanges && (
                <span className="workspace-selector__unsaved-indicator">*</span>
              )}
                             {collapseDownIcon}
            </button>

            {showWorkspaceDropdown && (
              <div className="workspace-selector__dropdown">
                <div className="workspace-selector__dropdown-header">
                  <span>Current: {currentWorkspace.name}</span>
                </div>
                
                <div className="workspace-selector__dropdown-section">
                  <h4>Switch Workspace</h4>
                  {availableWorkspaces.length > 0 ? (
                    availableWorkspaces.map((workspace) => (
                      <button
                        key={workspace.id}
                        type="button"
                        onClick={() => {
                          handleSelectWorkspace(workspace.id);
                          setShowWorkspaceDropdown(false);
                        }}
                        className="workspace-selector__dropdown-option"
                      >
                        {LibraryIcon}
                        <span>{workspace.name}</span>
                      </button>
                    ))
                  ) : (
                    <div className="workspace-selector__dropdown-empty">
                      No other workspaces available
                    </div>
                  )}
                </div>

                {hasUnsavedChanges && (
                  <div className="workspace-selector__dropdown-section">
                    <h4>Move Current Drawing</h4>
                    {availableWorkspaces.length > 0 ? (
                      availableWorkspaces.map((workspace) => (
                        <button
                          key={workspace.id}
                          type="button"
                          onClick={() => {
                            handleMoveToWorkspace(workspace.id);
                            setShowWorkspaceDropdown(false);
                          }}
                          className="workspace-selector__dropdown-option workspace-selector__dropdown-option--move"
                        >
                          {LoadIcon}
                          <span>Move to {workspace.name}</span>
                        </button>
                      ))
                    ) : (
                      <div className="workspace-selector__dropdown-empty">
                        No other workspaces available
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setShowMoveDialog(true);
                        setShowWorkspaceDropdown(false);
                      }}
                      className="workspace-selector__dropdown-option workspace-selector__dropdown-option--move"
                    >
                      {PlusIcon}
                      <span>Move to New Workspace</span>
                    </button>
                  </div>
                )}

                <div className="workspace-selector__dropdown-actions">
                  <button
                    type="button"
                    onClick={() => setShowWorkspaceDropdown(false)}
                    className="workspace-selector__dropdown-cancel"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleNewDrawing}
            className="workspace-selector__new-drawing-button"
            title="Create new drawing"
          >
            {PlusIcon}
            <span>New Drawing</span>
          </button>
        </div>
      )}

      {/* Quick Drawing Save Button (when no workspace selected) */}
      {!currentWorkspaceId && hasUnsavedChanges && (
        <div className="workspace-save-prompt">
          <button
            type="button"
            onClick={() => setShowSaveDialog(true)}
            className="workspace-save-prompt__button"
            title="Save your drawing to a workspace"
          >
            💾
            <span>Save to Workspace</span>
          </button>
        </div>
      )}

      {/* Welcome Dialog */}
      {showWelcomeDialog && (
        <Dialog
          onCloseRequest={() => setShowWelcomeDialog(false)}
          title="Welcome to Excalidraw"
          className="workspace-welcome-dialog"
        >
          <div className="workspace-welcome-dialog__content">
            <div className="workspace-welcome-dialog__header">
              <h2>Choose how you'd like to start</h2>
              <p>Select an option to begin your drawing session</p>
            </div>

            <div className="workspace-welcome-dialog__options">
              <button
                type="button"
                onClick={handleQuickDrawingStart}
                className="workspace-welcome-dialog__option workspace-welcome-dialog__option--quick"
              >
                {LoadIcon}
                <div className="workspace-welcome-dialog__option-content">
                  <h3>Quick Drawing</h3>
                  <p>
                    Start drawing immediately. You can save to a workspace later.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={handleCreateNewWorkspace}
                className="workspace-welcome-dialog__option workspace-welcome-dialog__option--new"
              >
                {PlusIcon}
                <div className="workspace-welcome-dialog__option-content">
                  <h3>Create New Workspace</h3>
                  <p>Create a new workspace for your project or idea.</p>
                </div>
              </button>

              {workspaces.length > 0 && (
                <button
                  type="button"
                  onClick={handleOpenExistingWorkspace}
                  className="workspace-welcome-dialog__option workspace-welcome-dialog__option--existing"
                >
                  {LibraryIcon}
                  <div className="workspace-welcome-dialog__option-content">
                    <h3>Open Existing Workspace</h3>
                    <p>
                      Continue working on a previous project ({workspaces.length}{" "}
                      available).
                    </p>
                  </div>
                </button>
              )}
            </div>
          </div>
        </Dialog>
      )}

      {/* Move to Workspace Dialog */}
      {showMoveDialog && (
        <Dialog
          onCloseRequest={() => setShowMoveDialog(false)}
          title="Move Drawing to Workspace"
          className="workspace-move-dialog"
        >
          <div className="workspace-move-dialog__content">
            <div className="workspace-move-dialog__header">
              <h3>Move your current drawing</h3>
              <p>Choose where to move your drawing from "{currentWorkspace?.name}"</p>
            </div>

            <div className="workspace-move-dialog__options">
              {availableWorkspaces.length > 0 && (
                <div className="workspace-move-dialog__section">
                  <h4>Move to Existing Workspace</h4>
                  <div className="workspace-move-dialog__list">
                    {availableWorkspaces.map((workspace) => (
                      <button
                        key={workspace.id}
                        type="button"
                        onClick={() => handleMoveToWorkspace(workspace.id)}
                        className="workspace-move-dialog__option"
                      >
                        {LibraryIcon}
                        <div className="workspace-move-dialog__option-content">
                          <h5>{workspace.name}</h5>
                          <p>Last modified: {formatDate(workspace.updatedAt)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="workspace-move-dialog__section">
                <h4>Move to New Workspace</h4>
                <div className="workspace-move-dialog__create">
                  <TextField
                    value={newWorkspaceName}
                    onChange={(value) => setNewWorkspaceName(value)}
                    placeholder="Enter new workspace name"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleMoveToNewWorkspaceFromDialog();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleMoveToNewWorkspaceFromDialog}
                    disabled={!newWorkspaceName.trim()}
                    className="workspace-move-dialog__create-button"
                  >
                    Create & Move
                  </button>
                </div>
              </div>
            </div>

            <div className="workspace-move-dialog__warning">
              <p>⚠️ Moving will save your current drawing to the selected workspace and clear the current canvas.</p>
            </div>

            <div className="workspace-move-dialog__actions">
              <button
                type="button"
                onClick={() => {
                  setShowMoveDialog(false);
                  setNewWorkspaceName("");
                }}
                className="workspace-move-dialog__cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </Dialog>
      )}

      {/* New Drawing Dialog */}
      {showNewDrawingDialog && (
        <Dialog
          onCloseRequest={() => setShowNewDrawingDialog(false)}
          title="New Drawing"
          className="workspace-new-drawing-dialog"
        >
          <div className="workspace-new-drawing-dialog__content">
            <div className="workspace-new-drawing-dialog__header">
              <h3>What would you like to do?</h3>
              <p>Choose how to handle your current drawing</p>
            </div>

            <div className="workspace-new-drawing-dialog__options">
              {hasUnsavedChanges && (
                <div className="workspace-new-drawing-dialog__section">
                  <h4>Save Current Drawing</h4>
                  <div className="workspace-new-drawing-dialog__option-group">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewDrawingDialog(false);
                        setShowSaveDialog(true);
                      }}
                      className="workspace-new-drawing-dialog__option"
                    >
                      {LibraryIcon}
                      <div className="workspace-new-drawing-dialog__option-content">
                        <h5>Save to Existing Workspace</h5>
                        <p>Save your current drawing to an existing workspace</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={handleMoveToNewWorkspace}
                      className="workspace-new-drawing-dialog__option"
                    >
                      {PlusIcon}
                      <div className="workspace-new-drawing-dialog__option-content">
                        <h5>Move to New Workspace</h5>
                        <p>Create a new workspace and move your drawing there</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              <div className="workspace-new-drawing-dialog__section">
                <h4>Start Fresh</h4>
                <div className="workspace-new-drawing-dialog__option-group">
                  <button
                    type="button"
                    onClick={handleNewDrawingInCurrentWorkspace}
                    className="workspace-new-drawing-dialog__option"
                  >
                    {LoadIcon}
                    <div className="workspace-new-drawing-dialog__option-content">
                      <h5>New Drawing in Current Workspace</h5>
                      <p>Start a new drawing in "{currentWorkspace?.name}"</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleNewDrawingInNewWorkspace}
                    className="workspace-new-drawing-dialog__option"
                  >
                    {PlusIcon}
                    <div className="workspace-new-drawing-dialog__option-content">
                      <h5>New Drawing in New Workspace</h5>
                      <p>Create a new workspace and start fresh</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {hasUnsavedChanges && (
              <div className="workspace-new-drawing-dialog__warning">
                <p>⚠️ You have unsaved changes. Consider saving your current drawing first.</p>
              </div>
            )}

            <div className="workspace-new-drawing-dialog__actions">
              <button
                type="button"
                onClick={() => setShowNewDrawingDialog(false)}
                className="workspace-new-drawing-dialog__cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Workspace List Dialog */}
      {showWorkspaceList && (
        <Dialog
          onCloseRequest={() => setShowWorkspaceList(false)}
          title="Select Workspace"
          className="workspace-list-dialog"
        >
          <div className="workspace-list-dialog__content">
            <div className="workspace-list-dialog__header">
              <button
                type="button"
                onClick={handleCreateNewWorkspace}
                className="workspace-list-dialog__create-button"
              >
                {PlusIcon}
                {t("workspace.create")}
              </button>
            </div>

            <div className="workspace-list-dialog__list">
              {workspaces.length === 0 ? (
                <div className="workspace-list-dialog__empty">
                  {t("workspace.noWorkspaces")}
                </div>
              ) : (
                workspaces.map((workspace) => (
                  <div
                    key={workspace.id}
                    className={`workspace-item ${
                      workspace.id === currentWorkspaceId
                        ? "workspace-item--active"
                        : ""
                    }`}
                  >
                    <div
                      className="workspace-item__content"
                      onClick={() => handleSelectWorkspace(workspace.id)}
                    >
                      <div className="workspace-item__name">{workspace.name}</div>
                      <div className="workspace-item__date">
                        {t("workspace.lastModified")}:{" "}
                        {formatDate(workspace.updatedAt)}
                      </div>
                    </div>
                    <div className="workspace-item__actions">
                      <ToolButton
                        type="button"
                        onClick={() => openEditDialog(workspace)}
                        className="workspace-item__edit"
                        aria-label="Edit workspace"
                        icon={DotsIcon}
                      />
                      <ToolButton
                        type="button"
                        onClick={() => handleDeleteWorkspace(workspace.id)}
                        className="workspace-item__delete"
                        aria-label="Delete workspace"
                        icon={TrashIcon}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="workspace-list-dialog__footer">
              <button
                type="button"
                onClick={() => {
                  setShowWorkspaceList(false);
                  setShowWelcomeDialog(true);
                }}
                className="workspace-list-dialog__cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Create Workspace Dialog */}
      {showCreateDialog && (
        <Dialog
          onCloseRequest={() => setShowCreateDialog(false)}
          title={t("workspace.create")}
          className="workspace-create-dialog"
        >
          <div className="workspace-create-dialog__content">
            <TextField
              value={newWorkspaceName}
              onChange={(value) => setNewWorkspaceName(value)}
              placeholder={t("workspace.namePlaceholder")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreateWorkspace();
                }
              }}
            />
            <div className="workspace-create-dialog__actions">
              <button type="button" onClick={() => {
                setShowCreateDialog(false);
                setShowWelcomeDialog(true);
              }}>
                {t("buttons.cancel")}
              </button>
              <button
                type="button"
                onClick={handleCreateWorkspace}
                disabled={!newWorkspaceName.trim()}
              >
                {t("workspace.create")}
              </button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Edit Workspace Dialog */}
      {showEditDialog && (
        <Dialog
          onCloseRequest={() => setShowEditDialog(false)}
          title={t("workspace.edit")}
          className="workspace-edit-dialog"
        >
          <div className="workspace-edit-dialog__content">
            <TextField
              value={editWorkspaceName}
              onChange={(value) => setEditWorkspaceName(value)}
              placeholder={t("workspace.namePlaceholder")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleEditWorkspace();
                }
              }}
            />
            <div className="workspace-edit-dialog__actions">
              <button type="button" onClick={() => {
                setShowEditDialog(false);
                setEditingWorkspace(null);
                setEditWorkspaceName("");
              }}>
                {t("buttons.cancel")}
              </button>
              <button
                type="button"
                onClick={handleEditWorkspace}
                disabled={!editWorkspaceName.trim()}
              >
                {t("buttons.save")}
              </button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Save to Workspace Dialog */}
      {showSaveDialog && (
        <Dialog
          onCloseRequest={() => setShowSaveDialog(false)}
          title="Save to Workspace"
          className="workspace-save-dialog"
        >
          <div className="workspace-save-dialog__content">
            <div className="workspace-save-dialog__section">
              <h3>Save to Existing Workspace</h3>
              <div className="workspace-save-dialog__list">
                {workspaces.length === 0 ? (
                  <p className="workspace-save-dialog__empty">
                    No workspaces available. Create a new one below.
                  </p>
                ) : (
                  workspaces.map((workspace) => (
                    <button
                      key={workspace.id}
                      type="button"
                      onClick={() => handleSaveToWorkspace(workspace.id)}
                      className="workspace-save-dialog__option"
                    >
                      {LibraryIcon}
                      <span>{workspace.name}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="workspace-save-dialog__section">
              <h3>Save to New Workspace</h3>
              <div className="workspace-save-dialog__create">
                <TextField
                  value={newWorkspaceName}
                  onChange={(value) => setNewWorkspaceName(value)}
                  placeholder="Enter workspace name"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSaveToNewWorkspace();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleSaveToNewWorkspace}
                  disabled={!newWorkspaceName.trim()}
                  className="workspace-save-dialog__create-button"
                >
                  Create & Save
                </button>
              </div>
            </div>

            <div className="workspace-save-dialog__actions">
              <button
                type="button"
                onClick={() => {
                  setShowSaveDialog(false);
                  setNewWorkspaceName("");
                }}
                className="workspace-save-dialog__cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
};
