import { Injectable } from '@nestjs/common';
import { UtilService } from 'src/util.service';

@Injectable()
export class LovcenPdfService {
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

    const tempAdditionalData = this.readSummaryTable(
      data.pages[data.pages.length - 1].content,
    );
    retVal = { ...retVal, ...tempAdditionalData };

    let tableArray = [];
    for (let i = 0; i < data.pages.length; i++) {
      const tempArray = this.readMainTable(data.pages[i].content);
      tableArray = [...tableArray, ...tempArray];
    }
    retVal['table'] = tableArray;

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
          retVal['accountNumber'] =
            this.utilService.formatDomesticAccount(value);
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

  readSummaryTable(content) {
    const initialStateText: string = 'Predhodno stanje',
      owesText: string = 'Dnevni promet (duguje)',
      demandsText: string = 'Dnevni promet (potražuje)',
      newStateText: string = 'Novo stanje',
      debitNumberText: string = 'Broj naloga (zaduženje)',
      approvalNumberText: string = 'Broj naloga (odobrenje)',
      totalText: string = 'UKUPNI IZNOS NAKNADA:';
    let commonY,
      initialStateX,
      owesX,
      demandsX,
      newStateX,
      debitNumberX,
      approvalNumberX,
      totalX;
    const margin = 30;
    const retVal = {};

    content.forEach((element) => {
      const value = element.str.trim();
      if (value === totalText) {
        totalX = element.x;
        commonY = element.y;
      }
      value === initialStateText && (initialStateX = element.x);
      value === owesText && (owesX = element.x);
      value === demandsText && (demandsX = element.x);
      value === newStateText && (newStateX = element.x);
      value === debitNumberText && (debitNumberX = element.x);
      value === approvalNumberText && (approvalNumberX = element.x);
    });

    content.forEach((element) => {
      const value = element.str.trim();
      if (value && element.y > commonY && element.y < commonY + 15) {
        const x = element.x;
        if (x >= totalX && x < initialStateX) {
          retVal['totalFees'] = value.replaceAll('.', '').replace(',', '.');
        }
        if (x >= initialStateX && x < owesX) {
          retVal['initialState'] = value.replaceAll('.', '').replace(',', '.');
        }
        if (x >= owesX - margin && x < demandsX) {
          retVal['totalOwes'] = value.replaceAll('.', '').replace(',', '.');
        }
        if (x >= demandsX - margin && x < newStateX) {
          retVal['totalDemands'] = value.replaceAll('.', '').replace(',', '.');
        }
        if (x >= newStateX - margin && x < debitNumberX) {
          retVal['newState'] = value.replaceAll('.', '').replace(',', '.');
        }
        if (x >= debitNumberX && x < approvalNumberX) {
          retVal['debitAuthNumber'] = value;
        }
        if (x >= approvalNumberX) {
          retVal['approvalAuthNumber'] = value;
        }
      }
    });

    return retVal;
  }

  readMainTable(content) {
    const col1Text: string = '1',
      //col2Text: string = '2',
      col3Text: string = '3',
      //col4Text: string = '4',
      col5Text: string = '5',
      col6Text: string = '6',
      col7Text: string = '7',
      col8Text: string = '8',
      commonY = this.getTitleRowY(content);
    let col1X = 50,
      //col2X,
      col3X,
      //col4X,
      col5X,
      col6X,
      col7X,
      col8X;
    const margin = 5;
    const tempArray = [],
      yArray = [];

    content.forEach((element) => {
      const value = element.str.trim();
      if (value && element.y < commonY + 3 && element.y > commonY - 3) {
        value === col1Text && (col1X = element.x);
        //value === col2Text && (col2X = element.x);
        value === col3Text && (col3X = element.x);
        //value === col4Text && (col4X = element.x);
        value === col5Text && (col5X = element.x);
        value === col6Text && (col6X = element.x);
        value === col7Text && (col7X = element.x);
        value === col8Text && (col8X = element.x);
      }
      if (value && element.y > commonY && element.x <= col1X) {
        if (this.utilService.isValidDate(value)) {
          yArray.push(element.y);
        }
      }
    });

    for (let i = 0; i < yArray.length; i++) {
      const y = yArray[i];
      let nextY = y + 30;
      i < yArray.length - 1 && (nextY = yArray[i + 1]);
      const tempVal = {};

      content.forEach((element) => {
        const value = element.str.trim();
        if (value && element.y > y - margin && element.y < nextY - margin) {
          const x = element.x;
          if (x <= col1X) {
            tempVal['col1'] = value;
          }
          if (x >= col1X - margin && x < col3X) {
            if (this.utilService.isDomesticAccount(value)) {
              tempVal['partnerAccountNumber'] =
                this.utilService.formatDomesticAccount(value);
            } else {
              tempVal['partnerName'] = value;
            }
          }
          if (x >= col3X - margin && x < col5X) {
            tempVal['owes'] = value.replaceAll('.', '').replace(',', '.');
          }
          if (x >= col5X - margin && x < col5X + 40) {
            tempVal['demands'] = value.replaceAll('.', '').replace(',', '.');
          }
          if (x >= col5X + 40 && x < col6X - 50) {
            if (element.y >= y - margin && element.y < y + 10) {
              tempVal['col6-1'] = value;
            } else {
              tempVal['purpose'] = value;
            }
          }
          if (x >= col7X - 50 && x < col8X - 50) {
            if (element.y >= y - margin && element.y < y + 10) {
              tempVal['debitNumber'] = value;
            } else {
              tempVal['approvalNumber'] = value;
            }
          }
          if (x >= col8X - 50) {
            tempVal['col8'] = value;
          }
        }
      });
      tempArray.push(tempVal);
    }

    return tempArray;
  }

  getTitleRowY(content) {
    let retVal = 0;
    content.forEach((el) => {
      const value = el.str.trim();
      if (value === '1' && el.x < 40 && el.x > 35 && el.y > 170 && el.y < 220) {
        retVal = el.y;
      }
    });
    return retVal;
  }
}
