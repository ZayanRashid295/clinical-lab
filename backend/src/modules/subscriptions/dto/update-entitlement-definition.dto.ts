import { PartialType } from "@nestjs/swagger";
import { CreateEntitlementDefinitionDto } from "./create-entitlement-definition.dto";

export class UpdateEntitlementDefinitionDto extends PartialType(
  CreateEntitlementDefinitionDto
) {}

