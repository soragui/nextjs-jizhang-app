import { NextResponse } from "next/server";
import { withAuth } from "@/lib/with-auth";
import { auth } from "@/auth";

jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

// Mock API route handlers that use withAuth
const mockApiHandler = async (request: Request) => {
  try {
    const session = await withAuth(request);
    return NextResponse.json({ message: "Success", userId: session.user.id });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    throw error;
  }
};

describe("API Route Authentication", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("withAuth protected routes", () => {
    it("allows request with valid session", async () => {
      const mockSession = {
        user: { id: "user-123", email: "test@example.com" },
        expires: "2025-01-01",
      };
      (auth as jest.Mock).mockResolvedValue(mockSession);

      const request = new Request("https://example.com/api/test");
      const response = await mockApiHandler(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ message: "Success", userId: "user-123" });
    });

    it("returns 401 for unauthenticated request", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = new Request("https://example.com/api/test");
      const response = await mockApiHandler(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("returns 401 when session has no user.id", async () => {
      const mockSession = {
        user: { email: "test@example.com" }, // missing id
        expires: "2025-01-01",
      };
      (auth as jest.Mock).mockResolvedValue(mockSession);

      const request = new Request("https://example.com/api/test");
      const response = await mockApiHandler(request);

      expect(response.status).toBe(401);
    });

    it("returns 401 when session has no user", async () => {
      const mockSession = {
        user: null,
        expires: "2025-01-01",
      };
      (auth as jest.Mock).mockResolvedValue(mockSession);

      const request = new Request("https://example.com/api/test");
      const response = await mockApiHandler(request);

      expect(response.status).toBe(401);
    });
  });
});
