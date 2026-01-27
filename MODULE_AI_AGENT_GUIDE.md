# Module creation guide for AI agents

This document describes how nw_wrld (new_wrld) modules are built and used, with emphasis on requirements, validation rules, and pitfalls. Use it when generating or editing workspace modules.

**See also:** [MODULE_DEVELOPMENT.md](MODULE_DEVELOPMENT.md) — the full human-oriented guide: tutorials (e.g. PulsingCircle), SDK API reference, starter modules, best practices, debugging, and performance tips.

---

## 1. Where modules live and how they are identified

- **Location:** Project folder `modules/` (e.g. `MyProject/modules/`). Only `.js` files are considered.
- **Module id:** Taken from the filename by dropping `.js`. **It must match** `^[A-Za-z][A-Za-z0-9]*$` (letters/numbers, starting with a letter). Enforced by `safeModuleName` in main process path safety.
- **Traps:**
  - `my-module.js` → invalid (id would be `my-module`, contains `-`).
  - `FooBar.js` → valid, id = `FooBar`.
  - `1Module.js` → invalid (starts with digit).

---

## 2. File and docblock contract

Each module file must have:

1. **A single docblock at the very top** (before any code). It is parsed from the first ~16KB (`MODULE_METADATA_MAX_BYTES`). Regex used: `@nwWrld\s+name\s*:\s*([^\r\n]+)` and analogous ones for `category` and `imports`.
2. **Three required fields:**
   - `@nwWrld name: …` — Display name in the UI.
   - `@nwWrld category: …` — Grouping in the UI (e.g. `2D`, `3D`, `Text`).
   - `@nwWrld imports: …` — Comma-separated list of allowed dependency tokens; **at least one** is required.
3. **Default export:** The file must end with `export default YourClass;` and export exactly one value (the class).

**Traps:**

- No `import … from "…"` or `require(...)` for app or project paths. Dependencies are **only** those declared in `@nwWrld imports`. The runtime injects them (via a preamble) as globals or from `globalThis.nwWrldSdk`. Requesting a token not in the allowed set causes a sandbox error.
- Docblock values can be quoted or unquoted; `normalizeDocblockValue` strips outer quotes. The rest of the line after the colon is the value (trimmed).

**Allowed imports** (from `WORKSPACE_MODULE_ALLOWED_IMPORTS` in sandbox/preload):

- SDK: `ModuleBase`, `BaseThreeJsModule`, `AudioAnalyzer`, `assetUrl`, `readText`, `loadJson`, `listAssets`
- Globals: `THREE`, `p5`, `d3`, `Noise`, `OBJLoader`, `PLYLoader`, `PCDLoader`, `GLTFLoader`, `STLLoader`, `EffectComposer`, `RenderPass`, `ShaderPass`, `OrbitControls`, `createNoise2D`, `createNoise3D`

---

## 3. Class and constructor

- The default export must be a **class** that extends `ModuleBase` (or `BaseThreeJsModule` for 3D).
- **Constructor:** Must call `super(container)` first. `container` is the DOM element the module renders into. Do not use `this.elem` before `super()`.
- **Traps:**
  - Forgetting `super(container)` or calling it after using `this` leads to “does not have an 'elem' property” and similar errors.
  - The class is instantiated with a single argument (the container). No dependency injection beyond what the preamble provides.

---

## 4. Static `methods` array

The runtime discovers methods from:

1. **Base class:** `ModuleBase.methods` or `BaseThreeJsModule.methods` (depending on what the class extends).
2. **Your class:** `YourClass.methods` — must be an array.
3. **Merge:** `mergeMethodsByName(baseMethods, declaredMethods)`. For each method name, the **declared** entry wins. So you can override a base method by redefining it in `static methods` with the same `name`.

Each entry must have at least:

- `name` (string) — **Must be the same as the actual instance method name.** The runtime calls `inst[methodName](options)`.
- `executeOnLoad` (boolean) — If `true`, this method is run automatically after the module is created and the matrix layout is applied, using **default option values** from the method definition (see “Method options and invocation”).
- `options` (array) — List of option definitions (see Option types).

**Traps:**

