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
    const clientData = this.readClientData(data.pages[0].content);
    if (
      clientData['clientName'] &&
      clientData['accountNumber']?.length === 18 &&
      clientData['number']?.length === 3 &&
      clientData['date']?.length === 11 &&
      clientData['year']?.length === 4
    ) {
      retVal['bank'] = 'HIPOTEKARNA';
      retVal = { ...clientData };
    } else {
      return retVal;
    }
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
            tempVal['partnerName'] = value;
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
            tempVal['purpose'] = value;
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
      tempArray.push(tempVal);
    }

    return tempArray;
  }
}
