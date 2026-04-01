import { withAuth } from "@/lib/with-auth";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

// Mock the auth module
jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

describe("withAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns session when user is authenticated", async () => {
    const mockSession = {
      user: { id: "user-123", email: "test@example.com" },
      expires: "2025-01-01",
    };
    (auth as jest.Mock).mockResolvedValue(mockSession);

    const mockRequest = new Request("https://example.com/api/test");
    const result = await withAuth(mockRequest);

    expect(result).toEqual(mockSession);
    expect(auth).toHaveBeenCalledTimes(1);
  });

  it("throws 401 when session is null", async () => {
    (auth as jest.Mock).mockResolvedValue(null);

    const mockRequest = new Request("https://example.com/api/test");

    let caughtError: unknown = null;
    try {
      await withAuth(mockRequest);
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeInstanceOf(NextResponse);
    const response = caughtError as NextResponse;
    expect(response.status).toBe(401);
  });

  it("throws 401 when session exists but user.id is missing", async () => {
    const mockSession = {
      user: { email: "test@example.com" }, // missing id
      expires: "2025-01-01",
    };
    (auth as jest.Mock).mockResolvedValue(mockSession);

    const mockRequest = new Request("https://example.com/api/test");

    let caughtError: unknown = null;
    try {
      await withAuth(mockRequest);
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeInstanceOf(NextResponse);
    const response = caughtError as NextResponse;
    expect(response.status).toBe(401);
  });

  it("throws 401 with correct error message", async () => {
    (auth as jest.Mock).mockResolvedValue(null);

    const mockRequest = new Request("https://example.com/api/test");

    let caughtError: unknown = null;
    try {
      await withAuth(mockRequest);
    } catch (error) {
      caughtError = error;
    }

    const response = caughtError as NextResponse;
    const data = await response.json();
    expect(data).toEqual({ error: "Unauthorized" });
  });
});
