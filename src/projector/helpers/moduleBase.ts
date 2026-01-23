// src/ModuleBase.js

export class ModuleBase {
  static methods = [
    {
      name: "matrix",
      executeOnLoad: true,
      options: [
        { name: "matrix", defaultVal: { rows: 1, cols: 1, excludedCells: [] }, type: "matrix" },
        { name: "border", defaultVal: false, type: "boolean" },
      ],
    },
    {
      name: "show",
      executeOnLoad: true,
      options: [{ name: "duration", defaultVal: 0, type: "number", min: 0 }],
    },
    {
      name: "hide",
      executeOnLoad: false,
      options: [{ name: "duration", defaultVal: 0, type: "number", min: 0 }],
    },
    {
      name: "offset",
      executeOnLoad: false,
      options: [
        { name: "x", defaultVal: 0, type: "number", allowRandomization: true },
        { name: "y", defaultVal: 0, type: "number", allowRandomization: true },
      ],
    },
    {
      name: "scale",
      executeOnLoad: false,
      options: [
        { name: "scale", defaultVal: 1, type: "number", allowRandomization: true },
      ],
    },
    {
      name: "randomZoom",
      executeOnLoad: false,
      options: [
        { name: "scaleFrom", defaultVal: 1, type: "number", min: 0.1 },
        { name: "scaleTo", defaultVal: 2, type: "number", min: 0.1 },
        {
          name: "position",
          defaultVal: "random",
          type: "select",
          values: [
            "random",
            "topLeft",
            "topRight",
            "bottomLeft",
            "bottomRight",
          ],
        },
      ],
    },
    {
      name: "opacity",
      executeOnLoad: false,
      options: [
        { name: "opacity", defaultVal: 1, type: "number", min: 0, max: 1 },
      ],
    },
    {
      name: "rotate",
      executeOnLoad: false,
      options: [
        {
          name: "direction",
          defaultVal: "clockwise",
          type: "select",
          values: ["clockwise", "counter-clockwise"],
        },
        {
          name: "speed",
          defaultVal: 1,
          type: "number",
          min: 0.1,
          max: 100,
        },
        {
          name: "duration",
          defaultVal: 0,
          type: "number",
          min: 0,
        },
      ],
    },
    {
      name: "setRotation",
      executeOnLoad: false,
      options: [
        {
          name: "angle",
          defaultVal: 360,
          type: "number",
          min: 0,
          max: 720,
        },
      ],
    },
    {
      name: "viewportLine",
      executeOnLoad: false,
      options: [
        {
          name: "x",
          defaultVal: 50,
          type: "number",
          min: 0,
          max: 100,
        },
        {
          name: "y",
          defaultVal: 50,
          type: "number",
          min: 0,
          max: 100,
        },
        {
          name: "length",
          defaultVal: 100,
          type: "number",
          min: 0,
          max: 100,
        },
        {
          name: "opacity",
          defaultVal: 1,
          type: "number",
          min: 0,
          max: 1,
        },
      ],
    },
    {
      name: "background",
      executeOnLoad: false,
      options: [
        {
          name: "color",
          defaultVal: "#000000",
          type: "color",
        },
      ],
    },
    {
      name: "invert",
      executeOnLoad: false,
      options: [{ name: "duration", defaultVal: 0, type: "number", min: 0 }],
    },
    {
      name: "setBlur",
      executeOnLoad: false,
      options: [
        { name: "amount", defaultVal: 0, type: "number", min: 0, max: 50 },
        { name: "centerAt50", defaultVal: false, type: "boolean" },
        { name: "maxPeak", defaultVal: 5, type: "number", min: 0.1, max: 50 },
      ],
    },
    {
      name: "setSaturation",
      executeOnLoad: false,
      options: [
        { name: "value", defaultVal: 100, type: "number", min: 0, max: 200 },
        { name: "centerAt50", defaultVal: false, type: "boolean" },
        { name: "maxPeak", defaultVal: 200, type: "number", min: 0.1, max: 200 },
      ],
    },
    {
      name: "setBrightness",
      executeOnLoad: false,
      options: [
        { name: "value", defaultVal: 100, type: "number", min: 0, max: 300 },
        { name: "centerAt50", defaultVal: false, type: "boolean" },
        { name: "maxPeak", defaultVal: 300, type: "number", min: 0.1, max: 300 },
      ],
    },
    {
      name: "setContrast",
      executeOnLoad: false,
      options: [
        { name: "value", defaultVal: 100, type: "number", min: 0, max: 300 },
        { name: "centerAt50", defaultVal: false, type: "boolean" },
        { name: "maxPeak", defaultVal: 300, type: "number", min: 0.1, max: 300 },
      ],
    },
    {
      name: "setHueShift",
      executeOnLoad: false,
      options: [
        { name: "degrees", defaultVal: 0, type: "number", min: 0, max: 360 },
        { name: "centerAt50", defaultVal: false, type: "boolean" },
        { name: "maxPeak", defaultVal: 360, type: "number", min: 0.1, max: 360 },
      ],
    },
    {
      name: "setGlitch",
      executeOnLoad: false,
      options: [
        { name: "intensity", defaultVal: 0, type: "number", min: 0, max: 100 },
        { name: "centerAt50", defaultVal: false, type: "boolean" },
        { name: "maxPeak", defaultVal: 100, type: "number", min: 0.1, max: 100 },
      ],
    },
    {
      name: "setPixelate",
      executeOnLoad: false,
      options: [{ name: "size", defaultVal: 1, type: "number", min: 1, max: 50 }],
    },
    {
      name: "setScanlines",
      executeOnLoad: false,
      options: [
        { name: "intensity", defaultVal: 0, type: "number", min: 0, max: 100 },
        { name: "speed", defaultVal: 0, type: "number", min: 0, max: 10 },
      ],
    },
    {
      name: "setSkew",
      executeOnLoad: false,
      options: [
        { name: "x", defaultVal: 0, type: "number", min: -45, max: 45 },
        { name: "y", defaultVal: 0, type: "number", min: -45, max: 45 },
      ],
    },
    {
      name: "setPerspective",
      executeOnLoad: false,
      options: [
        { name: "rotateX", defaultVal: 0, type: "number", min: -60, max: 60 },
        { name: "rotateY", defaultVal: 0, type: "number", min: -60, max: 60 },
        { name: "depth", defaultVal: 800, type: "number", min: 100, max: 2000 },
      ],
    },
    {
      name: "setZoom",
      executeOnLoad: false,
      options: [
        { name: "level", defaultVal: 100, type: "number", min: 25, max: 400 },
        { name: "centerAt50", defaultVal: false, type: "boolean" },
        { name: "maxPeak", defaultVal: 400, type: "number", min: 0.1, max: 400 },
      ],
    },
    {
      name: "setTrails",
      executeOnLoad: false,
      options: [
        { name: "length", defaultVal: 0, type: "number", min: 0, max: 100 },
        { name: "decay", defaultVal: 50, type: "number", min: 10, max: 100 },
      ],
    },
    {
      name: "setSpeed",
      executeOnLoad: false,
      options: [{ name: "multiplier", defaultVal: 1, type: "number", min: 0, max: 5 }],
    },
  ];

