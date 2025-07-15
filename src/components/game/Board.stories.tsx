import type { Meta, StoryObj } from "@storybook/react";

// Create a simple mock version for Storybook
const MockBoard = () => {
  return (
    <div className="p-3 md:p-6 bg-slate-800 rounded-lg border border-slate-700">
      <div
        className="grid gap-px bg-slate-900 p-2 rounded border-2 border-slate-600"
        style={{
          gridTemplateColumns: "repeat(10, 24px)",
          gridTemplateRows: "repeat(20, 24px)",
        }}
        aria-label="Tetris game board"
        role="img"
      >
        {Array.from({ length: 200 }, (_, i) => {
          const row = Math.floor(i / 10);
          const col = i % 10;

          // Add some filled cells for visual variety in certain stories
          const isEmpty = true; // Default empty board

          return (
            <div
              key={`cell-${row}-${col}`}
              className={`w-6 h-6 border border-slate-700 ${
                isEmpty ? "bg-slate-800/50" : "bg-blue-500"
              }`}
              data-testid={`cell-${row}-${col}`}
            />
          );
        })}
      </div>
    </div>
  );
};

const meta: Meta<typeof MockBoard> = {
  title: "Game/Board",
  component: MockBoard,
  parameters: {
    layout: "centered",
    chromatic: {
      viewports: [375, 768, 1280],
    },
    backgrounds: {
      default: "dark",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile",
    },
  },
};

export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: "tablet",
    },
  },
};

export const Desktop: Story = {
  parameters: {
    viewport: {
      defaultViewport: "desktop",
    },
  },
};
