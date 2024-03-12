import { Injectable } from '@nestjs/common';
import { UtilService } from 'src/util.service';

@Injectable()
export class PrvaPdfService {
  constructor(private readonly utilService: UtilService) {}

  parsePdf(data) {
    let retVal = {};
    //retVal = JSON.stringify(data.pages[0].content);
    const bankName = this.checkBank(data.pages[0].content);
    if (!bankName) {
      return retVal;
    } else {
      retVal['bank'] = bankName;
    }
    const clientData = this.readClientData(data.pages[0].content);
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
    retVal['table'] = tableArray;

    return retVal;
  }

  checkBank(content) {
    let name = '';
    content.forEach((element) => {
      if (element.str.toLowerCase().trim().endsWith('info@prvabankacg.com')) {
        name = 'PRVA';
      }
    });
    return name;
  }

  readClientData(content) {
    const nameText: string = 'Naziv:',
      accountText: string = 'Račun:',
      numberText: string = 'Izvod broj:',
      dateText: string = 'Datum izvoda:';
    const retVal = {};
    const clientXY = {},
      accountXY = {},
      numberXY = {},
      dateXY = {};

    content.forEach((element) => {
      if (element.str.trim() === nameText && element.y < 200) {
        clientXY['x'] = element.x;
        clientXY['y'] = element.y;
      }
      if (element.str.trim() === accountText && element.y < 200) {
        accountXY['x'] = element.x;
        accountXY['y'] = element.y;
      }
      if (element.str.trim() === numberText && element.y < 200) {
        numberXY['x'] = element.x;
        numberXY['y'] = element.y;
      }
      if (element.str.trim() === dateText && element.y < 200) {
        dateXY['x'] = element.x;
        dateXY['y'] = element.y;
      }
    });

    content.forEach((element) => {
      const value = element.str.trim();
      if (value) {
        const x = element.x;
        const y = element.y;
        if (y === clientXY['y'] && x < clientXY['x'] + 100) {
          value !== nameText && (retVal['name'] = value);
        }
        if (y === accountXY['y'] && x < accountXY['x'] + 100) {
          value !== accountText && (retVal['accountNumber'] = value);
        }
        if (y === numberXY['y'] && x < numberXY['x'] + 150) {
          value !== numberText && (retVal['number'] = value);
        }
        if (y === dateXY['y'] && x < dateXY['x'] + 150) {
          value !== dateText && (retVal['date'] = value);
        }
      }
    });
    retVal['year'] = retVal['date']?.substring(6, 10);

    return retVal;
  }

  readSummaryTable(content) {
    const initialStateText: string = 'Prethodno stanje',
      owesText: string = 'Duguje',
      demandsText: string = 'Potražuje',
      newStateText: string = 'Novo stanje',
      debitAuthNumberText: string = 'Broj naloga zaduženja/odobrenja',
      executedOrdersText: string = 'Broj izvršenih naloga',
      unexecutedOrdersText: string = 'Broj neizvršenih naloga',
      outlineLoanText: string = 'Okvirni kredit',
      usedText: string = 'Iskorišćeni',
      unusedText: string = 'Neiskorišćeni';
    let commonY,
      initialStateX,
      owesX,
      demandsX,
      newStateX,
      debitAuthNumberX,
      executedOrdersX,
      unexecutedOrdersX,
      outlineLoanX,
      usedX,
      unusedX;
    const margin = 30;
    const retVal = {};

    content.forEach((element) => {
      const value = element.str.trim();
      if (value && element.y < 220 && element.y > 210) {
        if (value === initialStateText) {
          initialStateX = element.x;
          commonY = element.y;
        }
        value === owesText && (owesX = element.x);
        value === demandsText && (demandsX = element.x);
        value === newStateText && (newStateX = element.x);
        value === debitAuthNumberText && (debitAuthNumberX = element.x);
        value === executedOrdersText && (executedOrdersX = element.x);
        value === unexecutedOrdersText && (unexecutedOrdersX = element.x);
        value === outlineLoanText && (outlineLoanX = element.x);
        value === usedText && (usedX = element.x);
        value === unusedText && (unusedX = element.x);
      }
    });

    content.forEach((element) => {
      const value = element.str.trim();
      if (value && element.y > commonY && element.y < commonY + 15) {
        const x = element.x;
        if (x >= initialStateX && x < owesX) {
          retVal['initialState'] = value.replaceAll('.', '').replace(',', '.');
        }
        if (x >= owesX - margin && x < demandsX) {
          retVal['owes'] = value.replaceAll('.', '').replace(',', '.');
        }
        if (x >= demandsX - margin && x < newStateX) {
          retVal['demands'] = value.replaceAll('.', '').replace(',', '.');
        }
        if (x >= newStateX - margin && x < debitAuthNumberX) {
          retVal['newState'] = value.replaceAll('.', '').replace(',', '.');
        }
        if (x >= debitAuthNumberX && x < executedOrdersX) {
          retVal['debitAuthNumber'] = value;
        }
        if (x >= executedOrdersX && x < unexecutedOrdersX) {
          retVal['executedOrdersNumber'] = value;
        }
        if (x >= unexecutedOrdersX && x < outlineLoanX) {
          retVal['unexecutedOrdersNumber'] = value;
        }
        if (x >= outlineLoanX - margin && x < usedX) {
          retVal['outlineLoan'] = value.replaceAll('.', '').replace(',', '.');
        }
        if (x >= usedX - margin && x < unusedX) {
          retVal['used'] = value.replaceAll('.', '').replace(',', '.');
        }
        if (x >= unusedX - margin) {
          retVal['unused'] = value.replaceAll('.', '').replace(',', '.');
        }
      }
    });

    return retVal;
  }

