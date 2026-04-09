import {
  Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { CategoriesService } from "./categories.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { QueryCategoryDto } from "./dto/query-category.dto";

@ApiTags("categories")
@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get("public")
  @ApiOperation({ summary: "Get all active categories with their products (public, no auth)" })
  @ApiResponse({ status: 200, description: "Public categories retrieved successfully" })
  async findAllPublic() {
    return this.categoriesService.findAllPublic();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all categories with filtering, pagination, and sorting" })
  @ApiResponse({ status: 200, description: "Categories retrieved successfully" })
  async findAll(@Query() query: QueryCategoryDto) {
    return this.categoriesService.findAll(query);
  }

  @Get("stats")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get category statistics" })
  getStats() {
    return this.categoriesService.getStats();
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get category by ID" })
  async findOne(@Param("id") id: string) {
    return this.categoriesService.findOne(id);
  }

  @Get(":id/products")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all products for a category" })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  async getProducts(@Param("id") id: string, @Query("isActive") isActive?: boolean) {
    return this.categoriesService.getProducts(id, isActive);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create new category" })
  async create(@Body() createDto: CreateCategoryDto) {
    return this.categoriesService.create(createDto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update category" })
  async update(@Param("id") id: string, @Body() updateDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Deactivate category" })
  async remove(@Param("id") id: string) {
    return this.categoriesService.remove(id);
  }
}