  constructor(container) {
    this.elem = container;
    this.name = this.constructor.name;

    // Initialize transformation state
    this.currentX = 0;
    this.currentY = 0;
    this.currentScale = 1;
    this.currentOpacity = 1;
    this.viewportLineElem = null;
    this.rotateTimeout = null;
    this.currentRotation = 0;
    this.externalElements = [];

    this.currentBlur = 0;
    this.currentSaturation = 100;
    this.currentBrightness = 100;
    this.currentContrast = 100;
    this.currentHueShift = 0;
    this.currentInvert = false;

    this.glitchIntensity = 0;
    this.glitchInterval = null;
    this.glitchOverlay = null;

    this.pixelateSize = 1;
    this.pixelateCanvas = null;

    this.scanlinesIntensity = 0;
    this.scanlinesSpeed = 0;
    this.scanlinesOverlay = null;
    this.scanlinesAnimationId = null;

    this.currentSkewX = 0;
    this.currentSkewY = 0;
    this.currentPerspectiveX = 0;
    this.currentPerspectiveY = 0;
    this.currentPerspectiveDepth = 800;
    this.currentZoom = 100;

    this.trailsLength = 0;
    this.trailsDecay = 50;
    this.trailsOverlay = null;
    this.trailsAnimationId = null;

    this.speedMultiplier = 1;

    if (this.elem) {
      this.elem.style.visibility = "hidden";
      this.elem.style.opacity = this.currentOpacity;
      this.updateTransform();
    }
  }

  show(options = {}) {
    const { duration = 0 } = options;
    const moduleElem = this.elem;

    if (moduleElem) {
      moduleElem.style.visibility = "visible";
      if (this.externalElements && Array.isArray(this.externalElements)) {
        this.externalElements.forEach((elem) => {
          if (elem && elem.style) {
            elem.style.visibility = "visible";
          }
        });
      }

      if (duration > 0) {
        setTimeout(() => {
          moduleElem.style.visibility = "hidden";
          if (this.externalElements && Array.isArray(this.externalElements)) {
            this.externalElements.forEach((elem) => {
              if (elem && elem.style) {
                elem.style.visibility = "hidden";
              }
            });
          }
        }, duration);
      }
    } else {
      console.warn(`Module instance does not have an 'elem' property.`);
    }
  }

  hide(options = {}) {
    const { duration = 0 } = options;
    const moduleElem = this.elem;

    if (moduleElem) {
      moduleElem.style.visibility = "hidden";
      if (this.externalElements && Array.isArray(this.externalElements)) {
        this.externalElements.forEach((elem) => {
          if (elem && elem.style) {
            elem.style.visibility = "hidden";
          }
        });
      }

      if (duration > 0) {
        setTimeout(() => {
          moduleElem.style.visibility = "visible";
          if (this.externalElements && Array.isArray(this.externalElements)) {
            this.externalElements.forEach((elem) => {
              if (elem && elem.style) {
                elem.style.visibility = "visible";
              }
            });
          }
        }, duration);
      }
    } else {
      console.warn(`Module instance does not have an 'elem' property.`);
    }
  }

  /**
   * Applies translation to the element.
   * @param {Object} options
   * @param {number} options.x - The X offset in percentage (default: 0).
   * @param {number} options.y - The Y offset in percentage (default: 0).
   */
  offset(options = {}) {
    const { x = 0, y = 0 } = options;
    this.currentX = x;
    this.currentY = y;
    this.updateTransform();
  }

  /**
   * Applies scaling to the element.
   * @param {Object} options
   * @param {number} options.scale - The scale factor (default: 1).
   */
  scale(options = {}) {
    const { scale = 1 } = options;
    this.currentScale = scale;
    this.updateTransform();
  }

  /**
   * Adjusts the opacity of the element.
   * @param {Object} options
   * @param {number} options.value - The opacity value between 0 and 1 (default: 1).
   */
  opacity(options = {}) {
    const { opacity = 1 } = options;
    const moduleElem = this.elem;

    if (moduleElem) {
      // Clamp the opacity value between 0 and 1
      const clampedValue = Math.min(Math.max(opacity, 0), 1);
      this.currentOpacity = clampedValue;
      moduleElem.style.opacity = this.currentOpacity;
    } else {
      console.warn(`Module instance does not have an 'elem' property.`);
    }
  }

