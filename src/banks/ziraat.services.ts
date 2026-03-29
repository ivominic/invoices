import { Injectable } from '@nestjs/common';
import { UtilService } from 'src/util.service';

let isDone = false;
@Injectable()
export class ZiraatPdfService {
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
        const tempAdditionalData = this.readSummaryTable(data.pages[i].content);
        retVal = { ...retVal, ...tempAdditionalData };
        tableArray = [...tableArray, ...tempArray];
      }
    }
    retVal['table'] = tableArray;

    return retVal;
  }

  checkBank(content) {
    let name = '';
    const searchText = 'STANJE I PROMJENE SREDSTAVA NA DAN ';
    content.forEach((el) => {
      if (
        el.str.trim().startsWith(searchText) &&
        el.x < 212 &&
        el.x > 211 &&
        el.y < 85 &&
        el.y > 84
      ) {
        name = 'ZIRAAT';
      }
    });
    return name;
  }

  readClientData(content) {
    const dateText = 'STANJE I PROMJENE SREDSTAVA NA DAN ',
      numberText = 'IZVOD BROJ ';
    const retVal = {};

    content.forEach((el) => {
      const value = el.str.trim();
      if (value) {
        const x = el.x;
        const y = el.y;
        if (x > 81 && x < 82 && y > 125 && y < 126) {
          retVal['name'] = value;
        }
        if (x > 81 && x < 82 && y > 141 && y < 142) {
          retVal['accountNumber'] =
            this.utilService.formatDomesticAccount(value);
        }
        if (value.startsWith(numberText) && y < 51) {
          const tempArray = value.split(' ');
          retVal['number'] = tempArray[tempArray.length - 1];
        }
        if (value.startsWith(dateText) && y < 85) {
          const tempArray = value.split(' ');
          retVal['date'] = tempArray[tempArray.length - 1];
        }
      }
    });
    retVal['year'] = retVal['date']?.substring(6, 10);

    return retVal;
  }

  readSummaryTable(content) {
    const initialStateText: string = 'Prethodno stanje';
    let initialY;
    const retVal = {};

    content.forEach((el) => {
      const value = el.str.trim();
      if (value === initialStateText && el.x < 16 && el.y < 250) {
        initialY = el.y;
      }
    });

    content.forEach((el) => {
      const value = el.str.trim();
      if (value && el.x < 540 && el.y > initialY && el.y < initialY + 40) {
        const x = el.x;
        if (x < 60) {
          retVal['initialState'] = value.replaceAll(',', '');
        }
        if (x > 80 && x < 130) {
          retVal['totalOwes'] = value.replaceAll(',', '');
        }
        if (x > 130 && x < 200) {
          retVal['totalDemands'] = value.replaceAll(',', '');
        }
        if (x > 200 && x < 260) {
          retVal['newState'] = value.replaceAll(',', '');
        }

        if (x > 290 && x < 330) {
          retVal['debtCount'] = value;
        }
        if (x > 350 && x < 380) {
          retVal['approvalCount'] = value;
        }
        if (x > 410 && x < 430) {
          retVal['itemsCount'] = value;
        }
        if (x > 490 && x < 510) {
          retVal['failedItemsCount'] = value;
        }
      }
    });

    return retVal;
  }

  readMainTable(content) {
    const col1X = 23,
      col2X = 41,
      col3X = 230,
      col4X = 430,
      col5X = 510,
      col6X = 530,
      col7X = 620,
      col8X = 730;
    const margin = 15;
    const tempArray = [],
      yArray = [];
    let maxY = 3000;

    content.forEach((el) => {
      const value = el.str.trim();
      if (value === 'NEIZVRŠENI NALOZI') {
        maxY = el.y;
        isDone = true;
      }
      if (
        value &&
        el.x < col1X &&
        !isNaN(value) &&
        value < 999 &&
        el.y < maxY
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
            tempVal['sequence'] = value;
          }
          if (x > col1X && x < col2X) {
            if (this.utilService.isDomesticAccount(value)) {
              tempVal['partnerAccountNumber'] =
                this.utilService.formatDomesticAccount(value);
            } else {
              if (tempVal['partnerName']) {
                tempVal['partnerName'] +=
                  this.utilService.camelCaseToText(value);
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
            if (value.startsWith('Naknada')) {
              const tempArray = value.replace(',', '').split(' ');
              tempVal['owesAdditionalFee'] = tempArray[tempArray.length - 1];
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
      tempVal['debitNumber'] = tempVal['debitNumber']?.substring(3);
      tempVal['approvalNumber'] = tempVal['approvalNumber']?.substring(3);
      tempArray.push(tempVal);
    }

    return tempArray;
  }

  parseForeignPdf(data) {
    isDone = false;
    let retVal = {};
    const bankName = this.checkForeignBank(data.pages[0].content);
    if (!bankName) {
      return retVal;
    } else {
      retVal['bank'] = bankName;
    }
    const clientData = this.readForeignClientData(data.pages[0].content);
    retVal = { ...retVal, ...clientData };

    let tableArray = [];
    for (let i = 0; i < data.pages.length; i++) {
      if (!isDone) {
        const tempArray = this.readForeignMainTable(data.pages[i].content);
        tableArray = [...tableArray, ...tempArray];
      }
    }
    retVal['table'] = tableArray;

    return retVal;
  }

  checkForeignBank(content) {
    let name = '';
    const searchText =
      'MOLIMO VAS DA IZVOD PREGLEDATE I IZVIJESTITE NAS O EVENTULANIM NESLAGANJIMA NA TEL. +382 (0)20 442200';
    content.forEach((el) => {
      if (el.str.trim().startsWith(searchText) && el.x < 20) {
        name = 'ZIRAAT';
      }
    });
    return name;
  }

  readForeignClientData(content) {
    const numberText = 'DEVIZNI IZVOD BROJ ';
    const retVal = {};

    content.forEach((el) => {
      const value = el.str.trim();
      if (value) {
        const x = el.x;
        const y = el.y;
        if (x > 83 && x < 86 && y > 95 && y < 99) {
          retVal['name'] = value;
        }
        if (x > 83 && x < 86 && y > 110 && y < 115) {
          retVal['accountNumber'] = value.trim();
        }
        if (value.startsWith(numberText) && y < 50) {
          const tempArray = value.split(' ');
          retVal['number'] = tempArray[tempArray.length - 1].substring(0, 3);
        }
        if (x > 200 && x < 210 && y > 300 && y < 400) {
          if (this.utilService.isValidDateWithoutPoint(value.trim())) {
            retVal['date'] = value.trim();
          }
        }
      }
    });
    retVal['year'] = retVal['date']?.substring(6, 10);

    return retVal;
  }

  readForeignMainTable(content) {
    const searchText =
      'MOLIMO VAS DA IZVOD PREGLEDATE I IZVIJESTITE NAS O EVENTULANIM NESLAGANJIMA NA TEL. +382 (0)20 442200';
    const col1X = 25,
      col2X = 45,
      col3X = 200,
      col4X = 250,
      col5X = 330,
      col6X = 400,
      col7X = 425,
      col8X = 505;
    const margin = 20;
    const tempArray = [],
      yArray = [];
    let maxY = 3000;

    content.forEach((el) => {
      const value = el.str.trim();
      if (value.startsWith(searchText)) {
        maxY = el.y - 50;
        isDone = true;
      }
      if (
        value &&
        el.x < col1X &&
        !isNaN(value) &&
        value < 999 &&
        el.y < maxY
      ) {
        yArray.push(el.y);
      }
    });

    for (let i = 0; i < yArray.length; i++) {
      const y = yArray[i];
      let nextY = y + 35;
      i < yArray.length - 1 && (nextY = yArray[i + 1]);
      const tempVal = {};
      tempVal['partnerAccountNumber'] = '';
      tempVal['partnerName'] = '';

      content.forEach((el) => {
        const value = el.str.trim();
        if (value && el.y > y - margin && el.y < nextY - margin) {
          const x = el.x;
          if (x <= col1X) {
            tempVal['sequence'] = value;
          }
          if (x > col1X && x < col2X) {
            tempVal['partnerName'] += this.utilService.setOrAppend(
              tempVal['partnerName'],
              value.trim(),
            );
          }
          if (x > col3X && x < col4X) {
            if (this.utilService.isValidDate(value)) {
              tempVal['itemDate'] = value;
            }
          }
          if (x > col4X && x < col5X) {
            if (value === '- EUR') {
              tempVal['owes'] = '0.00';
            } else {
              tempVal['owes'] = value
                .replace(',', '')
                .replace(' EUR', '')
                .trim();
            }
          }
          if (x > col5X && x < col6X) {
            if (value === '- EUR') {
              tempVal['demands'] = '0.00';
            } else {
              tempVal['demands'] = value
                .replace(',', '')
                .replace(' EUR', '')
                .trim();
            }
          }
          if (x > col6X && x < col7X) {
            tempVal['code'] = value;
          }
          if (x > col7X && x < col8X) {
            tempVal['purpose'] = this.utilService.setOrAppend(
              tempVal['purpose'],
              value.trim(),
            );
          }

          if (x > col8X) {
            tempVal['orderNumber'] = value.trim();
          }
        }
      });
      tempVal['partnerName'] &&
        (tempVal['purpose'] =
          tempVal['partnerName'] + ' ' + tempVal['purpose']);
      tempArray.push(tempVal);
    }

    return tempArray;
  }
}
