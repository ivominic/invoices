import { Injectable } from '@nestjs/common';

@Injectable()
export class UtilService {
  isDomesticAccount(value: string): boolean {
    const rgx = /^[0-9,\-]*$/;
    return rgx.test(value);
  }

  isValidDate(value: string): boolean {
    const dateArray = value.split('.');
    return (
      dateArray.length === 3 &&
      dateArray[0].length === 2 &&
      dateArray[1].length === 2 &&
      dateArray[2].length === 4
    );
  }

  isValidReverseDate(value: string): boolean {
    const dateArray = value.split('.');
    return (
      dateArray.length === 3 &&
      dateArray[0].length === 4 &&
      dateArray[1].length === 2 &&
      dateArray[2].length === 2
    );
  }

  isNumeric(value: string): boolean {
    const rgx = /^[0-9]*$/;
    return rgx.test(value);
  }

  formatDomesticAccount(value: string): string {
    if (!value.includes('-')) return value;

    const arr = value.split('-');
    if (arr.length !== 3) return value;
    if (
      !(
        this.isNumeric(arr[0]) &&
        this.isNumeric(arr[1]) &&
        this.isNumeric(arr[2])
      )
    ) {
      return value;
    }

    const missingZeros = 18 - (arr[0].length + arr[1].length + arr[2].length);
    for (let i = 0; i < missingZeros; i++) {
      arr[0] += '0';
    }

    return arr.join('');
  }
}