- A typo or mismatch between `name` in `static methods` and the real method name (e.g. `"draw"` vs `drawScene`) means the method is never called.
- **Callable methods** are discovered by walking the prototype chain and collecting own property names whose value is a function. Only such methods can be triggered from channels. If `static methods` lists a `name` that does not correspond to a function on the instance, it may appear in the UI but will never run.

---

## 5. Method signature and options

- Every method that can be triggered or run on load is called with **one argument:** an **options object**, e.g. `inst.myMethod(options)`.
- The dashboard/sandbox builds this object from the method’s `options` array: each entry has `name` and `value` (and sometimes `randomRange` / `randomValues`). The runtime uses that to produce a plain object `{ optionName: value, ... }` and passes it to the method.
- **Always use destructuring with defaults**, e.g.  
  `myMethod({ duration = 500, color = "#ffffff" } = {})`  
  so the method is safe when called with `{}` or missing keys.

**Traps:**

- Relying on positional arguments or assuming options are passed in any other shape will break.
- For **executeOnLoad** methods, the first run uses **defaults from the method definition** (`defaultVal` per option), not from the channel. Channel-stored values apply when the user triggers that method from a channel.

---

## 6. Option types and validation

Option definitions are validated and normalized by `validateOptionValue` (and related logic). The following types and rules are enforced:

| type     | defaultVal / value rules | Notes |
|----------|---------------------------|--------|
| `number` | Any finite number         | Invalid or NaN → fallback to `option.defaultVal`. |
| `select` | Must be in `option.values` or `"random"` | Otherwise → `option.defaultVal`. The value `"random"` is allowed by the validator; the method may receive the literal string `"random"` if the UI does not resolve it to an element of `values`. |
| `color`  | Must match `^#([0-9A-F]{3}){1,2}$` (hex)  | 3- or 6-digit hex only. |
| `boolean`| `true` or `false`         | Other types → `option.defaultVal`. |
| `text`   | Any string                | Non-string → `String(value)`. |
| `matrix` | Object with `rows`, `cols`, `excludedCells` | `rows`/`cols` 1–5; invalid → `defaultVal`. |

**Randomization:** Option definitions can include `allowRandomization: true`. The dashboard may then send `randomRange` (min/max for numbers) or `randomValues` (array of choices) instead of a single `value`. `buildMethodOptions` resolves these to a concrete value before calling the method. The method always receives a single resolved value per option, not the range or array.

**Traps:**

- **select:** `defaultVal` must be one of the strings in `values`. If you add a new preset/value, ensure the default is in that list.
- **color:** Only `#RGB` or `#RRGGBB`. No `rgb()`, `rgba()`, or color names.
- **matrix:** Shape is `{ rows, cols, excludedCells }`. `excludedCells` is an array of strings like `"1-2"`. Rows/cols are constrained to 1–5.

---

## 7. Execute-on-load and constructor methods

When a track is initialised:

1. Matrix layout is applied (from the `matrix` method if present).
2. For each method in the “constructor” list (from `modulesData[instanceId].constructor`), in order, the runtime runs that method with **buildMethodOptions(mm.options)**.
3. Each constructor entry has shape `{ name, options }`. `options` is an array of `{ name, value }` (and sometimes `randomRange`/`randomValues`). When the track is configured in the dashboard, executeOnLoad methods are added to this list and their option `value`s are set from the method definition’s **defaultVal**. So the options object passed to the method on load is built from those values, not from channel-trigger configuration.
4. Only methods with `name !== "matrix"` are run in this “nonMatrix” pass.

**Traps:**

- If an executeOnLoad method expects options that are never defined in its `options` array, those keys will be missing; use parameter defaults.
- The order of methods in the constructor list matters. The matrix method runs first; the rest run in the order of that list.

---

## 8. Invocation from channels (invokeOnInstance)

When a channel triggers a method:

- The main process sends `invokeOnInstance` with `instanceId`, `methodName`, and `options` (a plain object).
- The sandbox calls `inst[methodName](options)` for each instance of that track.
- `options` here is the **channel’s** option values (after validation), usually built from the method’s `options` and the user’s configured values/randomization.

So: **executeOnLoad** uses definition defaults; **triggered** calls use channel options.

---

## 9. Lifecycle and cleanup