  /**
   * Rotates the element either infinitely or for a specified duration.
   * After the duration, the rotation stops, and the element remains in its final rotated position.
   * @param {Object} options
   * @param {string} options.direction - "clockwise" or "counter-clockwise" (default: "clockwise").
   * @param {number} options.speed - The rotation speed in degrees per second (default: 60).
   * @param {number} options.duration - Duration in milliseconds to rotate before stopping (default: 0, which means infinite rotation).
   */
  rotate(options = {}) {
    const { direction = "clockwise", speed = 1, duration = 0 } = options;

    if (this.rotationInterval) {
      return;
    }

    // Determine rotation direction multiplier
    const directionMultiplier = direction === "clockwise" ? 1 : -1;

    // Define the rotation step based on speed (degrees per second)
    const rotationStep = directionMultiplier * (speed * 12);

    let lastTimestamp = null;

    // Define the rotation function using requestAnimationFrame
    const rotateAnimation = (timestamp) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const delta = (timestamp - lastTimestamp) / 1000; // Convert to seconds
      lastTimestamp = timestamp;

      // Update the current rotation angle
      this.currentRotation += rotationStep * delta;

      // Keep the rotation angle within 0-360 degrees
      this.currentRotation %= 360;

      // Apply the rotation
      this.updateTransform();

      // Continue the animation
      this.rotationInterval = requestAnimationFrame(rotateAnimation);
    };

    // Start the rotation animation
    this.rotationInterval = requestAnimationFrame(rotateAnimation);

