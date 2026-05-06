import { Injectable } from "@nestjs/common";
import { MEDPREP_MODES } from "./medprep-modes";

@Injectable()
export class MedprepAiService {
  getModes() {
    return {
      modes: MEDPREP_MODES.map((m) => ({
        id: m.id,
        title: m.title,
        heroHeadline: m.heroHeadline,
        summary: m.summary,
        highlights: m.highlights,
        ctaLabel: m.ctaLabel,
        standaloneAppPath: m.standaloneAppPath,
      })),
    };
  }
}
