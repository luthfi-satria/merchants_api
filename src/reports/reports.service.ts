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
import { NewMerchantEntity } from './repositories/new-merchants.repository';

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

      //** CREATE OBJECT DATA */
      const cityIObj = {};
      const menuIObj = {};

      // Data Cities
      raw.items.forEach((ms) => {
        if (ms.city_id) {
          cityIObj[ms.city_id] = null;
        }
      });

      // Data Menu
      raw.items.forEach((ms) => {
        if (ms.id) {
          menuIObj[ms.id] = null;
        }
      });

      const promises = [];
      let cities = null;
      let menus = null;

      raw.items.forEach((ms) => {
        cities = this.cityService.getCity(ms.city_id);
        promises.push(cities);
      });

      raw.items.forEach((ms) => {
        menus = this.commonCatalogService.getMenuByStoreId(ms.id);
        promises.push(menus);
      });

      await Promise.all(promises);

      if (cities) {
        cities = await cities;
        cities?.items?.forEach((city: any) => {
          cityIObj[city.id] = city;
        });
      }

      if (menus) {
        menus = await menus;
        menus?.items?.forEach((menu: any) => {
          menuIObj[menu.id] = menu;
        });
      }

      //** RESULT NEW MERCHANTS STORES */
      raw.items.forEach((ms) => {
        ms.city_id = cities ? cities : cityIObj[ms.city_id];
        ms.manu_id = menus ? menus : null;
      });

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
              this.messageService.get('merchant.general.idNotFound'),
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
            'total_recomended_menu',
            'total_picture_menu',
            'total_menu',
            'store_created',
            'status',
            'store_updated',
            'store_approved',
          ];

      //** GET DATA FROM DATABASE */
      const raw = await this.newMerchantEntities.generateNewMerchant(data, {
        isGetAll: true,
      });

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
          case 'total_recomended_menu':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'COUNT RECOMENDATION MENU';
            }
            break;
          case 'total_picture_menu':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'COUNT PICTURES MENU';
            }
            break;
          case 'total_menu':
            if (splitString[1] && splitString[1] !== '') {
              column.header = splitString[1].toUpperCase();
            } else {
              column.header = 'COUNT TOTAL MENU';
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

          //** GET DATA MENUS BY STORE ID */
          const getMenus = await this.commonCatalogService.getMenuByStoreId(
            obj.ms_id,
          );

          // Get total item menus
          const total_menus = getMenus.data.total_item;

          // Get total recomendation
          const countRecomendedMenu = getMenus.data.items.recommended;
          const recomendation_menus = Object.keys(countRecomendedMenu).length;

          // Get total image menu
          const menu_image = getMenus.data.total_item;

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
                const city = obj.ms_city_id;
                const getCity = await this.cityService.getCity(city);
                const nameCi = getCity.name ? getCity.name : '-';
                row.push(nameCi);
                break;
              case 'store_address':
                const nameMA = obj.ms_address ? obj.ms_address : '-';
                row.push(nameMA);
                break;
              case 'categories':
                const nameSC = obj.merchant_store_categories_languages_name
                  ? obj.merchant_store_categories_languages_name
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
              case 'total_recomended_menu':
                const nameTRM = recomendation_menus ? recomendation_menus : '-';
                row.push(nameTRM);
                break;
              case 'total_picture_menu':
                const nameTPM = menu_image ? menu_image : '-';
                row.push(nameTPM);
                break;
              case 'total_menu':
                const nameTM = total_menus ? total_menus : '-';
                row.push(nameTM);
                break;
              case 'store_created':
                const nameSCR = obj.ms_created_at ? obj.ms_created_at : '-';
                row.push(nameSCR);
                break;
              case 'status':
                const nameSST = obj.ms_status ? obj.ms_status : '-';
                row.push(nameSST);
                break;
              case 'store_updated':
                const nameSSU = obj.ms_updated_at ? obj.ms_updated_at : '-';
                row.push(nameSSU);
                break;
              case 'store_approved':
                const nameSSA = obj.ms_approved_at ? obj.ms_approved_at : '-';
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
            constraint: [this.messageService.get('merchant.general.NotFound')],
          },
          'Bad Request',
        ),
      );
    }
  }
}
