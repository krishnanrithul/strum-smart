import { ArrowLeft, Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const Library = () => {
  const exercises = [
    {
      id: 1,
      title: "Alternate Picking",
      category: "Technical",
      lastBpm: 120,
      status: "In Progress",
    },
    {
      id: 2,
      title: "Sultans of Swing - Solo",
      category: "Repertoire",
      lastBpm: 95,
      status: "In Progress",
    },
    {
      id: 3,
      title: "Chromatic Scale",
      category: "Warmup",
      lastBpm: 140,
      status: "Mastered",
    },
    {
      id: 4,
      title: "String Skipping",
      category: "Technical",
      lastBpm: 88,
      status: "New",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Mastered":
        return "bg-primary/20 text-primary border-primary/40";
      case "In Progress":
        return "bg-blue-500/20 text-blue-400 border-blue-500/40";
      case "New":
        return "bg-muted text-muted-foreground border-border";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Exercise Library</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Search & Add */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search exercises..."
              className="pl-10 h-12 bg-secondary border-border"
            />
          </div>
          <Button size="lg" className="h-12 px-4">
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {/* Exercise List */}
        <section className="space-y-3">
          {exercises.map((exercise) => (
            <Link key={exercise.id} to={`/exercise/${exercise.id}`}>
              <Card className="p-4 bg-secondary border-border hover:bg-secondary/80 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold mb-1 truncate">{exercise.title}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {exercise.category}
                      </Badge>
                      <Badge variant="outline" className={`text-xs ${getStatusColor(exercise.status)}`}>
                        {exercise.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm text-muted-foreground">Last BPM</div>
                    <div className="text-2xl font-bold metric-display">{exercise.lastBpm}</div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </section>

        {/* Empty State Helper */}
        <Card className="p-8 bg-card border-border text-center">
          <div className="text-muted-foreground mb-4">
            <div className="text-4xl mb-2">🎸</div>
            <p className="text-sm">
              Build your exercise library by adding songs, techniques, and warmups you want to track.
            </p>
          </div>
          <Button className="mt-2">
            <Plus className="h-5 w-5 mr-2" />
            Add Your First Exercise
          </Button>
        </Card>
      </main>
    </div>
  );
};

export default Library;
