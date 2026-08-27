import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

import { validate as isUuid } from 'uuid';

@Injectable()
export class ParseUuidPipe
  implements PipeTransform<string>
{
  transform(
    value: string,
    metadata: ArgumentMetadata,
  ): string {
    if (!isUuid(value)) {
      throw new BadRequestException(
        `${metadata.data ?? 'id'} must be a valid UUID`,
      );
    }

    return value;
  }
}