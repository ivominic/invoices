import { Injectable } from '@nestjs/common';
import { UtilService } from 'src/util.service';

let col1X = 125;

@Injectable()
export class NlbPdfService {
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

    retVal['owes'] = '0.00';
    retVal['demands'] = '0.00';

    let tableArray = [];
    for (let i = 0; i < data.pages.length; i++) {
      const tempArray = this.readMainTable(data.pages[i].content, tableArray);
      const tempAdditionalData = this.readSummaryTable(data.pages[i].content);
      retVal = { ...retVal, ...tempAdditionalData };
      tableArray = [...tableArray, ...tempArray];
    }
    retVal['table'] = tableArray;

    return retVal;
  }

  checkBank(content) {
    let name = '',
      isNameFound = false,
      isAddressFound = false;
    const searchName = 'NLB Banka',
      searchAddress = 'Bulevar Stanka Dragojevića br.46,';
    content.forEach((el) => {
      if (
        el.str.trim() === searchName &&
        el.x > 42 &&
        el.x < 45 &&
        el.y > 217 &&
        el.y < 235
      ) {
        isNameFound = true;
      }
      if (
        el.str.trim() === searchAddress &&
        el.x > 42 &&
        el.x < 45 &&
        el.y > 230 &&
        el.y < 246
      ) {
        isAddressFound = true;
      }
    });
    isNameFound && isAddressFound && (name = 'NLB');
    return name;
  }

  readClientData(content) {
    const accountText = '/ Račun:',
      numberText = 'IZVOD BR.',
      dateText = 'ZA PROMJENU SREDSTAVA NA RAČUNU DANA';
    let accountY = 0;
    const retVal = {};

    content.forEach((el) => {
      const value = el.str.trim();
      if (value) {
        const y = el.y;
        if (value.includes(accountText) && y > 270 && y < 300) {
          accountY = y;
          retVal['name'] = value.replace(accountText, '').trim();
        }

        if (value.startsWith(numberText) && y > 240 && y < 270) {
          const tempArray = value.split(' ');
          retVal['number'] = tempArray[tempArray.length - 1];
        }
        if (y > accountY - 1 && y < accountY + 1) {
          if (this.utilService.isDomesticAccount(value)) {
            retVal['accountNumber'] =
              this.utilService.formatDomesticAccount(value);
          }
        }
        if (value.startsWith(dateText) && y > 250 && y < 280) {
          const tempArray = value.split(' ');
          retVal['date'] = tempArray[tempArray.length - 3];
        }
      }
    });
    retVal['year'] = retVal['date']?.substring(6, 10);

    return retVal;
  }

  readSummaryTable(content) {
    const initialStateText: string = 'Preth. stanje';
    let initialY;
    const retVal = {};

    content.forEach((el) => {
      const value = el.str.trim();
      if (value.endsWith(initialStateText) && el.x < 55 && el.y < 360) {
        initialY = el.y + 20;
      }
    });

    content.forEach((el) => {
      const value = el.str.trim();
      if (value && el.y > initialY && el.y < initialY + 30) {
        const x = el.x;
        if (x < 70) {
          retVal['initialState'] = value.replaceAll(',', '');
        }
        if (x > 90 && x < 140) {
          retVal['totalOwes'] = value.replaceAll(',', '');
        }
        if (x > 160 && x < 190) {
          retVal['totalDemands'] = value.replaceAll(',', '');
        }
        if (x > 200 && x < 250) {
          retVal['newState'] = value.replaceAll(',', '');
        }
        if (x > 290 && x < 350) {
          !isNaN(value) && (retVal['debtCount'] = value);
        }
        if (x > 350 && x < 410) {
          !isNaN(value) && (retVal['approvalCount'] = value);
        }
      }
    });

    return retVal;
  }

  readMainTable(content, existingArray) {
    const col11X = 60,
      col2X = 200,
      col3X = 280,
      col4X = 345,
      col5X = 395,
      col6X = 430,
      col7X = 490,
      col8X = 570;
    const margin = 5;
    const tempArray = [],
      yArray = [];

    content.forEach((el) => {
      const value = el.str.trim();
      if (value && el.x < col1X && el.x > 100 && !isNaN(value) && value < 999) {
        if (yArray.length === 0) {
          col1X = el.x + el.width + 1;
        }
        !value.includes('.') && yArray.push(el.y);
      }
    });

    //When page break goes through a row. We need to append to the last item of previous page
    if (existingArray.length) {
      let borderY = 55;
      yArray.length && (borderY = yArray[0]);
      content.forEach((el) => {
        const value = el.str.trim();

        if (el.y < borderY && el.y > 35) {
          if (el.x > col1X && el.x < col2X) {
            if (this.utilService.isDomesticAccount(value)) {
              if (
                existingArray[existingArray.length - 1]['partnerAccountNumber']
              ) {
                existingArray[existingArray.length - 1][
                  'partnerAccountNumber'
                ] += value;
              } else {
                existingArray[existingArray.length - 1][
                  'partnerAccountNumber'
                ] = value;
              }
            } else {
              if (existingArray[existingArray.length - 1]['partnerName']) {
                existingArray[existingArray.length - 1]['partnerName'] +=
                  ' ' + value;
              } else {
                existingArray[existingArray.length - 1]['partnerName'] = value;
              }
            }
          }
          if (el.x < col11X && !isNaN(value)) {
            existingArray[existingArray.length - 1]['reference'] = value;
          }
          if (el.x > col2X && el.x < col3X) {
            if (existingArray[existingArray.length - 1]['bank']) {
              existingArray[existingArray.length - 1]['bank'] += ' ' + value;
            } else {
              existingArray[existingArray.length - 1]['bank'] = value;
            }
          }
          if (el.x > col3X && el.x < col4X) {
            if (value.startsWith('Naknada')) {
              existingArray[existingArray.length - 1]['owesAdditionalFee'] =
                value.replace('Naknada', '').replace(',', '');
            }
          }
          if (el.x > col6X && el.x < col7X) {
            if (existingArray[existingArray.length - 1]['purpose']) {
              existingArray[existingArray.length - 1]['purpose'] += ' ' + value;
            } else {
              existingArray[existingArray.length - 1]['purpose'] = value;
            }
          }
          if (el.x > col7X && el.x < col8X) {
            if (existingArray[existingArray.length - 1]['debitNumber']) {
              existingArray[existingArray.length - 1]['debitNumber'] += value;
            } else {
              existingArray[existingArray.length - 1]['debitNumber'] = value;
            }
          }
        }
      });
      existingArray[existingArray.length - 1]['partnerAccountNumber'] =
        this.utilService.formatDomesticAccount(
          existingArray[existingArray.length - 1]['partnerAccountNumber'],
        );
    }

    for (let i = 0; i < yArray.length; i++) {
      const y = yArray[i];
      let nextY = y + 90;
      let subY = 0;
      if (i < yArray.length - 1) {
        nextY = yArray[i + 1];
      } else {
        subY = 60;
      }
      const tempVal = {};

      content.forEach((el) => {
        const value = el.str.trim();
        if (value && el.y > y - margin && el.y < nextY - margin) {
          const x = el.x;
          if (el.x < col1X && el.x > 100 && !isNaN(value) && value < 999) {
            tempVal['sequence'] = value;
          }
          if (el.x < col11X && el.y < nextY - subY) {
            tempVal['reference'] = value;
          }
          if (x > col1X && x < col2X) {
            if (
              this.utilService.isDomesticAccount(value) &&
              !value.includes(',')
            ) {
              if (tempVal['partnerAccountNumber']) {
                tempVal['partnerAccountNumber'] += value;
              } else {
                tempVal['partnerAccountNumber'] = value;
              }
            } else {
              if (tempVal['partnerName']) {
                tempVal['partnerName'] += ' ' + value;
              } else {
                tempVal['partnerName'] = value;
              }
            }
          }
          if (x > col2X && x < col3X && el.y < nextY - subY) {
            if (tempVal['bank']) {
              tempVal['bank'] += ' ' + value;
            } else {
              tempVal['bank'] = value;
            }
          }
          if (x > col3X && x < col4X && el.y < nextY - subY) {
            if (value.startsWith('Naknada')) {
              tempVal['owesAdditionalFee'] = value
                .replace('Naknada', '')
                .replace(',', '');
            } else {
              if (tempVal['owes']) {
                if (!tempVal['owesAdditionalFee']) {
                  tempVal['owesAdditionalFee'] = value.replace(',', '');
                }
              } else {
                if (isNaN(value.replace(',', ''))) {
                  tempVal['owes'] = '0.00';
                } else {
                  tempVal['owes'] = value.replace(',', '');
                }
              }
            }
          }
          if (x > col4X && x < col5X && el.y < nextY - subY) {
            if (isNaN(value.replace(',', ''))) {
              if (!tempVal['demands']) {
                tempVal['demands'] = '0.00';
              }
            } else {
              tempVal['demands'] = value.replace(',', '');
            }
          }
          if (x > col5X - 13 && x < col6X - 10) {
            if (!tempVal['code']) {
              tempVal['code'] = value.substring(0, 4).trim();
            }
            if (tempVal['purpose']) {
              tempVal['purpose'] += ' ' + value.trim();
            } else {
              tempVal['purpose'] = value.substring(4).trim();
            }
          }
          if (x > col6X - 10 && x < col7X) {
            if (tempVal['purpose']) {
              tempVal['purpose'] += ' ' + value;
            } else {
              tempVal['purpose'] = value;
            }
          }
          if (x > col7X && x < col8X) {
            if (tempVal['debitNumber']) {
              tempVal['debitNumber'] += value;
            } else {
              tempVal['debitNumber'] = value;
            }
          }
        }
      });
      tempVal['partnerAccountNumber'] = this.utilService.formatDomesticAccount(
        tempVal['partnerAccountNumber'],
      );
      tempVal['partnerName'] &&
        (tempVal['purpose'] =
          tempVal['partnerName'] + ' ' + tempVal['purpose']);
      tempArray.push(tempVal);
    }

    return tempArray;
  }
}
