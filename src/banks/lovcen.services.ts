import { Injectable } from '@nestjs/common';

@Injectable()
export class LovcenPdfService {
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

    /*let tableArray = [];
    for (let i = 0; i < data.pages.length; i++) {
      const tempArray = this.readMainTable(data.pages[i].content, tableArray);
      const tempAdditionalData = this.readSummaryTable(data.pages[i].content);
      retVal = { ...retVal, ...tempAdditionalData };
      tableArray = [...tableArray, ...tempArray];
    }
    retVal['table'] = tableArray;*/

    return retVal;
  }

  checkBank(content) {
    let name = '';
    content.forEach((el) => {
      if (el.str.trim() === 'Lovcen Banka' && el.x < 25 && el.y < 70) {
        name = 'LOVCEN';
      }
    });
    return name;
  }

  readClientData(content) {
    const titleStart: string = 'IZVOD BR.';
    const retVal = {};

    content.forEach((element) => {
      const value = element.str.trim();
      if (value) {
        const x = element.x;
        const y = element.y;
        if (x === 474 && y > 67 && y < 69) {
          retVal['name'] = value;
        }
        if (x === 474 && y > 103 && y < 104) {
          retVal['accountNumber'] = value;
        }
        if (
          element.str.startsWith(titleStart) &&
          element.y > 143 &&
          element.y < 144 &&
          element.x > 320 &&
          element.x < 335
        ) {
          const numberArray = element.str.trim().split(' ');
          retVal['number'] = numberArray[2];
          retVal['date'] = numberArray[5];
        }
      }
    });
    retVal['year'] = retVal['date']?.substring(6, 10);

    return retVal;
  }
}
