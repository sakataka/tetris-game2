import { beforeEach, describe, expect, mock, test } from "bun:test";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AnimatedScoreItem } from "./AnimatedScoreItem";

// Mock framer-motion
mock.module("framer-motion", () => ({
  motion: {
    p: mock().mockImplementation((props) => (
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
    mock.restore();
  });

  test("should render label and value", () => {
    const { getByText, getByTestId } = render(<AnimatedScoreItem {...defaultProps} />);

    expect(getByText("Score")).toBeInTheDocument();
    expect(getByTestId("animated-value")).toHaveTextContent("1,000");
  });

  test("should format numbers with locale string for score animation", () => {
    const { getByTestId } = render(
      <AnimatedScoreItem {...defaultProps} value={123456} animation="score" />,
    );

    expect(getByTestId("animated-value")).toHaveTextContent("123,456");
  });

  test("should not format numbers for non-score animations", () => {
    const { getByTestId } = render(
      <AnimatedScoreItem {...defaultProps} value={123456} animation="lines" />,
    );

    expect(getByTestId("animated-value")).toHaveTextContent("123456");
  });

  test("should render string values as-is", () => {
    const { getByTestId } = render(<AnimatedScoreItem {...defaultProps} value="Level 5" />);

    expect(getByTestId("animated-value")).toHaveTextContent("Level 5");
  });

  test("should apply default className when none provided", () => {
    const { getByTestId } = render(<AnimatedScoreItem {...defaultProps} />);
    const element = getByTestId("animated-value");

    expect(element.className).toContain("text-xl");
    expect(element.className).toContain("font-bold");
    expect(element.className).toContain("text-tetris-cyan");
  });

  test("should apply custom className when provided", () => {
    const customClass = "text-lg text-red-500";
    const { getByTestId } = render(<AnimatedScoreItem {...defaultProps} className={customClass} />);

    expect(getByTestId("animated-value")).toHaveClass(customClass);
  });

  test("should render label with correct styling", () => {
    const { getByText } = render(<AnimatedScoreItem {...defaultProps} label="Lines" />);

    const label = getByText("Lines");
    expect(label).toHaveClass("text-sm font-medium text-gray-400");
  });

  test("should render with different animation types", () => {
    const { getByTestId, rerender } = render(
      <AnimatedScoreItem {...defaultProps} animation="score" />,
    );

    expect(getByTestId("animated-value")).toBeInTheDocument();

    rerender(<AnimatedScoreItem {...defaultProps} animation="lines" />);
    expect(getByTestId("animated-value")).toBeInTheDocument();

    rerender(<AnimatedScoreItem {...defaultProps} animation="level" />);
    expect(getByTestId("animated-value")).toBeInTheDocument();
  });

  test("should handle zero values correctly", () => {
    const { getByTestId } = render(
      <AnimatedScoreItem {...defaultProps} value={0} animation="score" />,
    );

    expect(getByTestId("animated-value")).toHaveTextContent("0");
  });

  test("should handle negative values correctly", () => {
    const { getByTestId } = render(
      <AnimatedScoreItem {...defaultProps} value={-100} animation="score" />,
    );

    expect(getByTestId("animated-value")).toHaveTextContent("-100");
  });

  test("should handle different data types for animationKey", () => {
    const { getByTestId, rerender } = render(
      <AnimatedScoreItem {...defaultProps} animationKey={42} />,
    );

    expect(getByTestId("animated-value")).toBeInTheDocument();

    rerender(<AnimatedScoreItem {...defaultProps} animationKey="string-key" />);
    expect(getByTestId("animated-value")).toBeInTheDocument();
  });

  test("should render container with correct structure", () => {
    const { container } = render(<AnimatedScoreItem {...defaultProps} />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("flex");
  });

  test("should handle large numbers correctly", () => {
    const { getByTestId } = render(
      <AnimatedScoreItem {...defaultProps} value={1234567890} animation="score" />,
    );

    expect(getByTestId("animated-value")).toHaveTextContent("1,234,567,890");
  });

  test("should handle empty string values", () => {
    const { getByTestId } = render(<AnimatedScoreItem {...defaultProps} value="" />);

    expect(getByTestId("animated-value")).toHaveTextContent("");
  });
});
