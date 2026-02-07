import { Injectable } from '@nestjs/common';
import { UtilService } from 'src/util.service';

/** There is no way to read some specific data about bank, and summary table column names are also nonexisting,
 * so this service is different from other ones. That is the reason to call this service after all the other, to be sure that it is the right bank.
 */
@Injectable()
export class HipotekarnaPdfService {
  constructor(private readonly utilService: UtilService) {}

  parsePdf(data) {
    let retVal = {};
    let excerptType = 1;
    let clientData = this.readClientData(data.pages[0].content);
    if (
      clientData['clientName'] &&
      clientData['accountNumber']?.length === 18 &&
      clientData['number']?.length === 3 &&
      clientData['date']?.length === 11 &&
      clientData['year']?.length === 4
    ) {
      retVal = { ...clientData };
      retVal['bank'] = 'HIPOTEKARNA';
    } else {
      excerptType = 2;
      clientData = this.readClientDataRegenerated(data.pages[0].content);
      if (
        clientData['clientName'] &&
        clientData['accountNumber']?.length === 18 &&
        clientData['number']?.length === 3 &&
        clientData['date']?.length === 10 &&
        clientData['year']?.length === 4
      ) {
        retVal = { ...clientData };
        retVal['bank'] = 'HIPOTEKARNA';
      } else {
        return retVal;
      }
    }

    if (excerptType === 1) {
      let tableArray = [];
      for (let i = 0; i < data.pages.length; i++) {
        const tempArray = this.readMainTable(
          data.pages[i].content,
          tableArray,
          retVal['date'],
        );
        tableArray = [...tableArray, ...tempArray];
      }
      retVal['table'] = tableArray;
    } else if (excerptType === 2) {
      let tableArray = [];
      for (let i = 0; i < data.pages.length; i++) {
        const tempArray = this.readMainTableRegenerated(
          data.pages[i].content,
          tableArray,
          retVal['date'],
        );
        tableArray = [...tableArray, ...tempArray];
      }
      retVal['table'] = tableArray;
    }
    return retVal;
  }

  readClientData(content) {
    const retVal = {};

    content.forEach((el) => {
      const value = el.str.trim();
      if (value) {
        if (el.x > 990 && el.x < 1400 && el.y < 61 && el.y > 59) {
          retVal['clientName'] = value.trim();
        }
        if (el.x > 990 && el.x < 1200 && el.y < 143 && el.y > 141) {
          retVal['accountNumber'] = value.trim();
        }
        if (el.x > 720 && el.x < 750 && el.y < 227 && el.y > 225) {
          retVal['number'] = value.trim();
        }
        if (el.x > 900 && el.x < 1000 && el.y < 227 && el.y > 225) {
          retVal['date'] = value.trim();
        }
      }
    });
    retVal['year'] = retVal['date']?.substring(6, 10);

    return retVal;
  }

  readMainTable(content, existingArray, date) {
    const col1X = 63,
      col2X = 157,
      col3X = 550,
      col4X = 730,
      col5X = 880,
      col6X = 1200,
      col7X = 1400;
    const margin = 5;
    const tempArray = [],
      yArray = [];

    content.forEach((el) => {
      const value = el.str.trim();
      if (value === date && el.x < col1X) {
        yArray.push(el.y);
      }
    });

    //There was no example of multi page excerpt for this bank. Until there is, this block is commented out.
    //if (existingArray.length) {}

    for (let i = 0; i < yArray.length; i++) {
      const y = yArray[i];
      let nextY = y + 35;
      i < yArray.length - 1 && (nextY = yArray[i + 1]);
      const tempVal = {};

      content.forEach((el) => {
        const value = el.str.trim();
        if (value && el.y > y - margin && el.y < nextY - margin) {
          const x = el.x;
          if (x > col2X && x <= col3X && el.y > y - 1 && el.y < y + 15) {
            tempVal['partnerName'] = this.utilService.setOrAppend(
              tempVal['partnerName'],
              value,
            );
          }
          if (x > col2X && x <= col3X && el.y > y + 15) {
            tempVal['partnerAccountNumber'] =
              this.utilService.formatDomesticAccount(value);
          }
          if (x >= col3X && x <= col4X) {
            tempVal['owes'] = value.replace(',', '');
          }
          if (x >= col4X && x <= col5X) {
            tempVal['demands'] = value.replace(',', '');
          }
          if (x >= col5X && x <= col6X && el.y < y + margin) {
            tempVal['code'] = value;
          }
          if (x > col5X && x <= col6X && el.y > y + 15) {
            tempVal['purpose'] = this.utilService.setOrAppend(
              tempVal['purpose'],
              value,
            );
          }

          if (x > col6X && x < col7X && el.y < y + margin) {
            tempVal['debitNumber'] = value;
          }
          if (x > col6X && x < col7X && el.y > y + 15) {
            if (!tempVal['debitNumber']) {
              tempVal['debitNumber'] = value;
            } else {
              tempVal['approvalNumber'] = value;
            }
          }
        }
      });

      tempVal['debitNumber'] = tempVal['debitNumber']?.substring(3);
      tempVal['approvalNumber'] = tempVal['approvalNumber']?.substring(3);
      tempVal['partnerName'] &&
        (tempVal['purpose'] =
          tempVal['partnerName'] + ' ' + tempVal['purpose']);
      tempArray.push(tempVal);
    }

    return tempArray;
  }

