import { Injectable } from '@nestjs/common';

@Injectable()
export class UtilService {
  isDomesticAccount(value: string) {
    const rgx = /^[0-9,\-]*$/;
    return rgx.test(value);
  }

  isValidDate(value: string) {
    const dateArray = value.split('.');
    return (
      dateArray.length === 3 &&
      dateArray[0].length === 2 &&
      dateArray[1].length === 2 &&
      dateArray[2].length === 4
    );
  }

  isValidReverseDate(value: string) {
    const dateArray = value.split('.');
    return (
      dateArray.length === 3 &&
      dateArray[0].length === 4 &&
      dateArray[1].length === 2 &&
      dateArray[2].length === 2
    );
  }
}
