import type { Meta, StoryObj } from "@storybook/react";
import { Pause, Play, RefreshCw, Settings } from "lucide-react";

// Create a mock MobileHeader component for Storybook
const MockMobileHeader = ({
  isPaused = false,
  score = 15750,
}: {
  isPaused?: boolean;
  score?: number;
}) => {
  return (
    <header className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 p-3">
      <div className="flex items-center justify-between">
        {/* Left side - Score info */}
        <div className="flex flex-col space-y-1">
          <div className="text-sm text-gray-400">Score</div>
          <div className="text-lg font-mono text-white">{score.toLocaleString()}</div>
        </div>

        {/* Center - Game controls */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            className="flex items-center justify-center w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            aria-label={isPaused ? "Resume game" : "Pause game"}
          >
            {isPaused ? (
              <Play className="w-5 h-5 text-white" />
            ) : (
              <Pause className="w-5 h-5 text-white" />
            )}
          </button>

          <button
            type="button"
            className="flex items-center justify-center w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            aria-label="Reset game"
          >
            <RefreshCw className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Right side - Settings */}
        <button
          type="button"
          className="flex items-center justify-center w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          aria-label="Game settings"
        >
          <Settings className="w-5 h-5 text-white" />
        </button>
      </div>
    </header>
  );
};

const meta: Meta<typeof MockMobileHeader> = {
  title: "Layout/MobileHeader",
  component: MockMobileHeader,
  parameters: {
    layout: "fullscreen",
    chromatic: {
      viewports: [375, 768, 1280],
    },
    backgrounds: {
      default: "dark",
    },
  },
  argTypes: {
    isPaused: {
      control: "boolean",
      description: "Whether the game is currently paused",
    },
    score: {
      control: "number",
      description: "Current game score",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isPaused: false,
    score: 15750,
  },
};

export const Paused: Story = {
  args: {
    isPaused: true,
    score: 42350,
  },
};

export const HighScore: Story = {
  args: {
    isPaused: false,
    score: 999999,
  },
};

export const Mobile: Story = {
  args: {
    isPaused: false,
    score: 15750,
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile",
    },
  },
};
