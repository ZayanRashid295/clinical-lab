import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { ProductsService } from "./products.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { QueryProductDto } from "./dto/query-product.dto";
import { QueryProductTagDto } from "./dto/query-product-tag.dto";
import { QueryProductSubtypeDto } from "./dto/query-product-subtype.dto";
import { CreateProductTagDto } from "./dto/create-product-tag.dto";
import { UpdateProductTagDto } from "./dto/update-product-tag.dto";
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
  @ApiOperation({
    summary: "Get all products with filtering, pagination, and sorting",
  })
  @ApiResponse({ status: 200, description: "Products retrieved successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async findAll(@Query() query: QueryProductDto) {
    return this.productsService.findAll(query);
  }

  @Get("stats")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get product statistics" })
  @ApiResponse({
    status: 200,
    description: "Product statistics retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  getStats() {
    return this.productsService.getStats();
  }

  // ========== PRODUCT TAGS ==========
  @Get("tags")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get all product tags with filtering, pagination, and sorting",
  })
  @ApiResponse({ status: 200, description: "Tags retrieved successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async findAllTags(@Query() query: QueryProductTagDto) {
    return this.productsService.findAllTags(query);
  }

  @Get("tags/stats")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get product tag statistics" })
  @ApiResponse({
    status: 200,
    description: "Tag statistics retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  getTagStats() {
    return this.productsService.getTagStats();
  }

  @Get("tags/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get tag by ID" })
  @ApiResponse({ status: 200, description: "Tag retrieved successfully" })
  @ApiResponse({ status: 404, description: "Tag not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getTag(@Param("id") id: string) {
    return this.productsService.getTag(id);
  }

  @Post("tags")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create new product tag (Admin only)" })
  @ApiResponse({ status: 201, description: "Tag created successfully" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async createTag(@Body() createTagDto: CreateProductTagDto) {
    return this.productsService.createTag(createTagDto);
  }

  @Patch("tags/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update product tag (Admin only)" })
  @ApiResponse({ status: 200, description: "Tag updated successfully" })
  @ApiResponse({ status: 404, description: "Tag not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async updateTag(
    @Param("id") id: string,
    @Body() updateTagDto: UpdateProductTagDto
  ) {
    return this.productsService.updateTag(id, updateTagDto);
  }

  @Delete("tags/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Deactivate product tag (Admin only)" })
  @ApiResponse({ status: 200, description: "Tag deactivated successfully" })
  @ApiResponse({ status: 404, description: "Tag not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async removeTag(@Param("id") id: string) {
    return this.productsService.removeTag(id);
  }

  // ========== PRODUCT SUBTYPES ==========
  @Get("subtypes")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get all product subtypes with filtering, pagination, and sorting",
  })
  @ApiResponse({
    status: 200,
    description: "Subtypes retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async findAllSubtypes(@Query() query: QueryProductSubtypeDto) {
    return this.productsService.findAllSubtypes(query);
  }

  @Get("subtypes/stats")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get product subtype statistics" })
  @ApiResponse({
    status: 200,
    description: "Subtype statistics retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  getSubtypeStats() {
    return this.productsService.getSubtypeStats();
  }

  @Get("subtypes/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get subtype by ID" })
  @ApiResponse({
    status: 200,
    description: "Subtype retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Subtype not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getSubtype(@Param("id") id: string) {
    return this.productsService.getSubtype(id);
  }

  @Post("subtypes")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create new product subtype (Admin only)" })
  @ApiResponse({
    status: 201,
    description: "Subtype created successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async createSubtype(@Body() createSubtypeDto: CreateProductSubtypeDto) {
    return this.productsService.createSubtype(createSubtypeDto);
  }

  @Patch("subtypes/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update product subtype (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Subtype updated successfully",
  })
  @ApiResponse({ status: 404, description: "Subtype not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async updateSubtype(
    @Param("id") id: string,
    @Body() updateSubtypeDto: UpdateProductSubtypeDto
  ) {
    return this.productsService.updateSubtype(id, updateSubtypeDto);
  }

  @Delete("subtypes/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Deactivate product subtype (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Subtype deactivated successfully",
  })
  @ApiResponse({ status: 404, description: "Subtype not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async removeSubtype(@Param("id") id: string) {
    return this.productsService.removeSubtype(id);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get product by ID" })
  @ApiResponse({ status: 200, description: "Product retrieved successfully" })
  @ApiResponse({ status: 404, description: "Product not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async findOne(@Param("id") id: string) {
    return this.productsService.findOne(id);
  }

  @Get(":id/sections")
  @ApiOperation({ summary: "Get all sections for a product" })
  @ApiResponse({ status: 200, description: "Sections retrieved successfully" })
  @ApiResponse({ status: 404, description: "Product not found" })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  async getProductSections(
    @Param("id") id: string,
    @Query("isActive") isActive?: boolean
  ) {
    return this.productsService.getProductSections(id, isActive);
  }

  @Get(":id/subtypes")
  @ApiOperation({ summary: "Get all subtypes for a product" })
  @ApiResponse({ status: 200, description: "Subtypes retrieved successfully" })
  @ApiResponse({ status: 404, description: "Product not found" })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  async getProductSubtypes(
    @Param("id") id: string,
    @Query("isActive") isActive?: boolean
  ) {
    return this.productsService.getProductSubtypes(id, isActive);
  }

  @Get(":id/tags")
  @ApiOperation({ summary: "Get all tags for a product" })
  @ApiResponse({ status: 200, description: "Tags retrieved successfully" })
  @ApiResponse({ status: 404, description: "Product not found" })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  async getProductTags(
    @Param("id") id: string,
    @Query("isActive") isActive?: boolean
  ) {
    return this.productsService.getProductTags(id, isActive);
  }

  @Get(":id/structure")
  @ApiOperation({
    summary: "Get complete product structure (sections, chapters, topics)",
  })
  @ApiResponse({
    status: 200,
    description: "Product structure retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Product not found" })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  async getProductStructure(
    @Param("id") id: string,
    @Query("isActive") isActive?: boolean
  ) {
    return this.productsService.getProductStructure(id, isActive);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create new product (Admin only)" })
  @ApiResponse({ status: 201, description: "Product created successfully" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update product (Admin only)" })
  @ApiResponse({ status: 200, description: "Product updated successfully" })
  @ApiResponse({ status: 404, description: "Product not found" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async update(
    @Param("id") id: string,
    @Body() updateProductDto: UpdateProductDto
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Deactivate product (Admin only)" })
  @ApiResponse({ status: 200, description: "Product deactivated successfully" })
  @ApiResponse({ status: 404, description: "Product not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async remove(@Param("id") id: string) {
    return this.productsService.remove(id);
  }
}
