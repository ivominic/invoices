import { Injectable } from '@nestjs/common';

@Injectable()
export class ZapadPdfService {
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
      if (el.str.trim() === searchText && el.x < 28 && el.y > 740) {
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
          retVal['accountNumber'] = value;
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
          retVal['owes'] = value.replaceAll('.', '').replace(',', '.');
        }
        if (y >= demandsY - 1 && y < demandsY + 1 && x > 390 && x < 420) {
          retVal['demands'] = value.replaceAll('.', '').replace(',', '.');
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
      col5X = 411,
      col6X = 482,
      col7X = 554;
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
              tempVal['client'] += ' ' + tempVal['purpose'];
              tempVal['purpose'] = value;
            } else {
              if (tempVal['client']) {
                tempVal['purpose'] = value;
              } else {
                tempVal['client'] = value;
              }
            }
          }
          if (x >= col4X && x < col5X - margin && el.y < nextY - 5) {
            if (!tempVal['accountNumber']) {
              const rgx = /^[0-9,\-]*$/;
              if (rgx.test(value)) {
                tempVal['accountNumber'] = value;
              }
            } else {
              if (!tempVal['debtNumber']) {
                tempVal['debtNumber'] = value;
              } else {
                tempVal['approvalNumber'] = value;
              }
            }
          }
          if (x >= col5X - margin && x < col6X) {
            tempVal['owes'] = value.replaceAll('.', '').replace(',', '.');
          }
          if (x >= col6X - margin && x < col7X - margin) {
            tempVal['demands'] = value.replaceAll('.', '').replace(',', '.');
          }
          if (x >= col7X - 20) {
            tempVal['state'] = value.replaceAll('.', '').replace(',', '.');
          }
        }
      });
      tempArray.push(tempVal);
    }

    return tempArray;
  }
}