- **destroy():** Must be implemented and must call `super.destroy()` **last**. Before that, you must:
  - Clear intervals and timeouts.
  - Cancel `requestAnimationFrame` ids.
  - Remove any DOM nodes you created (especially those appended outside `this.elem`).
  - Push nodes created outside `this.elem` into `this.externalElements` so `ModuleBase.destroy()` can remove them.
- **Traps:**
  - Not clearing intervals/timeouts/raf keeps handlers running after the module is gone and can cause “destroyed” or null-ref errors.
  - Elements added to `document.body` or other parents must be tracked (e.g. via `externalElements`) and removed in `destroy()`.

---

## 10. Inheritance and base methods

- **ModuleBase** provides many built-in methods (e.g. `show`, `hide`, `offset`, `scale`, `opacity`, `rotate`, `setBlur`, `setScanlines`, …). They are on the prototype, so they are “callable” and appear in introspection.
- To **add** your own methods while keeping base behaviour, use:
  - `static methods = [...ModuleBase.methods, { name: "myMethod", executeOnLoad: true, options: [...] }];`
- To **override** a base method, define one with the same `name` in your `static methods`. The merge replaces the base entry for that name.
- **BaseThreeJsModule** extends ModuleBase and adds 3D-related methods. Use `BaseThreeJsModule.methods` when extending it.

---

## 11. Assets and SDK helpers

- **assetUrl(path):** Returns a URL for a file under the project’s `assets/` directory. `path` must be relative, no leading `/`, no `..`. Validated by `safeAssetRelPath` (no colons, no backslashes, no `..`).
- **readText(path)** / **loadJson(path):** Async helpers to read assets. Path rules are the same.
- **Traps:** Paths are validated and rejected when they look like absolutes or escape the assets dir. Use only relative paths like `"images/foo.png"` or `"json/data.json"`.

---

## 12. Quick checklist for new modules

- [ ] File lives in project `modules/` and is named `PascalCase.js` (or similar) so the module id matches `^[A-Za-z][A-Za-z0-9]*$`.
- [ ] Top-of-file docblock has `@nwWrld name:`, `@nwWrld category:`, and `@nwWrld imports:` (at least one import).
- [ ] All imports in `@nwWrld imports` are from the allowed list; no file-based `import`/`require` for app or project code.
- [ ] Class extends `ModuleBase` (or `BaseThreeJsModule`), and constructor calls `super(container)` first.
- [ ] File ends with `export default YourClass;`.
- [ ] `static methods` is an array; every `name` matches an existing instance method.
- [ ] Each method used from the UI is implemented as `methodName(options)` and uses destructuring with defaults, e.g. `({ x = 0, y = 0 } = {})`.
- [ ] For `type: "select"`, `defaultVal` is one of `values`.
- [ ] For `type: "color"`, values are hex only (`#RGB` or `#RRGGBB`).
- [ ] `destroy()` clears timers/animations, detaches DOM, then calls `super.destroy()` last.

---

## 13. Where to look in the codebase

| Concern | Location |
|--------|----------|
| Docblock parsing | `src/shared/nwWrldDocblock.ts` |
| Allowed imports, preamble | `src/shared/validation/sandboxModuleUtils.ts`, `src/projector/moduleSandboxEntry.ts` (injectWorkspaceModuleImports, buildWorkspaceImportPreamble) |
| Option validation | `src/shared/validation/optionValidator.ts` |
| Method option building | `src/shared/utils/methodOptions.ts` (`buildMethodOptions`) |
| Sandbox request/result norms | `src/shared/validation/sandboxValidation.ts` |
| Introspection (methods, callableMethods) | `src/projector/moduleSandboxEntry.ts` (introspectModule, getCallableMethodNamesFromClass, mergeMethodsByName, getBaseMethodsForClass) |
| Module id from filename | `src/main/mainProcess/ipcBridge/registerWorkspaceBridge.ts` (scanWorkspaceModuleSummaries), `src/main/mainProcess/pathSafety.ts` (safeModuleName) |
| Base method definitions | `src/projector/helpers/moduleBase.ts`, `src/projector/helpers/threeBase.js` |
| Init/invoke flow | `src/projector/moduleSandboxEntry.ts` (initTrack, invokeOnInstance, buildMethodOptions) |

Using this guide and these entry points should keep generated or edited modules aligned with how nw_wrld loads, introspects, and runs them.
