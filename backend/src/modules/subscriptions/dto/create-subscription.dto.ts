import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsBoolean, IsDateString } from "class-validator";

export class CreateSubscriptionDto {
  @ApiProperty({
    description: "User ID",
    example: "cmguoh2b30000lj45cqti52mx",
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: "Subscription package ID",
    example: "cmguoh2b30000lj45cqti52mx",
  })
  @IsString()
  subscriptionPackageId: string;

  @ApiProperty({
    description: "Subscription status",
    example: "ACTIVE",
    enum: ["ACTIVE", "EXPIRED", "CANCELLED", "SUSPENDED", "PENDING"],
    default: "ACTIVE",
    required: false,
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({
    description: "Subscription start date",
    example: "2025-01-01T00:00:00.000Z",
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: "Subscription end date",
    example: "2025-12-31T23:59:59.999Z",
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: "Whether subscription auto-renews",
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;
}
