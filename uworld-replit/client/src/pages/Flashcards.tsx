import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, CreditCard, Play, Edit2, Trash2, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type FlashcardDeck, type Flashcard } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function Flashcards() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
  });
  const { toast } = useToast();

  const { data: decks = [], isLoading } = useQuery<FlashcardDeck[]>({
    queryKey: ["/api/flashcard-decks"],
  });

  const { data: allFlashcards = [] } = useQuery<Flashcard[][]>({
    queryKey: ["/api/flashcards/all"],
    queryFn: async () => {
      const flashcardPromises = decks.map(deck =>
        fetch(`/api/flashcard-decks/${deck.id}/flashcards`).then(res => res.json())
      );
      return Promise.all(flashcardPromises);
    },
    enabled: decks.length > 0,
  });

  const createDeckMutation = useMutation({
    mutationFn: async (data: { name: string; category: string; description?: string }) => {
      await apiRequest("POST", "/api/flashcard-decks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flashcard-decks"] });
      setIsDialogOpen(false);
      setFormData({ name: "", category: "", description: "" });
      toast({ title: "Deck created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create deck", variant: "destructive" });
    },
  });

  const deleteDeckMutation = useMutation({
    mutationFn: async (deckId: string) => {
      await apiRequest("DELETE", `/api/flashcard-decks/${deckId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flashcard-decks"] });
      toast({ title: "Deck deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete deck", variant: "destructive" });
    },
  });

  const filteredDecks = decks.filter((deck) =>
    deck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deck.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFlashcardsForDeck = (deckId: string): Flashcard[] => {
    const deckIndex = decks.findIndex(d => d.id === deckId);
    return deckIndex >= 0 && allFlashcards[deckIndex] ? allFlashcards[deckIndex] : [];
  };

  const calculateDeckStats = (deckId: string) => {
    const flashcards = getFlashcardsForDeck(deckId);
    const cardCount = flashcards.length;
    const masteredCount = flashcards.filter(f => f.repetitions >= 3).length;
    const now = new Date();
    const dueCount = flashcards.filter(f => {
      if (!f.nextReview) return true;
      return new Date(f.nextReview) <= now;
    }).length;

    return { cardCount, masteredCount, dueCount };
  };

  const totalCards = decks.reduce((sum, deck) => {
    const stats = calculateDeckStats(deck.id);
    return sum + stats.cardCount;
  }, 0);

  const totalMastered = decks.reduce((sum, deck) => {
    const stats = calculateDeckStats(deck.id);
    return sum + stats.masteredCount;
  }, 0);

  const totalDue = decks.reduce((sum, deck) => {
    const stats = calculateDeckStats(deck.id);
    return sum + stats.dueCount;
  }, 0);

  const handleCreateDeck = () => {
    createDeckMutation.mutate({
      name: formData.name,
      category: formData.category,
      description: formData.description || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="page-flashcards">
        <div>
          <h1 className="text-3xl font-bold">Flashcards</h1>
          <p className="text-muted-foreground mt-1">
            Create and study with spaced repetition flashcards
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="page-flashcards">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Flashcards</h1>
          <p className="text-muted-foreground mt-1">
            Create and study with spaced repetition flashcards
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-deck">
              <Plus className="h-4 w-4 mr-2" />
              New Deck
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Deck</DialogTitle>
              <DialogDescription>
                Create a new flashcard deck
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Input 
                  placeholder="Deck name" 
                  data-testid="input-deck-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Input 
                  placeholder="Category" 
                  data-testid="input-deck-category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
              <div>
                <Textarea
                  placeholder="Description (optional)..."
                  rows={3}
                  data-testid="textarea-deck-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <Button 
                className="w-full" 
                data-testid="button-save-deck"
                onClick={handleCreateDeck}
                disabled={createDeckMutation.isPending || !formData.name || !formData.category}
              >
                Create Deck
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Decks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-total-decks">
              {decks.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Cards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-total-cards">
              {totalCards}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mastered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-2" data-testid="text-mastered-cards">
              {totalMastered}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Due for Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-4" data-testid="text-due-cards">
              {totalDue}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search decks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          data-testid="input-search-decks"
        />
      </div>

      {filteredDecks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No decks found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              {searchQuery
                ? "Try adjusting your search query"
                : "Start creating flashcard decks to study with spaced repetition"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDecks.map((deck) => {
            const stats = calculateDeckStats(deck.id);
            const progress = stats.cardCount > 0 ? (stats.masteredCount / stats.cardCount) * 100 : 0;
            return (
              <Card key={deck.id} className="hover-elevate" data-testid={`card-deck-${deck.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{deck.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {deck.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Created: {new Date(deck.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-edit-${deck.id}`}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        data-testid={`button-delete-${deck.id}`}
                        onClick={() => deleteDeckMutation.mutate(deck.id)}
                        disabled={deleteDeckMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{stats.masteredCount} / {stats.cardCount}</span>
                    </div>
                    <Progress value={progress} />
                    
                    <div className="flex items-center justify-between text-sm">
                      <Badge variant="outline" className="bg-chart-4/10 text-chart-4 border-chart-4/20">
                        {stats.dueCount} due
                      </Badge>
                      <Badge variant="outline" className="bg-chart-2/10 text-chart-2 border-chart-2/20">
                        {stats.masteredCount} mastered
                      </Badge>
                    </div>

                    <div className="flex gap-2">
                      <Button className="flex-1" size="sm" data-testid={`button-study-${deck.id}`}>
                        <Play className="h-4 w-4 mr-1" />
                        Study
                      </Button>
                      <Button variant="outline" size="sm" data-testid={`button-reset-${deck.id}`}>
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
