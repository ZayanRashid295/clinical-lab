import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

interface System {
  id: string;
  name: string;
  count: number;
}

const systemGroups = [
  {
    category: "General Principles",
    systems: [
      { id: "biochem-general", name: "Biochemistry (General Principles)", count: 0 },
      { id: "genetics-general", name: "Genetics (General Principles)", count: 0 },
      { id: "micro-general", name: "Microbiology (General Principles)", count: 0 },
      { id: "path-general", name: "Pathology (General Principles)", count: 0 },
      { id: "pharm-general", name: "Pharmacology (General Principles)", count: 0 },
    ],
  },
  {
    category: "Clinical Sciences",
    systems: [
      { id: "biostats", name: "Biostatistics & Epidemiology", count: 0 },
      { id: "poisoning", name: "Poisoning & Environmental Exposure", count: 0 },
      { id: "psych", name: "Psychiatric/Behavioral & Substance Use Disorder", count: 0 },
      { id: "social", name: "Social Sciences (Ethics/Legal/Professional)", count: 0 },
      { id: "misc", name: "Miscellaneous (Multisystem)", count: 0 },
    ],
  },
  {
    category: "Organ Systems",
    systems: [
      { id: "allergy", name: "Allergy & Immunology", count: 0 },
      { id: "cardio", name: "Cardiovascular System", count: 0 },
      { id: "derm", name: "Dermatology", count: 0 },
      { id: "ent", name: "Ear, Nose & Throat (ENT)", count: 0 },
      { id: "endo", name: "Endocrine, Diabetes & Metabolism", count: 0 },
      { id: "female-repro", name: "Female Reproductive System & Breast", count: 0 },
      { id: "gi", name: "Gastrointestinal & Nutrition", count: 0 },
      { id: "heme-onc", name: "Hematology & Oncology", count: 0 },
      { id: "infectious", name: "Infectious Diseases", count: 0 },
      { id: "male-repro", name: "Male Reproductive System", count: 0 },
      { id: "neuro", name: "Nervous System", count: 0 },
      { id: "ophtho", name: "Ophthalmology", count: 0 },
      { id: "preg", name: "Pregnancy, Childbirth & Puerperium", count: 0 },
      { id: "pulm", name: "Pulmonary & Critical Care", count: 0 },
      { id: "renal", name: "Renal, Urinary Systems & Electrolytes", count: 0 },
      { id: "rheum", name: "Rheumatology/Orthopedics & Sports", count: 0 },
    ],
  },
];

interface SystemSelectorProps {
  selectedSystems: string[];
  onSystemToggle: (systemId: string) => void;
}

export function SystemSelector({ selectedSystems, onSystemToggle }: SystemSelectorProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const handleExpandAll = () => {
    const allItems = systemGroups.map((_, idx) => `item-${idx}`);
    setExpandedItems(expandedItems.length === allItems.length ? [] : allItems);
  };

  return (
    <Card data-testid="card-systems">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Systems</h3>
            <Button variant="ghost" size="sm" onClick={handleExpandAll} data-testid="button-expand-all">
              {expandedItems.length === systemGroups.length ? "Collapse All" : "Expand All"}
            </Button>
          </div>

          <ScrollArea className="h-[400px] pr-4">
            <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems} className="space-y-2">
              {systemGroups.map((group, idx) => (
                <AccordionItem key={idx} value={`item-${idx}`} className="border rounded-lg px-3">
                  <AccordionTrigger className="hover:no-underline py-3" data-testid={`accordion-${group.category.toLowerCase().replace(/\s+/g, '-')}`}>
                    <span className="font-medium text-sm">{group.category}</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pt-2 pb-3">
                      {group.systems.map((system) => (
                        <div
                          key={system.id}
                          className="flex items-center justify-between p-2 rounded-md hover-elevate"
                        >
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              id={system.id}
                              checked={selectedSystems.includes(system.id)}
                              onCheckedChange={() => onSystemToggle(system.id)}
                              data-testid={`checkbox-${system.id}`}
                            />
                            <Label htmlFor={system.id} className="cursor-pointer font-normal text-sm">
                              {system.name}
                            </Label>
                          </div>
                          <span className="text-sm font-mono text-muted-foreground tabular-nums">
                            {system.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
