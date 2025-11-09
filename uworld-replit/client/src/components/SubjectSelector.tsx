import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Subject {
  id: string;
  name: string;
  count: number;
}

const subjects: Subject[] = [
  { id: "anatomy", name: "Anatomy", count: 313 },
  { id: "behavioral", name: "Behavioral science", count: 261 },
  { id: "biochemistry", name: "Biochemistry", count: 164 },
  { id: "biostatistics", name: "Biostatistics", count: 121 },
  { id: "embryology", name: "Embryology", count: 77 },
  { id: "genetics", name: "Genetics", count: 109 },
  { id: "histology", name: "Histology", count: 29 },
  { id: "immunology", name: "Immunology", count: 132 },
  { id: "microbiology", name: "Microbiology", count: 352 },
  { id: "pathology", name: "Pathology", count: 850 },
  { id: "pathophysiology", name: "Pathophysiology", count: 493 },
  { id: "pharmacology", name: "Pharmacology", count: 553 },
  { id: "physiology", name: "Physiology", count: 278 },
];

interface SubjectSelectorProps {
  selectedSubjects: string[];
  onSubjectToggle: (subjectId: string) => void;
}

export function SubjectSelector({ selectedSubjects, onSubjectToggle }: SubjectSelectorProps) {
  return (
    <Card data-testid="card-subjects">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-1">Subjects</h3>
            <p className="text-xs text-muted-foreground">
              Some questions may be shared across shelf subjects.
            </p>
          </div>

          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {subjects.map((subject) => (
                <div
                  key={subject.id}
                  className="flex items-center justify-between p-2 rounded-md hover-elevate"
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={subject.id}
                      checked={selectedSubjects.includes(subject.id)}
                      onCheckedChange={() => onSubjectToggle(subject.id)}
                      data-testid={`checkbox-${subject.id}`}
                    />
                    <Label htmlFor={subject.id} className="cursor-pointer font-normal">
                      {subject.name}
                    </Label>
                  </div>
                  <span className="text-sm font-mono text-muted-foreground tabular-nums">
                    {subject.count}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
