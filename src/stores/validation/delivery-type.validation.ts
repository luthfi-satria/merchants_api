import { IsNotEmpty, IsEnum } from 'class-validator';
import { enumDeliveryType } from 'src/database/entities/store.entity';

export class DeliveryTypeValidation {
  @IsNotEmpty()
  @IsEnum(enumDeliveryType, {
    message: `Value yang diterima hanya enum ${enumDeliveryType.delivery_only} atau ${enumDeliveryType.delivery_and_pickup}`,
  })
  delivery_type: enumDeliveryType;
}
