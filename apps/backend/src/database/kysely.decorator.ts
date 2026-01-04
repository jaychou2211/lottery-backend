import { Inject } from '@nestjs/common';

import { KYSELY_TOKEN } from './database.provider';

export const InjectKysely = (): ReturnType<typeof Inject> => Inject(KYSELY_TOKEN);
