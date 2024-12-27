import { Injectable } from '@nestjs/common';
import { UtilService } from 'src/util.service';

let isDone = false;
@Injectable()
export class ZiraatOldPdfService {
  constructor(private readonly utilService: UtilService) {}

  parsePdf(data) {
    isDone = false;
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
      if (!isDone) {
        const tempArray = this.readMainTable(data.pages[i].content);
        tableArray = [...tableArray, ...tempArray];
      }
    }
    retVal['table'] = tableArray;

    return retVal;
  }

  checkBank(content) {
    let name = '';
    const searchText = 'ZIRAAT BANK MONTENEGRO A.D.';
    content.forEach((el) => {
      if (
        el.str.trim().startsWith(searchText) &&
        el.x < 30 &&
        el.x > 27 &&
        el.y < 95 &&
        el.y > 90
      ) {
        name = 'ZIRAAT';
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
        if (x > 25 && x < 35 && y > 115 && y < 120) {
          retVal['name'] = value;
        }
        if (x > 640 && x < 670 && y > 115 && y < 125) {
          retVal['accountNumber'] =
            this.utilService.formatDomesticAccount(value);
        }
        if (x > 425 && x < 445 && y > 40 && y < 45) {
          retVal['number'] = value;
        }
        if (x > 550 && x < 580 && y > 65 && y < 75) {
          retVal['date'] = value;
        }
      }
    });
    retVal['year'] = retVal['date']?.substring(6, 10);

    return retVal;
  }

  readMainTable(content) {
    const col1X = 47,
      col2X = 210,
      col3X = 290,
      col4X = 375,
      col5X = 450,
      col6X = 468,
      col7X = 660,
      col8X = 730;
    const margin = 12;
    const tempArray = [],
      yArray = [];
    let maxY = 800;

    content.forEach((el) => {
      const value = el.str.trim();
      if (value === 'Ukupno na racunu' && el.x < 35) {
        maxY = el.y;
        isDone = true;
      }
      if (
        value &&
        value.length < 3 &&
        value.endsWith('.') &&
        el.x < col1X &&
        el.y < maxY &&
        !isNaN(value)
      ) {
        yArray.push(el.y);
      }
    });

    for (let i = 0; i < yArray.length; i++) {
      const y = yArray[i];
      let nextY = y + 35;
      i < yArray.length - 1 && (nextY = yArray[i + 1]);
      const tempVal = {};

      content.forEach((el) => {
        const value = el.str.trim();
        if (value && el.y > y - margin && el.y < nextY - margin) {
          const x = el.x;
          if (x <= col1X) {
            tempVal['sequence'] = value.replace('.', '');
          }
          if (x > col1X && x < col2X) {
            if (this.utilService.isDomesticAccount(value)) {
              tempVal['partnerAccountNumber'] =
                this.utilService.formatDomesticAccount(value);
            } else {
              if (tempVal['partnerName']) {
                tempVal['partnerName'] +=
                  ' ' + this.utilService.camelCaseToText(value);
              } else {
                tempVal['partnerName'] =
                  this.utilService.camelCaseToText(value);
              }
            }
          }
          if (x > col2X && x < col3X) {
            if (this.utilService.isValidDate(value)) {
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
            if (el.y > y) {
              if (!isNaN(value.replace(',', ''))) {
                tempVal['owesAdditionalFee'] = value.replace(',', '');
              }
            } else {
              tempVal['owes'] = value.replace(',', '');
            }
          }
          if (x > col4X && x < col5X) {
            tempVal['demands'] = value.replace(',', '');
          }
          if (x > col5X && x < col6X) {
            tempVal['code'] = value;
          }
          if (x > col6X && x < col7X) {
            if (tempVal['purpose']) {
              tempVal['purpose'] +=
                ' ' + this.utilService.camelCaseToText(value);
            } else {
              tempVal['purpose'] = this.utilService.camelCaseToText(value);
            }
          }
          if (x > col7X && x < col8X) {
            if (el.y < y) {
              if (tempVal['debitNumber']) {
                tempVal['debitNumber'] += ' ' + value;
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
