import { Injectable } from '@nestjs/common';
//import { parse } from 'node-html-parser';
import * as cheerio from 'cheerio';

@Injectable()
export class HtmlParseService {
  async parseHtml(data: string) {
    let retVal: string = '';
    retVal === '' && (retVal = this.parseErsteBank(data));

    return retVal;
  }

  parseErsteBank(data) {
    const dataJson = {};
    const $ = cheerio.load(data);
    const firstTable = $('table');
    const bankName = firstTable.find('tr').next('tr').find('td').html().trim();
    if (!bankName.toUpperCase().startsWith('ERSTE BANK AD')) {
      return '';
    }

    dataJson['bank'] = 'ERSTE';
    const rDate = $('p').next('p').text();
    const excerptDate = rDate.substring(rDate.length - 12, rDate.length).trim();
    dataJson['date'] = excerptDate;

    const thirdTable = $('table').next('table').next('table');
    const accountNumber = thirdTable.find('tr').find('td').next('td').html();
    dataJson['accountNumber'] = accountNumber;
    const numberAndYear = thirdTable
      .find('tr')
      .next('tr')
      .next('tr')
      .next('tr')
      .find('td')
      .next('td')
      .html();
    const number = numberAndYear.split('/')[0];
    const year = numberAndYear.split('/')[1];
    dataJson['number'] = number;
    dataJson['year'] = year;

    const forthTable = $('table').next('table').next('table').next('table');
    dataJson['table'] = this.tableParseErsteBank(forthTable, dataJson);
    return JSON.stringify(dataJson);
  }

  /**
   * This method reads initial amount from the first row, final amount from the last row.
   * Turnovers and final balances from the row previous from the last, and that's where iteration of rows stops.
   * Parsing data from each row is done from the extractErsteMainRow method, and it's results are added to the array.
   * @param table - main table of htm. Contains details for all changes
   * @param dataJson - response object
   * @returns
   */
  tableParseErsteBank(table, dataJson) {
    const tempArray = [];
    const rows = table.find('tr');
    let isAvailable = true;
    let row = rows.next('tr');
    dataJson['initialAmount'] = this.extractSingleCellNumber(
      row.find('td').next('td').next('td').html(),
    );

    while (isAvailable) {
      row = row.next('tr');
      if (row.find('td').html().includes('Stanje na dan')) {
        isAvailable = false;
        const fifthCell = row
          .find('td')
          .next('td')
          .next('td')
          .next('td')
          .next('td')
          .html();
        const sixthCell = row
          .find('td')
          .next('td')
          .next('td')
          .next('td')
          .next('td')
          .next('td')
          .html();
        const turnoverArray = this.extractArrayOfCellNumbers(fifthCell);
        dataJson['turnover1'] = turnoverArray[0].trim();
        dataJson['turnover2'] = turnoverArray[1].trim();
        const finalBalanceArray = this.extractArrayOfCellNumbers(sixthCell);
        dataJson['finalBalance1'] = finalBalanceArray[0].trim();
        dataJson['finalBalance2'] = finalBalanceArray[1].trim();
      } else {
        tempArray.push(this.extractErsteMainRow(row));
      }
    }
    dataJson['finalAmount'] = this.extractSingleCellNumber(
      row.next('tr').find('td').next('td').next('td').html(),
    );

    return tempArray;
  }

  extractErsteMainRow(row) {
    const tempItem = {};

    let tempCell = row.find('td');
    const rawDates = this.extractArrayOfCellValues(tempCell.html());
    tempItem['documentDate'] = rawDates[0];
    tempItem['currencyDate'] = rawDates[1];
    tempItem['processingDate'] = rawDates[2];

    tempCell = tempCell.next('td');
    const rawInitiator = this.extractArrayOfCellValues(tempCell.html());
    tempItem['principal'] = rawInitiator[0];
    tempItem['accountNumber'] = rawInitiator[1];
    tempItem['rate'] = rawInitiator[2];

    tempCell = tempCell.next('td');
    const rawPurpose = this.extractArrayOfCellValues(tempCell.html());
    tempItem['sequenceNumber'] = rawPurpose[0];
    tempItem['transferPurpose'] = rawPurpose[1];
    tempItem['paymentCode'] = rawPurpose[2];

    tempCell = tempCell.next('td');
    const rawTransaction = this.extractArrayOfCellValues(tempCell.html());
    tempItem['debitNumber'] = rawTransaction[0];
    tempItem['approvalNumber'] = rawTransaction[1];
    tempItem['referentRelation'] = rawTransaction[2];

    tempCell = tempCell.next('td');
    tempItem['expense'] = this.extractSingleCellNumber(tempCell.html());
    tempCell = tempCell.next('td');
    tempItem['income'] = this.extractSingleCellNumber(tempCell.html());

    return tempItem;
  }

  extractSingleCellNumber(content: string) {
    return content
      .replaceAll('<b>', '')
      .replaceAll('</b>', '')
      .replaceAll(',', '.')
      .replaceAll('"', '')
      .trim();
  }

  extractArrayOfCellNumbers(content) {
    const tempValue = content
      .replaceAll('<b>', '')
      .replaceAll('</b>', '')
      .replaceAll('&nbsp;', '')
      .replaceAll(',', '.')
      .replaceAll('"', '')
      .replaceAll(' ', '');
    const returnArray = tempValue.split('<br>');
    return returnArray;
  }

  extractArrayOfCellValues(content) {
    let tempValue = content
      .replaceAll('<b>', '')
      .replaceAll('</b>', '')
      .replaceAll('&nbsp;', '')
      .replaceAll('"', '')
      .trim();
    tempValue = this.replaceNationalCharacters(tempValue);
    const returnArray = tempValue.split('<br>');
    return returnArray;
  }

  replaceNationalCharacters(content) {
    return content.replaceAll('è', 'č');
  }
}