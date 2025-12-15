import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { SortDirection } from "@/hooks/useTableSort";

interface SortableTableHeadProps {
  children: React.ReactNode;
  sortKey?: string;
  currentSortKey?: string | null;
  sortDirection?: SortDirection;
  onSort?: (key: string) => void;
  className?: string;
}

export function SortableTableHead({
  children,
  sortKey,
  currentSortKey,
  sortDirection,
  onSort,
  className,
}: SortableTableHeadProps) {
  const isSortable = sortKey && onSort;
  const isActive = sortKey === currentSortKey;

  const handleClick = () => {
    if (isSortable) {
      onSort(sortKey);
    }
  };

  return (
    <TableHead
      className={cn(
        "font-semibold",
        isSortable && "cursor-pointer select-none hover:bg-secondary/80 transition-colors",
        className
      )}
      onClick={handleClick}
    >
      <div className="flex items-center gap-1.5">
        <span>{children}</span>
        {isSortable && (
          <span className="text-muted-foreground">
            {isActive ? (
              sortDirection === "asc" ? (
                <ArrowUp className="h-3.5 w-3.5" />
              ) : (
                <ArrowDown className="h-3.5 w-3.5" />
              )
            ) : (
              <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
            )}
          </span>
        )}
      </div>
    </TableHead>
  );
}
