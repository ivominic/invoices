import { Injectable } from '@nestjs/common';
import { UtilService } from 'src/util.service';

@Injectable()
export class ZapadPdfService {
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
    //retVal = data.pages[1].content;

    return retVal;
  }

  checkBank(content) {
    let name = '';
    const searchText =
      'Ovaj dokument je validan bez pečata i potpisa Zapad banke AD.';
    content.forEach((el) => {
      if (el.str.trim() === searchText && el.x < 30 && el.y > 740) {
        name = 'ZAPAD';
      }
    });
    return name;
  }

  readClientData(content) {
    const titleStart: string = 'IZVOD RAČUNA - broj ',
      dateStart = 'za dan ';
    const retVal = {};

    content.forEach((el) => {
      const value = el.str.trim();
      if (value) {
        const x = el.x;
        const y = el.y;
        if (x > 77 && x < 78 && y > 144 && y < 154) {
          if (retVal['name']) {
            retVal['name'] += value;
          } else {
            retVal['name'] = value;
          }
        }
        if (x > 307 && x < 308 && y > 144 && y < 145) {
          retVal['accountNumber'] =
            this.utilService.formatDomesticAccount(value);
        }
        if (el.str.startsWith(titleStart) && el.y < 100 && el.x < 28) {
          const numberArray = el.str.trim().split(' ');
          retVal['number'] = numberArray[numberArray.length - 1];
        }
        if (el.str.startsWith(dateStart) && el.y < 115 && el.x < 28) {
          const dateArray = el.str.trim().split(' ');
          retVal['date'] = dateArray[dateArray.length - 1];
        }
      }
    });
    retVal['year'] = retVal['date']?.substring(6, 10);

    return retVal;
  }

  readSummaryTable(content) {
    const initialStateText: string = 'Prethodno stanje:',
      owesText: string = 'Ukupni promet - duguje:',
      demandsText: string = 'Ukupni promet - potražuje:',
      newStateText: string = 'Raspoloživo stanje:',
      finalStateText: string = 'Krajnje stanje:',
      totalText: string = 'Ukupni promet:';
    let initialY, owesY, demandsY, newY, finalY, totalY;
    const retVal = {};

    content.forEach((el) => {
      const value = el.str.trim();
      value === initialStateText && el.x < 28 && (initialY = el.y);
      value === finalStateText && el.x < 28 && (finalY = el.y);
      value === newStateText && el.x < 28 && (newY = el.y);
      value === owesText && el.x < 260 && el.x > 249 && (owesY = el.y);
      value === demandsText && el.x < 260 && el.x > 249 && (demandsY = el.y);
      value === totalText && el.x < 260 && el.x > 249 && (totalY = el.y);
    });

    content.forEach((el) => {
      const value = el.str.trim();
      if (value) {
        const x = el.x,
          y = el.y;
        if (y >= initialY - 1 && y < initialY + 1 && x > 200 && x < 220) {
          retVal['initialState'] = value.replaceAll('.', '').replace(',', '.');
        }
        if (y >= finalY - 1 && y < finalY + 1 && x > 200 && x < 220) {
          retVal['finalState'] = value.replaceAll('.', '').replace(',', '.');
        }
        if (y >= newY - 1 && y < newY + 1 && x > 200 && x < 220) {
          retVal['newState'] = value.replaceAll('.', '').replace(',', '.');
        }
        if (y >= owesY - 1 && y < owesY + 1 && x > 390 && x < 420) {
          retVal['totalOwes'] = value.replaceAll('.', '').replace(',', '.');
        }
        if (y >= demandsY - 1 && y < demandsY + 1 && x > 390 && x < 420) {
          retVal['totalDemands'] = value.replaceAll('.', '').replace(',', '.');
        }
        if (y >= totalY - 1 && y < totalY + 1 && x > 390 && x < 420) {
          retVal['dailySum'] = value.replaceAll('.', '').replace(',', '.');
        }
      }
    });

    return retVal;
  }

  readMainTable(content) {
    const col1X = 25,
      col2X = 50,
      col3X = 91,
      col4X = 264,
      col5X = 380,
      col6X = 460,
      col7X = 534;
    const margin = 10;
    const tempArray = [],
      yArray = [];

    content.forEach((el) => {
      const value = el.str.trim();
      if (value && el.x > col1X && el.x < col2X && !isNaN(value)) {
        yArray.push(el.y);
      }
    });

    for (let i = 0; i < yArray.length; i++) {
      const y = yArray[i];
      let nextY = y + 35;
      i < yArray.length - 1 && (nextY = yArray[i + 1]);
      const tempVal = {};
      tempVal['owes'] = '0';
      tempVal['demands'] = '0';

      content.forEach((el) => {
        const value = el.str.trim();
        if (value && el.y > y - margin && el.y < nextY) {
          const x = el.x;
          if (x <= col1X) {
            if (value.endsWith('.')) {
              tempVal['sequence'] = value;
            } else {
              tempVal['code'] = value;
            }
          }
          if (x >= col1X && x < col2X + margin && el.y < y + 5) {
            tempVal['transactionNumber'] = value;
          }
          if (x >= col2X && x < col3X + margin && el.y < nextY - 10) {
            if (tempVal['purpose']) {
              tempVal['partnerName'] += ' ' + tempVal['purpose'];
              tempVal['purpose'] = value;
            } else {
              if (tempVal['partnerName']) {
                tempVal['purpose'] = value;
              } else {
                tempVal['partnerName'] = value;
              }
            }
          }
          if (x >= col4X && x < col5X - margin && el.y < nextY - 5) {
            if (!tempVal['partnerAccountNumber']) {
              if (this.utilService.isDomesticAccount(value)) {
                tempVal['partnerAccountNumber'] =
                  this.utilService.formatDomesticAccount(value);
              }
            } else {
              if (!tempVal['debitNumber']) {
                tempVal['debitNumber'] = value;
              } else {
                tempVal['approvalNumber'] = value;
              }
            }
          }
          if (x >= col5X && x < col6X) {
            //tempVal['owes'] = value.replaceAll('.', '').replace(',', '.');
            tempVal['owes'] = value.replaceAll(',', '');
          }
          if (x >= col6X && x < col7X) {
            //tempVal['demands'] = value.replaceAll('.', '').replace(',', '.');
            tempVal['demands'] = value.replaceAll(',', '');
          }
          if (x >= col7X - 20) {
            //tempVal['state'] = value.replaceAll('.', '').replace(',', '.');
            tempVal['state'] = value.replaceAll(',', '');
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
    let retVal = {};
    const bankName = this.checkBank(data.pages[0].content);
    if (!bankName) {
      return retVal;
    } else {
      retVal['bank'] = bankName;
    }
    const clientData = this.readForeignClientData(data.pages[0].content);
    retVal = { ...retVal, ...clientData };

    let tableArray = [];
    for (let i = 0; i < data.pages.length; i++) {
      const tempArray = this.readForeignMainTable(data.pages[i].content);
      const tempAdditionalData = this.readSummaryTable(data.pages[i].content);
      retVal = { ...retVal, ...tempAdditionalData };
      tableArray = [...tableArray, ...tempArray];
    }
    retVal['table'] = tableArray;
    //retVal = data.pages[1].content;

    return retVal;
  }

  readForeignClientData(content) {
    const titleStart: string = 'DEVIZNI IZVOD RAČUNA - broj ',
      dateStart = 'za dan ';
    const retVal = {};

    content.forEach((el) => {
      const value = el.str.trim();
      if (value) {
        const x = el.x;
        const y = el.y;
        if (x > 79 && x < 80 && y > 145 && y < 155) {
          if (retVal['name']) {
            retVal['name'] += value;
          } else {
            retVal['name'] = value;
          }
        }
        if (x > 360 && x < 370 && y > 145 && y < 155) {
          retVal['accountNumber'] = value.trim().replaceAll(' ', '');
        }
        if (el.str.startsWith(titleStart) && el.y < 102 && el.x < 30) {
          const numberArray = el.str.trim().split(' ');
          retVal['number'] = numberArray[numberArray.length - 1];
        }
        if (el.str.startsWith(dateStart) && el.y < 135 && el.x < 30) {
          const dateArray = el.str.trim().split(' ');
          retVal['date'] = dateArray[dateArray.length - 1];
        }
      }
    });
    retVal['year'] = retVal['date']?.substring(6, 10);

    return retVal;
  }

  readForeignMainTable(content) {
    const col1X = 30,
      col2X = 140,
      col3X = 285,
      col4X = 365,
      col5X = 435,
      col6X = 495,
      col7X = 530;
    const margin = 10;
    const tempArray = [],
      yArray = [];

    content.forEach((el) => {
      const value = el.str.trim();
      if (value && el.x < col1X && !isNaN(value)) {
        yArray.push(el.y);
      }
    });

    for (let i = 0; i < yArray.length; i++) {
      const y = yArray[i];
      let nextY = y + 50;
      i < yArray.length - 1 && (nextY = yArray[i + 1]);
      const tempVal = {};
      tempVal['owes'] = '0';
      tempVal['demands'] = '0';
      tempVal['code'] = '';
      tempVal['purpose'] = '';

      content.forEach((el) => {
        const value = el.str.trim();
        if (value && el.y > y - margin && el.y < nextY) {
          const x = el.x;
          if (x < col1X) {
            if (value.endsWith('.')) {
              tempVal['sequence'] = value;
            }
          }
          if (x > col1X && x < col2X && el.y < y + 5) {
            tempVal['partnerName'] = value.trim();
          }
          if (x > col1X && x < col2X && el.y > y + 5 && el.y < y + 15) {
            tempVal['code'] = value.trim();
          }

          if (x > col1X && x < col2X && el.y > y + 25 && el.y < nextY - 5) {
            tempVal['partnerAccountNumber'] = value.trim();
          }

          if (x > col2X && x < col3X) {
            if (tempVal['purpose']) {
              tempVal['purpose'] += ' ' + value.trim();
            } else {
              tempVal['purpose'] = value.trim();
            }
          }

          if (x > col3X && x < col4X && el.y < y + 5) {
            tempVal['date'] = value.trim();
          }
          if (x > col4X && x < col5X && el.y < y + margin) {
            //tempVal['owes'] = value.replaceAll('.', '').replace(',', '.');
            tempVal['owes'] = value.replaceAll(',', '');
          }
          if (x > col5X && x < col6X && el.y < y + margin) {
            //tempVal['demands'] = value.replaceAll('.', '').replace(',', '.');
            tempVal['demands'] = value.replaceAll(',', '');
          }
          if (x > col7X && el.y < y + margin) {
            //tempVal['state'] = value.replaceAll('.', '').replace(',', '.');
            tempVal['state'] = value.replaceAll(',', '');
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
