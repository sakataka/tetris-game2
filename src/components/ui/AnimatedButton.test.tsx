import { describe, expect, it, mock } from "bun:test";
import { fireEvent, render } from "@testing-library/react";
import { AnimatedButton } from "./AnimatedButton";

// Mock framer-motion to avoid animation complexities in tests
mock.module("framer-motion", () => ({
  motion: {
    div: ({ children, whileHover, whileTap, transition, ...props }: any) => (
      <div
        data-motion-div
        data-while-hover={whileHover ? "true" : undefined}
        data-while-tap={whileTap ? "true" : undefined}
        data-transition={transition ? "true" : undefined}
        {...props}
      >
        {children}
      </div>
    ),
  },
}));

describe("AnimatedButton", () => {
  describe("basic functionality", () => {
    it("should render button with children", () => {
      const { getByRole, getByText } = render(<AnimatedButton>Test Button</AnimatedButton>);

      expect(getByRole("button")).toBeInTheDocument();
      expect(getByText("Test Button")).toBeInTheDocument();
    });

    it("should pass through button props", () => {
      const handleClick = mock();
      const { getByRole } = render(
        <AnimatedButton
          onClick={handleClick}
          variant="destructive"
          size="lg"
          className="test-class"
        >
          Click me
        </AnimatedButton>,
      );

      const button = getByRole("button");
      expect(button).toHaveClass("test-class");
    });

    it("should handle click events", () => {
      const handleClick = mock();

      const { getByRole } = render(<AnimatedButton onClick={handleClick}>Click me</AnimatedButton>);

      const button = getByRole("button");
      button.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("animation functionality", () => {
    it("should render with motion.div wrapper by default", () => {
      const { container } = render(<AnimatedButton>Animated</AnimatedButton>);

      const motionDiv = container.querySelector("[data-motion-div]");
      expect(motionDiv).toBeInTheDocument();
    });

    it("should apply default animation props", () => {
      const { container } = render(<AnimatedButton>Default Animation</AnimatedButton>);

      const motionDiv = container.querySelector("[data-motion-div]");
      expect(motionDiv).toHaveAttribute("data-while-hover", "true");
      expect(motionDiv).toHaveAttribute("data-while-tap", "true");
      expect(motionDiv).toHaveAttribute("data-transition", "true");
    });

    it("should accept custom animation props", () => {
      const customHover = { scale: 1.1, rotate: 5 };
      const customTap = { scale: 0.9 };
      const customTransition = { type: "spring", stiffness: 300 };

      const { container } = render(
        <AnimatedButton whileHover={customHover} whileTap={customTap} transition={customTransition}>
          Custom Animation
        </AnimatedButton>,
      );

      const motionDiv = container.querySelector("[data-motion-div]");
      expect(motionDiv).toBeInTheDocument();
    });
  });

  describe("animationDisabled prop", () => {
    it("should render standard Button when animationDisabled is true", () => {
      const { container, getByRole } = render(
        <AnimatedButton animationDisabled={true}>No Animation</AnimatedButton>,
      );

      const motionDiv = container.querySelector("[data-motion-div]");
      expect(motionDiv).not.toBeInTheDocument();

      const button = getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("No Animation");
    });

    it("should render animated version when animationDisabled is false", () => {
      const { container } = render(
        <AnimatedButton animationDisabled={false}>With Animation</AnimatedButton>,
      );

      const motionDiv = container.querySelector("[data-motion-div]");
      expect(motionDiv).toBeInTheDocument();
    });

    it("should render animated version by default", () => {
      const { container } = render(<AnimatedButton>Default Behavior</AnimatedButton>);

      const motionDiv = container.querySelector("[data-motion-div]");
      expect(motionDiv).toBeInTheDocument();
    });
  });

  describe("forwardRef functionality", () => {
    it("should forward ref to button element", () => {
      let buttonRef: any = null;

      render(
        <AnimatedButton
          ref={(ref) => {
            buttonRef = ref;
          }}
        >
          Ref Test
        </AnimatedButton>,
      );

      expect(buttonRef).toBeTruthy();
      expect(buttonRef?.textContent).toBe("Ref Test");
    });

    it("should forward ref when animation is disabled", () => {
      let buttonRef: any = null;

      render(
        <AnimatedButton
          ref={(ref) => {
            buttonRef = ref;
          }}
          animationDisabled={true}
        >
          Disabled Animation Ref
        </AnimatedButton>,
      );

      expect(buttonRef).toBeTruthy();
      expect(buttonRef?.textContent).toBe("Disabled Animation Ref");
    });
  });

  describe("variant and size props", () => {
    it("should pass variant prop to Button", () => {
      const { getByRole } = render(
        <AnimatedButton variant="destructive">Destructive</AnimatedButton>,
      );

      const button = getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("should pass size prop to Button", () => {
      const { getByRole } = render(<AnimatedButton size="lg">Large</AnimatedButton>);

      const button = getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("should pass disabled prop to Button", () => {
      const { getByRole } = render(<AnimatedButton disabled>Disabled</AnimatedButton>);

      const button = getByRole("button");
      expect(button).toBeDisabled();
    });
  });

  describe("accessibility", () => {
    it("should maintain button accessibility when animated", () => {
      const { getByRole } = render(
        <AnimatedButton aria-label="Accessible button">
          <span>Icon only</span>
        </AnimatedButton>,
      );

      const button = getByRole("button");
      expect(button).toHaveAccessibleName("Accessible button");
    });

    it("should maintain button accessibility when animation disabled", () => {
      const { getByRole } = render(
        <AnimatedButton aria-label="Accessible disabled animation" animationDisabled={true}>
          <span>Icon only</span>
        </AnimatedButton>,
      );

      const button = getByRole("button");
      expect(button).toHaveAccessibleName("Accessible disabled animation");
    });
  });

  describe("custom event handlers", () => {
    it("should handle onTouchStart events", () => {
      const handleTouchStart = mock();

      const { getByRole } = render(
        <AnimatedButton onTouchStart={handleTouchStart}>Touch Button</AnimatedButton>,
      );

      const button = getByRole("button");

      // Simulate touch start using fireEvent
      fireEvent.touchStart(button);

      expect(handleTouchStart).toHaveBeenCalledTimes(1);
    });

    it("should handle multiple event handlers", () => {
      const handleClick = mock();
      const handleMouseOver = mock();

      const { getByRole } = render(
        <AnimatedButton onClick={handleClick} onMouseOver={handleMouseOver}>
          Multi Event
        </AnimatedButton>,
      );

      const button = getByRole("button");

      // Simulate mouse over using fireEvent
      fireEvent.mouseOver(button);
      expect(handleMouseOver).toHaveBeenCalledTimes(1);

      // Simulate click
      button.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("complex children", () => {
    it("should render complex JSX children", () => {
      const { getByText } = render(
        <AnimatedButton>
          <div className="flex items-center gap-2">
            <span>Icon</span>
            <span>Text</span>
          </div>
        </AnimatedButton>,
      );

      expect(getByText("Icon")).toBeInTheDocument();
      expect(getByText("Text")).toBeInTheDocument();
    });

    it("should render with mixed content", () => {
      const { getByRole, getByText } = render(
        <AnimatedButton>
          Some text
          <strong>Bold text</strong>
          {" more text"}
        </AnimatedButton>,
      );

      const button = getByRole("button");
      expect(button).toHaveTextContent("Some textBold text more text");
      expect(getByText("Bold text")).toBeInTheDocument();
    });
  });
});
