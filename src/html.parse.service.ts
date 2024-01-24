import { Injectable } from '@nestjs/common';
import { parse } from 'node-html-parser';

@Injectable()
export class HtmlParseService {
  async parseHtml(data: string) {
    // Use fs.readFile() method to read the file
    /*fs.readdir('./files/', (err, files) => {
      files.forEach((file) => {
        console.log('AAAAAA', file.toString());
        if (file.toString().endsWith('xml')) {
          console.log('BBBCCCCcB', fs.readFileSync(file, 'utf-8').toString());
        }
      });
    });*/

    let retVal: string = '';
    retVal === '' && (retVal = this.parseErsteBank(data));

    return retVal;
  }

  parseErsteBank(data) {
    const root = parse(data);
    const tables = root.querySelectorAll('table');
    const bankName = tables[0]
      .querySelectorAll('tr')[1]
      .querySelector('td').innerHTML;
    if (!bankName.toString().trim().toUpperCase().startsWith('ERSTE BANK AD')) {
      return '';
    }

    const retVal = { bank: 'ERSTE' };
    const ps = root.querySelectorAll('p');
    const tempDate = ps[1]?.innerHTML.trim();
    const excerptDate = tempDate.substring(
      tempDate.length - 15,
      tempDate.length - 4,
    );
    retVal['date'] = excerptDate;

    const clientName = tables[1]
      .querySelector('tr')
      .querySelectorAll('td')[1].innerHTML;
    retVal['clientName'] = clientName;

    const thirdTableRows = tables[2].querySelectorAll('tr');
    const accountNumber = thirdTableRows[0].querySelectorAll('td')[1].innerHTML;
    retVal['accountNumber'] = accountNumber;
    const numberAndYear = thirdTableRows[3].querySelectorAll('td')[1].innerHTML;
    const number = numberAndYear.split('/')[0];
    const year = numberAndYear.split('/')[1];
    retVal['number'] = number;
    retVal['year'] = year;
    retVal['table'] = this.tableParseErsteBank(tables[3]);

    // firstTable.querySelectorAll('tr').forEach((item) => {
    //   console.log('Item', item.toString());
    // });

    return JSON.stringify(retVal);
  }

  tableParseErsteBank(table) {
    const retVal = {};
    const rows = table.querySelectorAll('tr');
    if (rows.length < 5) {
      return retVal;
    }
    const initialAmount = this.extractSingleCellNumber(
      rows[1].querySelectorAll('td')[1],
    );
    const finalAmount = this.extractSingleCellNumber(
      rows[rows.length - 1].querySelectorAll('td')[
        rows[rows.length - 1].querySelectorAll('td').length - 1
      ],
    );
    const balanceRow = rows[rows.length - 2].querySelectorAll('td');
    const turnoverArray = this.extractArrayOfCellNumbers(
      balanceRow[balanceRow.length - 2],
    );
    const finalBalanceArray = this.extractArrayOfCellNumbers(
      balanceRow[balanceRow.length - 1],
    );

    retVal['initialAmount'] = initialAmount;
    retVal['finalAmount'] = finalAmount;
    retVal['turnover1'] = turnoverArray[0];
    retVal['turnover2'] = turnoverArray[1];
    retVal['finalBalance1'] = finalBalanceArray[0];
    retVal['finalBalance2'] = finalBalanceArray[1];
    retVal['table'] = this.extractErsteMainTableData(rows);
    return retVal;
  }

  extractErsteMainTableData(rows) {
    const tempArray = [];

    for (let i = 2; i < rows.length - 2; i++) {
      const tds = rows[i].querySelectorAll('td');
      const tempItem = {};

      const rawDates = this.extractArrayOfCellValues(tds[0]);
      tempItem['documentDate'] = rawDates[0];
      tempItem['currencyDate'] = rawDates[1];
      tempItem['processingDate'] = rawDates[2];

      const rawInitiator = this.extractArrayOfCellValues(tds[1]);
      tempItem['principal'] = rawInitiator[0];
      tempItem['accountNumber'] = rawInitiator[1];
      tempItem['rate'] = rawInitiator[2];

      const rawPurpose = this.extractArrayOfCellValues(tds[2]);
      tempItem['sequenceNumber'] = rawPurpose[0];
      tempItem['transferPurpose'] = rawPurpose[1];
      tempItem['paymentCode'] = rawPurpose[2];

      const rawTransaction = this.extractArrayOfCellValues(tds[3]);
      tempItem['debitNumber'] = rawTransaction[0];
      tempItem['approvalNumber'] = rawTransaction[1];
      tempItem['referentRelation'] = rawTransaction[2];

      tempItem['expense'] = this.extractSingleCellNumber(tds[4]);
      tempItem['income'] = this.extractSingleCellNumber(tds[5]);

      tempArray.push(tempItem);
    }

    return tempArray;
  }

  extractSingleCellNumber(td) {
    return td.innerHTML
      .replace('<b>', '')
      .replace('</b>', '')
      .replace(',', '.')
      .replaceAll('"', '')
      .trim();
  }

  extractArrayOfCellNumbers(td) {
    const tempValue = td.innerHTML
      .replace('<b>', '')
      .replace('</b>', '')
      .replace(',', '.')
      .replaceAll('"', '')
      .trim();
    const returnArray = tempValue.split('<br>');
    return returnArray;
  }

  extractArrayOfCellValues(td) {
    const tempValue = td.innerHTML
      .replace('<b>', '')
      .replace('</b>', '')
      .replaceAll('"', '')
      .trim();
    const returnArray = tempValue.split('<br>');
    return returnArray;
  }
}
