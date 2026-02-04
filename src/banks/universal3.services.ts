import { Injectable } from '@nestjs/common';
import { UtilService } from 'src/util.service';

@Injectable()
export class Universal3PdfService {
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
    const searchText = 'E-mail: info@ucbank.me';
    content.forEach((el) => {
      if (
        el.str.trim() === searchText &&
        el.y > 60 &&
        el.y < 67 &&
        el.x > 690
      ) {
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

        if (x > 55 && x < 60 && y > 95 && y < 105) {
          retVal['name'] = value;
        }
        if (x > 690 && x < 700 && y > 155 && y < 165) {
          retVal['accountNumber'] =
            this.utilService.formatDomesticAccount(value);
        }
        if (x > 700 && x < 750 && y > 130 && y < 140) {
          retVal['number'] = parseInt(value).toString();
        }
        if (x > 300 && x < 320 && y > 90 && y < 100) {
          retVal['date'] = value
            .replace('STANJE I PROMJENE SREDSTAVA NA DAN ', '')
            .trim();
        }
      }
    });
    retVal['year'] = retVal['date']?.substring(6, 10);

    return retVal;
  }

  readMainTable(content) {
    const col1X = 40,
      col2X = 185,
      col3X = 280,
      col4X = 350,
      col5X = 425,
      col6X = 460,
      col7X = 570,
      col8X = 670;
    const margin = 10;
    const tempArray = [],
      yArray = [];

    content.forEach((el) => {
      const value = el.str.trim();
      if (value && el.x > col1X - 10 && el.x < col1X + 10) {
        if (!isNaN(value) && parseInt(value) < 99) {
          yArray.push(el.y);
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
          if (value && el.x > col1X - 10 && el.x < col1X + 10) {
            if (!isNaN(value) && parseInt(value) < 99) {
              tempVal['sequence'] = value;
            }
          }
          if (x > col1X + 10 && x < col2X) {
            const arr = value.split(',');
            for (const item of arr) {
              if (
                this.utilService.isDomesticAccount(item.trim()) &&
                item.trim() !== ''
              ) {
                tempVal['partnerAccountNumber'] =
                  this.utilService.formatDomesticAccount(item.trim());
              } else {
                if (tempVal['partnerName']) {
                  if (!item.trim().startsWith(',') && item.trim() !== '') {
                    tempVal['partnerName'] += ' ' + item.trim();
                  }
                } else {
                  tempVal['partnerName'] = item.trim();
                }
              }
            }
          }
          if (x > col2X && x < col3X) {
            const arr = value.split('/');
            if (arr.length > 1) {
              for (const item of arr) {
                if (this.utilService.isValidReverseDate(item.trim())) {
                  tempVal['processingDate'] = item.trim();
                } else {
                  if (tempVal['origin']) {
                    tempVal['origin'] += ' ' + item.trim();
                  } else {
                    tempVal['origin'] = item.trim();
                  }
                }
              }
            } else {
              if (tempVal['origin']) {
                tempVal['origin'] += ' ' + value;
              } else {
                tempVal['origin'] = value;
              }
            }
          }
          if (x > col3X && x < col4X) {
            if (value === '0,00') {
              tempVal['owes'] = '0.00';
            } else {
              tempVal['owes'] = value.replace(',', '');
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
      tempVal['partnerName'] &&
        (tempVal['purpose'] =
          tempVal['partnerName'] + ' ' + tempVal['purpose']);
      //tempVal['debitNumber'] = tempVal['debitNumber']?.substring(3);
      //tempVal['approvalNumber'] = tempVal['approvalNumber']?.substring(3);
      tempArray.push(tempVal);
    }

    return tempArray;
  }
}