  readClientDataRegenerated(content) {
    const retVal = {};

    content.forEach((el) => {
      const value = el.str.trim();
      if (value) {
        if (el.x > 470 && el.x < 480 && el.y < 68 && el.y > 65) {
          retVal['clientName'] = value.trim();
        }
        if (el.x > 470 && el.x < 480 && el.y < 105 && el.y > 101) {
          retVal['accountNumber'] = value.trim();
        }
        if (el.x > 320 && el.x < 470 && el.y < 145 && el.y > 141) {
          const tempArray = value
            .replaceAll('IZVOD BR. ', '')
            .trim()
            .split(' ');

          retVal['number'] = this.utilService.formatExcerptNumber(tempArray[0]);
          retVal['date'] = tempArray[3];
        }
        /*if (el.x > 720 && el.x < 750 && el.y < 227 && el.y > 225) {
          retVal['number'] = value.trim();
        }
        if (el.x > 900 && el.x < 1000 && el.y < 227 && el.y > 225) {
          retVal['date'] = value.trim();
        }*/
      }
    });
    retVal['year'] = retVal['date']?.substring(6, 10);

    return retVal;
  }

  readMainTableRegenerated(content, existingArray, date) {
    const col1X = 22.5,
      col2X = 62,
      col3X = 270,
      col4X = 350,
      col5X = 420,
      col6X = 600,
      col7X = 710;
    const margin = 5;
    const tempArray = [],
      yArray = [];

    content.forEach((el) => {
      const value = el.str.trim();
      if (value === date && el.x < col1X) {
        yArray.push(el.y);
      }
    });

    //There was no example of multi page excerpt for this bank. Until there is, this block is commented out.
    //if (existingArray.length) {}

    for (let i = 0; i < yArray.length; i++) {
      const y = yArray[i];
      let nextY = y + 20;
      i < yArray.length - 1 && (nextY = yArray[i + 1]);
      const tempVal = {};

      content.forEach((el) => {
        const value = el.str.trim();
        if (value && el.y > y - margin && el.y < nextY - margin) {
          const x = el.x;
          if (x > col2X && x <= col3X && el.y > y - 1 && el.y < y + 10) {
            tempVal['partnerName'] = this.utilService.setOrAppend(
              tempVal['partnerName'],
              value,
            );
          }
          if (x > col2X && x <= col3X && el.y > y + 10) {
            tempVal['partnerAccountNumber'] =
              this.utilService.formatDomesticAccount(value);
          }
          if (x >= col3X && x <= col4X) {
            tempVal['owes'] = value.replace(',', '');
          }
          if (x >= col4X && x <= col5X) {
            tempVal['demands'] = value.replace(',', '');
          }
          if (x >= col5X && x <= col6X && el.y < y + margin) {
            tempVal['code'] = value;
          }
          if (x > col5X && x <= col6X && el.y > y + 10) {
            tempVal['purpose'] = this.utilService.setOrAppend(
              tempVal['purpose'],
              value,
            );
          }

          if (x > col6X && x < col7X && el.y < y + margin) {
            tempVal['debitNumber'] = value;
          }
          if (x > col6X && x < col7X && el.y > y + 10) {
            tempVal['approvalNumber'] = value;
          }
        }
      });

      let tempOwes = tempVal['owes'],
        tempDemands = tempVal['demands'];
      tempOwes = tempOwes.replaceAll('.', '');
      tempVal['owes'] =
        tempOwes.substring(0, tempOwes.length - 2) +
        '.' +
        tempOwes.substring(tempOwes.length - 2);
      tempDemands = tempDemands.replaceAll('.', '');
      tempVal['demands'] =
        tempDemands.substring(0, tempDemands.length - 2) +
        '.' +
        tempDemands.substring(tempDemands.length - 2);

      tempVal['debitNumber'] = tempVal['debitNumber']?.substring(3);
      tempVal['approvalNumber'] = tempVal['approvalNumber']?.substring(3);
      tempVal['partnerName'] &&
        (tempVal['purpose'] =
          tempVal['partnerName'] + ' ' + tempVal['purpose']);
      tempArray.push(tempVal);
    }

    return tempArray;
  }

