import { useTranslation } from "react-i18next";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export function Controls() {
  const { t } = useTranslation();

  const controls = [
    { key: "← →", action: t("game.controls.move") },
    { key: "↓", action: t("game.controls.softDrop") },
    { key: "↑", action: t("game.controls.rotate") },
    { key: "Space", action: t("game.controls.hardDrop") },
    { key: "P", action: t("game.controls.pause") },
  ];

  return (
    <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-700 shadow-xl hover:bg-gray-900/60 hover:border-gray-600 transition-all duration-300 hover:shadow-2xl">
      <CardHeader>
        <CardTitle className="text-base font-bold text-gray-300 text-center">
          {t("game.controls.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {controls.map(({ key, action }) => (
            <div
              key={key}
              className="flex items-center justify-between py-1.5 px-3 bg-gray-800/30 rounded-md transition-colors hover:bg-gray-700/30"
            >
              <Badge variant="outline" className="font-mono text-xs border-gray-600 text-gray-300">
                {key}
              </Badge>
              <span className="text-sm text-gray-300">{action}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
