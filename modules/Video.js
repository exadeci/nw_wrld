/*
@nwWrld name: Video
@nwWrld category: Media
@nwWrld imports: ModuleBase, assetUrl, listAssets
*/

class Video extends ModuleBase {
  static methods = [
    {
      name: "video",
      executeOnLoad: true,
      options: [
        {
          name: "path",
          defaultVal: "",
          type: "assetFile",
          assetBaseDir: "videos",
          assetExtensions: [".mp4", ".webm", ".ogg", ".mov", ".avi", ".mkv"],
          allowCustom: true,
        },
        {
          name: "autoplay",
          defaultVal: true,
          type: "boolean",
        },
        {
          name: "loop",
          defaultVal: true,
          type: "boolean",
        },
        {
          name: "muted",
          defaultVal: true,
          type: "boolean",
        },
        {
          name: "controls",
          defaultVal: false,
          type: "boolean",
        },
      ],
    },
    {
      name: "play",
      executeOnLoad: false,
    },
    {
      name: "pause",
      executeOnLoad: false,
    },
    {
      name: "setVolume",
      executeOnLoad: false,
      options: [
        {
          name: "volume",
          defaultVal: 1.0,
          type: "number",
          min: 0.0,
          max: 1.0,
        },
      ],
    },
    {
      name: "videoDirectory",
      executeOnLoad: true,
      options: [
        {
          name: "directory",
          defaultVal: "videos",
          type: "assetDir",
          assetBaseDir: "videos",
          allowCustom: true,
        },
        {
          name: "autoplay",
          defaultVal: true,
          type: "boolean",
        },
        {
          name: "loop",
          defaultVal: true,
          type: "boolean",
        },
        {
          name: "muted",
          defaultVal: true,
          type: "boolean",
        },
        {
          name: "controls",
          defaultVal: false,
          type: "boolean",
        },
      ],
    },
    {
      name: "setIndex",
      executeOnLoad: false,
      options: [
        {
          name: "index",
          defaultVal: 0,
          min: 0,
          type: "number",
        },
      ],
    },
    {
      name: "shift",
      executeOnLoad: false,
      options: [
        {
          name: "amount",
          defaultVal: 1,
          type: "number",
        },
      ],
    },
    { name: "random", executeOnLoad: false },
  ];

  constructor(container) {
    super(container);
    this.name = Video.name;
    this.video = null;
    this.urls = [];
    this.currentIndex = 0;
    this.init();
  }

  init() {
    this.video = document.createElement("video");
    this.video.style.cssText = [
      "width: 100%;",
      "height: 100%;",
      "object-fit: contain;",
      "display: block;",
    ].join(" ");
    if (this.elem) {
      this.elem.appendChild(this.video);
    }
  }

  video({
    path = "",
    autoplay = true,
    loop = true,
    muted = true,
    controls = false,
  } = {}) {
    const url = typeof assetUrl === "function" ? assetUrl(path) : null;
    if (this.video && url) {
      this.video.src = url;
      this.video.autoplay = Boolean(autoplay);
      this.video.loop = Boolean(loop);
      this.video.muted = Boolean(muted);
      this.video.controls = Boolean(controls);
      
      if (autoplay) {
        this.video.play().catch(() => {});
      }
    }
    this.show();
  }

  play() {
    if (this.video) {
      this.video.play().catch(() => {});
    }
  }

  pause() {
    if (this.video) {
      this.video.pause();
    }
  }

  setVolume({ volume = 1.0 } = {}) {
    if (this.video) {
      const val = Number(volume);
      const clampedVolume = Math.max(
        0.0,
        Math.min(1.0, Number.isFinite(val) ? val : 1.0)
      );
      this.video.volume = clampedVolume;
    }
  }


  setUrls(urls) {
    const list = Array.isArray(urls) ? urls : [];
    this.urls = list.filter(
      (u) => typeof u === "string" && u.trim().length > 0
    );
    this.currentIndex = 0;
    this.loadCurrentVideo();
  }

  loadCurrentVideo() {
    if (!this.video || !this.urls.length) return;
    const idx = Math.max(0, Math.min(this.currentIndex, this.urls.length - 1));
    this.currentIndex = idx;
    const url = this.urls[idx];
    if (url) {
      this.video.src = url;
      this.show();
    }
  }

  async videoDirectory({
    directory = "videos",
    autoplay = true,
    loop = true,
    muted = true,
    controls = false,
  } = {}) {
    const raw = String(directory ?? "").trim();
    if (!raw) {
      this.setUrls([]);
      return;
    }

    let base = raw.replace(/^assets\//, "");
    if (!base) {
      this.setUrls([]);
      return;
    }

    const baseDir = base.replace(/\/+$/, "");

    const extSet = new Set([
      ".mp4",
      ".webm",
      ".ogg",
      ".mov",
      ".avi",
      ".mkv",
    ]);

    const entries =
      typeof listAssets === "function" ? await listAssets(baseDir) : [];
    const files = Array.isArray(entries)
      ? entries
          .map((n) => String(n || "").trim())
          .filter(Boolean)
          .filter((name) => {
            const dot = name.lastIndexOf(".");
            if (dot <= 0) return false;
            const ext = name.slice(dot).toLowerCase();
            return extSet.has(ext);
          })
          .sort((a, b) => a.localeCompare(b))
      : [];

    const urls = files
      .map((name) => `${baseDir}/${name}`)
      .map((p) => (typeof assetUrl === "function" ? assetUrl(p) : null))
      .filter(Boolean);
    
    this.setUrls(urls);

    if (this.video && this.urls.length > 0) {
      this.video.autoplay = Boolean(autoplay);
      this.video.loop = Boolean(loop);
      this.video.muted = Boolean(muted);
      this.video.controls = Boolean(controls);
      
      if (autoplay) {
        this.video.play().catch(() => {});
      }
    }
  }

  setIndex({ index = 0 } = {}) {
    if (!this.urls.length) return;
    const next = Number.isFinite(Number(index)) ? Math.trunc(Number(index)) : 0;
    if (next < 0 || next >= this.urls.length) return;
    this.currentIndex = next;
    this.loadCurrentVideo();
    if (this.video && !this.video.paused) {
      this.video.play().catch(() => {});
    }
  }

  shift({ amount = 1 } = {}) {
    if (!this.urls.length) return;
    const delta = Number.isFinite(Number(amount)) ? Math.trunc(Number(amount)) : 1;
    const len = this.urls.length;
    this.currentIndex = (((this.currentIndex + delta) % len) + len) % len;
    this.loadCurrentVideo();
    if (this.video && !this.video.paused) {
      this.video.play().catch(() => {});
    }
  }

  random() {
    if (!this.urls.length) return;
    if (this.urls.length === 1) {
      this.loadCurrentVideo();
      return;
    }
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * this.urls.length);
    } while (nextIndex === this.currentIndex && this.urls.length > 1);
    this.currentIndex = nextIndex;
    this.loadCurrentVideo();
    if (this.video && !this.video.paused) {
      this.video.play().catch(() => {});
    }
  }

  destroy() {
    if (this.video) {
      this.video.pause();
      if (this.video.parentNode === this.elem) {
        this.elem.removeChild(this.video);
      }
    }
    this.video = null;
    this.urls = [];
    super.destroy();
  }
}

export default Video;