  parsePdfCard(data) {
    let retVal = {};
    const bankName = this.checkBankCard(data.pages[0].content);
    if (!bankName) {
      return retVal;
    } else {
      retVal['bank'] = bankName;
    }
    const clientData = this.readClientDataCard(data.pages[0].content);
    retVal = { ...retVal, ...clientData };

    let tableArray = [];
    for (let i = 0; i < data.pages.length; i++) {
      const tempArray = this.readMainTableCard(data.pages[i].content);
      tableArray = [...tableArray, ...tempArray];
    }
    retVal['table'] = tableArray;

    return retVal;
  }

  checkBankCard(content) {
    let name = '';
    const searchText = '907-52001-93';
    content.forEach((el) => {
      if (
        el.str.trim() === searchText &&
        el.x < 133 &&
        el.x > 130 &&
        el.y > 106 &&
        el.y < 108
      ) {
        name = 'HIPOTEKARNA';
      }
    });
    return name;
  }

  readClientDataCard(content) {
    const retVal = {};

    content.forEach((el) => {
      const value = el.str.trim();
      if (value) {
        const x = el.x;
        const y = el.y;
        if (x > 997 && x < 998 && y > 59 && y < 61) {
          retVal['name'] = value;
        }
        if (x > 997 && x < 998 && y > 141 && y < 145) {
          retVal['accountNumber'] =
            this.utilService.formatDomesticAccount(value);
        }
        if (el.x < 735 && el.x > 730 && el.y > 225 && el.y < 227) {
          retVal['number'] = value;
        }
        if (el.x < 975 && el.x > 970 && el.y > 225 && el.y < 227) {
          retVal['date'] = value;
        }
      }
    });
    retVal['year'] = retVal['date']?.substring(3, 7);
    retVal['date'] = this.utilService.getLastDayOfMonth(retVal['date']);

    return retVal;
  }

  readMainTableCard(content) {
    const col1X = 63,
      col2X = 157,
      col3X = 550,
      col4X = 730,
      col5X = 880,
      col6X = 1200,
      col7X = 1400;
    const margin = 5;
    const tempArray = [],
      yArray = [];

    content.forEach((el) => {
      const value = el.str.trim();
      if (el.x < col1X && this.utilService.isValidDateFormat(value)) {
        yArray.push(el.y);
      }
    });

    for (let i = 0; i < yArray.length; i++) {
      const y = yArray[i];
      let nextY = y + 35;
      i < yArray.length - 1 && (nextY = yArray[i + 1]);
      const tempVal = {};
      tempVal['partnerAccountNumber'] = '';

      content.forEach((el) => {
        const value = el.str.trim();
        if (
          el.x < col1X &&
          el.y > y - margin &&
          el.y < nextY - margin &&
          this.utilService.isValidDateFormat(value)
        ) {
          tempVal['itemDate'] = value;
        }
        if (value && el.y > y - margin && el.y < nextY - margin) {
          const x = el.x;
          if (x > col2X && x <= col3X && el.y > y - 1 && el.y < y + 15) {
            tempVal['partnerName'] = this.utilService.setOrAppend(
              tempVal['partnerName'],
              value,
            );
          }
          if (x > col2X && x <= col3X && el.y > y + 15) {
            tempVal['partnerAccountNumber'] =
              this.utilService.formatDomesticAccount(value);
          }
          if (x >= col3X && x <= col4X) {
            tempVal['owes'] = value.replace(',', '');
          }
          if (x >= col4X && x <= col5X) {
            tempVal['demands'] = value.replace(',', '');
          }
          if (x >= col5X && x <= col6X && el.y < y + margin) {
            tempVal['code'] = value;
          }
          if (x > col5X && x <= col6X && el.y > y + margin) {
            tempVal['purpose'] = this.utilService.setOrAppend(
              tempVal['purpose'],
              value,
            );
          }

          if (x > col6X && x < col7X && el.y < y + margin) {
            tempVal['debitNumber'] = value;
          }
          if (x > col6X && x < col7X && el.y > y + 15) {
            if (!tempVal['debitNumber']) {
              tempVal['debitNumber'] = value;
            } else {
              tempVal['approvalNumber'] = value;
            }
          }
        }
      });

      tempVal['debitNumber'] = tempVal['debitNumber']?.substring(3);
      tempVal['approvalNumber'] = tempVal['approvalNumber']?.substring(3);
      tempVal['partnerName'] &&
        (tempVal['purpose'] =
          tempVal['partnerName'] + ' ' + tempVal['purpose']);
      tempVal['purpose'] += ' ' + tempVal['itemDate'];
      tempArray.push(tempVal);
    }

    return tempArray;
  }

