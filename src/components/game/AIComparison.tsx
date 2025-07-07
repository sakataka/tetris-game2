import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface PlayerStats {
  gamesPlayed: number;
  averageScore: number;
  bestScore: number;
  averageLines: number;
  tSpinRate: number;
  averageGameTime: number;
  perfectClearRate: number;
}

export interface AIComparisonProps {
  humanStats: PlayerStats;
  aiStats: PlayerStats;
  onStartComparison?: () => void;
}

export function AIComparison({ humanStats, aiStats, onStartComparison }: AIComparisonProps) {
  const comparisonData = useMemo(() => {
    const metrics = [
      {
        name: "Average Score",
        human: humanStats.averageScore,
        ai: aiStats.averageScore,
        format: (value: number) => value.toLocaleString(),
        higherBetter: true,
      },
      {
        name: "Best Score",
        human: humanStats.bestScore,
        ai: aiStats.bestScore,
        format: (value: number) => value.toLocaleString(),
        higherBetter: true,
      },
      {
        name: "Average Lines",
        human: humanStats.averageLines,
        ai: aiStats.averageLines,
        format: (value: number) => value.toFixed(0),
        higherBetter: true,
      },
      {
        name: "T-Spin Rate",
        human: humanStats.tSpinRate,
        ai: aiStats.tSpinRate,
        format: (value: number) => `${(value * 100).toFixed(1)}%`,
        higherBetter: true,
      },
      {
        name: "Perfect Clear Rate",
        human: humanStats.perfectClearRate,
        ai: aiStats.perfectClearRate,
        format: (value: number) => `${(value * 100).toFixed(1)}%`,
        higherBetter: true,
      },
      {
        name: "Avg Game Time",
        human: humanStats.averageGameTime,
        ai: aiStats.averageGameTime,
        format: (value: number) =>
          `${Math.floor(value / 60)}:${(value % 60).toFixed(0).padStart(2, "0")}`,
        higherBetter: true,
      },
    ];

    return metrics;
  }, [humanStats, aiStats]);

  const winningMetrics = useMemo(() => {
    let humanWins = 0;
    let aiWins = 0;

    comparisonData.forEach((metric) => {
      if (metric.higherBetter) {
        if (metric.human > metric.ai) humanWins++;
        else if (metric.ai > metric.human) aiWins++;
      } else {
        if (metric.human < metric.ai) humanWins++;
        else if (metric.ai < metric.human) aiWins++;
      }
    });

    return { humanWins, aiWins };
  }, [comparisonData]);

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">AI vs Human Comparison</h3>

      {/* Overall Wins/Losses */}
      <div className="mb-4 p-3 bg-muted rounded-lg">
        <div className="text-sm text-center">
          <span className="text-blue-600 font-semibold">Human: {winningMetrics.humanWins}</span>
          <span className="mx-2">vs</span>
          <span className="text-red-600 font-semibold">AI: {winningMetrics.aiWins}</span>
        </div>
        {winningMetrics.humanWins > winningMetrics.aiWins ? (
          <div className="text-sm text-center text-blue-600 font-medium mt-1">Human Leading!</div>
        ) : winningMetrics.aiWins > winningMetrics.humanWins ? (
          <div className="text-sm text-center text-red-600 font-medium mt-1">AI Leading!</div>
        ) : (
          <div className="text-sm text-center text-gray-600 font-medium mt-1">Tied!</div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <h4 className="font-medium text-blue-600">Human Player</h4>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>Games:</span>
              <span>{humanStats.gamesPlayed}</span>
            </div>
            <div className="flex justify-between">
              <span>Avg Score:</span>
              <span>{humanStats.averageScore.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Best Score:</span>
              <span>{humanStats.bestScore.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Avg Lines:</span>
              <span>{humanStats.averageLines.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span>T-Spin Rate:</span>
              <span>{(humanStats.tSpinRate * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>PC Rate:</span>
              <span>{(humanStats.perfectClearRate * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-red-600">AI Player</h4>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>Games:</span>
              <span>{aiStats.gamesPlayed}</span>
            </div>
            <div className="flex justify-between">
              <span>Avg Score:</span>
              <span>{aiStats.averageScore.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Best Score:</span>
              <span>{aiStats.bestScore.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Avg Lines:</span>
              <span>{aiStats.averageLines.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span>T-Spin Rate:</span>
              <span>{(aiStats.tSpinRate * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>PC Rate:</span>
              <span>{(aiStats.perfectClearRate * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Comparison Chart */}
      <div className="mt-4">
        <h4 className="font-medium mb-2">Performance Comparison</h4>
        <ComparisonChart comparisonData={comparisonData} />
      </div>

      <Button onClick={onStartComparison} className="w-full mt-4">
        Start New Comparison Game
      </Button>
    </Card>
  );
}

function ComparisonChart({
  comparisonData,
}: {
  comparisonData: Array<{
    name: string;
    human: number;
    ai: number;
    format: (value: number) => string;
    higherBetter: boolean;
  }>;
}) {
  return (
    <div className="space-y-3">
      {comparisonData.map((metric, _index) => {
        const maxValue = Math.max(metric.human, metric.ai);
        const humanPercentage = maxValue > 0 ? (metric.human / maxValue) * 100 : 0;
        const aiPercentage = maxValue > 0 ? (metric.ai / maxValue) * 100 : 0;

        const humanWins = metric.higherBetter ? metric.human > metric.ai : metric.human < metric.ai;
        const aiWins = metric.higherBetter ? metric.ai > metric.human : metric.ai < metric.human;

        return (
          <div key={metric.name} className="space-y-1">
            <div className="flex justify-between text-sm font-medium">
              <span>{metric.name}</span>
              <div className="flex gap-4">
                <span className={`${humanWins ? "text-blue-600 font-bold" : "text-gray-600"}`}>
                  {metric.format(metric.human)}
                </span>
                <span className={`${aiWins ? "text-red-600 font-bold" : "text-gray-600"}`}>
                  {metric.format(metric.ai)}
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${humanPercentage}%` }}
                />
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${aiPercentage}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
