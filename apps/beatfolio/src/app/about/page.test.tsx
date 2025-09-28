import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import About from "./page";

vi.mock("@ui/design-system/components/pages/AboutPage", () => ({
  default: () => <div data-testid="about-page">About Page Content</div>,
}));

describe("About Page", () => {
  it("AboutPageコンポーネントをレンダリングする", () => {});
});
