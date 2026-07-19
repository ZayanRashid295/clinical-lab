import React from "react";
import { MenuSystem } from "../../src/shared";
import { appContentRegistry } from "../../src/app/config/content.registry";

export default function MenuManagerPage() {
  return (
    <MenuSystem
      contentRegistry={appContentRegistry}
      applicationTitle="MedPrepAI"
    />
  );
}
