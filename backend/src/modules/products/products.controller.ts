import {
  Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { ProductsService } from "./products.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { QueryProductDto } from "./dto/query-product.dto";
import { QueryProductSubtypeDto } from "./dto/query-product-subtype.dto";
import { CreateProductSubtypeDto } from "./dto/create-product-subtype.dto";
import { UpdateProductSubtypeDto } from "./dto/update-product-subtype.dto";

@ApiTags("products")
@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ========== PRODUCTS ==========
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all products with filtering, pagination, and sorting" })
  async findAll(@Query() query: QueryProductDto) {
    return this.productsService.findAll(query);
  }

  @Get("stats")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get product statistics" })
  getStats() {
    return this.productsService.getStats();
  }

  // ========== PRODUCT SUBTYPES ==========
  @Get("subtypes")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all product subtypes" })
  async findAllSubtypes(@Query() query: QueryProductSubtypeDto) {
    return this.productsService.findAllSubtypes(query);
  }

  @Get("subtypes/stats")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get product subtype statistics" })
  getSubtypeStats() {
    return this.productsService.getSubtypeStats();
  }

  @Get("subtypes/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get subtype by ID" })
  async getSubtype(@Param("id") id: string) {
    return this.productsService.getSubtype(id);
  }

  @Post("subtypes")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create new product subtype" })
  async createSubtype(@Body() createSubtypeDto: CreateProductSubtypeDto) {
    return this.productsService.createSubtype(createSubtypeDto);
  }

  @Patch("subtypes/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update product subtype" })
  async updateSubtype(@Param("id") id: string, @Body() updateSubtypeDto: UpdateProductSubtypeDto) {
    return this.productsService.updateSubtype(id, updateSubtypeDto);
  }

  @Delete("subtypes/permanent/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Permanently delete product subtype" })
  async removeSubtypePermanent(@Param("id") id: string) {
    return this.productsService.removeSubtypePermanent(id);
  }

  @Delete("subtypes/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Deactivate product subtype" })
  async removeSubtype(@Param("id") id: string) {
    return this.productsService.removeSubtype(id);
  }

  // ========== PRODUCT BY ID ==========
  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get product by ID" })
  async findOne(@Param("id") id: string) {
    return this.productsService.findOne(id);
  }

  @Get(":id/systems")
  @ApiOperation({ summary: "Get all systems for a product" })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  async getProductSystems(@Param("id") id: string, @Query("isActive") isActive?: boolean) {
    return this.productsService.getProductSystems(id, isActive);
  }

  @Get(":id/subtypes")
  @ApiOperation({ summary: "Get all subtypes for a product" })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  async getProductSubtypes(@Param("id") id: string, @Query("isActive") isActive?: boolean) {
    return this.productsService.getProductSubtypes(id, isActive);
  }

  @Get(":id/structure")
  @ApiOperation({ summary: "Get complete product structure (systems → topics → subtopics)" })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  async getProductStructure(@Param("id") id: string, @Query("isActive") isActive?: boolean) {
    return this.productsService.getProductStructure(id, isActive);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create new product" })
  async create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update product" })
  async update(@Param("id") id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete("permanent/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Permanently delete product" })
  async removePermanent(@Param("id") id: string) {
    return this.productsService.removePermanent(id);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Deactivate product" })
  async remove(@Param("id") id: string) {
    return this.productsService.remove(id);
  }
}
