import { PartialType } from "@nestjs/swagger";
import { CreateProductSubtypeDto } from "./create-product-subtype.dto";

export class UpdateProductSubtypeDto extends PartialType(CreateProductSubtypeDto) {}

