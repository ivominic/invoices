import { Injectable } from '@nestjs/common';
//const parse = require('xml-parser');
import * as parse from 'xml-parser';

@Injectable()
export class XmlParseService {
  async parseXml(data: string) {
    let retVal: string = '';
    retVal === '' && (retVal = this.parseCKB(data));
    retVal === '' && (retVal = this.parseHB(data));

    return retVal;
  }

  parseCKB(data) {
    const retVal = { bank: 'CKB' };
    const obj = parse(data);

    const extensionBlock = obj.root.children[obj.root.children.length - 1];
    if (
      !(
        extensionBlock?.name === 'extension' &&
        extensionBlock?.children[0]?.name === 'companybankname' &&
        extensionBlock?.children[0]?.content
          .toUpperCase()
          .startsWith('CRNOGORSKA KOMERCIJALNA BANKA')
      )
    ) {
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

  parseHB(data) {
    console.log('HB');
    const retVal = { bank: 'HB' };
    const obj = parse(data);

    if (
      obj.root.name !== 'stmtrslist' &&
      obj.root.children[0].name !== 'stmtrs'
    ) {
      return '';
    }

    let extensionBlock;
    obj.root.children[0].children.forEach((element) => {
      if (element.name === 'extension') {
        extensionBlock = element;
      }
    });

    if (
      !(
        extensionBlock?.name === 'extension' &&
        extensionBlock.children[0].name === 'companybankname' &&
        extensionBlock.children[0].content
          .toUpperCase()
          .startsWith('HIPOTEKARNA BANKA')
      )
    ) {
      return '';
    }

    obj.root.children[0].children.forEach((element) => {
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
