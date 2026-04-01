import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "@/components/error-boundary";

// Test component that throws an error
const ThrowError = ({ message = "Test error" }: { message?: string }) => {
  throw new Error(message);
};

describe("ErrorBoundary", () => {
  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Hello World</div>
      </ErrorBoundary>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("renders fallback UI when error is thrown", () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(
      screen.getByText("We're sorry, but the page failed to load. Please try again.")
    ).toBeInTheDocument();
    expect(screen.getByText("Reload Page")).toBeInTheDocument();
  });

  it("calls console.error in componentDidCatch", () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "ErrorBoundary caught an error:",
      expect.any(Error),
      expect.any(Object)
    );

    consoleErrorSpy.mockRestore();
  });

  it("resets error state when reload button is clicked", () => {
    let shouldThrow = true;
    const ConditionalThrow = () => {
      if (shouldThrow) {
        throw new Error("Test error");
      }
      return <div data-testid="reloaded">Reloaded</div>;
    };

    render(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>
    );

    // Should show error state
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    // Change flag so component won't throw on re-render
    shouldThrow = false;

    // Click reload button
    fireEvent.click(screen.getByText("Reload Page"));

    // Should render the reloaded content
    expect(screen.getByTestId("reloaded")).toBeInTheDocument();
    expect(screen.getByText("Reloaded")).toBeInTheDocument();
  });
});
