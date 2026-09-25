import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useElapsedSeconds } from "@/hooks/useElapsedSeconds";

const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

const mount = (running = false) =>
  renderHook(({ running }) => useElapsedSeconds(running), {
    initialProps: { running },
  });

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useElapsedSeconds", () => {
  it("starts at zero", () => {
    const { result } = mount();

    expect(result.current[0]).toBe(0);
  });

  // The session clock used to be started on mount with no condition, so it
  // ran from the moment the practice screen opened.
  it("does not advance until it is started", () => {
    const { result } = mount(false);

    advance(5000);

    expect(result.current[0]).toBe(0);
  });

  it("counts one per second while running", () => {
    const { result } = mount(true);

    advance(3000);

    expect(result.current[0]).toBe(3);
  });

  it("holds the count when paused rather than resetting it", () => {
    const { result, rerender } = mount(true);

    advance(4000);
    rerender({ running: false });
    advance(10_000);

    expect(result.current[0]).toBe(4);
  });

  it("resumes from where it paused", () => {
    const { result, rerender } = mount(true);

    advance(4000);
    rerender({ running: false });
    advance(10_000);
    rerender({ running: true });
    advance(2000);

    expect(result.current[0]).toBe(6);
  });

  it("can be reset without stopping", () => {
    const { result } = mount(true);

    advance(5000);
    act(() => {
      result.current[1](0);
    });

    expect(result.current[0]).toBe(0);

    advance(1000);
    expect(result.current[0]).toBe(1);
  });

  it("does not keep counting after unmount", () => {
    const { result, unmount } = mount(true);

    advance(2000);
    const atUnmount = result.current[0];
    unmount();
    advance(10_000);

    expect(result.current[0]).toBe(atUnmount);
  });
});
