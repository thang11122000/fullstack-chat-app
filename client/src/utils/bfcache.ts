/**
 * Utilities to optimize Back/Forward Cache (bfcache) compatibility
 * Fixes Lighthouse "Page prevented back/forward cache restoration" issue
 */

export class BfcacheManager {
  private static instance: BfcacheManager;
  private socketCleanupCallbacks: Set<() => void> = new Set();
  private isPageVisible = !document.hidden;

  private constructor() {
    this.setupEventListeners();
  }

  public static getInstance(): BfcacheManager {
    if (!BfcacheManager.instance) {
      BfcacheManager.instance = new BfcacheManager();
    }
    return BfcacheManager.instance;
  }

  private setupEventListeners() {
    // Handle page visibility changes
    document.addEventListener(
      "visibilitychange",
      this.handleVisibilityChange.bind(this)
    );

    // Handle bfcache events
    window.addEventListener("pageshow", this.handlePageShow.bind(this));
    window.addEventListener("pagehide", this.handlePageHide.bind(this));

    // Avoid beforeunload that blocks bfcache
    window.addEventListener(
      "beforeunload",
      this.handleBeforeUnload.bind(this),
      { passive: true }
    );
  }

  private handleVisibilityChange() {
    const wasVisible = this.isPageVisible;
    this.isPageVisible = !document.hidden;

    if (!wasVisible && this.isPageVisible) {
      // Page became visible - restore connections if needed
      console.log("Page became visible - checking connections");
      this.restoreConnections();
    } else if (wasVisible && !this.isPageVisible) {
      // Page became hidden - prepare for potential bfcache
      console.log("Page became hidden - preparing for bfcache");
      this.prepareForCache();
    }
  }

  private handlePageShow(event: PageTransitionEvent) {
    if (event.persisted) {
      // Page was restored from bfcache
      console.log("Page restored from bfcache");
      this.restoreConnections();
    }
  }

  private handlePageHide(event: PageTransitionEvent) {
    if (event.persisted) {
      // Page is being cached - clean up resources
      console.log("Page is being cached");
      this.prepareForCache();
    }
  }

  private handleBeforeUnload() {
    // Don't prevent default - let browser handle bfcache
    // Just do minimal cleanup
    console.log("Page unloading - minimal cleanup for bfcache");
  }

  private prepareForCache() {
    // Temporarily disconnect sockets but keep callbacks for restoration
    this.socketCleanupCallbacks.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.warn("Error during socket cleanup:", error);
      }
    });
  }

  private restoreConnections() {
    // Trigger connection restoration
    window.dispatchEvent(new CustomEvent("bfcache-restore-connections"));
  }

  // Public API for components to register cleanup callbacks
  public registerSocketCleanup(callback: () => void): () => void {
    this.socketCleanupCallbacks.add(callback);

    // Return unregister function
    return () => {
      this.socketCleanupCallbacks.delete(callback);
    };
  }

  // Check if bfcache is supported
  public static isBfcacheSupported(): boolean {
    return "onpagehide" in window && "onpageshow" in window;
  }

  // Log bfcache blocking factors for debugging
  public static logBfcacheStatus() {
    if (!BfcacheManager.isBfcacheSupported()) {
      console.warn("bfcache not supported in this browser");
      return;
    }

    // Check for common blocking factors

    // Check for open IndexedDB connections
    if ("indexedDB" in window) {
      // This is harder to detect, but we can warn
      console.log("IndexedDB detected - ensure proper cleanup");
    }

    // Check for active WebSocket connections
    if (window.WebSocket) {
      console.log("WebSocket API available - ensure proper socket cleanup");
    }

    // Check for unfinished network requests
    if ("performance" in window && performance.getEntriesByType) {
      const entries = performance.getEntriesByType(
        "navigation"
      ) as PerformanceNavigationTiming[];
      if (entries.length > 0) {
        const entry = entries[0];
        console.log("Last navigation type:", entry.type);
      }
    }

    console.log("bfcache status check completed");
  }
}

// Initialize the manager
export const bfcacheManager = BfcacheManager.getInstance();

// Hook for React components
export const useBfcacheOptimization = () => {
  return {
    registerSocketCleanup:
      bfcacheManager.registerSocketCleanup.bind(bfcacheManager),
    isBfcacheSupported: BfcacheManager.isBfcacheSupported(),
    logStatus: BfcacheManager.logBfcacheStatus,
  };
};
