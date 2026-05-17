import React from "react";
import { MenuSystem } from "../../src/shared";
import { transportationContentRegistry } from "../../src/app/config/content.registry";

export default function RefDesignPage() {
  return (
    <MenuSystem
      contentRegistry={transportationContentRegistry}
      applicationTitle="MedPrepAI"
    />
  );
}

