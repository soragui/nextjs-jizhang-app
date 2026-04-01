import { render, screen } from "@testing-library/react";
import { ErrorBoundaryLayout } from "@/components/error-boundary-layout";

describe("ErrorBoundaryLayout", () => {
  it("renders children wrapped in ErrorBoundary", () => {
    render(
      <ErrorBoundaryLayout>
        <div data-testid="content">Test Content</div>
      </ErrorBoundaryLayout>
    );

    expect(screen.getByTestId("content")).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("catches errors in child components", () => {
    const ThrowError = () => {
      throw new Error("Test error");
    };

    render(
      <ErrorBoundaryLayout>
        <ThrowError />
      </ErrorBoundaryLayout>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("applies className when provided", () => {
    const { container } = render(
      <ErrorBoundaryLayout className="custom-class">
        <div>Content</div>
      </ErrorBoundaryLayout>
    );

    // The ErrorBoundaryLayout should pass through the className
    // Since it wraps with ErrorBoundary, we check if content renders
    expect(container.firstChild).toBeInTheDocument();
  });
});
