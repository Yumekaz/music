import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = globalThis.ResizeObserver || ResizeObserverMock;
