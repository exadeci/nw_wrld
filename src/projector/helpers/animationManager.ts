// src/projector/helpers/animationManager.ts

import TWEEN from "@tweenjs/tween.js";

/**
 * AnimationManager - Centralized requestAnimationFrame coordinator
 *
 * Consolidates multiple animation loops into a single RAF loop to prevent
 * scheduling conflicts and reduce CPU overhead when multiple modules are active.
 *
 * Performance benefits:
 * - Single RAF callback instead of N callbacks (one per module instance)
 * - Guaranteed synchronization: all modules update in the same frame
 * - Reduced browser scheduler overhead
 * - Automatic cleanup when no subscribers remain
 */
class AnimationManager {
  private subscribers: Set<() => void>;
  private rafId: number | null;
  private tickBound: () => void;
  private fps: number;
  private frameCount: number;
  private lastTime: number;
  private fpsCallbacks: Set<(fps: number) => void>;
  private forceRunning: boolean;

  constructor() {
    this.subscribers = new Set();
    this.rafId = null;
    this.tickBound = this.tick.bind(this);
    this.fps = 0;
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fpsCallbacks = new Set();
    this.forceRunning = false;
  }

  /**
   * Register a callback to be called on every animation frame
   * @param {Function} callback - The animation callback to execute each frame
   */
  subscribe(callback: unknown) {
    if (typeof callback !== "function") {
      console.error(
        "[AnimationManager] Subscribe called with non-function:",
        callback
      );
      return;
    }

    const cb = callback as () => void;
    this.subscribers.add(cb);

    // Start the loop if this is the first subscriber
    if (!this.rafId) {
      this.start();
    }
  }

  /**
   * Unregister a callback from the animation loop
   * @param {Function} callback - The callback to remove
   */
  unsubscribe(callback: () => void) {
    this.subscribers.delete(callback);

    // Stop the loop if no subscribers remain and not forced to run
    if (this.subscribers.size === 0 && !this.forceRunning) {
      this.stop();
    }
  }

  /**
   * Main animation loop tick - executes all subscribed callbacks
   */
  private tick() {
    const now = performance.now();
    this.frameCount++;
    
    if (now - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
      this.frameCount = 0;
      this.lastTime = now;
      
      this.fpsCallbacks.forEach((callback) => {
        try {
          callback(this.fps);
        } catch (error: unknown) {
          console.error("[AnimationManager] Error in FPS callback:", error);
        }
      });
    }

    TWEEN.update();

    this.subscribers.forEach((callback) => {
      try {
        callback();
      } catch (error: unknown) {
        console.error(
          "[AnimationManager] Error in subscriber callback:",
          error
        );
      }
    });

    this.rafId = requestAnimationFrame(this.tickBound);
  }

  /**
   * Start the animation loop
   */
  start() {
    if (!this.rafId) {
      this.lastTime = performance.now();
      this.frameCount = 0;
      this.rafId = requestAnimationFrame(this.tickBound);
    }
  }

  /**
   * Stop the animation loop
   */
  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Get current subscriber count (useful for debugging)
   */
  getSubscriberCount() {
    return this.subscribers.size;
  }

  /**
   * Subscribe to FPS updates
   * @param {Function} callback - Called with current FPS value
   */
  onFpsUpdate(callback: unknown) {
    if (typeof callback === "function") {
      const cb = callback as (fps: number) => void;
      this.fpsCallbacks.add(cb);
      this.forceRunning = this.fpsCallbacks.size > 0;
      if (this.forceRunning && !this.rafId) {
        this.start();
      }
    }
  }

  /**
   * Unsubscribe from FPS updates
   * @param {Function} callback - The callback to remove
   */
  offFpsUpdate(callback: (fps: number) => void) {
    this.fpsCallbacks.delete(callback);
    this.forceRunning = this.fpsCallbacks.size > 0;
    if (!this.forceRunning && this.subscribers.size === 0) {
      this.stop();
    }
  }

  /**
   * Get current FPS
   */
  getFps() {
    return this.fps;
  }
}

// Singleton instance - shared across all modules
export const animationManager = new AnimationManager();
