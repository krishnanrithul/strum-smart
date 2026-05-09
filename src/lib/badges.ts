export const getStatusColor = (status: string) => {
  switch (status) {
    case "Mastered": return "bg-primary/20 text-primary border-primary/40";
    case "In Progress": return "bg-blue-500/20 text-blue-400 border-blue-500/40";
    default: return "bg-muted text-muted-foreground border-border";
  }
};

export const getCategoryBadge = (category: string) => {
  switch (category) {
    case "Technical": return "bg-blue-500/20 text-blue-400 border-blue-500/40";
    case "Warmup": return "bg-orange-500/20 text-orange-400 border-orange-500/40";
    case "Repertoire": return "bg-purple-500/20 text-purple-400 border-purple-500/40";
    default: return "bg-muted text-muted-foreground border-border";
  }
};