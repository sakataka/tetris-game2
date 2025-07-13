import type { Meta, StoryObj } from "@storybook/react";

// Create a mock ScoreBoard component for Storybook
const MockScoreBoard = () => {
  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 w-64">
      <div className="border-b border-slate-600 pb-2 mb-3">
        <h3 className="text-base font-bold text-gray-300 text-center">Score</h3>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Score:</span>
          <span className="text-lg font-mono text-white">15,750</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Lines:</span>
          <span className="text-lg font-mono text-white">42</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Level:</span>
          <span className="text-lg font-mono text-white">5</span>
        </div>
      </div>
    </div>
  );
};

const meta: Meta<typeof MockScoreBoard> = {
  title: "Game/ScoreBoard",
  component: MockScoreBoard,
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

export const HighScore: Story = {
  render: () => (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 w-64">
      <div className="border-b border-slate-600 pb-2 mb-3">
        <h3 className="text-base font-bold text-gray-300 text-center">Score</h3>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Score:</span>
          <span className="text-lg font-mono text-yellow-400">999,999</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Lines:</span>
          <span className="text-lg font-mono text-yellow-400">999</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Level:</span>
          <span className="text-lg font-mono text-yellow-400">99</span>
        </div>
      </div>
    </div>
  ),
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile",
    },
  },
};