    // If duration is specified, set a timeout to stop the rotation
    if (duration > 0) {
      this.rotationTimeout = setTimeout(() => {
        this.stopRotate();
      }, duration);
    }
  }

  /**
   * Stops the rotation animation.
   * The element remains in its final rotated position.
   */
  stopRotate() {
    if (this.rotationInterval) {
      cancelAnimationFrame(this.rotationInterval);
      this.rotationInterval = null;
    }

    if (this.rotationTimeout) {
      clearTimeout(this.rotationTimeout);
      this.rotationTimeout = null;
    }
  }

  setRotation(options = {}) {
    const { angle = 360 } = options;
    this.currentRotation = angle;
    this.updateTransform();
  }

  /**
   * Updates the CSS transform property based on current transformation states, including rotation.
   */
  updateTransform() {
    if (this.elem) {
      const transformParts = [];

      if (this.currentPerspectiveX !== 0 || this.currentPerspectiveY !== 0) {
        this.elem.style.perspective = `${this.currentPerspectiveDepth}px`;
      } else {
        this.elem.style.perspective = "none";
      }

      if (this.currentX !== 0 || this.currentY !== 0) {
        transformParts.push(`translate(${this.currentX}%, ${this.currentY}%)`);
      }

      const effectiveScale = this.currentScale * (this.currentZoom / 100);
      if (effectiveScale !== 1) {
        transformParts.push(`scale(${effectiveScale})`);
      }

      if (this.currentRotation !== 0) {
        transformParts.push(`rotate(${this.currentRotation}deg)`);
      }

      if (this.currentSkewX !== 0 || this.currentSkewY !== 0) {
        transformParts.push(`skew(${this.currentSkewX}deg, ${this.currentSkewY}deg)`);
      }

      if (this.currentPerspectiveX !== 0) {
        transformParts.push(`rotateX(${this.currentPerspectiveX}deg)`);
      }
      if (this.currentPerspectiveY !== 0) {
        transformParts.push(`rotateY(${this.currentPerspectiveY}deg)`);
      }

      this.elem.style.transform =
        transformParts.length > 0 ? transformParts.join(" ") : "none";
    }
  }

  /**
   * Applies a random zoom effect with a random position within specified scale bounds
   * @param {Object} options
   * @param {number} options.scaleFrom - The minimum scale value (default: 1)
   * @param {number} options.scaleTo - The maximum scale value (default: 2)
   * @param {string} options.position - Optional fixed position ('topLeft', 'topRight', 'bottomLeft', 'bottomRight', 'random')
   * @returns {Object} The applied transformation values
   */
  randomZoom(options = {}) {
    const { scaleFrom = 1, scaleTo = 2, position = "random" } = options;

    // Ensure numeric values and generate random scale
    const numScaleFrom = Number(scaleFrom);
    const numScaleTo = Number(scaleTo);

    if (isNaN(numScaleFrom) || isNaN(numScaleTo)) {
      console.error("Invalid scale values provided");
      return;
    }

    const randomScale = Number(
      (Math.random() * (numScaleTo - numScaleFrom) + numScaleFrom).toFixed(2)
    );

    // Predefined position mappings
    const positions = {
      topLeft: { x: 0, y: 0 },
      topRight: { x: 100, y: 0 },
      bottomLeft: { x: 0, y: 100 },
      bottomRight: { x: 100, y: 100 },
    };

    let xOffset, yOffset;

    if (position === "random") {
      // Generate random percentage positions between 0-100
      xOffset = +(Math.random() * 100).toFixed(2);
      yOffset = +(Math.random() * 100).toFixed(2);
    } else {
      // Use predefined position if specified
      const selectedPosition = positions[position] || positions.topLeft;
      xOffset = selectedPosition.x;
      yOffset = selectedPosition.y;
    }

    // Apply the transformations
    this.scale({ scale: randomScale });
    this.offset({ x: xOffset, y: yOffset });

    // Return the applied values for reference
    return {
      scale: randomScale,
      x: xOffset,
      y: yOffset,
    };
  }

  /**
   * Draws a two-segment line from the module container to a viewport position.
   * The line extends outward from the closest side of the container, then toward the target.
   * @param {Object} options
   * @param {number} options.x - X position as percentage of viewport width (0-100)
   * @param {number} options.y - Y position as percentage of viewport height (0-100)
   * @param {number} options.length - Length of line as percentage of total distance (0-100, default: 100)
   * @param {number} options.opacity - Opacity of the line (0-1, default: 1)
   */
  viewportLine(options = {}) {
    const { x = 50, y = 50, length = 100, opacity = 1 } = options;
    const moduleElem = this.elem;

    if (!moduleElem) {
      console.warn(`Module instance does not have an 'elem' property.`);
      return;
    }

    // Remove existing line if present
    if (this.viewportLineElem) {
      if (this.viewportLineElem.parentNode) {
        this.viewportLineElem.parentNode.removeChild(this.viewportLineElem);
      }
      if (this.externalElements && Array.isArray(this.externalElements)) {
        const index = this.externalElements.indexOf(this.viewportLineElem);
        if (index > -1) {
          this.externalElements.splice(index, 1);
        }
      }
      this.viewportLineElem = null;
    }

    // Get container's bounding box (accounts for all transforms)
    const containerRect = moduleElem.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Convert target percentages to viewport coordinates
    const targetX = (x / 100) * viewportWidth;
    const targetY = (y / 100) * viewportHeight;

    // Calculate container center and dimensions
    const containerCenterX = containerRect.left + containerRect.width / 2;
    const containerCenterY = containerRect.top + containerRect.height / 2;
    const containerLeft = containerRect.left;
    const containerRight = containerRect.right;
    const containerTop = containerRect.top;
    const containerBottom = containerRect.bottom;

    // Calculate distances from target to each side center
    const topCenter = { x: containerCenterX, y: containerTop };
    const rightCenter = { x: containerRight, y: containerCenterY };
    const bottomCenter = { x: containerCenterX, y: containerBottom };
    const leftCenter = { x: containerLeft, y: containerCenterY };

    const distances = {
      top: Math.sqrt(
        Math.pow(targetX - topCenter.x, 2) + Math.pow(targetY - topCenter.y, 2)
      ),
      right: Math.sqrt(
        Math.pow(targetX - rightCenter.x, 2) +
          Math.pow(targetY - rightCenter.y, 2)
      ),
      bottom: Math.sqrt(
        Math.pow(targetX - bottomCenter.x, 2) +
          Math.pow(targetY - bottomCenter.y, 2)
      ),
      left: Math.sqrt(
        Math.pow(targetX - leftCenter.x, 2) +
          Math.pow(targetY - leftCenter.y, 2)
      ),
    };

    // Find closest side
    const closestSide = Object.keys(distances).reduce((a, b) =>
      distances[a] < distances[b] ? a : b
    );

    // Get starting point (center of closest side)
    let startX, startY;
    let outwardDirX, outwardDirY;

    switch (closestSide) {
      case "top":
        startX = topCenter.x;
        startY = topCenter.y;
        outwardDirX = 0;
        outwardDirY = -1;
        break;
      case "right":
        startX = rightCenter.x;
        startY = rightCenter.y;
        outwardDirX = 1;
        outwardDirY = 0;
        break;
      case "bottom":
        startX = bottomCenter.x;
        startY = bottomCenter.y;
        outwardDirX = 0;
        outwardDirY = 1;
        break;
      case "left":
        startX = leftCenter.x;
        startY = leftCenter.y;
        outwardDirX = -1;
        outwardDirY = 0;
        break;
    }

    // Calculate direction vector from start to target
    const dx = targetX - startX;
    const dy = targetY - startY;
    const totalLength = Math.sqrt(dx * dx + dy * dy);

    if (totalLength === 0) {
      console.warn("Target point is at the container edge. No line drawn.");
      return;
    }

    // Clamp length to valid range
    const clampedLength = Math.max(0, Math.min(100, length));
    const lengthMultiplier = clampedLength / 100;

    // Clamp opacity to valid range
    const clampedOpacity = Math.max(0, Math.min(1, opacity));

    // Calculate first segment: perpendicular outward (15% of total distance)
    const outwardLength = totalLength * 0.15;
    const midX = startX + outwardDirX * outwardLength;
    const midY = startY + outwardDirY * outwardLength;

    // Calculate actual end point based on length percentage
    // The end point is at length% of the way from start to target
    const endX = startX + dx * lengthMultiplier;
    const endY = startY + dy * lengthMultiplier;

    // Get z-index from container
    const computedStyle = window.getComputedStyle(moduleElem);
    const zIndex = computedStyle.zIndex || "1";

    // Create SVG overlay
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", viewportWidth);
    svg.setAttribute("height", viewportHeight);
    svg.style.position = "fixed";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.width = "100vw";
    svg.style.height = "100vh";
    svg.style.pointerEvents = "none";
    svg.style.zIndex = zIndex;

    // Create path for two-segment line
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const pathData = `M ${startX} ${startY} L ${midX} ${midY} L ${endX} ${endY}`;
    path.setAttribute("d", pathData);
    path.setAttribute("stroke", "#ffffff");
    path.setAttribute("stroke-width", "1");
    path.setAttribute("stroke-opacity", clampedOpacity);
    path.setAttribute("fill", "none");

    svg.appendChild(path);

    // Match module's current visibility state
    const moduleVisibility = window.getComputedStyle(moduleElem).visibility;
    svg.style.visibility = moduleVisibility;

    // Append to body (or projector container if available)
    const projectorContainer =
      document.querySelector(".projector") || document.body;
    projectorContainer.appendChild(svg);

    this.viewportLineElem = svg;
    this.externalElements.push(svg);

    console.log(
      `Module "${
        this.constructor.name
      }" viewport line drawn from (${startX.toFixed(1)}, ${startY.toFixed(
        1
      )}) to (${endX.toFixed(1)}, ${endY.toFixed(
        1
      )}) via closest side: ${closestSide}, length: ${clampedLength}%.`
    );
  }

  /**
   * Sets the background color of the module container.
   * @param {Object} options
   * @param {string} options.color - The color value (hex, rgb, rgba, or named color, default: "#000000").
   */
  background(options = {}) {
    const { color = "#000000" } = options;
    const moduleElem = this.elem;

    if (moduleElem) {
      moduleElem.style.backgroundColor = color;
    } else {
      console.warn(`Module instance does not have an 'elem' property.`);
    }
  }

  /**
   * Inverts all colors in the module container using CSS filter.
   * @param {Object} options
   * @param {number} options.duration - Duration to apply inversion in milliseconds (default: 0 for permanent).
   */
  invert(options = {}) {
    const { duration = 0 } = options;

    if (this.elem) {
      this.currentInvert = true;
      this.updateFilters();

      if (duration > 0) {
        setTimeout(() => {
          this.currentInvert = false;
          this.updateFilters();
        }, duration);
      }
    }
  }

  /**
   * Updates CSS filters based on current filter states.
   */
  updateFilters() {
    if (!this.elem) return;

    const filters = [];

    if (this.currentBlur > 0) {
      filters.push(`blur(${this.currentBlur}px)`);
    }
    if (this.currentSaturation !== 100) {
      filters.push(`saturate(${this.currentSaturation}%)`);
    }
    if (this.currentBrightness !== 100) {
      filters.push(`brightness(${this.currentBrightness}%)`);
    }
    if (this.currentContrast !== 100) {
      filters.push(`contrast(${this.currentContrast}%)`);
    }
    if (this.currentHueShift !== 0) {
      filters.push(`hue-rotate(${this.currentHueShift}deg)`);
    }
    if (this.currentInvert) {
      filters.push("invert(1)");
    }

    this.elem.style.filter = filters.length > 0 ? filters.join(" ") : "none";
  }

  /**
   * Sets blur amount - great for transitions and build-ups.
   * @param {Object} options
   * @param {number} options.amount - Blur intensity in pixels (0-50, default: 0).
   * @param {boolean} options.centerAt50 - If true, fader mapping: 50% = 0 blur, 0%/100% = 50 blur.
   */
  setBlur(options = {}) {
    const { amount = 0, centerAt50 = false, maxPeak = 5 } = options;
    const val = Number(amount);
    let blurValue;
    

    if (centerAt50) {
      const clamped = Math.max(0, Math.min(100, Number.isFinite(val) ? val : 0));
      const center = 50;
      const distance = Math.abs(clamped - center) / 50;
      const linearPart = distance * 0.3;
      const easedPart = Math.pow(distance, 2.5) * 0.7;
      
      blurValue = (linearPart + easedPart) * maxPeak; 
    } else {
      blurValue = Number.isFinite(val) ? val : 0;
    }
    
    this.currentBlur = Math.max(0, Math.min(50, blurValue));
    this.updateFilters();
  }

  /**
   * Sets saturation level - like a filter sweep on audio.
   * @param {Object} options
   * @param {number} options.value - Saturation intensity percentage (0-200, default: 100).
   * @param {boolean} options.centerAt50 - If true, fader mapping: 50% = 100% saturation, 0%/100% = 0% saturation.
   */
  setSaturation(options = {}) {
    const { value = 100, centerAt50 = false, maxPeak = 200 } = options;
    const val = Number(value);
    let satValue;
    
    if (centerAt50) {
      const clamped = Math.max(0, Math.min(100, Number.isFinite(val) ? val : 100));
      const center = 50;
      const distance = Math.abs(clamped - center) / 50;
      const linearPart = distance * 0.3;
      const easedPart = Math.pow(distance, 2.5) * 0.7;
      const effectIntensity = (linearPart + easedPart) * maxPeak;
      const neutral = 100;
      satValue = neutral - effectIntensity;
    } else {
      satValue = Number.isFinite(val) ? val : 100;
    }
    
    this.currentSaturation = Math.max(0, Math.min(200, satValue));
    this.updateFilters();
  }

  /**
   * Sets brightness level - for strobe/flash effects.
   * @param {Object} options
   * @param {number} options.value - Brightness intensity percentage (0-300, default: 100).
   * @param {boolean} options.centerAt50 - If true, fader mapping: 50% = 100% brightness, 0%/100% = 0% brightness.
   */
  setBrightness(options = {}) {
    const { value = 100, centerAt50 = false, maxPeak = 300 } = options;
    const val = Number(value);
    let brightValue;
    
    if (centerAt50) {
      const clamped = Math.max(0, Math.min(100, Number.isFinite(val) ? val : 100));
      const center = 50;
      const distance = Math.abs(clamped - center) / 50;
      const linearPart = distance * 0.3;
      const easedPart = Math.pow(distance, 2.5) * 0.7;
      const effectIntensity = (linearPart + easedPart) * maxPeak;
      const neutral = 100;
      brightValue = neutral - effectIntensity;
    } else {
      brightValue = Number.isFinite(val) ? val : 100;
    }
    
    this.currentBrightness = Math.max(0, Math.min(300, brightValue));
    this.updateFilters();
  }

  /**
   * Sets contrast level - for punchy drop effects.
   * @param {Object} options
   * @param {number} options.value - Contrast intensity percentage (0-300, default: 100).
   * @param {boolean} options.centerAt50 - If true, fader mapping: 50% = 100% contrast, 0%/100% = 0% contrast.
   */
  setContrast(options = {}) {
    const { value = 100, centerAt50 = false, maxPeak = 300 } = options;
    const val = Number(value);
    let contrastValue;
    
    if (centerAt50) {
      const clamped = Math.max(0, Math.min(100, Number.isFinite(val) ? val : 100));
      const center = 50;
      const distance = Math.abs(clamped - center) / 50;
      const linearPart = distance * 0.3;
      const easedPart = Math.pow(distance, 2.5) * 0.7;
      const effectIntensity = (linearPart + easedPart) * maxPeak;
      const neutral = 100;
      contrastValue = neutral - effectIntensity;
    } else {
      contrastValue = Number.isFinite(val) ? val : 100;
    }
    
    this.currentContrast = Math.max(0, Math.min(300, contrastValue));
    this.updateFilters();
  }

  /**
   * Sets hue rotation - color sweep like a filter on audio.
   * @param {Object} options
   * @param {number} options.degrees - Hue rotation intensity in degrees (0-360, default: 0).
   * @param {boolean} options.centerAt50 - If true, fader mapping: 50% = 0° rotation, 0%/100% = 360° rotation.
   */
  setHueShift(options = {}) {
    const { degrees = 0, centerAt50 = false, maxPeak = 360 } = options;
    const val = Number(degrees);
    let hueValue;
    
    if (centerAt50) {
      const clamped = Math.max(0, Math.min(100, Number.isFinite(val) ? val : 0));
      const center = 50;
      const distance = Math.abs(clamped - center) / 50;
      const linearPart = distance * 0.3;
      const easedPart = Math.pow(distance, 2.5) * 0.7;
      hueValue = (linearPart + easedPart) * maxPeak;
    } else {
      hueValue = Number.isFinite(val) ? val : 0;
    }
    
    this.currentHueShift = ((hueValue % 360) + 360) % 360;
    this.updateFilters();
  }

  /**
   * Creates RGB split/chromatic aberration glitch effect.
   * @param {Object} options
   * @param {number} options.intensity - Glitch intensity (0-100, default: 0).
   * @param {boolean} options.centerAt50 - If true, fader mapping: 50% = 0 intensity, 0%/100% = 100 intensity.
   */
  setGlitch(options = {}) {
    const { intensity = 0, centerAt50 = false, maxPeak = 100 } = options;
    const val = Number(intensity);
    let glitchValue;
    
    if (centerAt50) {
      const clamped = Math.max(0, Math.min(100, Number.isFinite(val) ? val : 0));
      const center = 50;
      const distance = Math.abs(clamped - center) / 50;
      const linearPart = distance * 0.3;
      const easedPart = Math.pow(distance, 2.5) * 0.7;
      glitchValue = (linearPart + easedPart) * maxPeak;
    } else {
      glitchValue = Number.isFinite(val) ? val : 0;
    }
    
    this.glitchIntensity = Math.max(0, Math.min(100, glitchValue));

    if (this.glitchInterval) {
      clearInterval(this.glitchInterval);
      this.glitchInterval = null;
    }

    if (this.glitchOverlay && this.glitchOverlay.parentNode) {
      this.glitchOverlay.parentNode.removeChild(this.glitchOverlay);
      this.glitchOverlay = null;
    }

    if (this.glitchIntensity === 0 || !this.elem) return;

    this.glitchOverlay = document.createElement("div");
    this.glitchOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
      mix-blend-mode: screen;
    `;
    this.elem.style.position = "relative";
    this.elem.appendChild(this.glitchOverlay);

    const applyGlitch = () => {
      if (!this.glitchOverlay || this.glitchIntensity === 0) return;

      const offset = (this.glitchIntensity / 100) * 15;
      const randomOffset = () => (Math.random() - 0.5) * offset * 2;

      if (Math.random() < this.glitchIntensity / 100) {
        this.glitchOverlay.style.boxShadow = `
          ${randomOffset()}px ${randomOffset()}px 0 rgba(255, 0, 0, 0.5),
          ${randomOffset()}px ${randomOffset()}px 0 rgba(0, 255, 0, 0.5),
          ${randomOffset()}px ${randomOffset()}px 0 rgba(0, 0, 255, 0.5)
        `;
        this.elem.style.transform = this.elem.style.transform + ` translate(${randomOffset()}px, ${randomOffset() * 0.5}px)`;
    } else {
        this.glitchOverlay.style.boxShadow = "none";
        this.updateTransform();
      }
    };

    this.glitchInterval = setInterval(applyGlitch, 50);
  }

  /**
   * Creates a pixelation effect - retro/lo-fi visual.
   * @param {Object} options
   * @param {number} options.size - Pixel size (1-50, default: 1 = no pixelation).
   */
  setPixelate(options = {}) {
    const { size = 1 } = options;
    const val = Number(size);
    this.pixelateSize = Math.max(1, Math.min(50, Math.floor(Number.isFinite(val) ? val : 1)));

    if (!this.elem) return;

    if (this.pixelateSize <= 1) {
      this.elem.style.imageRendering = "auto";
      if (this.pixelateCanvas && this.pixelateCanvas.parentNode) {
        this.pixelateCanvas.parentNode.removeChild(this.pixelateCanvas);
        this.pixelateCanvas = null;
      }
      return;
    }

    this.elem.style.imageRendering = "pixelated";

    const scaleDown = 1 / this.pixelateSize;
    this.elem.style.filter = (this.elem.style.filter || "").replace(/url\([^)]*pixelate[^)]*\)/g, "").trim();

    const svgFilter = `
      <svg xmlns="http://www.w3.org/2000/svg" style="display:none">
        <filter id="pixelate-${this.pixelateSize}">
          <feFlood x="0" y="0" width="${this.pixelateSize}" height="${this.pixelateSize}"/>
          <feComposite width="${this.pixelateSize}" height="${this.pixelateSize}"/>
          <feTile result="a"/>
          <feComposite in="SourceGraphic" in2="a" operator="in"/>
          <feMorphology operator="dilate" radius="${this.pixelateSize * 0.5}"/>
        </filter>
      </svg>
    `;

    if (!document.getElementById("pixelate-filter-svg")) {
      const svgContainer = document.createElement("div");
      svgContainer.id = "pixelate-filter-svg";
      svgContainer.innerHTML = svgFilter;
      document.body.appendChild(svgContainer);
    }
  }

  /**
   * Creates animated scanlines overlay effect.
   * @param {Object} options
   * @param {number} options.intensity - Scanline opacity (0-100, default: 0).
   * @param {number} options.speed - Animation speed (0-10, default: 0 = static).
   */
  setScanlines(options = {}) {
    const { intensity = 0, speed = 0 } = options;
    const intVal = Number(intensity);
    const spdVal = Number(speed);
    this.scanlinesIntensity = Math.max(0, Math.min(100, Number.isFinite(intVal) ? intVal : 0));
    this.scanlinesSpeed = Math.max(0, Math.min(10, Number.isFinite(spdVal) ? spdVal : 0));

    if (this.scanlinesAnimationId) {
      cancelAnimationFrame(this.scanlinesAnimationId);
      this.scanlinesAnimationId = null;
    }

    if (this.scanlinesOverlay && this.scanlinesOverlay.parentNode) {
      this.scanlinesOverlay.parentNode.removeChild(this.scanlinesOverlay);
      this.scanlinesOverlay = null;
    }

    if (this.scanlinesIntensity === 0 || !this.elem) return;

    this.scanlinesOverlay = document.createElement("div");
    this.scanlinesOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 200%;
      pointer-events: none;
      z-index: 9998;
      background: repeating-linear-gradient(
        0deg,
        transparent 0px,
        transparent 2px,
        rgba(0, 0, 0, ${this.scanlinesIntensity / 100}) 2px,
        rgba(0, 0, 0, ${this.scanlinesIntensity / 100}) 4px
      );
    `;
    this.elem.style.position = "relative";
    this.elem.style.overflow = "hidden";
    this.elem.appendChild(this.scanlinesOverlay);

    if (this.scanlinesSpeed > 0) {
      let offset = 0;
      const animateScanlines = () => {
        if (!this.scanlinesOverlay) return;
        offset = (offset + this.scanlinesSpeed * 0.5) % 4;
        this.scanlinesOverlay.style.transform = `translateY(${-offset}px)`;
        this.scanlinesAnimationId = requestAnimationFrame(animateScanlines);
      };
      this.scanlinesAnimationId = requestAnimationFrame(animateScanlines);
    }
  }

  /**
   * Applies skew transformation - warping effect.
   * @param {Object} options
   * @param {number} options.x - Horizontal skew in degrees (-45 to 45, default: 0).
   * @param {number} options.y - Vertical skew in degrees (-45 to 45, default: 0).
   */
  setSkew(options = {}) {
    const { x = 0, y = 0 } = options;
    const xVal = Number(x);
    const yVal = Number(y);
    this.currentSkewX = Math.max(-45, Math.min(45, Number.isFinite(xVal) ? xVal : 0));
    this.currentSkewY = Math.max(-45, Math.min(45, Number.isFinite(yVal) ? yVal : 0));
    this.updateTransform();
  }

  /**
   * Applies 3D perspective transformation - depth/tilt effect.
   * @param {Object} options
   * @param {number} options.rotateX - X-axis rotation in degrees (-60 to 60, default: 0).
   * @param {number} options.rotateY - Y-axis rotation in degrees (-60 to 60, default: 0).
   * @param {number} options.depth - Perspective depth (100-2000, default: 800).
   */
  setPerspective(options = {}) {
    const { rotateX = 0, rotateY = 0, depth = 800 } = options;
    const rxVal = Number(rotateX);
    const ryVal = Number(rotateY);
    const dVal = Number(depth);
    this.currentPerspectiveX = Math.max(-60, Math.min(60, Number.isFinite(rxVal) ? rxVal : 0));
    this.currentPerspectiveY = Math.max(-60, Math.min(60, Number.isFinite(ryVal) ? ryVal : 0));
    this.currentPerspectiveDepth = Math.max(100, Math.min(2000, Number.isFinite(dVal) ? dVal : 800));
    this.updateTransform();
  }

  /**
   * Sets zoom level - beatmatched zoom effect.
   * @param {Object} options
   * @param {number} options.level - Zoom intensity percentage (25-400, default: 100).
   * @param {boolean} options.centerAt50 - If true, fader mapping: 50% = 100% zoom, 0%/100% = 400% zoom.
   */
  setZoom(options = {}) {
    const { level = 100, centerAt50 = false, maxPeak = 400 } = options;
    const val = Number(level);
    let zoomValue;
    
    if (centerAt50) {
      const clamped = Math.max(0, Math.min(100, Number.isFinite(val) ? val : 100));
      const center = 50;
      const distance = Math.abs(clamped - center) / 50;
      const linearPart = distance * 0.3;
      const easedPart = Math.pow(distance, 2.5) * 0.7;
      const effectIntensity = (linearPart + easedPart);
      const neutral = 100;
      const maxZoom = Math.min(maxPeak, 400);
      zoomValue = neutral + (effectIntensity * (maxZoom - neutral));
    } else {
      zoomValue = Number.isFinite(val) ? val : 100;
    }
    
    this.currentZoom = Math.max(25, Math.min(400, zoomValue));
    this.updateTransform();
  }

  /**
   * Creates visual trails/echo effect - like delay on audio.
   * @param {Object} options
   * @param {number} options.length - Trail length (0-100, default: 0).
   * @param {number} options.decay - Trail decay rate (10-100, default: 50).
   */
  setTrails(options = {}) {
    const { length = 0, decay = 50 } = options;
    const lenVal = Number(length);
    const decVal = Number(decay);
    this.trailsLength = Math.max(0, Math.min(100, Number.isFinite(lenVal) ? lenVal : 0));
    this.trailsDecay = Math.max(10, Math.min(100, Number.isFinite(decVal) ? decVal : 50));

    if (this.trailsAnimationId) {
      cancelAnimationFrame(this.trailsAnimationId);
      this.trailsAnimationId = null;
    }

    if (this.trailsOverlay && this.trailsOverlay.parentNode) {
      this.trailsOverlay.parentNode.removeChild(this.trailsOverlay);
      this.trailsOverlay = null;
    }

    if (this.trailsLength === 0 || !this.elem) return;

    this.trailsOverlay = document.createElement("div");
    this.trailsOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: -1;
    `;
    this.elem.style.position = "relative";
    this.elem.insertBefore(this.trailsOverlay, this.elem.firstChild);

    const copies = [];
    const numCopies = Math.ceil(this.trailsLength / 10);

    for (let i = 0; i < numCopies; i++) {
      const copy = document.createElement("div");
      copy.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: ${(1 - (i + 1) / (numCopies + 1)) * (this.trailsLength / 100)};
        transform: scale(${1 - (i + 1) * 0.02});
        filter: blur(${(i + 1) * 0.5}px);
        pointer-events: none;
      `;
      copies.push(copy);
      this.trailsOverlay.appendChild(copy);
    }

    let lastTransform = this.elem.style.transform;
    const animateTrails = () => {
      if (!this.trailsOverlay || this.trailsLength === 0) return;

      const currentTransform = this.elem.style.transform;
      if (currentTransform !== lastTransform) {
        for (let i = copies.length - 1; i > 0; i--) {
          copies[i].style.transform = copies[i - 1].style.transform;
        }
        if (copies.length > 0) {
          copies[0].style.transform = lastTransform;
        }
        lastTransform = currentTransform;
      }

      this.trailsAnimationId = requestAnimationFrame(animateTrails);
    };
    this.trailsAnimationId = requestAnimationFrame(animateTrails);
  }

  /**
   * Sets animation speed multiplier - tempo control feel.
   * @param {Object} options
   * @param {number} options.multiplier - Speed multiplier (0-5, default: 1).
   */
  setSpeed(options = {}) {
    const { multiplier = 1 } = options;
    const val = Number(multiplier);
    this.speedMultiplier = Math.max(0, Math.min(5, Number.isFinite(val) ? val : 1));
  }

  /**
   * Gets current speed multiplier for use in module animations.
   * @returns {number} The current speed multiplier.
   */
  getSpeedMultiplier() {
    return this.speedMultiplier;
  }

  /**
   * Sets blur amount (centered mode: 0-50, default 25).
   * @param {Object} options
   * @param {number} options.amount - Blur amount in pixels (0-50, default: 25).
   */

  /**
   * Attempts to initialize the audio analyzer with the audio stream.
   * This method should be called by modules that need audio reactivity.
   * Sets this.audioReady to true when successful.
   * 
   * Modules should initialize these properties in their constructor:
   * - this.analyzer = null;
   * - this.audioReady = false;
   * - this.pollInterval = null;
   * 
   * @returns {Promise<void>}
   */
  async tryInitializeAudio() {
    if (this.audioReady || this.destroyed) return;
    const sdk = globalThis.nwWrldSdk;
    const stream = sdk?.audio?.getStream?.();
    if (stream) {
      this.analyzer = new AudioAnalyzer();
      const initialized = await this.analyzer.init(stream);
      if (initialized) {
        this.audioReady = true;
        if (this.pollInterval) {
          clearInterval(this.pollInterval);
          this.pollInterval = null;
        }
      }
    }
  }

  /**
   * Starts polling for the audio stream if it's not immediately available.
   * Polls every 1000ms until the stream is available or the module is destroyed.
   * 
   * This method should be called after tryInitializeAudio() if audioReady is false.
   */
  startStreamPolling() {
    if (this.pollInterval) return;
    this.pollInterval = setInterval(() => {
      if (this.destroyed) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
        return;
      }
      this.tryInitializeAudio();
    }, 1000);
  }

  destroy() {
    this.stopRotate();

    if (this.glitchInterval) {
      clearInterval(this.glitchInterval);
      this.glitchInterval = null;
    }
    if (this.glitchOverlay && this.glitchOverlay.parentNode) {
      this.glitchOverlay.parentNode.removeChild(this.glitchOverlay);
      this.glitchOverlay = null;
    }

    if (this.scanlinesAnimationId) {
      cancelAnimationFrame(this.scanlinesAnimationId);
      this.scanlinesAnimationId = null;
    }
    if (this.scanlinesOverlay && this.scanlinesOverlay.parentNode) {
      this.scanlinesOverlay.parentNode.removeChild(this.scanlinesOverlay);
      this.scanlinesOverlay = null;
    }

    if (this.trailsAnimationId) {
      cancelAnimationFrame(this.trailsAnimationId);
      this.trailsAnimationId = null;
    }
    if (this.trailsOverlay && this.trailsOverlay.parentNode) {
      this.trailsOverlay.parentNode.removeChild(this.trailsOverlay);
      this.trailsOverlay = null;
    }

    if (this.pixelateCanvas && this.pixelateCanvas.parentNode) {
      this.pixelateCanvas.parentNode.removeChild(this.pixelateCanvas);
      this.pixelateCanvas = null;
    }

    if (this.externalElements && Array.isArray(this.externalElements)) {
      this.externalElements.forEach((elem) => {
        if (elem && elem.parentNode) {
          elem.parentNode.removeChild(elem);
        }
      });
      this.externalElements = [];
    }

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    if (this.analyzer) {
      if (typeof this.analyzer.destroy === "function") {
        this.analyzer.destroy();
      }
      this.analyzer = null;
    }

    this.viewportLineElem = null;
    if (this.elem && this.elem.parentNode) {
      this.elem.parentNode.removeChild(this.elem);
    }
    this.elem = null;
  }
}

export default ModuleBase;
