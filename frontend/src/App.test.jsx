// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import snapshot from "../public/data/fpl.json";
import App from "./App";


describe("FPL workspace", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => snapshot,
    }));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("supports player discovery, combined filters, comparison, and fixture browsing", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText("Pascal Groß")).toBeVisible();
    expect(document.querySelectorAll(".player-table tbody tr")).toHaveLength(60);

    await user.type(screen.getByPlaceholderText("Player or club"), "Haaland");
    expect(screen.getByText("Erling Haaland")).toBeVisible();
    expect(document.querySelectorAll(".player-table tbody tr")).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Reset" }));

    await user.selectOptions(screen.getByLabelText("Club"), "Arsenal");
    await user.click(screen.getByRole("button", { name: "FWD", exact: true }));
    const filteredRows = document.querySelectorAll(".player-table tbody tr");
    expect(filteredRows.length).toBeGreaterThan(0);
    filteredRows.forEach((row) => expect(within(row).getByText("Arsenal")).toBeVisible());
    await user.click(screen.getByRole("button", { name: "Reset" }));

    const compareButtons = screen.getAllByRole("button", { name: /^Add .* to comparison$/ });
    await user.click(compareButtons[0]);
    await user.click(compareButtons[1]);
    expect(screen.getByText("2/3 selected")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Compare now" }));
    expect(screen.getByRole("heading", { name: "Player comparison" })).toBeVisible();
    expect(screen.getByText("Points / £m")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Close comparison" }));

    await user.click(screen.getByRole("button", { name: /Fixtures/ }));
    expect(screen.getByRole("heading", { name: "See the gameweek ahead." })).toBeVisible();
    fireEvent.change(screen.getByLabelText("Gameweek"), { target: { value: "6" } });
    await waitFor(() => expect(document.querySelectorAll(".fixture-card").length).toBeGreaterThan(0));

    await user.click(screen.getByRole("button", { name: /Data/ }));
    expect(document.querySelectorAll(".resource-card")).toHaveLength(5);
  });
});
