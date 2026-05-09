import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { Exercise } from "@/lib/storage";
import { getStatusColor, getCategoryBadge } from "@/lib/badges";

type Props = {
  exercise: Exercise;
  showCategory?: boolean;
  bpmLabel?: string;
  onEdit: (exercise: Exercise, e: React.MouseEvent) => void;
  onDelete: (exercise: Exercise, e: React.MouseEvent) => void;
};

export const ExerciseCard = ({ exercise, showCategory = false, bpmLabel = "BPM", onEdit, onDelete }: Props) => (
  <Card className="relative group p-4 bg-secondary border-border hover:bg-secondary/80 transition-colors">
    <Link to={`/practice/${exercise.id}`} className="block pr-20">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold mb-1 truncate">{exercise.title}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {showCategory && (
              <Badge variant="outline" className={`text-xs ${getCategoryBadge(exercise.category)}`}>
                {exercise.category}
              </Badge>
            )}
            <Badge variant="outline" className={`text-xs ${getStatusColor(exercise.status)}`}>
              {exercise.status}
            </Badge>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-sm text-muted-foreground">{bpmLabel}</div>
          <div className="text-2xl font-bold metric-display">{exercise.current_bpm}</div>
        </div>
      </div>
    </Link>
    <Button variant="ghost" size="icon"
      className="absolute top-2 right-10 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10"
      onClick={(e) => onEdit(exercise, e)}>
      <Pencil className="h-4 w-4" />
    </Button>
    <Button variant="destructive" size="icon"
      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10"
      onClick={(e) => onDelete(exercise, e)}>
      <Trash2 className="h-4 w-4" />
    </Button>
  </Card>
);