import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAtom } from "jotai";
import { FaPlus, FaCode, FaEye, FaSpinner, FaCheck, FaSearch } from "react-icons/fa";
import { Modal } from "../shared/Modal.tsx";
import { useIPCListener, useIPCSend } from "../core/hooks/useIPC.ts";
import { ModalHeader } from "../components/ModalHeader.tsx";
import { Button } from "../components/Button.tsx";
import { HelpIcon } from "../components/HelpIcon.tsx";
import { activeSetIdAtom, activeTrackIdAtom } from "../core/state.ts";
import { updateActiveSet } from "../core/utils.ts";
import { getActiveSetTracks } from "../../shared/utils/setUtils.ts";
import { HELP_TEXT } from "../../shared/helpText.ts";
import { formatModuleName } from "../../shared/utils/stringUtils.js";

export const AddModuleModal = ({
  isOpen,
  onClose,
  trackIndex,
  userData,
  setUserData,
  predefinedModules,
  onCreateNewModule,
  onEditModule,
  mode = "add-to-track",
}) => {
  const sendToProjector = useIPCSend("dashboard-to-projector");
  const [hoveredPreviewModuleId, setHoveredPreviewModuleId] = useState(null);
  const [loadingPreviewModuleId, setLoadingPreviewModuleId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const previewRequestRef = useRef({ moduleId: null, requestId: null });
  const lastAutoPreviewSentRef = useRef(null);
  const searchInputRef = useRef(null);

  const handleClose = () => {
    setHoveredPreviewModuleId(null);
    setLoadingPreviewModuleId(null);
    setSearchQuery("");
    previewRequestRef.current = { moduleId: null, requestId: null };
    lastAutoPreviewSentRef.current = null;
    sendToProjector("clear-preview", {});
    onClose();
  };

  const modalTitle = (
    <>
      {mode === "add-to-track" ? "MODULE" : "MODULES"}
      <HelpIcon helpText={HELP_TEXT.modules} />
    </>
  );

  const [activeSetId] = useAtom(activeSetIdAtom);
  const [activeTrackId] = useAtom(activeTrackIdAtom);
  const tracks = getActiveSetTracks(userData, activeSetId);

  const effectiveTrackIndex =
    trackIndex !== null && trackIndex !== undefined
      ? trackIndex
      : mode === "manage-modules" && activeTrackId
      ? tracks.findIndex((t) => t.id === activeTrackId)
      : null;

  const track =
    effectiveTrackIndex !== null && effectiveTrackIndex !== -1
      ? tracks?.[effectiveTrackIndex]
      : null;

  const modulesWithTrackIndicator = useMemo(() => {
    const list = Array.isArray(predefinedModules) ? predefinedModules : [];
    const modules = Array.isArray(track?.modules) ? track.modules : [];

    if (modules.length === 0) {
      return list.map((m) => ({ ...m, instancesOnCurrentTrack: 0 }));
    }

    const typeCounts = new Map();
    modules.forEach((inst) => {
      const type = inst?.type ? String(inst.type) : "";
      if (!type) return;
      typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
    });

    return list.map((m) => {
      const id = m?.id ? String(m.id) : "";
      const name = m?.name ? String(m.name) : "";
      const countFromId = id ? typeCounts.get(id) || 0 : 0;
      const countFromName = name && name !== id ? typeCounts.get(name) || 0 : 0;
      return { ...m, instancesOnCurrentTrack: countFromId + countFromName };
    });
  }, [predefinedModules, track]);

  const handleAddToTrack = (module) => {
    if (!track || effectiveTrackIndex === null || effectiveTrackIndex === -1)
      return;
    sendToProjector("clear-preview", {});
    updateActiveSet(setUserData, activeSetId, (activeSet) => {
      const track = activeSet.tracks[effectiveTrackIndex];
      const instanceId = `inst_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      track.modules.push({
        id: instanceId,
        type: module.id || module.name,
      });
      const moduleMethods = Array.isArray(module.methods) ? module.methods : [];
      const hasMethodData = moduleMethods.length > 0;
      const constructorMethods = hasMethodData
        ? moduleMethods
            .filter((m) => m.executeOnLoad)
            .map((m) => ({
              name: m.name,
              options: m?.options?.length
                ? m.options.map((opt) => ({
                    name: opt.name,
                    value: opt.defaultVal,
                  }))
                : [],
            }))
        : [];

      if (!constructorMethods.some((m) => m.name === "matrix")) {
        constructorMethods.unshift({
          name: "matrix",
          options: [
            { name: "matrix", value: { rows: 1, cols: 1, excludedCells: [] } },
            { name: "border", value: false },
          ],
        });
      }
      if (!constructorMethods.some((m) => m.name === "show")) {
        constructorMethods.push({
          name: "show",
          options: [{ name: "duration", value: 0 }],
        });
      }
      track.modulesData[instanceId] = {
        constructor: constructorMethods,
        methods: {},
      };
    });
    onClose();
  };

  const filteredModulesByCategory = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return modulesWithTrackIndicator.reduce((acc, module) => {
        if (!acc[module.category]) {
          acc[module.category] = [];
        }
        acc[module.category].push(module);
        return acc;
      }, {});
    }

    const filtered = modulesWithTrackIndicator.filter((module) => {
      const moduleName = formatModuleName(module.name || "").toLowerCase();
      const category = (module.category || "").toLowerCase();
      const id = (module.id || "").toLowerCase();
      const name = (module.name || "").toLowerCase();
      
      return (
        moduleName.includes(query) ||
        category.includes(query) ||
        id.includes(query) ||
        name.includes(query)
      );
    });

    return filtered.reduce((acc, module) => {
      if (!acc[module.category]) {
        acc[module.category] = [];
      }
      acc[module.category].push(module);
      return acc;
    }, {});
  }, [modulesWithTrackIndicator, searchQuery]);

  const handlePreviewHandshake = useCallback((event, data) => {
    if (!data || typeof data !== "object") return;
    if (
      data.type !== "preview-module-ready" &&
      data.type !== "preview-module-error"
    )
      return;

    const payload = data.props || {};
    const requestId = payload.requestId || null;
    if (!requestId) return;
    if (previewRequestRef.current.requestId !== requestId) return;

    setLoadingPreviewModuleId(null);
    previewRequestRef.current = {
      moduleId: previewRequestRef.current.moduleId,
      requestId: null,
    };
  }, []);

  useIPCListener("from-projector", handlePreviewHandshake, [
    handlePreviewHandshake,
  ]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setHoveredPreviewModuleId(null);
      setLoadingPreviewModuleId(null);
      previewRequestRef.current = { moduleId: null, requestId: null };
      lastAutoPreviewSentRef.current = null;
      return;
    }
    if (!hoveredPreviewModuleId) return;
    if (lastAutoPreviewSentRef.current === hoveredPreviewModuleId) return;

    const mod =
      (predefinedModules || []).find(
        (m) => (m?.id || m?.name) && (m.id || m.name) === hoveredPreviewModuleId
      ) || null;
    if (!mod) return;
    const moduleMethods = Array.isArray(mod.methods) ? mod.methods : [];
    if (moduleMethods.length === 0) return;

    const constructorMethods = moduleMethods
      .filter((m) => m.executeOnLoad)
      .map((m) => ({
        name: m.name,
        options: m?.options?.length
          ? m.options.map((opt) => ({
              name: opt.name,
              value: opt.defaultVal,
            }))
          : null,
      }));

    const finalConstructorMethods = [...constructorMethods];
    if (!finalConstructorMethods.some((m) => m.name === "matrix")) {
      finalConstructorMethods.unshift({
        name: "matrix",
        options: [
          { name: "matrix", value: { rows: 1, cols: 1, excludedCells: [] } },
          { name: "border", value: false },
        ],
      });
    }
    if (!finalConstructorMethods.some((m) => m.name === "show")) {
      finalConstructorMethods.push({
        name: "show",
        options: [{ name: "duration", value: 0 }],
      });
    }

    sendToProjector("preview-module", {
      moduleName: mod.id || mod.name,
      requestId: previewRequestRef.current.requestId,
      moduleData: {
        constructor: finalConstructorMethods,
        methods: {},
      },
    });
    lastAutoPreviewSentRef.current = hoveredPreviewModuleId;
  }, [isOpen, hoveredPreviewModuleId, predefinedModules, sendToProjector]);

  if (mode === "add-to-track") {
    if (trackIndex === null || trackIndex === undefined) return null;
    if (!track || !track.modules) return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onCloseHandler={handleClose}
      size="medium"
    >
      <ModalHeader title={modalTitle} onClose={handleClose} />

      <div className="px-6">
        <div className="mb-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 text-xs" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search modules..."
              className="w-full pl-8 pr-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-neutral-300 text-[11px] font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {Object.keys(filteredModulesByCategory).length === 0 ? (
          <div className="text-neutral-300/30 text-[11px] font-mono py-4">
            No modules found matching "{searchQuery}"
          </div>
        ) : (
          Object.entries(filteredModulesByCategory).map(([category, modules]) => (
          <div key={category} className="mb-6 font-mono">
            <div className="mb-2">
              <div className="opacity-50 text-[11px] text-neutral-300">
                {category}:
              </div>

              <div className="pl-6 uppercase flex flex-col flex-wrap gap-2">
                {modules.map((module) => {
                  const handlePreview = () => {
                    const hoveredId = module.id || module.name;
                    if (!hoveredId) return;
                    if (hoveredPreviewModuleId === hoveredId) return;
                    const requestId = `${Date.now()}_${Math.random()
                      .toString(36)
                      .slice(2, 8)}`;
                    setHoveredPreviewModuleId(hoveredId);
                    setLoadingPreviewModuleId(hoveredId);
                    previewRequestRef.current = {
                      moduleId: hoveredId,
                      requestId,
                    };
                    lastAutoPreviewSentRef.current = null;
                    const moduleMethods = Array.isArray(module.methods)
                      ? module.methods
                      : [];
                    const hasMethodData = moduleMethods.length > 0;

                    if (!hasMethodData) {
                      sendToProjector("module-introspect", {
                        moduleId: module.id || module.name,
                      });
                      return;
                    }

                    const constructorMethods = hasMethodData
                      ? moduleMethods
                          .filter((m) => m.executeOnLoad)
                          .map((m) => ({
                            name: m.name,
                            options: m?.options?.length
                              ? m.options.map((opt) => ({
                                  name: opt.name,
                                  value: opt.defaultVal,
                                }))
                              : null,
                          }))
                      : [];

                    const finalConstructorMethods = [...constructorMethods];
                    if (
                      !finalConstructorMethods.some((m) => m.name === "matrix")
                    ) {
                      finalConstructorMethods.unshift({
                        name: "matrix",
                        options: [
                          {
                            name: "matrix",
                            value: { rows: 1, cols: 1, excludedCells: [] },
                          },
                          { name: "border", value: false },
                        ],
                      });
                    }
                    if (
                      !finalConstructorMethods.some((m) => m.name === "show")
                    ) {
                      finalConstructorMethods.push({
                        name: "show",
                        options: [{ name: "duration", value: 0 }],
                      });
                    }

                    const previewData = {
                      type: "preview-module",
                      props: {
                        moduleName: module.id || module.name,
                        requestId,
                        moduleData: {
                          constructor: finalConstructorMethods,
                          methods: {},
                        },
                      },
                    };

                    sendToProjector(previewData.type, previewData.props);
                    lastAutoPreviewSentRef.current = hoveredId;
                  };

                  const handleClearPreview = () => {
                    setHoveredPreviewModuleId(null);
                    setLoadingPreviewModuleId(null);
                    previewRequestRef.current = {
                      moduleId: null,
                      requestId: null,
                    };
                    lastAutoPreviewSentRef.current = null;
                    sendToProjector("clear-preview", {});
                  };

                  const isHovered =
                    hoveredPreviewModuleId === (module.id || module.name);
                  const isLoading =
                    loadingPreviewModuleId === (module.id || module.name);

                  return (
                    <div
                      key={module.id || module.name}
                      className="flex items-center gap-1 group"
                    >
                      <div className="font-mono text-[11px] text-neutral-300 uppercase flex-1 flex items-center gap-2">
                        <div className="truncate">{formatModuleName(module.name)}</div>
                        {module.instancesOnCurrentTrack > 0 ? (
                          <div
                            className="flex items-center gap-1 text-blue-500/50"
                            title={`${module.instancesOnCurrentTrack} instance${
                              module.instancesOnCurrentTrack > 1 ? "s" : ""
                            } on this track`}
                          >
                            <FaCheck />
                            {module.instancesOnCurrentTrack > 1 ? (
                              <span className="text-[10px]">
                                {module.instancesOnCurrentTrack}
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          onMouseEnter={handlePreview}
                          onMouseLeave={handleClearPreview}
                          className="cursor-default"
                        >
                          <div
                            title={
                              isHovered && isLoading
                                ? "Loading preview..."
                                : "Preview module"
                            }
                            className="cursor-help flex items-center text-neutral-400"
                          >
                            {isHovered && isLoading ? (
                              <FaSpinner className="animate-spin" />
                            ) : (
                              <FaEye />
                            )}
                          </div>
                        </div>

                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditModule(module.id || module.name);
                          }}
                          type="secondary"
                          icon={<FaCode />}
                          title="Edit code"
                          className="text-blue-500"
                        />
                        <Button
                          onClick={() => handleAddToTrack(module)}
                          type="secondary"
                          icon={<FaPlus />}
                          title={
                            track ? "Add to track" : "Select a track first"
                          }
                          disabled={!track}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))
        )}
      </div>
    </Modal>
  );
};