  parseForeignPdf(data) {
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
      const tempArray = this.readForeignMainTable(data.pages[i].content);
      tableArray = [...tableArray, ...tempArray];
    }
    retVal['table'] = tableArray;
    return retVal;
  }

  checkForeignBank(content) {
    let name = '';
    const searchText = 'HIPOTEKARNA BANKA AD';
    content.forEach((el) => {
      if (el.str.trim() === searchText && el.x == 59 && el.y > 767) {
        name = 'HIPOTEKARNA';
      }
    });
    return name;
  }

  readForeignClientData(content) {
    const retVal = {};

    content.forEach((el) => {
      const value = el.str.trim();
      if (value) {
        if (el.x > 370 && el.x < 375 && el.y < 139 && el.y > 137) {
          retVal['clientName'] = value.trim();
        }
        if (el.x > 430 && el.x < 440 && el.y < 83 && el.y > 80) {
          retVal['accountNumber'] = value.trim();
        }
        if (el.x > 505 && el.x < 510 && el.y < 46 && el.y > 44) {
          retVal['number'] = value.trim()?.substring(4, 7);
        }
        if (el.x > 497 && el.x < 498 && el.y < 94 && el.y > 93) {
          retVal['date'] = value.trim();
        }
      }
    });
    retVal['year'] = retVal['date']?.substring(6, 10);

    return retVal;
  }

  readForeignMainTable(content) {
    const col1X = 60,
      col2X = 80,
      col3X = 120,
      col4X = 290,
      col5X = 440,
      col6X = 520;
    let margin1 = 20,
      margin2 = 20;
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
      i < yArray.length - 1 && (margin2 = (yArray[i + 1] - yArray[i]) / 2);
      i > 0 && (margin1 = (yArray[i] - yArray[i - 1]) / 2);
      const tempVal = {};

      content.forEach((el) => {
        const value = el.str.trim();
        if (value && el.y > y - margin1 && el.y < y + margin2) {
          const x = el.x;
          if (x < col1X && el.y === y) {
            tempVal['sequence'] = value;
          }
          if (x > col1X && x <= col2X) {
            if (el.y < y) {
              tempVal['dateOne'] = value;
            } else {
              tempVal['dateTwo'] = value;
            }
          }
          if (x > col3X && x <= col4X) {
            if (el.y < y + 10) {
              tempVal['partnerName'] = this.utilService.setOrAppend(
                tempVal['partnerName'],
                value,
              );
            } else {
              tempVal['partnerAccountNumber'] = value;
            }
          }
          if (x >= col4X && x <= col5X) {
            tempVal['purpose'] = this.utilService.setOrAppend(
              tempVal['purpose'],
              value,
            );
          }
          if (x >= col5X && x <= col6X) {
            tempVal['owes'] = value.replaceAll('.', '').replace(',', '.');
          }
          if (x >= col6X) {
            tempVal['demands'] = value.replaceAll('.', '').replace(',', '.');
          }
        }
      });
      tempArray.push(tempVal);
    }

    return tempArray;
  }
}
