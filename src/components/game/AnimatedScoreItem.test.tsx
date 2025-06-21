import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AnimatedScoreItem } from "./AnimatedScoreItem";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    p: vi.fn().mockImplementation((props) => (
      <p data-testid="animated-value" className={props.className}>
        {props.children}
      </p>
    )),
  },
}));

describe("AnimatedScoreItem", () => {
  const defaultProps = {
    label: "Score",
    value: 1000,
    animationKey: "test-key",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render label and value", () => {
    const { getByText, getByTestId } = render(<AnimatedScoreItem {...defaultProps} />);

    expect(getByText("Score")).toBeInTheDocument();
    expect(getByTestId("animated-value")).toHaveTextContent("1,000");
  });

  it("should format numbers with locale string for score animation", () => {
    const { getByTestId } = render(
      <AnimatedScoreItem {...defaultProps} value={123456} animation="score" />,
    );

    expect(getByTestId("animated-value")).toHaveTextContent("123,456");
  });

  it("should not format numbers for non-score animations", () => {
    const { getByTestId } = render(
      <AnimatedScoreItem {...defaultProps} value={123456} animation="lines" />,
    );

    expect(getByTestId("animated-value")).toHaveTextContent("123456");
  });

  it("should render string values as-is", () => {
    const { getByTestId } = render(<AnimatedScoreItem {...defaultProps} value="Level 5" />);

    expect(getByTestId("animated-value")).toHaveTextContent("Level 5");
  });

  it("should apply default className when none provided", () => {
    const { getByTestId } = render(<AnimatedScoreItem {...defaultProps} />);

    expect(getByTestId("animated-value")).toHaveClass("text-2xl font-bold text-tetris-cyan");
  });

  it("should apply custom className when provided", () => {
    const customClass = "text-lg text-red-500";
    const { getByTestId } = render(<AnimatedScoreItem {...defaultProps} className={customClass} />);

    expect(getByTestId("animated-value")).toHaveClass(customClass);
  });

  it("should render label with correct styling", () => {
    const { getByText } = render(<AnimatedScoreItem {...defaultProps} label="Lines" />);

    const label = getByText("Lines");
    expect(label).toHaveClass("text-sm font-medium text-gray-400");
  });

  it("should render with different animation types", () => {
    const { getByTestId, rerender } = render(
      <AnimatedScoreItem {...defaultProps} animation="score" />,
    );

    expect(getByTestId("animated-value")).toBeInTheDocument();

    rerender(<AnimatedScoreItem {...defaultProps} animation="lines" />);
    expect(getByTestId("animated-value")).toBeInTheDocument();

    rerender(<AnimatedScoreItem {...defaultProps} animation="level" />);
    expect(getByTestId("animated-value")).toBeInTheDocument();
  });

  it("should handle zero values correctly", () => {
    const { getByTestId } = render(
      <AnimatedScoreItem {...defaultProps} value={0} animation="score" />,
    );

    expect(getByTestId("animated-value")).toHaveTextContent("0");
  });

  it("should handle negative values correctly", () => {
    const { getByTestId } = render(
      <AnimatedScoreItem {...defaultProps} value={-100} animation="score" />,
    );

    expect(getByTestId("animated-value")).toHaveTextContent("-100");
  });

  it("should handle different data types for animationKey", () => {
    const { getByTestId, rerender } = render(
      <AnimatedScoreItem {...defaultProps} animationKey={42} />,
    );

    expect(getByTestId("animated-value")).toBeInTheDocument();

    rerender(<AnimatedScoreItem {...defaultProps} animationKey="string-key" />);
    expect(getByTestId("animated-value")).toBeInTheDocument();
  });

  it("should render container with correct structure", () => {
    const { container } = render(<AnimatedScoreItem {...defaultProps} />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("space-y-1");
  });

  it("should handle large numbers correctly", () => {
    const { getByTestId } = render(
      <AnimatedScoreItem {...defaultProps} value={1234567890} animation="score" />,
    );

    expect(getByTestId("animated-value")).toHaveTextContent("1,234,567,890");
  });

  it("should handle empty string values", () => {
    const { getByTestId } = render(<AnimatedScoreItem {...defaultProps} value="" />);

    expect(getByTestId("animated-value")).toHaveTextContent("");
  });
});
