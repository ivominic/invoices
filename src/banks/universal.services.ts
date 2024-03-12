import { Injectable } from '@nestjs/common';
import { UtilService } from 'src/util.service';

@Injectable()
export class UniversalPdfService {
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
      const tempAdditionalData = this.readSummaryTable(data.pages[i].content);
      retVal = { ...retVal, ...tempAdditionalData };
      tableArray = [...tableArray, ...tempArray];
    }
    retVal['table'] = tableArray;

    return retVal;
  }

  checkBank(content) {
    let name = '';
    const searchText = 'E-mail: info@ucbank.me';
    content.forEach((el) => {
      if (el.str.trim() === searchText && el.y < 84) {
        name = 'UNIVERSAL';
      }
    });
    return name;
  }

  readClientData(content) {
    const accountText = 'Račun /';
    let accountY = 0;
    const retVal = {};

    content.forEach((el) => {
      const value = el.str.trim();
      if (value) {
        const x = el.x;
        const y = el.y;
        value === accountText && (accountY = y);

        if (x > 178 && x < 179 && y > 151 && y < 152) {
          retVal['name'] = value;
        }
        if (x > 178 && x < 179 && y > accountY - 1 && y < accountY + 1) {
          retVal['accountNumber'] = value;
        }
        if (x > 559 && x < 560 && y > 151 && y < 152) {
          retVal['number'] = value;
        }
        if (x > 559 && x < 560 && y > 188 && y < 189) {
          retVal['date'] = value;
        }
      }
    });
    retVal['year'] = retVal['date']?.substring(6, 10);

    return retVal;
  }

  readSummaryTable(content) {
    const initialStateText: string = ' balance';
    let initialY;
    const retVal = {};

    content.forEach((el) => {
      const value = el.str.trim();
      if (value.endsWith(initialStateText) && el.x < 50 && el.y < 260) {
        initialY = el.y;
      }
    });

    content.forEach((el) => {
      const value = el.str.trim();
      if (value && el.y > initialY + 10 && el.y < initialY + 20) {
        const x = el.x;
        if (x < 70) {
          retVal['initialState'] = value.replaceAll(',', '');
        }
        if (x > 120 && x < 150) {
          retVal['owes'] = value.replaceAll(',', '');
        }
        if (x > 180 && x < 220) {
          retVal['demands'] = value.replaceAll(',', '');
        }
        if (x > 240 && x < 280) {
          retVal['newState'] = value.replaceAll(',', '');
        }
        if (x > 330 && x < 370) {
          const tempArray = value.split(' / ');
          retVal['debtCount'] = tempArray[0];
          retVal['approveCount'] = tempArray[1];
        }
        if (x > 460 && x < 480) {
          retVal['executedCount'] = value;
        }
        if (x > 550 && x < 570) {
          retVal['unexecutedCount'] = value;
        }
        if (x > 620 && x < 640) {
          retVal['creditLine'] = value;
        }
        if (x > 680 && x < 720) {
          retVal['usedCreditLine'] = value;
        }
        if (x > 750 && x < 780) {
          retVal['cover'] = value;
        }
      }
    });

    return retVal;
  }

  readMainTable(content) {
    const col1X = 47,
      col2X = 240,
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
      if (value && el.x < col1X && !isNaN(value) && value < 99) {
        yArray.push(el.y);
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
          if (x <= col1X) {
            tempVal['sequence'] = value;
          }
          if (x > col1X && x < col2X) {
            if (this.utilService.isDomesticAccount(value)) {
              tempVal['partnerAccount'] = value;
            } else {
              if (tempVal['partner']) {
                tempVal['partner'] += ' ' + value;
              } else {
                tempVal['partner'] = value;
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
              if (tempVal['debtNumber']) {
                tempVal['debtNumber'] += ' ' + value;
              } else {
                tempVal['debtNumber'] = value;
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
      tempArray.push(tempVal);
    }

    return tempArray;
  }
}
