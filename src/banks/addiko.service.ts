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

  readMainTable(content, existingArray) {
    const sequenceText: string = 'Broj',
      additionalSequenceText: string = 'Nal',
      receiverText: string = 'Naziv i sjedište',
      originText: string = 'Porijeklo naloga',
      debtText: string = 'Duguje',
      feeText: string = 'Potražuje',
      codeText: string = 'Osnov',
      purposeText: string = 'Svrha',
      modelText: string = 'Poziv na broj',
      complaintText: string = 'Obračunata naknada',
      workerText: string = 'Radnik';
    let commonY = 250,
      sequenceX = 49,
      receiverX,
      originX,
      debtX,
      feeX,
      codeX,
      purposeX,
      modelX,
      complaintX,
      workerX;
    const margin = 5;
    const tempArray = [],
      yArray = [];
    const maxY = this.findMaxY(content);

    content.forEach((element) => {
      const value = element.str.trim();
      if (value === additionalSequenceText) {
        //sequenceX = element.x;
        commonY = element.y;
      }
      value === receiverText && (receiverX = element.x);
      value === originText && (originX = element.x);
      value === debtText && (debtX = element.x);
      value === feeText && (feeX = element.x);
      value === codeText && (codeX = element.x);
      value === purposeText && (purposeX = element.x);
      value === modelText && (modelX = element.x);
      value === complaintText && (complaintX = element.x);
      value === workerText && (workerX = element.x);

      if (value && element.y > commonY && element.x <= sequenceX) {
        if (value !== sequenceText && value !== additionalSequenceText) {
          yArray.push(element.y);
        }
      }
    });

    //When page break goes through a row. We need to append to the last item of previous page
    if (existingArray.length) {
      content.forEach((element) => {
        const value = element.str.trim();
        if (
          ![
            'Naziv i sjedište',
            'primaoca nalogodavca',
            'Broj računa',
            'Porijeklo naloga',
            'Datum knjiženja',
            'Poziv na broj',
            'zaduženja/odobrenja',
          ].includes(value)
        )
          if (element.y < yArray[0] && element.x === 61) {
            const rgx = /^[0-9,\-]*$/;
            if (rgx.test(value)) {
              existingArray[existingArray.length - 1]['partnerAccount'] = value;
            } else {
              existingArray[existingArray.length - 1]['receiver'] +=
                ' ' + value;
            }
            if (element.x >= 144 && element.x < 200) {
              const dateArray = value.split('.');
              if (
                dateArray.length === 3 &&
                dateArray[0].length === 4 &&
                dateArray[1].length === 2 &&
                dateArray[2].length === 2
              ) {
                existingArray[existingArray.length - 1]['dateOrigin'] = value;
              }
            }
            if (element.x >= 555 && element.x < 560) {
              existingArray[existingArray.length - 1]['modelApprove'] = value;
            }
          }
      });
    }

    for (let i = 0; i < yArray.length; i++) {
      const y = yArray[i];
      let nextY = y + 100;
      maxY > 0 && (nextY = maxY);
      i < yArray.length - 1 && (nextY = yArray[i + 1]);
      const tempVal = {};
      tempVal['modelDebt'] = '';
      tempVal['modelApprove'] = '';
      tempVal['calculatedExpense'] = '';
      tempVal['worker'] = '';

      content.forEach((element) => {
        const value = element.str.trim();

        if (value && element.y > y - margin && element.y < nextY - margin) {
          const x = element.x;
          if (x > 48 && x < 61) {
            if (value.indexOf('. ') && value.indexOf('. ') < 3) {
              tempVal['sequenceNumber'] = value.substring(
                0,
                value.indexOf('. '),
              );
              tempVal['receiver'] = value.substring(value.indexOf('. ') + 2);
            }
          } else if (x === 61) {
            const rgx = /^[0-9,\-]*$/;
            if (rgx.test(value)) {
              tempVal['partnerAccount'] = value;
            } else {
              if (tempVal['receiver']) {
                tempVal['receiver'] += ' ' + value;
              } else {
                tempVal['receiver'] = value;
              }
            }
          }
          if (x >= 144 && x < 200) {
            const dateArray = value.split('.');
            if (
              dateArray.length === 3 &&
              dateArray[0].length === 2 &&
              dateArray[1].length === 2 &&
              dateArray[2].length === 4
            ) {
              tempVal['dateOrigin'] = value;
            } else {
              if (tempVal['origin']) {
                tempVal['origin'] += ' ' + value;
              } else {
                tempVal['origin'] = value;
              }
            }
          }
          if (x >= 310 && x < 330) {
            tempVal['debt'] = value;
          }
          if (x >= 390 && x < 400) {
            tempVal['fee'] = value;
          }
          if (x >= 427 && x < 430) {
            tempVal['code'] = value;
          }
          if (x >= 452 && x < 460) {
            if (tempVal['purpose']) {
              tempVal['purpose'] += ' ' + value;
            } else {
              tempVal['purpose'] = value;
            }
          }
          if (x >= 555 && x < 560) {
            if (element.y >= y && element.y < y + 10) {
              tempVal['modelDebt'] = value;
            } else {
              tempVal['modelApprove'] = value;
            }
          }
          if (x >= 650 && x < 660) {
            tempVal['calculatedExpense'] = value;
          }
          if (x >= 749) {
            tempVal['worker'] = value;
          }
        }
      });
      tempArray.push(tempVal);
    }

    return tempArray;
  }

  readSummaryTable(content) {
    const initialStateText: string = 'Prethodno stanje',
      owesText: string = 'Duguje',
      demandsText: string = 'Potražuje',
      newStateText: string = 'Novo stanje',
      numberAccountsText: string = 'Br.Nal.Potražuje Br.Nal.Duguje';
    let commonY, initialStateX, owesX, demandsX, newStateX, numberAccountsX;
    const margin = 30;
    const retVal = {};

    content.forEach((element) => {
      const value = element.str.trim();
      if (value === initialStateText) {
        initialStateX = element.x;
        commonY = element.y;
      }
      value === owesText && (owesX = element.x);
      value === demandsText && (demandsX = element.x);
      value === newStateText && (newStateX = element.x);
      value === numberAccountsText && (numberAccountsX = element.x);
    });

    if (initialStateX && numberAccountsX) {
      content.forEach((element) => {
        const value = element.str.trim();
        if (value && element.y > commonY && element.y < commonY + 20) {
          const x = element.x;
          if (x >= initialStateX && x < owesX - margin) {
            retVal['initialState'] = value;
          }
          if (x >= owesX - margin && x < demandsX - margin) {
            retVal['owes'] = value;
          }
          if (x >= demandsX - margin && x < newStateX - margin) {
            retVal['demands'] = value;
          }
          if (x >= newStateX - margin && x < numberAccountsX - margin) {
            retVal['newState'] = value;
          }
          if (x >= numberAccountsX) {
            if (x < 748) {
              retVal['numberAccountsDemands'] = value;
            } else {
              retVal['numberAccountsDebts'] = value;
            }
          }
        }
      });
    }

    return retVal;
  }

  findMaxY(content) {
    let retVal = 0;
    const searchValue = 'Br.Nal.Potražuje Br.Nal.Duguje';
    content.forEach((element) => {
      const value = element.str.trim();
      value === searchValue && (retVal = element.y);
    });
    return retVal;
  }
}
