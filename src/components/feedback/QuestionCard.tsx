import { cn } from "@/lib/utils";

export interface QuestionOption {
  value: string;
  label: string;
  emoji: string;
}

interface QuestionCardProps {
  question: string;
  options: QuestionOption[];
  selectedValue: string | null;
  onSelect: (value: string) => void;
  questionNumber: number;
}

export const QuestionCard = ({
  question,
  options,
  selectedValue,
  onSelect,
  questionNumber,
}: QuestionCardProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-foreground">
        <span className="text-primary font-bold mr-2">{questionNumber}.</span>
        {question}
      </h3>
      <div className="grid gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className={cn(
              "w-full p-4 rounded-xl border-2 text-left transition-all duration-200",
              "hover:border-primary/50 hover:bg-primary/5",
              "flex items-center gap-3",
              selectedValue === option.value
                ? "border-primary bg-primary/10 shadow-sm"
                : "border-border bg-card"
            )}
          >
            <span className="text-2xl">{option.emoji}</span>
            <span className={cn(
              "font-medium",
              selectedValue === option.value ? "text-primary" : "text-foreground"
            )}>
              {option.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
