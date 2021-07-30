import { Global, Module } from '@nestjs/common';
import { HashService } from 'src/hash/hash.service';
// import { CustomersModule } from 'src/customers/customers.module';

@Global()
@Module({
  providers: [
    {
      provide: 'HashService',
      useClass: HashService,
    },
  ],
  exports: [HashService],
  imports: [],
})
export class HashModule {}
