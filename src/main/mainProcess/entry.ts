import { app, ipcMain } from "electron";
import * as fs from "node:fs";
import * as path from "node:path";

import { setupApp } from "./appSetup";
import { registerIpcBridge } from "./ipcBridge";
import { registerLifecycle, registerActivate } from "./lifecycle";
import { registerProtocols } from "./protocols";
import { registerSandboxIpc } from "./sandbox";
import { state, srcDir } from "./state";
import { createWindow, registerMessagingIpc } from "./windows";
import {
  ensureWorkspaceScaffold,
  maybeMigrateJsonIntoProject,
  registerWorkspaceSelectionIpc,
  getFallbackJsonDirForMain,
} from "./workspace";
import { isExistingDirectory } from "./pathSafety";

const getTestProjectDir = (): string | null => {
  const raw = process.env.NW_WRLD_TEST_PROJECT_DIR;
  if (!raw || typeof raw !== "string") return null;
  const dir = raw.trim();
  if (!dir) return null;
  if (!isExistingDirectory(dir)) return null;
  return dir;
};

export function start() {
  setupApp();

  registerIpcBridge();
  registerSandboxIpc();
  registerMessagingIpc({ ipcMain });
  registerWorkspaceSelectionIpc({ createWindow });
  registerLifecycle({ createWindow });

  app.whenReady().then(async () => {
    registerProtocols();
    const testProjectDir = getTestProjectDir();
    let projectDirToUse: string | null = null;
    
    if (testProjectDir) {
      projectDirToUse = testProjectDir;
    } else {
      try {
        const fallbackJsonDir = getFallbackJsonDirForMain();
        const legacyJsonDir = path.join(srcDir, "..", "src", "shared", "json");
        
        const checkAppStatePath = async (appStatePath: string) => {
          if (fs.existsSync(appStatePath)) {
            const appStateContent = await fs.promises.readFile(appStatePath, "utf-8");
            const appState = JSON.parse(appStateContent);
            const savedWorkspacePath = appState?.workspacePath;
            if (typeof savedWorkspacePath === "string" && savedWorkspacePath.trim() && isExistingDirectory(savedWorkspacePath)) {
              return savedWorkspacePath.trim();
            }
          }
          return null;
        };
        
        const fallbackPath = path.join(fallbackJsonDir, "appState.json");
        const legacyPath = path.join(legacyJsonDir, "appState.json");
        
        projectDirToUse = await checkAppStatePath(fallbackPath) || await checkAppStatePath(legacyPath) || null;
        
        console.log("[Main] Loaded workspace path on startup:", projectDirToUse);
      } catch (err) {
        console.warn("[Main] Error loading workspace path from appState:", err);
      }
    }
    
    if (projectDirToUse) {
      state.currentProjectDir = projectDirToUse;
      try {
        await ensureWorkspaceScaffold(projectDirToUse);
      } catch {}
      try {
        maybeMigrateJsonIntoProject(projectDirToUse);
      } catch {}
    } else {
      state.currentProjectDir = null;
    }
    registerActivate({ createWindow });
    createWindow(projectDirToUse);
  });
}
