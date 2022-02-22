import { IAddons } from 'src/database/interfaces/addons.interface';

export const addons: IAddons[] = [
  {
    id: '7915377a-471c-4f28-870f-bc107e3bd0d1',
    name: 'Queueing Display',
    code: 'queueing_display',
    sequence: 4,
  },
  {
    id: 'e183860b-cd5e-4125-9209-93afa0cc23d7',
    name: 'Kitchen Display Pickup',
    code: 'kitchen_display_pickup',
    sequence: 3,
  },
  {
    id: 'ec1f5e82-c8ba-44c5-bf3d-0ca6a2e61d50',
    name: 'Kitchen Display Assembler',
    code: 'kitchen_display_assembler',
    sequence: 2,
  },
  {
    id: 'de59ddb3-2d35-4a5a-907c-63d1d5889d1c',
    name: 'POS',
    code: 'pos',
    sequence: 1,
  },
];
