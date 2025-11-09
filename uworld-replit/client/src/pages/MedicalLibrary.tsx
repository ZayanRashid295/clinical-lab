import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, BookOpen, FileText, Video, ExternalLink, Maximize2 } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Article } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function MedicalLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: articles = [], isLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles/search", { searchTerm: searchQuery, type: activeTab !== "all" ? activeTab : undefined }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("searchTerm", searchQuery);
      if (activeTab !== "all") params.append("type", activeTab);
      
      const url = `/api/articles/search?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch articles");
      return response.json();
    },
  });

  const articlesByType = {
    all: articles,
    article: articles.filter((a) => a.type === "article"),
    video: articles.filter((a) => a.type === "video"),
    reference: articles.filter((a) => a.type === "reference"),
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4" />;
      case "reference":
        return <FileText className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const handleViewArticle = (article: Article) => {
    setSelectedArticle(article);
    setDialogOpen(true);
  };

  const renderArticle = (article: Article) => (
    <Card key={article.id} className="hover-elevate" data-testid={`card-article-${article.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getIcon(article.type)}
              <Badge variant="secondary" className="text-xs">
                {article.category}
              </Badge>
            </div>
            <CardTitle className="text-lg">{article.title}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{article.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {article.readTime || article.videoLength}
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleViewArticle(article)}
            data-testid={`button-view-${article.id}`}
          >
            View
            <Maximize2 className="h-3 w-3 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="page-medical-library">
        <div>
          <h1 className="text-3xl font-bold">Medical Library</h1>
          <p className="text-muted-foreground mt-1">
            Access comprehensive medical reference materials and resources
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
    <div className="space-y-6" data-testid="page-medical-library">
      <div>
        <h1 className="text-3xl font-bold">Medical Library</h1>
        <p className="text-muted-foreground mt-1">
          Access comprehensive medical reference materials and resources
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Articles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-total-articles">
              {articles.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Articles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-article-count">
              {articlesByType.article.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Videos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-video-count">
              {articlesByType.video.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              References
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-reference-count">
              {articlesByType.reference.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search articles, videos, and references..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          data-testid="input-search-library"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">
            All ({articlesByType.all.length})
          </TabsTrigger>
          <TabsTrigger value="article" data-testid="tab-articles">
            Articles ({articlesByType.article.length})
          </TabsTrigger>
          <TabsTrigger value="video" data-testid="tab-videos">
            Videos ({articlesByType.video.length})
          </TabsTrigger>
          <TabsTrigger value="reference" data-testid="tab-references">
            References ({articlesByType.reference.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {articlesByType.all.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No articles found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {articlesByType.all.map(renderArticle)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="article" className="space-y-4">
          {articlesByType.article.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No articles found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {articlesByType.article.map(renderArticle)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="video" className="space-y-4">
          {articlesByType.video.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Video className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No videos found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {articlesByType.video.map(renderArticle)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reference" className="space-y-4">
          {articlesByType.reference.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No references found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {articlesByType.reference.map(renderArticle)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedArticle && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  {getIcon(selectedArticle.type)}
                  <Badge variant="secondary" className="text-xs">
                    {selectedArticle.category}
                  </Badge>
                </div>
                <DialogTitle className="text-2xl">{selectedArticle.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <p className="text-muted-foreground">{selectedArticle.description}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{selectedArticle.readTime || selectedArticle.videoLength}</span>
                  <span>•</span>
                  <span className="capitalize">{selectedArticle.type}</span>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-foreground">
                    This is a preview of the {selectedArticle.type}. In a full implementation, 
                    this would display the complete article content, video player, or reference material.
                  </p>
                  <p className="text-foreground mt-4">
                    <strong>Category:</strong> {selectedArticle.category}
                  </p>
                  {selectedArticle.type === "video" && (
                    <div className="mt-4 bg-muted rounded-lg p-8 flex items-center justify-center">
                      <div className="text-center">
                        <Video className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">Video player would be displayed here</p>
                      </div>
                    </div>
                  )}
                  {selectedArticle.type === "article" && (
                    <div className="mt-4 space-y-3">
                      <p className="text-foreground">
                        Full article content would be displayed here with proper formatting, 
                        images, diagrams, and interactive elements for medical education.
                      </p>
                    </div>
                  )}
                  {selectedArticle.type === "reference" && (
                    <div className="mt-4">
                      <p className="text-foreground">
                        Reference materials including clinical guidelines, protocols, and 
                        evidence-based resources would be available here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
