import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "../pages/Login.jsx";
import { AuthContext } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock("../services/api.js", () => ({
  api: {
    get: vi.fn(),
  },
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderLogin(loginImpl = mockLogin) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider
        value={{
          user: null,
          loading: false,
          login: loginImpl,
          logout: vi.fn(),
          isAdmin: false,
        }}
      >
        <Login />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe("Login page", () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockNavigate.mockReset();
    api.get.mockResolvedValue({ usernames: ["dm", "player1"] });
  });

  it("renders username selector and PIN display", async () => {
    renderLogin();
    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith("/auth/usernames", {
        skipAuth: true,
      }),
    );
    expect(screen.getByLabelText(/character selection/i)).toBeTruthy();
    expect(screen.getByText(/enter the yawning portal/i)).toBeTruthy();
  });

  it("submit button is disabled without username and full PIN", async () => {
    renderLogin();
    await waitFor(() => expect(api.get).toHaveBeenCalled());
    const btn = screen.getByText(/enter the yawning portal/i);
    expect(btn.closest("button").disabled).toBe(true);
  });

  it("shows error on wrong PIN (401)", async () => {
    const err = Object.assign(new Error("Unauthorized"), { status: 401 });
    mockLogin.mockRejectedValueOnce(err);

    renderLogin();
    await waitFor(() => expect(api.get).toHaveBeenCalled());
    fireEvent.click(screen.getByLabelText(/character selection/i));
    fireEvent.click(screen.getByText(/dungeon master/i));

    // Click PIN digits 1, 2, 3, 4
    ["1", "2", "3", "4"].forEach((d) => fireEvent.click(screen.getByText(d)));

    fireEvent.click(screen.getByText(/enter the yawning portal/i));
    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(screen.getByRole("alert").textContent).toMatch(/incorrect/i);
  });

  it("shows locked error on 423", async () => {
    const err = Object.assign(new Error("Locked"), { status: 423 });
    mockLogin.mockRejectedValueOnce(err);

    renderLogin();
    await waitFor(() => expect(api.get).toHaveBeenCalled());
    fireEvent.click(screen.getByLabelText(/character selection/i));
    fireEvent.click(screen.getByText(/dungeon master/i));
    ["1", "2", "3", "4"].forEach((d) => fireEvent.click(screen.getByText(d)));
    fireEvent.click(screen.getByText(/enter the yawning portal/i));
    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(screen.getByRole("alert").textContent).toMatch(/locked/i);
  });

  it("navigates to /admin for DM role", async () => {
    mockLogin.mockResolvedValueOnce({ role: "DM", mustChangePIN: false });
    renderLogin();
    await waitFor(() => expect(api.get).toHaveBeenCalled());
    fireEvent.click(screen.getByLabelText(/character selection/i));
    fireEvent.click(screen.getByText(/dungeon master/i));
    ["1", "2", "3", "4"].forEach((d) => fireEvent.click(screen.getByText(d)));
    fireEvent.click(screen.getByText(/enter the yawning portal/i));
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/admin", { replace: true }),
    );
  });

  it("navigates to /dashboard for PLAYER role", async () => {
    mockLogin.mockResolvedValueOnce({ role: "PLAYER", mustChangePIN: false });
    renderLogin();
    await waitFor(() => expect(api.get).toHaveBeenCalled());
    fireEvent.click(screen.getByLabelText(/character selection/i));
    fireEvent.click(screen.getByText(/player1/i));
    ["1", "2", "3", "4"].forEach((d) => fireEvent.click(screen.getByText(d)));
    fireEvent.click(screen.getByText(/enter the yawning portal/i));
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard", {
        replace: true,
      }),
    );
  });

  it("navigates to /change-pin when mustChangePIN is true", async () => {
    mockLogin.mockResolvedValueOnce({ role: "DM", mustChangePIN: true });
    renderLogin();
    await waitFor(() => expect(api.get).toHaveBeenCalled());
    fireEvent.click(screen.getByLabelText(/character selection/i));
    fireEvent.click(screen.getByText(/dungeon master/i));
    ["1", "2", "3", "4"].forEach((d) => fireEvent.click(screen.getByText(d)));
    fireEvent.click(screen.getByText(/enter the yawning portal/i));
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/change-pin", {
        replace: true,
      }),
    );
  });
});
