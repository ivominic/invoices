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

    // firstTable.querySelectorAll('tr').forEach((item) => {
    //   console.log('Item', item.toString());
    // });

    return JSON.stringify(retVal);
  }
}
