import { Injectable } from '@nestjs/common';
import { UtilService } from 'src/util.service';

@Injectable()
export class AdriaticPdfService {
  constructor(private readonly utilService: UtilService) {}

  parsePdf(data) {
    let retVal = {};
    const bankName = this.checkBank(data.pages[0].content);
    if (!bankName) {
      return retVal;
    } else {
      retVal['bank'] = bankName;
    }
    let tableArray = [];

    const clientData = this.readClientData(data.pages[0].content);
    if (clientData['name']) {
      retVal = { ...retVal, ...clientData };

      for (let i = 0; i < data.pages.length; i++) {
        const tempArray = this.readMainTable(data.pages[i].content);
        const tempAdditionalData = this.readSummaryTable(data.pages[i].content);
        retVal = { ...retVal, ...tempAdditionalData };
        tableArray = [...tableArray, ...tempArray];
      }
      retVal['table'] = tableArray;
    } else {
      //Foreign excerpt
      const foreignClientData = this.readForeignClientData(
        data.pages[0].content,
      );

      if (foreignClientData['foreignExcerpt']) {
        retVal = { ...retVal, ...foreignClientData };

        for (let i = 0; i < data.pages.length; i++) {
          const tempArray = this.readForeignMainTable(data.pages[i].content);
          const tempAdditionalData = this.readForeignSummaryTable(
            data.pages[i].content,
          );
          retVal = { ...retVal, ...tempAdditionalData };
          tableArray = [...tableArray, ...tempArray];
        }
        retVal['table'] = tableArray;
      }
    }

    return retVal;
  }

  checkBank(content) {
    let name = '';
    const searchText = 'www.adriaticbank.com';
    content.forEach((el) => {
      if (el.str.trim() === searchText && el.x > 440 && el.y > 767) {
        name = 'ADRIATIC';
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
        if (x > 372 && x < 374 && y > 132 && y < 133) {
          if (retVal['name']) {
            retVal['name'] += value;
          } else {
            retVal['name'] = value;
          }
        }
        if (x > 482 && x < 483 && y > 57 && y < 58) {
          retVal['accountNumber'] =
            this.utilService.formatDomesticAccount(value);
        }
        if (x > 531 && x < 532 && y > 45 && y < 46) {
          if (value.length > 3) {
            retVal['number'] = value.substring(value.length - 3);
          } else {
            retVal['number'] = value;
          }
        }
        if (x > 522 && x < 523 && y > 81 && y < 82) {
          retVal['date'] = value;
        }
      }
    });
    retVal['year'] = retVal['date']?.substring(6, 10);

    return retVal;
  }

  readSummaryTable(content) {
    const initialStateText: string = 'POČETNO STANJE NA DAN:',
      secondText: string = 'PROMET:',
      totalText: string = 'NOVO STANJE:';
    let initialY, secondY, totalY;
    const retVal = {};

    content.forEach((el) => {
      const value = el.str.trim();
      value === initialStateText && el.x < 57 && (initialY = el.y);
      value === secondText && el.x < 59 && (secondY = el.y);
      value === totalText && el.x < 59 && (totalY = el.y);
    });

    content.forEach((el) => {
      const value = el.str.trim();
      if (value) {
        const x = el.x,
          y = el.y;
        if (y >= initialY - 1 && y < initialY + 1 && x > 520) {
          retVal['initialState'] = value.replaceAll(',', '');
        }
        if (y >= secondY - 1 && y < secondY + 1 && x > 490 && x < 520) {
          retVal['owes'] = value.replaceAll(',', '');
        }
        if (y >= secondY - 1 && y < secondY + 1 && x > 520) {
          retVal['demands'] = value.replaceAll(',', '');
        }
        if (y >= totalY - 1 && y < totalY + 1 && x > 530) {
          retVal['newState'] = value.replaceAll(',', '');
        }
      }
    });

    return retVal;
  }

  readMainTable(content) {
    const col1X = 58,
      col2X = 98,
      col3X = 262,
      col4X = 375,
      col5X = 470,
      col6X = 520;
    const margin = 5;
    const tempArray = [],
      yArray = [];

    content.forEach((el) => {
      const value = el.str.trim();
      if (value && el.x < col1X + 1) {
        if (this.utilService.isValidDate(value)) {
          yArray.push(el.y);
        }
      }
    });

    for (let i = 0; i < yArray.length; i++) {
      const y = yArray[i];
      let nextY = y + 20;
      i < yArray.length - 1 && (nextY = yArray[i + 1]);
      const tempVal = {};

      content.forEach((el) => {
        const value = el.str.trim();
        if (value && el.y > y - margin && el.y < nextY) {
          const x = el.x;
          if (x <= col1X + 1) {
            tempVal['date'] = value;
          }
          if (x > col1X && x < col2X + margin) {
            if (el.y < y + margin) {
              tempVal['purpose'] = value;
            } else {
              const splitArray = value.split(' ');
              tempVal['firstAccountNumber'] = splitArray[0];
              if (splitArray.length > 1) {
                tempVal['code'] = splitArray[1];
              }
            }
          }
          if (x > col2X && x < col3X + margin) {
            if (el.y < y + margin) {
              tempVal['partnerName'] = value;
            } else {
              tempVal['partnerAccountNumber'] =
                this.utilService.formatDomesticAccount(value);
            }
          }
          if (x > col3X && x < col4X + margin) {
            if (el.y < y + margin) {
              tempVal['firstSubAccount'] = value;
            } else {
              tempVal['secondSubAccount'] = value;
            }
          }
          if (x > col5X && x < col6X) {
            tempVal['owes'] = value.replaceAll(',', '');
          }
          if (x > col6X) {
            tempVal['demands'] = value.replaceAll(',', '');
          }
        }
      });
      tempVal['secondSubAccount'] &&
        (tempVal['purpose'] =
          tempVal['secondSubAccount'] + ' ' + tempVal['purpose']);
      tempVal['firstSubAccount'] &&
        (tempVal['purpose'] =
          tempVal['firstSubAccount'] + ' ' + tempVal['purpose']);
      tempVal['partnerName'] &&
        (tempVal['purpose'] =
          tempVal['partnerName'] + ' ' + tempVal['purpose']);
      tempArray.push(tempVal);
    }

    return tempArray;
  }

