import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { QueryProductDto } from "./dto/query-product.dto";
import { QueryProductSubtypeDto } from "./dto/query-product-subtype.dto";
import { CreateProductSubtypeDto } from "./dto/create-product-subtype.dto";
import { UpdateProductSubtypeDto } from "./dto/update-product-subtype.dto";

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  private get productInclude() {
    return {
      category: { select: { id: true, name: true, slug: true } },
      productSubtypes: true,
      _count: { select: { systems: true, productSubtypes: true } },
    };
  }

  async findAll(query: QueryProductDto) {
    try {
      const {
        search, status, dateFrom, dateTo,
        page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc",
      } = query;

      const where: any = {};
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }
      if (status) where.isActive = status === "ACTIVE";
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo);
      }

      const total = await this.prisma.product.count({ where });
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      if (query.listAll) {
        const products = await this.prisma.product.findMany({
          where, include: this.productInclude, orderBy,
        });
        return {
          data: products,
          pagination: { page: 1, limit: total, total, totalPages: 1 },
        };
      }

      const skip = (page - 1) * limit;
      const products = await this.prisma.product.findMany({
        where, include: this.productInclude, skip, take: limit, orderBy,
      });
      return {
        data: products,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  }

  async findAllLegacy(isActive?: boolean) {
    const where = isActive !== undefined ? { isActive } : {};
    return this.prisma.product.findMany({
      where, include: this.productInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  async getStats() {
    const total = await this.prisma.product.count();
    const active = await this.prisma.product.count({ where: { isActive: true } });
    const inactive = await this.prisma.product.count({ where: { isActive: false } });
    return { total, active, inactive };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        systems: {
          include: { _count: { select: { topics: true } } },
          orderBy: { order: "asc" },
        },
        productSubtypes: true,
        _count: { select: { systems: true, productSubtypes: true } },
      },
    });
    if (!product) throw new NotFoundException(`Product with ID ${id} not found`);
    return product;
  }

  async getProductSystems(id: string, isActive?: boolean) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`Product with ID ${id} not found`);

    const where: any = { productId: id };
    if (isActive !== undefined) where.isActive = isActive;

    return this.prisma.system.findMany({
      where,
      include: { _count: { select: { topics: true } } },
      orderBy: { order: "asc" },
    });
  }

  async getProductSubtypes(id: string, isActive?: boolean) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`Product with ID ${id} not found`);

    const where: any = { productId: id };
    if (isActive !== undefined) where.isActive = isActive;

    return this.prisma.productSubtype.findMany({
      where,
      include: {
        subscriptionPackages: {
          include: {
            subscriptionFeatures: { include: { packageFeature: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  async getProductStructure(id: string, isActive?: boolean) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`Product with ID ${id} not found`);

    const systemWhere: any = { productId: id };
    if (isActive !== undefined) systemWhere.isActive = isActive;
    const subtopicWhere = isActive !== undefined ? { isActive } : {};

    return this.prisma.system.findMany({
      where: systemWhere,
      include: {
        topics: {
          where: isActive !== undefined ? { isActive } : {},
          include: {
            subtopics: {
              where: subtopicWhere,
              include: { _count: { select: { questions: true } } },
              orderBy: { order: "asc" },
            },
            _count: { select: { subtopics: true } },
          },
          orderBy: { order: "asc" },
        },
        _count: { select: { topics: true } },
      },
      orderBy: { order: "asc" },
    });
  }

  async create(createProductDto: CreateProductDto) {
    const { categoryId, ...productData } = createProductDto;
    return this.prisma.product.create({
      data: {
        ...productData,
        category: categoryId ? { connect: { id: categoryId } } : undefined,
      },
      include: this.productInclude,
    });
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`Product with ID ${id} not found`);

    const { categoryId, ...productData } = updateProductDto;
    return this.prisma.product.update({
      where: { id },
      data: {
        ...productData,
        category: categoryId !== undefined
          ? categoryId
            ? { connect: { id: categoryId } }
            : { disconnect: true }
          : undefined,
      },
      include: this.productInclude,
    });
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`Product with ID ${id} not found`);
    return this.prisma.product.update({ where: { id }, data: { isActive: false } });
  }

  /**
   * Deletes a question and all dependent rows (choices, blocks, paper links).
   * Used for product/category cascades where relationMode=prisma may not DB-cascade.
   */
  async deleteQuestionGraphInTx(tx: Prisma.TransactionClient, questionId: string): Promise<void> {
    const exists = await tx.question.findUnique({ where: { id: questionId } });
    if (!exists) return;

    await tx.questionChoice.deleteMany({ where: { questionId } });
    await tx.questionStemBlock.deleteMany({ where: { questionId } });

    const perAnswers = await tx.perAnswerExplanation.findMany({
      where: { questionId },
      select: { id: true },
    });
    for (const pa of perAnswers) {
      await tx.explanationBlock.deleteMany({ where: { perAnswerId: pa.id } });
    }
    await tx.perAnswerExplanation.deleteMany({ where: { questionId } });
    await tx.explanationBlock.deleteMany({ where: { questionId } });

    await tx.questionPaperQuestion.deleteMany({ where: { questionId } });

    await tx.question.delete({ where: { id: questionId } });
  }

  private async deleteSubtopicTreeInTx(tx: Prisma.TransactionClient, subtopicId: string): Promise<void> {
    const questions = await tx.question.findMany({
      where: { subtopicId },
      select: { id: true },
    });
    for (const { id: qid } of questions) {
      await this.deleteQuestionGraphInTx(tx, qid);
    }
    await tx.subtopic.delete({ where: { id: subtopicId } });
  }

  private async deleteTopicTreeInTx(tx: Prisma.TransactionClient, topicId: string): Promise<void> {
    const subtopics = await tx.subtopic.findMany({
      where: { topicId },
      select: { id: true },
    });
    for (const { id: sid } of subtopics) {
      await this.deleteSubtopicTreeInTx(tx, sid);
    }
    const topicQuestions = await tx.question.findMany({
      where: { topicId },
      select: { id: true },
    });
    for (const { id: qid } of topicQuestions) {
      await this.deleteQuestionGraphInTx(tx, qid);
    }
    await tx.topic.delete({ where: { id: topicId } });
  }

  private async deleteSystemTreeInTx(tx: Prisma.TransactionClient, systemId: string): Promise<void> {
    const topics = await tx.topic.findMany({
      where: { systemId },
      select: { id: true },
    });
    for (const { id: tid } of topics) {
      await this.deleteTopicTreeInTx(tx, tid);
    }
    const systemQuestions = await tx.question.findMany({
      where: { systemId },
      select: { id: true },
    });
    for (const { id: qid } of systemQuestions) {
      await this.deleteQuestionGraphInTx(tx, qid);
    }
    await tx.system.delete({ where: { id: systemId } });
  }

  /**
   * Removes subtypes, their packages, user subscriptions, and linked payments so the product can be deleted.
   */
  private async deleteProductSubtypeCommercialChainInTx(
    tx: Prisma.TransactionClient,
    productId: string,
  ): Promise<void> {
    const subtypes = await tx.productSubtype.findMany({
      where: { productId },
      select: { id: true },
    });
    const subtypeIds = subtypes.map((s) => s.id);
    if (subtypeIds.length === 0) return;

    const packages = await tx.subscriptionPackage.findMany({
      where: { productSubtypeId: { in: subtypeIds } },
      select: { id: true },
    });
    const packageIds = packages.map((p) => p.id);

    if (packageIds.length > 0) {
      const subscriptions = await tx.subscription.findMany({
        where: { subscriptionPackageId: { in: packageIds } },
        select: { id: true },
      });
      const subscriptionIds = subscriptions.map((s) => s.id);

      if (subscriptionIds.length > 0) {
        const payments = await tx.payment.findMany({
          where: { subscriptionId: { in: subscriptionIds } },
          select: { id: true },
        });
        const paymentIds = payments.map((p) => p.id);
        if (paymentIds.length > 0) {
          await tx.promoCodeUsage.deleteMany({ where: { paymentId: { in: paymentIds } } });
          await tx.walletTransaction.deleteMany({ where: { paymentId: { in: paymentIds } } });
          await tx.refund.deleteMany({ where: { paymentId: { in: paymentIds } } });
          await tx.payment.deleteMany({ where: { id: { in: paymentIds } } });
        }
        await tx.subscription.deleteMany({ where: { id: { in: subscriptionIds } } });
      }
      await tx.subscriptionFeatures.deleteMany({
        where: { subscriptionPackageId: { in: packageIds } },
      });
      await tx.subscriptionPackage.deleteMany({ where: { id: { in: packageIds } } });
    }

    await tx.productSubtype.deleteMany({ where: { id: { in: subtypeIds } } });
  }

  /**
   * Permanently removes a product and all nested systems → topics → subtopics → questions → choices (etc.).
   */
  async deleteProductTreeInTx(tx: Prisma.TransactionClient, productId: string): Promise<void> {
    const systems = await tx.system.findMany({
      where: { productId },
      select: { id: true },
    });
    for (const { id: sid } of systems) {
      await this.deleteSystemTreeInTx(tx, sid);
    }

    const productQuestions = await tx.question.findMany({
      where: { productId },
      select: { id: true },
    });
    for (const { id: qid } of productQuestions) {
      await this.deleteQuestionGraphInTx(tx, qid);
    }

    await this.deleteProductSubtypeCommercialChainInTx(tx, productId);
    await tx.product.delete({ where: { id: productId } });
  }

  async removePermanent(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`Product with ID ${id} not found`);
    try {
      await this.prisma.$transaction(async (tx) => {
        await this.deleteProductTreeInTx(tx, id);
      });
      return { message: "Product permanently deleted with all nested content" };
    } catch (e: any) {
      if (e?.code === "P2003" || e?.code === "P2014") {
        throw new ConflictException(
          "Cannot delete this product while it is still referenced outside the content tree (e.g. subscriptions).",
        );
      }
      throw e;
    }
  }

  // ========== PRODUCT SUBTYPES ==========
  async findAllSubtypes(query: QueryProductSubtypeDto) {
    try {
      const {
        search, status, productId, dateFrom, dateTo,
        page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc",
      } = query;

      const where: any = {};
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }
      if (status) where.isActive = status === "ACTIVE";
      if (productId) where.productId = productId;
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo);
      }

      const total = await this.prisma.productSubtype.count({ where });
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      const include = {
        product: { select: { id: true, name: true } },
        subscriptionPackages: { select: { id: true, name: true } },
      };

      if (query.listAll) {
        const subtypes = await this.prisma.productSubtype.findMany({ where, include, orderBy });
        return {
          data: subtypes,
          pagination: { page: 1, limit: total, total, totalPages: 1 },
        };
      }

      const skip = (page - 1) * limit;
      const subtypes = await this.prisma.productSubtype.findMany({ where, include, skip, take: limit, orderBy });
      return {
        data: subtypes,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      console.error("Error fetching product subtypes:", error);
      throw error;
    }
  }

  async getSubtype(id: string) {
    const subtype = await this.prisma.productSubtype.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, name: true } },
        subscriptionPackages: {
          include: { subscriptionFeatures: { include: { packageFeature: true } } },
        },
      },
    });
    if (!subtype) throw new NotFoundException(`Product subtype with ID ${id} not found`);
    return subtype;
  }

  async createSubtype(createSubtypeDto: CreateProductSubtypeDto) {
    return this.prisma.productSubtype.create({
      data: createSubtypeDto,
      include: { product: { select: { id: true, name: true } } },
    });
  }

  async updateSubtype(id: string, updateSubtypeDto: UpdateProductSubtypeDto) {
    const subtype = await this.prisma.productSubtype.findUnique({ where: { id } });
    if (!subtype) throw new NotFoundException(`Product subtype with ID ${id} not found`);
    return this.prisma.productSubtype.update({
      where: { id }, data: updateSubtypeDto,
      include: { product: { select: { id: true, name: true } } },
    });
  }

  async removeSubtype(id: string) {
    const subtype = await this.prisma.productSubtype.findUnique({ where: { id } });
    if (!subtype) throw new NotFoundException(`Product subtype with ID ${id} not found`);
    return this.prisma.productSubtype.update({ where: { id }, data: { isActive: false } });
  }

  async removeSubtypePermanent(id: string) {
    const subtype = await this.prisma.productSubtype.findUnique({ where: { id } });
    if (!subtype) throw new NotFoundException(`Product subtype with ID ${id} not found`);
    try {
      await this.prisma.productSubtype.delete({ where: { id } });
      return { message: "Product subtype permanently deleted" };
    } catch (e: any) {
      if (e?.code === "P2003" || e?.code === "P2014") {
        throw new ConflictException(
          "Cannot delete this subtype while subscriptions or other records still reference it.",
        );
      }
      throw e;
    }
  }

  async getSubtypeStats() {
    const total = await this.prisma.productSubtype.count();
    const active = await this.prisma.productSubtype.count({ where: { isActive: true } });
    const inactive = await this.prisma.productSubtype.count({ where: { isActive: false } });
    return { total, active, inactive };
  }
}
