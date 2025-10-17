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

@ApiTags("products")
@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: "Get all products" })
  @ApiResponse({ status: 200, description: "Products retrieved successfully" })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  async findAll(@Query("isActive") isActive?: boolean) {
    return this.productsService.findAll(isActive);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get product by ID" })
  @ApiResponse({ status: 200, description: "Product retrieved successfully" })
  @ApiResponse({ status: 404, description: "Product not found" })
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
