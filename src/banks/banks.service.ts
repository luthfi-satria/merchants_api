// import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// // import { ListBankDocument } from 'src/database/entities/list_banks';
// import { ListResponse, RMessage } from 'src/response/response.interface';
// import { Repository } from 'typeorm';
// import { ResponseService } from 'src/response/response.service';

// @Injectable()
// export class BanksService {
//   constructor(
//     // @InjectRepository(ListBankDocument)
//     // private readonly bankRepository: Repository<ListBankDocument>,
//     private readonly responseService: ResponseService,
//   ) {}

//   async listBanks(data: Record<string, any>): Promise<Record<string, any>> {
//     let search = data.search || '';
//     search = search.toLowerCase();
//     const currentPage = data.page || 1;
//     const perPage = data.limit || 10;
//     let totalItems: number;
//     return await this.bankRepository
//       .createQueryBuilder('merchant_list_banks')
//       .select('*')
//       .where('lower(bank_code) like :bcode', { bcode: '%' + search + '%' })
//       .orWhere('lower(bank_name) like :bname', {
//         bname: '%' + search + '%',
//       })
//       .getCount()
//       .then(async (counts) => {
//         totalItems = counts;
//         return await this.bankRepository
//           .createQueryBuilder('merchant_list_banks')
//           .select('*')
//           .where('lower(bank_code) like :bcode', { bcode: '%' + search + '%' })
//           .orWhere('lower(bank_name) like :bname', {
//             bname: '%' + search + '%',
//           })
//           .orderBy('bank_code')
//           .offset((currentPage - 1) * perPage)
//           .limit(perPage)
//           .getRawMany();
//       })
//       .then((result) => {
//         const list_result: ListResponse = {
//           total_item: totalItems,
//           limit: Number(perPage),
//           current_page: Number(currentPage),
//           items: result,
//         };
//         return list_result;
//       })
//       .catch((err) => {
//         const errors: RMessage = {
//           value: '',
//           property: '',
//           constraint: [err.message],
//         };
//         throw new BadRequestException(
//           this.responseService.error(
//             HttpStatus.BAD_REQUEST,
//             errors,
//             'Bad Request',
//           ),
//         );
//       });
//   }

//   async findBankById(id: string): Promise<ListBankDocument> {
//     return await this.bankRepository.findOne({ id: id });
//   }
// }
