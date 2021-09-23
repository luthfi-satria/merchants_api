import { SetMetadata } from '@nestjs/common';

export const ResponseExcludeParam = (...structure: string[]) =>
  SetMetadata('exclude_param', structure);
