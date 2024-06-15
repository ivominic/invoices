import { Injectable } from '@nestjs/common';
import { UtilService } from 'src/util.service';

@Injectable()
export class Universal2PdfService {
  constructor(private readonly utilService: UtilService) {}

  parsePdf(data) {
    let retVal = {};
    const bankName = this.checkBank(data.pages[0].content);
    if (!bankName) {
      return retVal;
    } else {
      retVal['bank'] = bankName;
    }
    const clientData = this.readClientData(data.pages[0].content);
    retVal = { ...retVal, ...clientData };

    let tableArray = [];
    for (let i = 0; i < data.pages.length; i++) {
      const tempArray = this.readMainTable(data.pages[i].content);
      tableArray = [...tableArray, ...tempArray];
    }
    retVal['table'] = tableArray;

    return retVal;
  }

  checkBank(content) {
    let name = '';
    const searchText = 'Universal Capital Bank';
    content.forEach((el) => {
      if (el.str.trim() === searchText && el.y > 64 && el.y < 96 && el.x < 30) {
        name = 'UNIVERSAL';
      }
    });
    return name;
  }

  readClientData(content) {
    const retVal = {};

    content.forEach((el) => {
      const value = el.str.trim();
      if (value) {
        const x = el.x;
        const y = el.y;

        if (x > 28 && x < 32 && y > 116 && y < 120) {
          retVal['name'] = value;
        }
        if (x > 640 && x < 670 && y > 118 && y < 122) {
          retVal['accountNumber'] =
            this.utilService.formatDomesticAccount(value);
        }
        if (x > 420 && x < 440 && y > 43 && y < 45) {
          retVal['number'] = parseInt(value).toString();
        }
        if (x > 550 && x < 580 && y > 68 && y < 72) {
          retVal['date'] = value;
        }
      }
    });
    retVal['year'] = retVal['date']?.substring(6, 10);

    return retVal;
  }

  readMainTable(content) {
    const col1X = 45,
      col2X = 220,
      col3X = 320,
      col4X = 400,
      col5X = 450,
      col6X = 480,
      col7X = 620,
      col8X = 730;
    const margin = 5;
    const tempArray = [],
      yArray = [];

    content.forEach((el) => {
      const value = el.str.trim();
      if (value && el.x > col1X - 1 && el.x < col1X + 1) {
        const splitArray = value.split(' ');
        if (splitArray.length && splitArray[0].toString().endsWith('.')) {
          const tempValue = splitArray[0].substring(
            0,
            splitArray[0].length - 1,
          );
          if (!isNaN(tempValue) && parseInt(tempValue) < 99) {
            yArray.push(el.y);
          }
        }
      }
    });

    for (let i = 0; i < yArray.length; i++) {
      const y = yArray[i];
      let nextY = y + 30;
      i < yArray.length - 1 && (nextY = yArray[i + 1]);
      const tempVal = {};

      content.forEach((el) => {
        const value = el.str.trim();
        if (value && el.y > y - margin && el.y < nextY - margin) {
          const x = el.x;
          if (x <= col1X + 1 && !tempVal['sequence']) {
            const splitArray = value.split(' ');
            if (splitArray.length && splitArray[0].toString().endsWith('.')) {
              const tempValue = splitArray[0].substring(
                0,
                splitArray[0].length - 1,
              );
              if (!isNaN(tempValue) && parseInt(tempValue) < 99) {
                tempVal['sequence'] = tempValue;
                tempVal['partnerName'] = value.substring(
                  splitArray[0].length + 1,
                );
              }
            }
          }
          if (x > col1X + 1 && x < col2X) {
            if (this.utilService.isDomesticAccount(value)) {
              tempVal['partnerAccountNumber'] =
                this.utilService.formatDomesticAccount(value);
            } else {
              if (tempVal['partnerName']) {
                tempVal['partnerName'] += ' ' + value;
              } else {
                tempVal['partnerName'] = value;
              }
            }
          }
          if (x > col2X && x < col3X) {
            if (this.utilService.isValidReverseDate(value)) {
              tempVal['processingDate'] = value;
            } else {
              if (tempVal['origin']) {
                tempVal['origin'] += ' ' + value;
              } else {
                tempVal['origin'] = value;
              }
            }
          }
          if (x > col3X && x < col4X) {
            if (el.y < y + margin && el.y > y - margin) {
              if (value === '0,00') {
                tempVal['owes'] = '0.00';
              } else {
                tempVal['owes'] = value.replace(',', '');
              }
            } else {
              tempVal['owesAdditionalFee'] = value.replace(',', '');
            }
          }
          if (x > col4X && x < col5X) {
            if (value === '0,00') {
              tempVal['demands'] = '0.00';
            } else {
              tempVal['demands'] = value.replace(',', '');
            }
          }
          if (x > col5X && x < col6X) {
            tempVal['code'] = value;
          }
          if (x > col6X && x < col7X) {
            if (tempVal['purpose']) {
              tempVal['purpose'] += ' ' + value;
            } else {
              tempVal['purpose'] = value;
            }
          }
          if (x > col7X && x < col8X) {
            if (el.y < y + margin) {
              if (tempVal['debitNumber']) {
                tempVal['debtNumber'] += ' ' + value;
              } else {
                tempVal['debitNumber'] = value;
              }
            } else {
              if (tempVal['approvalNumber']) {
                tempVal['approvalNumber'] += ' ' + value;
              } else {
                tempVal['approvalNumber'] = value;
              }
            }
          }
          if (x > col8X) {
            if (tempVal['complaint']) {
              tempVal['complaint'] += ' ' + value;
            } else {
              tempVal['complaint'] = value;
            }
          }
        }
      });
      //tempVal['debitNumber'] = tempVal['debitNumber']?.substring(3);
      //tempVal['approvalNumber'] = tempVal['approvalNumber']?.substring(3);
      tempArray.push(tempVal);
    }

    return tempArray;
  }
}
