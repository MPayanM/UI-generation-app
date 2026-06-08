import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge, getToolCallLabel } from "../ToolCallBadge";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

function makeCall(toolName: string, args: unknown): ToolInvocation {
  return { state: "call", toolCallId: "test-id", toolName, args } as ToolInvocation;
}

function makeResult(toolName: string, args: unknown, result: unknown): ToolInvocation {
  return { state: "result", toolCallId: "test-id", toolName, args, result } as ToolInvocation;
}

// --- getToolCallLabel unit tests ---

test("str_replace_editor create with path", () => {
  expect(getToolCallLabel(makeCall("str_replace_editor", { command: "create", path: "src/components/Card.jsx" }))).toBe("Creating Card.jsx");
});

test("str_replace_editor str_replace with path", () => {
  expect(getToolCallLabel(makeCall("str_replace_editor", { command: "str_replace", path: "App.jsx" }))).toBe("Editing App.jsx");
});

test("str_replace_editor insert with path", () => {
  expect(getToolCallLabel(makeCall("str_replace_editor", { command: "insert", path: "App.jsx" }))).toBe("Editing App.jsx");
});

test("str_replace_editor view with path", () => {
  expect(getToolCallLabel(makeCall("str_replace_editor", { command: "view", path: "App.jsx" }))).toBe("Viewing App.jsx");
});

test("str_replace_editor undo_edit with path", () => {
  expect(getToolCallLabel(makeCall("str_replace_editor", { command: "undo_edit", path: "App.jsx" }))).toBe("Undoing edit to App.jsx");
});

test("str_replace_editor unknown command falls back to toolName", () => {
  expect(getToolCallLabel(makeCall("str_replace_editor", { command: "unknown_cmd", path: "App.jsx" }))).toBe("str_replace_editor");
});

test("file_manager rename with path", () => {
  expect(getToolCallLabel(makeCall("file_manager", { command: "rename", path: "App.jsx" }))).toBe("Renaming App.jsx");
});

test("file_manager delete with path", () => {
  expect(getToolCallLabel(makeCall("file_manager", { command: "delete", path: "App.jsx" }))).toBe("Deleting App.jsx");
});

test("file_manager unknown command falls back to toolName", () => {
  expect(getToolCallLabel(makeCall("file_manager", { command: "unknown_cmd", path: "App.jsx" }))).toBe("file_manager");
});

test("unknown toolName falls back to toolName", () => {
  expect(getToolCallLabel(makeCall("some_custom_tool", { command: "create", path: "x.js" }))).toBe("some_custom_tool");
});

test("missing args.path returns generic label without crash", () => {
  const label = getToolCallLabel(makeCall("str_replace_editor", { command: "create" }));
  expect(label).toBe("Creating file");
  expect(label).not.toContain("undefined");
});

test("undefined args falls back to toolName", () => {
  expect(getToolCallLabel(makeCall("str_replace_editor", undefined))).toBe("str_replace_editor");
});

test("empty args object falls back to toolName", () => {
  expect(getToolCallLabel(makeCall("str_replace_editor", {}))).toBe("str_replace_editor");
});

// --- ToolCallBadge render tests ---

test("state === result with truthy result renders green dot, not spinner", () => {
  const { container } = render(
    <ToolCallBadge toolInvocation={makeResult("str_replace_editor", { command: "create", path: "App.jsx" }, "File created")} />
  );
  expect(container.querySelector(".bg-emerald-500")).not.toBeNull();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("state === result with null result renders spinner, not green dot", () => {
  const { container } = render(
    <ToolCallBadge toolInvocation={makeResult("str_replace_editor", { command: "create", path: "App.jsx" }, null)} />
  );
  expect(container.querySelector(".animate-spin")).not.toBeNull();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("state === call renders spinner, not green dot", () => {
  const { container } = render(
    <ToolCallBadge toolInvocation={makeCall("str_replace_editor", { command: "create", path: "App.jsx" })} />
  );
  expect(container.querySelector(".animate-spin")).not.toBeNull();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("renders label text from getToolCallLabel", () => {
  render(
    <ToolCallBadge toolInvocation={makeCall("str_replace_editor", { command: "create", path: "Button.tsx" })} />
  );
  expect(screen.getByText("Creating Button.tsx")).toBeDefined();
});
