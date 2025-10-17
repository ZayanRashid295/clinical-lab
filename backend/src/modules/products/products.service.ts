import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(isActive?: boolean) {
    const where = isActive !== undefined ? { isActive } : {};

    return this.prisma.product.findMany({
      where,
      include: {
        productTags: true,
        productSubtypes: true,
        _count: {
          select: {
            sections: true,
            productTags: true,
            productSubtypes: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        productTags: true,
        productSubtypes: true,
        sections: {
          include: {
            _count: {
              select: {
                chapters: true,
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
        _count: {
          select: {
            sections: true,
            productTags: true,
            productSubtypes: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async getProductSections(id: string, isActive?: boolean) {
    // First check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const where = {
      productId: id,
      ...(isActive !== undefined ? { isActive } : {}),
    };

    return this.prisma.section.findMany({
      where,
      include: {
        _count: {
          select: {
            chapters: true,
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    });
  }

  async getProductSubtypes(id: string, isActive?: boolean) {
    // First check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const where = {
      productId: id,
      ...(isActive !== undefined ? { isActive } : {}),
    };

    return this.prisma.productSubtype.findMany({
      where,
      include: {
        subscriptionPackages: {
          include: {
            subscriptionFeatures: {
              include: {
                packageFeature: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  async getProductTags(id: string, isActive?: boolean) {
    // First check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const where = {
      products: {
        some: {
          id: id,
        },
      },
      ...(isActive !== undefined ? { isActive } : {}),
    };

    return this.prisma.productTag.findMany({
      where,
      include: {
        _count: {
          select: {
            questions: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  async getProductStructure(id: string, isActive?: boolean) {
    // First check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const sectionWhere = {
      productId: id,
      ...(isActive !== undefined ? { isActive } : {}),
    };

    const chapterWhere = isActive !== undefined ? { isActive } : {};
    const topicWhere = isActive !== undefined ? { isActive } : {};

    return this.prisma.section.findMany({
      where: sectionWhere,
      include: {
        chapters: {
          where: chapterWhere,
          include: {
            topics: {
              where: topicWhere,
              include: {
                _count: {
                  select: {
                    questions: true,
                  },
                },
              },
              orderBy: {
                order: "asc",
              },
            },
            _count: {
              select: {
                topics: true,
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
        _count: {
          select: {
            chapters: true,
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    });
  }

  async create(createProductDto: CreateProductDto) {
    return this.prisma.product.create({
      data: createProductDto,
      include: {
        productTags: true,
        productSubtypes: true,
      },
    });
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    // First check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
      include: {
        productTags: true,
        productSubtypes: true,
      },
    });
  }

  async remove(id: string) {
    // First check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Soft delete by setting isActive to false
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
