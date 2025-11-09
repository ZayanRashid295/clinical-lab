import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateTagDto } from "./dto/create-tag.dto";
import { UpdateTagDto } from "./dto/update-tag.dto";

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async findAll(isActive?: boolean) {
    const where = isActive !== undefined ? { isActive } : {};

    return this.prisma.productTag.findMany({
      where,
      include: {
        _count: {
          select: {
            questions: true,
            products: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  async findOne(id: string) {
    const tag = await this.prisma.productTag.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
            name: true,
          },
        },
        questions: {
          include: {
            topic: {
              include: {
                chapter: {
                  include: {
                    section: {
                      include: {
                        product: {
                          select: {
                            id: true,
                            name: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10, // Limit to recent questions
        },
        _count: {
          select: {
            questions: true,
            products: true,
          },
        },
      },
    });

    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }

    return tag;
  }

  async getTagQuestions(
    id: string,
    isActive?: boolean,
    limit?: number,
    offset?: number
  ) {
    // First check if tag exists
    const tag = await this.prisma.productTag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }

    const where: any = { productTagId: id };
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [questions, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        include: {
          choices: {
            orderBy: {
              order: "asc",
            },
          },
          topic: {
            include: {
              chapter: {
                include: {
                  section: {
                    include: {
                      product: {
                        select: {
                          id: true,
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        skip: offset,
      }),
      this.prisma.question.count({ where }),
    ]);

    return {
      questions,
      total,
      limit,
      offset,
    };
  }

  async create(createTagDto: CreateTagDto) {
    return this.prisma.productTag.create({
      data: createTagDto,
      include: {
        _count: {
          select: {
            questions: true,
            products: true,
          },
        },
      },
    });
  }

  async update(id: string, updateTagDto: UpdateTagDto) {
    const tag = await this.prisma.productTag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }

    return this.prisma.productTag.update({
      where: { id },
      data: updateTagDto,
      include: {
        _count: {
          select: {
            questions: true,
            products: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const tag = await this.prisma.productTag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }

    return this.prisma.productTag.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