  readForeignClientData(content) {
    const retVal = {};

    content.forEach((el) => {
      const value = el.str.trim();
      const excerptDateDomesticText = 'POČETNO STANJE NA DAN: ',
        excerptDateText = 'INITIAL BALANCE ON DAY: ';
      if (value) {
        const x = el.x;
        const y = el.y;

        if (x > 372 && x < 374 && y > 137 && y < 140) {
          if (retVal['name']) {
            retVal['name'] += value;
          } else {
            retVal['name'] = value;
          }
        }
        if (x > 400 && x < 440 && y > 80 && y < 85) {
          if (this.utilService.isForeignAccount(value)) {
            retVal['accountNumber'] = value;
            retVal['foreignExcerpt'] = true;
          }
        }
        if (x > 500 && x < 510 && y > 44 && y < 46) {
          if (value.length > 3) {
            retVal['number'] = value.substring(value.length - 3);
          } else {
            retVal['number'] = value;
          }
        }
        /*if (x > 495 && x < 500 && y > 92 && y < 94) {
          retVal['date'] = value;
        }*/
        if (value.startsWith(excerptDateText)) {
          retVal['date'] = value.replaceAll(excerptDateText, '').trim();
        }
        if (value.startsWith(excerptDateDomesticText)) {
          retVal['date'] = value.replaceAll(excerptDateDomesticText, '').trim();
        }
      }
    });
    retVal['year'] = retVal['date']?.substring(6, 10);

    return retVal;
  }

  readForeignSummaryTable(content) {
    const initialStateText: string = 'INITIAL BALANCE ON DAY: ',
      initialStateDomesticText: string = 'POČETNO STANJE NA DAN: ',
      secondText: string = 'TURNOVER:',
      secondDomesticText: string = 'PROMET:',
      totalText: string = 'BALANCE:',
      totalDomesticText: string = 'SALDO:';
    let initialY, secondY, totalY;
    const retVal = {};

    content.forEach((el) => {
      const value = el.str.trim();
      (value.startsWith(initialStateText) ||
        value.startsWith(initialStateDomesticText)) &&
        el.x < 59 &&
        (initialY = el.y);
      (value === secondText || value === secondDomesticText) &&
        el.x < 59 &&
        (secondY = el.y);
      (value === totalText || value === totalDomesticText) &&
        el.x < 59 &&
        (totalY = el.y);
    });

    content.forEach((el) => {
      const value = el.str.trim();
      if (value) {
        const x = el.x,
          y = el.y;
        if (y >= initialY - 1 && y < initialY + 1 && x > 520) {
          retVal['initialState'] = value.replaceAll(',', '');
        }
        if (y >= secondY - 1 && y < secondY + 1 && x > 440 && x < 500) {
          retVal['owes'] = value.replaceAll(',', '');
        }
        if (y >= secondY - 1 && y < secondY + 1 && x > 520) {
          retVal['demands'] = value.replaceAll(',', '');
        }
        if (y >= totalY - 1 && y < totalY + 1 && x > 520) {
          retVal['newState'] = value.replaceAll(',', '');
        }
      }
    });

    return retVal;
  }

  readForeignMainTable(content) {
    const col1X = 58,
      col2X = 120,
      col3X = 290,
      col4X = 420,
      col5X = 490;
    const yMargin = 25;
    const tempArray = [],
      yArray = [];

    content.forEach((el) => {
      const value = el.str.trim();
      if (value && el.x < col1X + 1) {
        if (this.utilService.isNumeric(value)) {
          yArray.push(el.y);
        }
      }
    });

    for (let i = 0; i < yArray.length; i++) {
      const y = yArray[i];
      const tempVal = {};

      content.forEach((el) => {
        const value = el.str.trim();
        if (value && el.y > y - yMargin && el.y < y + yMargin) {
          const x = el.x;
          if (x <= col1X + 1) {
            tempVal['sequence'] = value;
          }
          if (x > col1X && x < col2X) {
            if (el.y < y) {
              tempVal['dateOne'] = value;
            } else {
              tempVal['dateTwo'] = value;
            }
          }
          if (x > col2X && x < col3X) {
            if (tempVal['purposeOne']) {
              tempVal['purposeOne'] += ' ' + value;
            } else {
              tempVal['purposeOne'] = value;
            }
          }
          if (x > col3X && x < col4X) {
            if (tempVal['purposeTwo']) {
              tempVal['purposeTwo'] += ' ' + value;
            } else {
              tempVal['purposeTwo'] = value;
            }
          }
          if (x > col4X && x < col5X) {
            tempVal['owes'] = value.replaceAll(',', '');
          }
          if (x > col5X) {
            tempVal['demands'] = value.replaceAll(',', '');
          }
        }
      });
      tempArray.push(tempVal);
    }

    return tempArray;
  }
}
