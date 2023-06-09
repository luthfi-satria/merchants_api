import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import moment from 'moment';
import ExcelJS from 'exceljs';
import { InjectRepository } from '@nestjs/typeorm';
import { StoreDocument } from 'src/database/entities/store.entity';
import { MenuOnlineDocument } from 'src/database/entities/menu_online.entity';
import { Repository } from 'typeorm';
import { ResponseService } from 'src/response/response.service';
import { MessageService } from 'src/message/message.service';
import { CityService } from 'src/common/services/admins/city.service';
import { ListReprotNewMerchantDTO } from './dto/report.dto';
import { Response } from 'express';
import { CatalogsService } from 'src/common/catalogs/catalogs.service';
import { NewMerchantEntity } from './repository/new-merchants.repository';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(StoreDocument)
    public readonly storeRepository: Repository<StoreDocument>,
    @InjectRepository(MenuOnlineDocument)
    public readonly menuOnlineRepository: Repository<MenuOnlineDocument>,
    private readonly responseService: ResponseService,
    private readonly messageService: MessageService,
    private readonly cityService: CityService,
    private readonly commonCatalogService: CatalogsService,
    private readonly newMerchantEntities: NewMerchantEntity,
  ) {}

  //** PROCCESS LIST */
  async processListNewMerchants(data: ListReprotNewMerchantDTO): Promise<any> {
    try {
      //** GET DATA FROM DATABASE */
      const raw = await this.newMerchantEntities.listNewMerchantsData(data);

      // Get City
      if (raw && raw.items.length > 0) {
        for (const rows in raw.items) {
          const city = await this.cityService.getCity(
            raw.items[rows].ms_city_id,
          );
          if (city) {
            raw.items[rows].ms_city_id = city;
          }
        }
      }
      return raw;
    } catch (error) {
      throw error;
    }
  }

  //** LIST NEW MERCHANTS */
  async listNewMerchants(data: ListReprotNewMerchantDTO): Promise<any> {
    const raw = await this.processListNewMerchants(data);
    //** EXECUTE QUERIES */
    try {
      return raw;
    } catch (error) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: '',
            constraint: [
              this.messageService.get('merchant.general.dataNotFound'),
            ],
          },
          'Bad Request',
        ),
      );
    }
  }

  //** GENERATE XLSX NEW MERCHANT STORES */
  async generateNewMerchantStores(
    data: ListReprotNewMerchantDTO,
    res: Response<any, Record<string, any>>,
  ): Promise<any> {
    try {
      //** CREATE COLUMN EXCEL */
      const columns = data.columns?.length
        ? data.columns
        : [
            'group_id',
            'group_name',
            'merchant_id',
            'merchant_name',
            'store_id',
            'store_name',
            'type',
            'store_phone',
            'city_id',
            'store_address',
            'categories',
            'pic_name',
            'pic_phone',
            'pic_email',
            'pic_profile_merchant',
            'store_banner',
            'store_created',
            'status',
            'store_updated',
            'store_approved',
          ];

      //** GET DATA FROM DATABASE */
      const raw = await this.processListNewMerchants(data);

      //** CREATE WORKBOOK */
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Efood';

      //** CREATE SHEETSEFOOD */
      let sheetEfood: ExcelJS.Worksheet;

      if (data.sheet_name && data.sheet_name !== '') {
        sheetEfood = workbook.addWorksheet('Data New Stores', {
          properties: { defaultColWidth: 20 },
        });
      } else {
        sheetEfood = workbook.addWorksheet('Data New Stores', {
          properties: { defaultColWidth: 20 },
        });
      }

      //** EFOOD COLUMN NAME */
      const sheetEfoodColumns: any[] = [];
      sheetEfoodColumns.push({
        header: 'No.',
        key: 'no',
        width: 15,
      });

      //** EFOOD COLUMN NAME */
      for (let key of columns) {
        const splitString = key.split('|');
        key = splitString[0];

        const column = {
          header: key.toUpperCase(),
          key: key,
          width: key.substring(key.length - 3, key.length) == '_id' ? 30 : 25,
        };

        switch (key) {
          case 'group_id':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'CORPORATE ID';
            }
            break;
          case 'group_name':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'CORPORATE';
            }
            break;
          case 'merchant_id':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'BRAND ID';
            }
            break;
          case 'merchant_name':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'BRAND';
            }
            break;
          case 'store_id':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'STORE ID';
            }
            break;
          case 'store_name':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'STORE';
            }
            break;
          case 'type':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'TYPE';
            }
            break;
          case 'store_phone':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'STORE PHONE';
            }
            break;
          case 'city_id':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'KOTA & AREA';
            }
            break;
          case 'store_address':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'STORE ADDRESS';
            }
            break;
          case 'categories':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'CATEGORIES STORE MENU';
            }
            break;
          case 'pic_name':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'PIC NAME';
            }
            break;
          case 'pic_phone':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'PIC PHONE';
            }
            break;
          case 'pic_email':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'PIC EMAIL';
            }
            break;
          case 'pic_profile_merchant':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'PIC PROFILE MERCHANT';
            }
            break;
          case 'store_banner':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'STORE BANNER';
            }
            break;
          case 'store_created':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'CREATED DATE';
            }
            break;
          case 'status':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'STATUS';
            }
            break;
          case 'store_updated':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'UPDATED DATE';
            }
            break;
          case 'store_approved':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'APPROVED DATE';
            }
            break;
        }
        sheetEfoodColumns.push(column);
      }

      sheetEfood.columns = sheetEfoodColumns;
      sheetEfood.getRow(1).font = { bold: true };
      sheetEfood.getRow(1).alignment = { horizontal: 'center', wrapText: true };
      if (raw.items.length > 0) {
        for (const [idx, obj] of raw.items.entries()) {
          const row = [];
          row.push(idx + 1);

          for (let key of columns) {
            const splitString = key.split('|');
            key = splitString[0];

            switch (key) {
              case 'group_id':
                const nameGI = obj.group_id.slice(0, 8)
                  ? obj.group_id.slice(0, 8)
                  : '-';
                row.push(nameGI);
                break;
              case 'group_name':
                const nameG = obj.group_name ? obj.group_name : '-';
                row.push(nameG);
                break;
              case 'merchant_id':
                const nameMI = obj.merchant_id.slice(0, 8)
                  ? obj.merchant_id.slice(0, 8)
                  : '-';
                row.push(nameMI);
                break;
              case 'merchant_name':
                const nameM = obj.merchant_name ? obj.merchant_name : '-';
                row.push(nameM);
                break;
              case 'store_id':
                const nameSI = obj.ms_id.slice(0, 8)
                  ? obj.ms_id.slice(0, 8)
                  : '-';
                row.push(nameSI);
                break;
              case 'store_name':
                const nameS = obj.ms_name ? obj.ms_name : '-';
                row.push(nameS);
                break;
              case 'type':
                const nameMT = obj.merchant_type ? obj.merchant_type : '-';
                row.push(nameMT);
                break;
              case 'store_phone':
                const nameSP = obj.ms_phone ? obj.ms_phone : '-';
                row.push(nameSP);
                break;
              case 'city_id':
                const nameCi = obj.ms_city_id.name ? obj.ms_city_id.name : '-';
                row.push(nameCi);
                break;
              case 'store_address':
                const nameMA = obj.ms_address ? obj.ms_address : '-';
                row.push(nameMA);
                break;
              case 'categories':
                const nameSC = obj.merchant_store_categories_name
                  ? obj.merchant_store_categories_name
                  : '-';
                row.push(nameSC);
                break;
              case 'pic_name':
                const namePN = obj.merchant_pic_name
                  ? obj.merchant_pic_name
                  : '-';
                row.push(namePN);
                break;
              case 'pic_phone':
                const namePP = obj.merchant_pic_phone
                  ? obj.merchant_pic_phone
                  : '-';
                row.push(namePP);
                break;
              case 'pic_email':
                const namePE = obj.merchant_pic_email
                  ? obj.merchant_pic_email
                  : '-';
                row.push(namePE);
                break;
              case 'pic_profile_merchant':
                const namePPM = obj.merchant_profile_store_photo
                  ? obj.merchant_profile_store_photo
                  : '-';
                row.push(namePPM);
                break;
              case 'store_banner':
                const nameSB = obj.ms_photo ? obj.ms_photo : '-';
                row.push(nameSB);
                break;
              case 'store_created':
                const dateCr = new Date(obj.ms_created_at);
                const yearCr = dateCr.toLocaleString('default', {
                  year: 'numeric',
                });
                const monthCr = dateCr.toLocaleString('default', {
                  month: '2-digit',
                });
                const dayCr = dateCr.toLocaleString('default', {
                  day: '2-digit',
                });
                const formatDateCr = dayCr + '-' + monthCr + '-' + yearCr;
                const nameSCR = formatDateCr ? formatDateCr : '-';
                row.push(nameSCR);
                break;
              case 'status':
                const nameSST = obj.ms_status ? obj.ms_status : '-';
                row.push(nameSST);
                break;
              case 'store_updated':
                const dateUp = new Date(obj.ms_updated_at);
                const yearUp = dateUp.toLocaleString('default', {
                  year: 'numeric',
                });
                const monthUp = dateUp.toLocaleString('default', {
                  month: '2-digit',
                });
                const dayUp = dateUp.toLocaleString('default', {
                  day: '2-digit',
                });
                const formatDateUp = dayUp + '-' + monthUp + '-' + yearUp;
                const nameSSU = formatDateUp ? formatDateUp : '-';
                row.push(nameSSU);
                break;
              case 'store_approved':
                const dateAp = new Date(obj.ms_updated_at);
                const yearAp = dateAp.toLocaleString('default', {
                  year: 'numeric',
                });
                const monthAp = dateAp.toLocaleString('default', {
                  month: '2-digit',
                });
                const dayAp = dateAp.toLocaleString('default', {
                  day: '2-digit',
                });
                const formatDateAp = dayAp + '-' + monthAp + '-' + yearAp;
                const nameSSA = formatDateAp ? formatDateAp : '-';
                row.push(nameSSA);
                break;
            }
          }
          sheetEfood.addRow(row);
        }
      }

      const dateTitle = moment().format('YYMMDDHHmmss');
      let fileName: string;
      if (data.sheet_name && data.sheet_name !== '') {
        fileName = `Laporan_${data.sheet_name
          .split(' ')
          .join('_')
          .toLowerCase()}_${dateTitle}.xlsx`;
      } else {
        fileName = `Laporan_store_baru_${dateTitle}.xlsx`;
      }

      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=${fileName}`,
      });
      await workbook.xlsx.write(res);

      res.end();
    } catch (error) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: '',
            constraint: [
              this.messageService.get('merchant.general.dataNotFound'),
            ],
          },
          'Bad Request',
        ),
      );
    }
  }

  //** GENERATE MENU REPORT BY MERCHANTS */
  async generateMenuXLSXMenuMerchants(
    data: ListReprotNewMerchantDTO,
    res: Response<any, Record<string, any>>,
  ): Promise<any> {
    try {
      //** CREATE COLUMN EXCEL */
      const columns = data.columns?.length
        ? data.columns
        : [
            'group_id',
            'group_name',
            'merchant_id',
            'merchant_name',
            'store_id',
            'store_name',
            'categories',
            'recommended',
            'total_photo_menu',
            'total_menu',
            'store_created',
            'status',
            'store_updated',
            'store_approved',
          ];

      //** GET DATA FROM DATABASE */
      const raw = await this.processListNewMerchants(data);

      //** CREATE WORKBOOK */
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Efood';

      //** CREATE SHEETSEFOOD */
      let sheetEfood: ExcelJS.Worksheet;

      if (data.sheet_name && data.sheet_name !== '') {
        sheetEfood = workbook.addWorksheet('Data Menu Stores', {
          properties: { defaultColWidth: 20 },
        });
      } else {
        sheetEfood = workbook.addWorksheet('Data Menu Stores', {
          properties: { defaultColWidth: 20 },
        });
      }

      //** EFOOD COLUMN NAME */
      const sheetEfoodColumns: any[] = [];
      sheetEfoodColumns.push({
        header: 'No.',
        key: 'no',
        width: 15,
      });

      //** EFOOD COLUMN NAME */
      for (let key of columns) {
        const splitString = key.split('|');
        key = splitString[0];

        const column = {
          header: key.toUpperCase(),
          key: key,
          width: key.substring(key.length - 3, key.length) == '_id' ? 30 : 25,
        };

        switch (key) {
          case 'group_id':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'CORPORATE ID';
            }
            break;
          case 'group_name':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'CORPORATE';
            }
            break;
          case 'merchant_id':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'BRAND ID';
            }
            break;
          case 'merchant_name':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'BRAND';
            }
            break;
          case 'store_id':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'STORE ID';
            }
            break;
          case 'store_name':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'STORE';
            }
            break;
          case 'categories':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'CATEGORIES STORE MENU';
            }
            break;
          case 'recommended':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'TOTAL RECOMMENDED';
            }
            break;
          case 'total_photo_menu':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'TOTAL PHOTO MENU';
            }
            break;
          case 'total_menu':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'TOTAL MENU';
            }
            break;
          case 'store_created':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'CREATED DATE';
            }
            break;
          case 'status':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'STATUS';
            }
            break;
          case 'store_updated':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'UPDATED DATE';
            }
            break;
          case 'store_approved':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'APPROVED DATE';
            }
            break;
        }
        sheetEfoodColumns.push(column);
      }

      sheetEfood.columns = sheetEfoodColumns;
      sheetEfood.getRow(1).font = { bold: true };
      sheetEfood.getRow(1).alignment = { horizontal: 'center', wrapText: true };
      if (raw.items.length > 0) {
        for (const [idx, obj] of raw.items.entries()) {
          const row = [];
          row.push(idx + 1);

          for (let key of columns) {
            const splitString = key.split('|');
            key = splitString[0];

            switch (key) {
              case 'group_id':
                const nameGI = obj.group_id.slice(0, 8)
                  ? obj.group_id.slice(0, 8)
                  : '-';
                row.push(nameGI);
                break;
              case 'group_name':
                const nameG = obj.group_name ? obj.group_name : '-';
                row.push(nameG);
                break;
              case 'merchant_id':
                const nameMI = obj.merchant_id.slice(0, 8)
                  ? obj.merchant_id.slice(0, 8)
                  : '-';
                row.push(nameMI);
                break;
              case 'merchant_name':
                const nameM = obj.merchant_name ? obj.merchant_name : '-';
                row.push(nameM);
                break;
              case 'store_id':
                const nameSI = obj.ms_id.slice(0, 8)
                  ? obj.ms_id.slice(0, 8)
                  : '-';
                row.push(nameSI);
                break;
              case 'store_name':
                const nameS = obj.ms_name ? obj.ms_name : '-';
                row.push(nameS);
                break;
              case 'categories':
                const nameSC = obj.merchant_store_categories_name
                  ? obj.merchant_store_categories_name
                  : '-';
                row.push(nameSC);
                break;
              case 'recommended':
                const recommended = obj.merchant_id;
                const getRecom =
                  await this.commonCatalogService.getMenuRecommendedByStoreId(
                    recommended,
                  );
                const nameRD = getRecom.data.total_item
                  ? getRecom.data.total_item
                  : '-';
                row.push(nameRD);
                break;
              case 'total_photo_menu':
                const photo = obj.merchant_id;
                const getPohto =
                  await this.commonCatalogService.getMenuOnlyByStoreId(photo);
                const namePM = getPohto.data.total_item
                  ? getPohto.data.total_item
                  : '-';
                row.push(namePM);
                break;
              case 'total_menu':
                const menus = obj.merchant_id;
                const getTotalMenu =
                  await this.commonCatalogService.getMenuOnlyByStoreId(menus);
                const nameTM = getTotalMenu.data.total_item
                  ? getTotalMenu.data.total_item
                  : '-';
                row.push(nameTM);
                break;
              case 'store_created':
                const dateCr = new Date(obj.ms_created_at);
                const yearCr = dateCr.toLocaleString('default', {
                  year: 'numeric',
                });
                const monthCr = dateCr.toLocaleString('default', {
                  month: '2-digit',
                });
                const dayCr = dateCr.toLocaleString('default', {
                  day: '2-digit',
                });
                const formatDateCr = dayCr + '-' + monthCr + '-' + yearCr;
                const nameSCR = formatDateCr ? formatDateCr : '-';
                row.push(nameSCR);
                break;
              case 'status':
                const nameSST = obj.ms_status ? obj.ms_status : '-';
                row.push(nameSST);
                break;
              case 'store_updated':
                const dateUp = new Date(obj.ms_updated_at);
                const yearUp = dateUp.toLocaleString('default', {
                  year: 'numeric',
                });
                const monthUp = dateUp.toLocaleString('default', {
                  month: '2-digit',
                });
                const dayUp = dateUp.toLocaleString('default', {
                  day: '2-digit',
                });
                const formatDateUp = dayUp + '-' + monthUp + '-' + yearUp;
                const nameSSU = formatDateUp ? formatDateUp : '-';
                row.push(nameSSU);
                break;
              case 'store_approved':
                const dateAp = new Date(obj.ms_updated_at);
                const yearAp = dateAp.toLocaleString('default', {
                  year: 'numeric',
                });
                const monthAp = dateAp.toLocaleString('default', {
                  month: '2-digit',
                });
                const dayAp = dateAp.toLocaleString('default', {
                  day: '2-digit',
                });
                const formatDateAp = dayAp + '-' + monthAp + '-' + yearAp;
                const nameSSA = formatDateAp ? formatDateAp : '-';
                row.push(nameSSA);
                break;
            }
          }
          sheetEfood.addRow(row);
        }
      }

      const dateTitle = moment().format('YYMMDDHHmmss');
      let fileName: string;
      if (data.sheet_name && data.sheet_name !== '') {
        fileName = `Laporan_${data.sheet_name
          .split(' ')
          .join('_')
          .toLowerCase()}_${dateTitle}.xlsx`;
      } else {
        fileName = `Laporan_menu_store_${dateTitle}.xlsx`;
      }

      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=${fileName}`,
      });
      await workbook.xlsx.write(res);

      res.end();
    } catch (error) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: '',
            constraint: [
              this.messageService.get('merchant.general.dataNotFound'),
            ],
          },
          'Bad Request',
        ),
      );
    }
  }
}
