import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ScoreBadge({ 
  score, 
  showPercentage = true, 
  size = "md",
  className 
}: ScoreBadgeProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "score-green";
    if (score >= 70) return "score-yellow";
    return "score-red";
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base font-semibold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium",
        getScoreColor(score),
        sizeClasses[size],
        className
      )}
    >
      {score.toFixed(0)}{showPercentage && "%"}
    </span>
  );
}
