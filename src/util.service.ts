import { Injectable } from '@nestjs/common';

@Injectable()
export class UtilService {
  isDomesticAccount(value: string): boolean {
    const rgx = /^[0-9,\-]*$/;
    return rgx.test(value);
  }

  isForeignAccount(value: string): boolean {
    const rgx = /^ME[0-9]{20}$/;
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
    const rgx = /^[0-9]{1,}$/;
    return rgx.test(value);
  }

  formatDomesticAccount(value: string): string {
    if (!value) return value;
    if (!value.includes('-')) return value;

    const arr = value.split('-');
    if (arr.length > 3) return value;
    if (
      arr.length === 3 &&
      !(
        this.isNumeric(arr[0]) &&
        this.isNumeric(arr[1]) &&
        this.isNumeric(arr[2])
      )
    ) {
      return value;
    }
    if (
      arr.length === 2 &&
      !(this.isNumeric(arr[0]) && this.isNumeric(arr[1]))
    ) {
      return value;
    }

    let missingZeros = 18 - arr[0].length - arr[1].length;
    if (arr.length === 3) {
      missingZeros -= arr[2].length;
    }
    for (let i = 0; i < missingZeros; i++) {
      arr[0] += '0';
    }

    return arr.join('');
  }

  /**
   *
   * @param value Method that takes text in camel case and returns text with spaces. Eg: "SomeTextWithoutTHE" returns "Some Text Without THE"
   * @returns
   */
  camelCaseToText(value) {
    return value.replace(/([a-z])([A-Z])/g, '$1 $2');
  }
}
