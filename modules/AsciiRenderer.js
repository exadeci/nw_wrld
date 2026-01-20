/*
@nwWrld name: AsciiRenderer
@nwWrld category: 2D
@nwWrld imports: ModuleBase, assetUrl
*/

const ASCII_CHARS = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~";

const CACHE_BITS = 5;
const CACHE_RANGE = 2 ** CACHE_BITS;

const SAMPLING_CIRCLES = [
  { x: 0.25, y: 0.25, radius: 0.15 },
  { x: 0.75, y: 0.25, radius: 0.15 },
  { x: 0.25, y: 0.5, radius: 0.15 },
  { x: 0.75, y: 0.5, radius: 0.15 },
  { x: 0.25, y: 0.75, radius: 0.15 },
  { x: 0.75, y: 0.75, radius: 0.15 },
];

const EXTERNAL_SAMPLING_CIRCLES = [
  { x: 0.0, y: 0.0, radius: 0.15 },
  { x: 0.5, y: 0.0, radius: 0.15 },
  { x: 1.0, y: 0.0, radius: 0.15 },
  { x: 0.0, y: 0.5, radius: 0.15 },
  { x: 1.0, y: 0.5, radius: 0.15 },
  { x: 0.0, y: 1.0, radius: 0.15 },
  { x: 0.5, y: 1.0, radius: 0.15 },
  { x: 1.0, y: 1.0, radius: 0.15 },
  { x: 0.25, y: 1.0, radius: 0.15 },
  { x: 0.75, y: 1.0, radius: 0.15 },
];

const AFFECTING_EXTERNAL_INDICES = [
  [0, 1, 2, 4],
  [0, 1, 3, 5],
  [2, 4, 6],
  [3, 5, 7],
  [4, 6, 8, 9],
  [5, 7, 8, 9],
];

let characterShapeVectors = null;
let characterShapeVectorsNormalized = null;
let lookupCache = new Map();
let initializationPromise = null;

