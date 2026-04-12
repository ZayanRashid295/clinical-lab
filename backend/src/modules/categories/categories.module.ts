import { Module } from "@nestjs/common";
import { CategoriesService } from "./categories.service";
import { CategoriesController } from "./categories.controller";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { ProductsModule } from "../products/products.module";

@Module({
  imports: [PrismaModule, ProductsModule],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
