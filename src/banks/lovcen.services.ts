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

    const tempAdditionalData = this.readSummaryTable(
      data.pages[data.pages.length - 1].content,
    );
    retVal = { ...retVal, ...tempAdditionalData };

    /*let tableArray = [];
    for (let i = 0; i < data.pages.length; i++) {
      const tempArray = this.readMainTable(data.pages[i].content, tableArray);
      
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
          retVal['owes'] = value.replaceAll('.', '').replace(',', '.');
        }
        if (x >= demandsX - margin && x < newStateX) {
          retVal['demands'] = value.replaceAll('.', '').replace(',', '.');
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
}