  readMainTable(content, pageNumber) {
    const sequenceText: string = 'RB',
      receiverText: string = 'Primalac plaćanja/platilac',
      originText: string = 'Porijeklo',
      debtText: string = 'Zaduženje',
      approvalText: string = 'Odobrenje',
      codeText: string = 'Šifra',
      purposeText: string = 'Svrha plaćanja',
      modelText: string = '(model) Broj zaduženja',
      complaintText: string = 'Podaci za';
    const createdText: string = 'Kreirano';
    let commonY = 240,
      sequenceX = 50,
      receiverX,
      originX,
      debtX,
      approvalX,
      codeX,
      purposeX,
      modelX,
      complaintX;
    const margin = 5;
    const tempArray = [],
      yArray = [];

    if (pageNumber) {
      commonY = 45;
    }
    let maxY = 30000; //If there are non executed transaction, we need to stop rows parsing

    content.forEach((element) => {
      const value = element.str.trim();
      if (value === 'NEIZVRŠENI NALOZI') {
        maxY = element.y; //If there are non executed transaction, we need to stop rows parsing
      }
      if (value && element.y < commonY + 60 && element.y > commonY) {
        if (value === sequenceText) {
          sequenceX = element.x;
          commonY = element.y;
        }
        value === receiverText && (receiverX = element.x);
        value === originText && (originX = element.x);
        value === debtText && (debtX = element.x);
        value === approvalText && (approvalX = element.x);
        value === codeText && (codeX = element.x);
        value === purposeText && (purposeX = element.x);
        value === modelText && (modelX = element.x);
        value === complaintText && (complaintX = element.x);
      }
      if (
        value &&
        element.y > commonY &&
        element.y < maxY &&
        element.x <= sequenceX
      ) {
        if (value !== sequenceText && !value.startsWith(createdText)) {
          yArray.push(element.y);
        }
      }
    });

    for (let i = 0; i < yArray.length; i++) {
      const y = yArray[i];
      let nextY = y + 37;
      i < yArray.length - 1 && (nextY = yArray[i + 1]);
      const tempVal = {};

      content.forEach((element) => {
        const value = element.str.trim();
        if (value && element.y > y - margin && element.y < nextY - margin) {
          const x = element.x;
          if (x <= sequenceX) {
            tempVal['sequenceNumber'] = value;
          }
          if (x >= receiverX - margin && x < originX) {
            if (this.utilService.isDomesticAccount(value)) {
              tempVal['partnerAccount'] = value;
            } else {
              if (tempVal['receiver']) {
                tempVal['receiver'] = tempVal['receiver'] + ' ' + value;
              } else {
                tempVal['receiver'] = value;
              }
            }
          }
          if (x >= originX - margin && x < debtX) {
            if (this.utilService.isValidReverseDate(value)) {
              tempVal['dateOrigin'] = value;
            } else {
              if (tempVal['origin']) {
                tempVal['origin'] = tempVal['origin'] + ' ' + value;
              } else {
                tempVal['origin'] = value;
              }
            }
          }
          if (x >= debtX - margin && x < approvalX) {
            if (element.y > y && element.y < y + 10) {
              tempVal['debt'] = value.replaceAll('.', '').replace(',', '.');
            } else {
              tempVal['fee'] = value;
            }
          }
          if (x >= approvalX && x < codeX) {
            tempVal['approval'] = value.replaceAll('.', '').replace(',', '.');
          }
          if (x >= codeX && x < purposeX) {
            tempVal['code'] = value;
          }
          if (x >= purposeX && x < modelX) {
            if (tempVal['purpose']) {
              tempVal['purpose'] = tempVal['purpose'] + ' ' + value;
            } else {
              tempVal['purpose'] = value;
            }
          }
          if (x >= modelX - margin && x < complaintX - 50) {
            if (element.y > y && element.y < y + 10) {
              tempVal['modelDebt'] = value;
            } else {
              tempVal['modelApprove'] = value;
            }
          }
          if (x >= complaintX - 50) {
            if (tempVal['complaint']) {
              tempVal['complaint'] = tempVal['complaint'] + ' ' + value;
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
