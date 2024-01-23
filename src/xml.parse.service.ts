import { Injectable } from '@nestjs/common';
//const parse = require('xml-parser');
import * as parse from 'xml-parser';

@Injectable()
export class XmlParseService {
  async parseXml(data: string) {
    let retVal: string = '';
    retVal === '' && (retVal = this.parseCkbBank(data));

    return retVal;
  }

  parseCkbBank(data) {
    const retVal = { bank: 'CKB' };
    const obj = parse(data);

    let isCkb = false;

    const extensionBlock = obj.root.children[obj.root.children.length - 1];
    if (extensionBlock.name === 'extension') {
      if (
        extensionBlock.children[0].name === 'companybankname' &&
        extensionBlock.children[0].content
          .toUpperCase()
          .startsWith('CRNOGORSKA KOMERCIJALNA BANKA')
      ) {
        isCkb = true;
      }
    }
    if (!isCkb) {
      return '';
    }

    obj.root.children.forEach((element) => {
      console.log('**********', element.name);
      console.log('----------', element.children);
      console.log('..........', element.attributes);

      element.name === 'acctid' && (retVal['accountNumber'] = element.content);
      element.name === 'stmtnumber' && (retVal['number'] = element.content);
      if (element.name === 'ledgerbal') {
        element.children.forEach((item) => {
          if (item.name === 'dtasof') {
            const rawDate = item.content;
            const year = rawDate.substring(0, 4);
            const month = rawDate.substring(5, 7);
            const day = rawDate.substring(8, 10);
            retVal['year'] = year;
            retVal['date'] = `${day}.${month}.${year}.`;
          }
        });
      }
    });

    return JSON.stringify(retVal);
  }
}
