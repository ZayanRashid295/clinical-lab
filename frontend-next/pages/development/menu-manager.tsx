import React from "react";
import { MenuSystem } from "../../src/shared";
import { transportationContentRegistry } from "../../src/app/config/content.registry";

export default function MenuManagerPage() {
  return (
    <MenuSystem
      contentRegistry={transportationContentRegistry}
      applicationTitle="Medical Lab"
    />
  );
}