function rgbToLightness(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function sampleCircle(imageData, imageWidth, imageHeight, circleX, circleY, circleRadius, samplesPerCircle = 9) {
  let totalLightness = 0;
  let sampleCount = 0;

  for (let i = 0; i < samplesPerCircle; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * circleRadius;
    const sampleX = circleX + Math.cos(angle) * radius;
    const sampleY = circleY + Math.sin(angle) * radius;

    const imageX = Math.floor(sampleX * imageWidth);
    const imageY = Math.floor(sampleY * imageHeight);

    if (imageX >= 0 && imageX < imageWidth && imageY >= 0 && imageY < imageHeight) {
      const idx = (imageY * imageWidth + imageX) * 4;

      if (idx >= 0 && idx < imageData.data.length - 3) {
        const r = imageData.data[idx] / 255;
        const g = imageData.data[idx + 1] / 255;
        const b = imageData.data[idx + 2] / 255;
        totalLightness += rgbToLightness(r, g, b);
        sampleCount++;
      }
    }
  }

  return sampleCount > 0 ? totalLightness / sampleCount : 0;
}

function calculateCharacterShapeVector(char, cellSize = 32) {
  const canvas = document.createElement("canvas");
  canvas.width = cellSize;
  canvas.height = cellSize;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, cellSize, cellSize);

  ctx.fillStyle = "#000000";
  ctx.font = `${cellSize * 0.8}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(char, cellSize / 2, cellSize / 2);

  const imageData = ctx.getImageData(0, 0, cellSize, cellSize);
  const vector = [];

  for (const circle of SAMPLING_CIRCLES) {
    const circleX = circle.x;
    const circleY = circle.y;
    const circleRadius = circle.radius;
    let totalLightness = 0;
    let sampleCount = 0;

    for (let i = 0; i < 100; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * circleRadius;
      const sampleX = circleX + Math.cos(angle) * radius;
      const sampleY = circleY + Math.sin(angle) * radius;

      if (sampleX >= 0 && sampleX < 1 && sampleY >= 0 && sampleY < 1) {
        const pixelX = Math.floor(sampleX * cellSize);
        const pixelY = Math.floor(sampleY * cellSize);
        const idx = (pixelY * cellSize + pixelX) * 4;

        if (idx >= 0 && idx < imageData.data.length) {
          const r = imageData.data[idx] / 255;
          const g = imageData.data[idx + 1] / 255;
          const b = imageData.data[idx + 2] / 255;
          const lightness = rgbToLightness(r, g, b);
          totalLightness += 1 - lightness;
          sampleCount++;
        }
      }
    }

    vector.push(sampleCount > 0 ? totalLightness / sampleCount : 0);
  }

  return vector;
}

function initializeCharacterShapeVectors() {
  if (characterShapeVectors) return Promise.resolve();
  if (initializationPromise) return initializationPromise;

  initializationPromise = new Promise((resolve) => {
    setTimeout(() => {
      characterShapeVectors = [];
      for (const char of ASCII_CHARS) {
        const vector = calculateCharacterShapeVector(char);
        characterShapeVectors.push({ char, vector });
      }

      const maxValues = new Array(SAMPLING_CIRCLES.length).fill(0);
      for (const { vector } of characterShapeVectors) {
        for (let i = 0; i < vector.length; i++) {
          if (vector[i] > maxValues[i]) {
            maxValues[i] = vector[i];
          }
        }
      }

      characterShapeVectorsNormalized = characterShapeVectors.map(({ char, vector }) => ({
        char,
        vector: vector.map((value, i) => maxValues[i] > 0 ? value / maxValues[i] : 0),
      }));

      resolve();
    }, 0);
  });

  return initializationPromise;
}

function euclideanDistance(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return sum;
}

function generateCacheKey(vector) {
  let key = 0;
  for (let i = 0; i < vector.length; i++) {
    const quantized = Math.min(CACHE_RANGE - 1, Math.floor(vector[i] * CACHE_RANGE));
    key = (key << CACHE_BITS) | quantized;
  }
  return key;
}

function findBestCharacter(samplingVector) {
  const cacheKey = generateCacheKey(samplingVector);
  if (lookupCache.has(cacheKey)) {
    return lookupCache.get(cacheKey);
  }

  let bestChar = " ";
  let bestDistance = Infinity;

  for (const { char, vector } of characterShapeVectorsNormalized) {
    const distance = euclideanDistance(samplingVector, vector);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestChar = char;
    }
  }

  lookupCache.set(cacheKey, bestChar);
  return bestChar;
}

function applyGlobalContrastEnhancement(vector, exponent) {
  if (exponent === 1) return vector;
  const maxValue = Math.max(...vector);
  if (maxValue === 0) return vector;
  return vector.map((value) => {
    const normalized = value / maxValue;
    const enhanced = Math.pow(normalized, exponent);
    return enhanced * maxValue;
  });
}

function applyDirectionalContrastEnhancement(internalVector, externalVector, exponent) {
  if (exponent === 1) return internalVector;
  return internalVector.map((value, i) => {
    let maxValue = value;
    for (const externalIndex of AFFECTING_EXTERNAL_INDICES[i]) {
      if (externalVector[externalIndex] > maxValue) {
        maxValue = externalVector[externalIndex];
      }
    }
    if (maxValue === 0) return value;
    const normalized = value / maxValue;
    const enhanced = Math.pow(normalized, exponent);
    return enhanced * maxValue;
  });
}

class AsciiRenderer extends ModuleBase {
  static methods = [
    {
      name: "image",
      executeOnLoad: true,
      options: [
        {
          name: "path",
          defaultVal: "images/blueprint.png",
          type: "assetFile",
          assetBaseDir: "images",
          assetExtensions: [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"],
          allowCustom: true,
        },
        {
          name: "cols",
          defaultVal: 80,
          type: "number",
          min: 10,
          max: 200,
        },
        {
          name: "rows",
          defaultVal: 40,
          type: "number",
          min: 5,
          max: 100,
        },
        {
          name: "contrast",
          defaultVal: 1.0,
          type: "number",
          min: 1.0,
          max: 4.0,
        },
        {
          name: "sampleQuality",
          defaultVal: 9,
          type: "number",
          min: 3,
          max: 25,
        },
      ],
    },
    {
      name: "setCols",
      executeOnLoad: false,
      options: [
        {
          name: "cols",
          defaultVal: 80,
          type: "number",
          min: 10,
          max: 200,
        },
      ],
    },
    {
      name: "setRows",
      executeOnLoad: false,
      options: [
        {
          name: "rows",
          defaultVal: 40,
          type: "number",
          min: 5,
          max: 100,
        },
      ],
    },
    {
      name: "setContrast",
      executeOnLoad: false,
      options: [
        {
          name: "contrast",
          defaultVal: 1.0,
          type: "number",
          min: 1.0,
          max: 4.0,
        },
      ],
    },
  ];

  constructor(container) {
    super(container);
    this.name = AsciiRenderer.name;
    this.asciiElement = null;
    this.sourceImage = null;
    this.currentCols = 80;
    this.currentRows = 40;
    this.currentContrast = 1.0;
    this.currentSampleQuality = 9;
    this.init();
    initializeCharacterShapeVectors();
  }

  init() {
    if (!this.elem) return;

    this.asciiElement = document.createElement("pre");
    this.asciiElement.style.cssText = [
      "width: 100%;",
      "height: 100%;",
      "margin: 0;",
      "padding: 0;",
      "font-family: monospace;",
      "font-size: 12px;",
      "line-height: 1.2;",
      "color: #ffffff;",
      "background: #000000;",
      "overflow: hidden;",
      "white-space: pre;",
      "display: flex;",
      "align-items: center;",
      "justify-content: center;",
    ].join(" ");

    this.elem.appendChild(this.asciiElement);
  }

  async image({
    path = "images/blueprint.png",
    cols = 80,
    rows = 40,
    contrast = 1.0,
    sampleQuality = 9,
  } = {}) {
    this.currentCols = Math.max(10, Math.min(200, Math.floor(cols)));
    this.currentRows = Math.max(5, Math.min(100, Math.floor(rows)));
    this.currentContrast = Math.max(1.0, Math.min(4.0, Number(contrast)));
    this.currentSampleQuality = Math.max(3, Math.min(25, Math.floor(sampleQuality)));

    const url = typeof assetUrl === "function" ? assetUrl(path) : null;
    if (!url) {
      console.warn("AsciiRenderer: Invalid image path");
      return;
    }

    try {
      await this.loadAndRenderImage(url);
    } catch (error) {
      console.error("AsciiRenderer: Error loading image", error);
    }

    this.show();
  }

  async loadAndRenderImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        this.sourceImage = img;
        this.renderAscii();
        resolve();
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  renderAscii() {
    if (!this.sourceImage || !this.asciiElement) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    canvas.width = this.sourceImage.width;
    canvas.height = this.sourceImage.height;
    ctx.drawImage(this.sourceImage, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const cellWidth = canvas.width / this.currentCols;
    const cellHeight = canvas.height / this.currentRows;

    let asciiOutput = "";

    for (let row = 0; row < this.currentRows; row++) {
      for (let col = 0; col < this.currentCols; col++) {
        const cellStartX = (col / this.currentCols);
        const cellStartY = (row / this.currentRows);

        const internalVector = [];
        for (const circle of SAMPLING_CIRCLES) {
          const circleX = cellStartX + circle.x / this.currentCols;
          const circleY = cellStartY + circle.y / this.currentRows;
          const circleRadius = circle.radius / Math.max(this.currentCols, this.currentRows);
          const lightness = sampleCircle(
            imageData,
            canvas.width,
            canvas.height,
            circleX,
            circleY,
            circleRadius,
            this.currentSampleQuality
          );
          internalVector.push(lightness);
        }

        const externalVector = [];
        for (const circle of EXTERNAL_SAMPLING_CIRCLES) {
          const circleX = cellStartX + circle.x / this.currentCols;
          const circleY = cellStartY + circle.y / this.currentRows;
          const circleRadius = circle.radius / Math.max(this.currentCols, this.currentRows);
          const lightness = sampleCircle(
            imageData,
            canvas.width,
            canvas.height,
            circleX,
            circleY,
            circleRadius,
            this.currentSampleQuality
          );
          externalVector.push(lightness);
        }

        let enhancedVector = [...internalVector];

        if (this.currentContrast > 1.0) {
          enhancedVector = applyDirectionalContrastEnhancement(
            enhancedVector,
            externalVector,
            this.currentContrast
          );
          enhancedVector = applyGlobalContrastEnhancement(
            enhancedVector,
            this.currentContrast
          );
        }

        const char = findBestCharacter(enhancedVector);
        asciiOutput += char;
      }
      asciiOutput += "\n";
    }

    this.asciiElement.textContent = asciiOutput;
  }

  setImage(options = {}) {
    return this.image(options);
  }

  setCols({ cols = 80 } = {}) {
    this.currentCols = Math.max(10, Math.min(200, Math.floor(cols)));
    if (this.sourceImage) {
      this.renderAscii();
    }
  }

  setRows({ rows = 40 } = {}) {
    this.currentRows = Math.max(5, Math.min(100, Math.floor(rows)));
    if (this.sourceImage) {
      this.renderAscii();
    }
  }

  setContrast({ contrast = 1.0 } = {}) {
    this.currentContrast = Math.max(1.0, Math.min(4.0, Number(contrast)));
    if (this.sourceImage) {
      this.renderAscii();
    }
  }

  destroy() {
    if (this.asciiElement && this.asciiElement.parentNode === this.elem) {
      this.elem.removeChild(this.asciiElement);
    }
    this.asciiElement = null;
    this.sourceImage = null;
    super.destroy();
  }
}

export default AsciiRenderer;
