import { Injectable } from '@nestjs/common';
import { UtilService } from 'src/util.service';

let isDone = false;
@Injectable()
export class CkbPdfService {
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
        const tempArray = this.readMainTable(data.pages[i].content, tableArray);
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
    const searchText = 'Izvod broj ',
      location = 'Lokacija';
    let counter = 0;
    content.forEach((el) => {
      if (
        el.str.trim().startsWith(searchText) &&
        el.x > 220 &&
        el.y < 78 &&
        el.y > 77
      ) {
        counter++;
      }
      if (
        el.str.trim().startsWith(location) &&
        el.x < 387 &&
        el.x > 386 &&
        el.y < 250
      ) {
        counter++;
      }
    });
    if (counter === 2) {
      name = 'CKB';
    }
    return name;
  }

  readClientData(content) {
    const searchText = 'Izvod broj ';
    const retVal = {};

    content.forEach((el) => {
      const value = el.str.trim();
      if (value && value.startsWith(searchText)) {
        if (el.x > 220 && el.y < 78 && el.y > 77) {
          const tempArray = value.split(' ');
          if (tempArray.length === 12) {
            retVal['accountNumber'] = tempArray[8];
            retVal['number'] = tempArray[2];
            retVal['date'] = tempArray[11];
          }
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
      if (value === initialStateText && el.x < 75 && el.y < 147) {
        initialY = el.y;
      }
    });

    content.forEach((el) => {
      const value = el.str.trim();
      if (value && el.x < 540 && el.y > initialY && el.y < initialY + 20) {
        const x = el.x;
        if (x < 130) {
          retVal['initialState'] = value.replaceAll('.', '').replace(',', '.');
        }
        if (x > 160 && x < 200) {
          retVal['totalOwes'] = value.replaceAll('.', '').replace(',', '.');
        }
        if (x > 220 && x < 260) {
          retVal['totalDemands'] = value.replaceAll('.', '').replace(',', '.');
        }
        if (x > 300 && x < 340) {
          retVal['newState'] = value.replaceAll('.', '').replace(',', '.');
        }

        if (x > 700 && x < 730) {
          retVal['debtCount'] = value;
        }
        if (x > 750) {
          retVal['approvalCount'] = value;
        }
      }
    });

    return retVal;
  }

  readMainTable(content, existingArray) {
    const col1X = 63,
      col2X = 130,
      col3X = 240,
      col4X = 280,
      //col5X = 380,
      col6X = 440,
      col7X = 520,
      col8X = 600, //TODO: check when there is data
      col9X = 690;
    const margin = 5;
    const tempArray = [],
      yArray = [];
    let maxY = 3000;

    content.forEach((el) => {
      const value = el.str.trim();
      if (value === 'UKUPNO') {
        maxY = el.y;
        isDone = true;
      }
      if (value && el.x < col1X && !isNaN(value) && value < 99 && el.y < maxY) {
        yArray.push(el.y);
      }
    });

    //When page break goes through a row. We need to append to the last item of previous page. Only two columns have multiple lines.
    if (existingArray.length) {
      let borderY = 250;
      yArray.length && (borderY = yArray[0]);
      content.forEach((element) => {
        const value = element.str.trim();
        if (
          ![
            'Rbr',
            'ID',
            'Račun',
            'Šifra plaćanja',
            'Datum',
            'poravnjanja',
            'valute',
            'Odliv',
            'Priliv',
            'Provizija',
            'Poziv na broj (zaduženja)',
            'Naziv / Svrha doznake',
            'Poziv na broj (odobrenja)',
          ].includes(value)
        ) {
          if (element.y < borderY && element.x < col1X + margin) {
            if (existingArray[existingArray.length - 1]['partnerName']) {
              if (existingArray[existingArray.length - 1]['purpose']) {
                existingArray[existingArray.length - 1]['purpose'] +=
                  ' ' + value;
              } else {
                existingArray[existingArray.length - 1]['purpose'] = value;
              }
            } else {
              existingArray[existingArray.length - 1]['partnerName'] = value;
            }
          }
          if (element.y < borderY && element.x > col9X) {
            if (existingArray[existingArray.length - 1]['debitNumber']) {
              if (existingArray[existingArray.length - 1]['approvalNumber']) {
                existingArray[existingArray.length - 1]['approvalNumber'] +=
                  value;
              } else {
                existingArray[existingArray.length - 1]['approvalNumber'] =
                  value;
              }
            } else {
              existingArray[existingArray.length - 1]['debitNumber'] = value;
            }
          }
        }
      });
    }

    for (let i = 0; i < yArray.length; i++) {
      const y = yArray[i];
      let nextY = y + 35;
      i < yArray.length - 1 && (nextY = yArray[i + 1]);
      const tempVal = {};

      content.forEach((el) => {
        const value = el.str.trim();
        if (value && el.y > y - margin && el.y < nextY - margin) {
          const x = el.x;
          if (x <= col1X && el.y < y + 1) {
            tempVal['sequence'] = value;
          }
          if (x <= col1X + margin && el.y > y + 7 && el.y < y + 15) {
            tempVal['partnerName'] = value;
          }
          if (x <= col1X + margin && el.y > y + 15 && el.y < nextY - margin) {
            tempVal['purpose'] = value;
          }
          if (x > col1X && x < col2X && el.y < y + 1) {
            tempVal['identifier'] = value;
          }
          if (x > col2X && x < col3X && el.y < y + 1) {
            if (this.utilService.isDomesticAccount(value)) {
              tempVal['partnerAccountNumber'] =
                this.utilService.formatDomesticAccount(value);
            }
          }
          if (x > col3X && x < col4X && el.y < y + 1) {
            tempVal['code'] = value;
          }
          if (x > col6X && x < col7X && el.y < y + 1) {
            tempVal['owes'] = value.replaceAll('.', '').replace(',', '.');
          }
          if (x > col7X && x < col8X && el.y < y + 1) {
            tempVal['demands'] = value.replaceAll('.', '').replace(',', '.');
          }
          if (x > col9X && el.y < y + 1) {
            tempVal['debitNumber'] = value;
          }
          if (x > col9X && el.y > y + margin) {
            if (!tempVal['debitNumber']) {
              tempVal['debitNumber'] = value;
            } else {
              tempVal['approvalNumber'] = value;
            }
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
        const tempAdditionalData = this.readSummaryTable(data.pages[i].content);
        retVal = { ...retVal, ...tempAdditionalData };
        tableArray = [...tableArray, ...tempArray];
      }
    }
    retVal['table'] = tableArray;

    return retVal;
  }

  checkForeignBank(content) {
    let name = '';
    const searchText = 'Devizni izvod broj ',
      iban = 'IBAN:';
    let counter = 0;
    content.forEach((el) => {
      if (
        el.str.trim().startsWith(searchText) &&
        el.x > 150 &&
        el.y < 70 &&
        el.y > 68
      ) {
        counter++;
      }
      if (el.str.trim() === iban && el.x < 580 && el.x > 570 && el.y < 94) {
        counter++;
      }
    });
    if (counter === 2) {
      name = 'CKB';
    }
    return name;
  }

  readForeignClientData(content) {
    const searchText = 'Devizni izvod broj ',
      accountPrefix = 'ME';
    const retVal = {};

    content.forEach((el) => {
      const value = el.str.trim();
      if (value && value.startsWith(searchText)) {
        if (el.x > 150 && el.y < 70 && el.y > 68) {
          const tempArray = value.split(' ');
          if (tempArray.length === 16) {
            retVal['number'] = tempArray[3];
            retVal['date'] = tempArray[15];
          }
        }
      }
      if (value && value.startsWith(accountPrefix)) {
        if (el.x > 580 && el.y < 95 && el.y > 90) {
          retVal['accountNumber'] = value.trim();
        }
      }
    });
    retVal['year'] = retVal['date']?.substring(6, 10);

    return retVal;
  }

  readForeignMainTable(content) {
    const col1X = 68,
      col2X = 92,
      col3X = 110,
      col4X = 260,
      col5X = 380,
      col6X = 440,
      col7X = 610,
      col8X = 660;
    const margin = 5;
    const tempArray = [],
      yArray = [];
    let maxY = 3000;

    content.forEach((el) => {
      const value = el.str.trim();
      if (value === 'UKUPNO:') {
        maxY = el.y;
        isDone = true;
      }
      if (value && el.x < col1X && !isNaN(value) && value < 99 && el.y < maxY) {
        yArray.push(el.y);
      }
    });

    //When page break goes through a row. We need to append to the last item of previous page. Only two columns have multiple lines.
    //Probably don't need this for foreign payments
    /*if (existingArray.length) {
      let borderY = 250;
      yArray.length && (borderY = yArray[0]);
             content.forEach((element) => {
        const value = element.str.trim();
        if (
          ![
            'rbr.',
            'nalog',
            'dat. valute',
            'odliv',
            'priliv',
            'provizija/valuta',
          ].includes(value)
        ) {
          if (element.y < borderY && element.x < col1X + margin) {
            if (existingArray[existingArray.length - 1]['partnerName']) {
              if (existingArray[existingArray.length - 1]['purpose']) {
                existingArray[existingArray.length - 1]['purpose'] +=
                  ' ' + value;
              } else {
                existingArray[existingArray.length - 1]['purpose'] = value;
              }
            } else {
              existingArray[existingArray.length - 1]['partnerName'] = value;
            }
          }
          if (element.y < borderY && element.x > col9X) {
            if (existingArray[existingArray.length - 1]['debitNumber']) {
              if (existingArray[existingArray.length - 1]['approvalNumber']) {
                existingArray[existingArray.length - 1]['approvalNumber'] +=
                  value;
              } else {
                existingArray[existingArray.length - 1]['approvalNumber'] =
                  value;
              }
            } else {
              existingArray[existingArray.length - 1]['debitNumber'] = value;
            }
          }
        }
      }); 
    }*/

    for (let i = 0; i < yArray.length; i++) {
      const y = yArray[i];
      let nextY = y + 100;
      i < yArray.length - 1 && (nextY = yArray[i + 1]);
      const tempVal = {};
      let accountHeight = y + 22,
        purposeHeight = y + 12,
        codeHeight = y + 32;

      content.forEach((el) => {
        const value = el.str.trim();
        if (value && el.y > y - margin && el.y < nextY - margin) {
          const x = el.x;
          if (value === 'Račun:' && x < 80) {
            accountHeight = el.y;
          }
          if (value === 'Opis:' && x < 80) {
            purposeHeight = el.y;
          }
          if (value === 'DEV.šifra/TRN:' && x > 500) {
            codeHeight = el.y;
          }
          if (x <= col1X && el.y < y + 1) {
            tempVal['sequence'] = value;
          }
          if (
            x > col3X - margin &&
            x <= col3X + margin &&
            el.y > accountHeight - 3 &&
            el.y < accountHeight + 3
          ) {
            const ret = this.splitByFirstDash(value.trim());
            tempVal['partnerAccountNumber'] = ret.first;
            tempVal['partnerName'] = ret.second;
          }
          if (
            x > col3X - margin &&
            x <= col3X + margin &&
            el.y > purposeHeight - 3 &&
            el.y < purposeHeight + 3
          ) {
            tempVal['purpose'] = value;
          }
          if (x > col1X && x < col2X && el.y < y + 1) {
            tempVal['identifier'] = value;
          }
          if (x > col3X + 80 && x < col4X && el.y < y + 1) {
            tempVal['date'] = value;
          }
          if (x > col7X && x < col8X && el.y > codeHeight - 3) {
            tempVal['code'] = value;
          }
          if (x > col4X && x < col5X && el.y < y + 1) {
            tempVal['owes'] = value.replaceAll('.', '').replace(',', '.');
          }
          if (x > col5X && x < col6X && el.y < y + 1) {
            tempVal['demands'] = value.replaceAll('.', '').replace(',', '.');
          }
        }
      });
      !tempVal['code'] && (tempVal['code'] = '');
      !tempVal['purpose'] && (tempVal['purpose'] = '');
      tempVal['partnerName'] &&
        (tempVal['purpose'] =
          tempVal['partnerName'] + ' ' + tempVal['purpose']);
      tempArray.push(tempVal);
    }

    return tempArray;
  }

  splitByFirstDash(input: string): {
    first: string;
    second: string;
  } {
    const index = input.indexOf('-');

    if (index === -1) {
      return {
        first: input,
        second: '',
      };
    }

    return {
      first: input.substring(0, index),
      second: input.substring(index + 1),
    };
  }
}
