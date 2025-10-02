import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LogoutDialog } from "../components/LogoutDialog";
import { AuthProvider } from "../contexts/AuthContext";

// Mock the API service
jest.mock("../lib/api", () => ({
  apiService: {
    logout: jest.fn().mockResolvedValue({}),
  },
}));

// Mock wouter
jest.mock("wouter", () => ({
  useLocation: () => ["/", () => {}],
}));

const MockedAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <AuthProvider>{children}</AuthProvider>;
};

describe("LogoutDialog", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it("renders logout button", () => {
    render(
      <MockedAuthProvider>
        <LogoutDialog />
      </MockedAuthProvider>
    );

    const logoutButton = screen.getByTestId("button-logout");
    expect(logoutButton).toBeInTheDocument();
  });

  it("opens confirmation dialog when logout button is clicked", async () => {
    render(
      <MockedAuthProvider>
        <LogoutDialog />
      </MockedAuthProvider>
    );

    const logoutButton = screen.getByTestId("button-logout");
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(
        screen.getByText("Are you sure you want to logout?")
      ).toBeInTheDocument();
    });
  });

  it("cancels logout when cancel button is clicked", async () => {
    render(
      <MockedAuthProvider>
        <LogoutDialog />
      </MockedAuthProvider>
    );

    const logoutButton = screen.getByTestId("button-logout");
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(
        screen.getByText("Are you sure you want to logout?")
      ).toBeInTheDocument();
    });

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(
        screen.queryByText("Are you sure you want to logout?")
      ).not.toBeInTheDocument();
    });
  });
});
