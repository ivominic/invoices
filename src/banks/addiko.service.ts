import { Injectable } from '@nestjs/common';

@Injectable()
export class AddikoPdfService {
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
    console.log('retVal', retVal);
    /*
    
    const summaryTable = this.readSummaryTable(data.pages[0].content);
    retVal = { ...retVal, ...clientData, ...summaryTable };

    let tableArray = [];
    let isValidTable = true;
    for (let i = 0; i < data.pages.length; i++) {
      if (isValidTable) {
        const tempArray = this.readMainTable(data.pages[i].content, i);
        tableArray = [...tableArray, ...tempArray];
      }
      data.pages[i].content.forEach((element) => {
        if (element.str === 'NEIZVRŠENI NALOZI') {
          isValidTable = false;
        }
      });
    }
    retVal['table'] = tableArray;*/
    retVal = JSON.stringify(data.pages[0].content);

    return retVal;
  }

  checkBank(content) {
    let name = '';
    content.forEach((element) => {
      if (
        element.str.trim().endsWith('ADDIKO BANK A.D.') &&
        element.x < 30 &&
        element.y < 90
      ) {
        name = 'ADDIKO';
      }
    });
    return name;
  }

  readClientData(content) {
    const firstLineStart: string = 'Izvod broj',
      secondLineStart: string = 'Stanje i promjene sredstava na dan';
    const retVal = {};

    content.forEach((element) => {
      if (
        element.str.trim() &&
        element.y > 81 &&
        element.y < 82 &&
        element.x === 502
      ) {
        retVal['name'] = element.str.trim();
      }
      if (
        element.str.startsWith(firstLineStart) &&
        element.y > 220 &&
        element.y < 230 &&
        element.x > 320 &&
        element.x < 380
      ) {
        const numberArray = element.str.trim().split(' ');
        retVal['number'] = numberArray[2];
        retVal['accountNumber'] = numberArray[5];
      }
      if (
        element.str.startsWith(secondLineStart) &&
        element.y > 240 &&
        element.y < 250 &&
        element.x > 310 &&
        element.x < 330
      ) {
        const dateArray = element.str.trim().split(' ');
        retVal['date'] = dateArray[dateArray.length - 1];
        retVal['year'] = retVal['date'].substring(6, 10);
      }
    });

    return retVal;
  }
}
