import { Progress } from "@/components/ui/progress";

interface SurveyProgressProps {
  answered: number;
  total: number;
}

export const SurveyProgress = ({ answered, total }: SurveyProgressProps) => {
  const percentage = Math.round((answered / total) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Progresso da pesquisa</span>
        <span className="font-medium text-primary">
          {answered} de {total} respondidas
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
};
