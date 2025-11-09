import { PartialType } from "@nestjs/swagger";
import { CreatePackageFeatureDto } from "./create-package-feature.dto";

export class UpdatePackageFeatureDto extends PartialType(
  CreatePackageFeatureDto
) {}
