import { IPriceRanges } from 'src/database/interfaces/price_ranges.interface';

export const priceRanges: IPriceRanges[] = [
  {
    id: 'f65f2653-7efb-4545-a291-58c42eaceddb',
    name: 'Murah',
    symbol: '$',
    price_low: 0,
    price_high: 16000,
    sequence: 1,
  },
  {
    id: 'a993d813-350a-4670-9434-d429dd5a5468',
    name: 'Medium',
    symbol: '$$',
    price_low: 16000,
    price_high: 40000,
    sequence: 2,
  },
  {
    id: 'b3055338-f00c-4b93-9267-78e2664df2f2',
    name: 'Mahal',
    symbol: '$$$',
    price_low: 40000,
    price_high: 100000,
    sequence: 3,
  },
  {
    id: '7aa931a0-e96f-4448-93f5-d52ba3860ed4',
    name: 'Super Mahal',
    symbol: '$$$$',
    price_low: 100000,
    price_high: 0,
    sequence: 4,
  },
];
