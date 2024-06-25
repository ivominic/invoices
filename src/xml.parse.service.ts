import { Injectable } from '@nestjs/common';
//const parse = require('xml-parser');
import * as parse from 'xml-parser';
import { UtilService } from './util.service';

@Injectable()
export class XmlParseService {
  constructor(private readonly utilService: UtilService) {}

  async parseXml(data: string) {
    let retVal: string = '';
    retVal === '' && (retVal = this.parseCKB(data));
    retVal === '' && (retVal = this.parseHB(data));
    if (retVal['number']) {
      retVal['number'] = parseInt(retVal['number']).toString();
    }

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
      if (element.name === 'acctid') {
        retVal['accountNumber'] = this.utilService.formatDomesticAccount(
          element.content,
        );
      }

      element.name === 'stmtnumber' && (retVal['number'] = element.content);
      if (element.name === 'availbal') {
        element.children.forEach((item) => {
          if (item.name === 'dtasof') {
            const rawDate = item.content;
            const year = rawDate.substring(0, 4);
            const month = rawDate.substring(5, 7);
            const day = rawDate.substring(8, 10);
            retVal['year'] = year;
            retVal['date'] = `${day}.${month}.${year}.`;
          }
          if (item.name === 'balamt') {
            retVal['finalAmount'] = item.content;
          }
        });
      }
      if (element.name === 'ledgerbal') {
        element.children.forEach((item) => {
          if (item.name === 'balamt') {
            retVal['initialAmount'] = item.content;
          }
        });
      }
      if (element.name === 'trnlist') {
        retVal['table'] = this.tableParseCkb(element);
      }
    });

    return JSON.stringify(retVal);
  }

  tableParseCkb(table) {
    const tempArray = [];
    table.children.forEach((item) => {
      const tempItem = {};
      item.children.forEach((element) => {
        if (element.name === 'trntype') {
          tempItem['trnType'] = element.content;
        }
        if (element.name === 'fitid') {
          tempItem['fitId'] = element.content;
        }
        if (element.name === 'benefit') {
          tempItem['benefit'] = element.content;
        }
        if (element.name === 'payeeinfo') {
          element.children.forEach((record) => {
            if (record.name === 'name') {
              tempItem['partnerName'] = record.content;
            }
            if (record.name === 'city') {
              tempItem['payeeInfoCity'] = record.content;
            }
          });
        }
        if (element.name === 'payeeaccountinfo') {
          element.children.forEach((record) => {
            if (record.name === 'acctid') {
              tempItem['partnerAccountNumber'] =
                this.utilService.formatDomesticAccount(record.content);
            }
            if (record.name === 'bankid') {
              tempItem['payeeAccountInfoBankId'] = record.content;
            }
            if (record.name === 'bankname') {
              tempItem['payeeAccountInfoBankName'] = record.content;
            }
          });
        }
        if (element.name === 'dtposted') {
          tempItem['datePosted'] = element.content;
        }
        if (element.name === 'trnamt') {
          tempItem['trnAmount'] = element.content;
        }
        if (element.name === 'purpose') {
          tempItem['purpose'] = element.content;
        }
        if (element.name === 'purposecode') {
          tempItem['purposeCode'] = element.content;
        }
        if (element.name === 'curdef') {
          tempItem['curDef'] = element.content;
        }
        if (element.name === 'trnplace') {
          tempItem['trnPlace'] = element.content;
        }
        if (element.name === 'dtuser') {
          tempItem['dateUser'] = element.content;
        }
        if (element.name === 'dtavail') {
          tempItem['dateAvailable'] = element.content;
        }
        if (element.name === 'refmodel') {
          tempItem['refModel'] = element.content;
        }
        if (element.name === 'payeerefmodel') {
          tempItem['payeeRefModel'] = element.content;
        }
        if (element.name === 'urgency') {
          tempItem['urgency'] = element.content;
        }
        if (element.name === 'fee') {
          tempItem['fee'] = element.content;
        }
      });
      tempItem['debitNumber'] = '';
      tempItem['approvalNumber'] = '';
      tempItem['owes'] = 0.0;
      tempItem['demands'] = 0.0;
      if (tempItem['benefit'] === 'debit') {
        tempItem['owes'] = tempItem['trnAmount'];
      }
      if (tempItem['benefit'] === 'credit') {
        tempItem['demands'] = tempItem['trnAmount'];
      }
      tempItem['partnerName'] &&
        (tempItem['purpose'] =
          tempItem['partnerName'] + ' ' + tempItem['purpose']);

      tempArray.push(tempItem);
    });

    return tempArray;
  }

  parseHB(data) {
    const retVal = { bank: 'HIPOTEKARNA' };
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
      if (element.name === 'acctid') {
        retVal['accountNumber'] = this.utilService.formatDomesticAccount(
          element.content,
        );
      }

      element.name === 'stmtnumber' && (retVal['number'] = element.content);
      if (element.name === 'availbal') {
        element.children.forEach((item) => {
          if (item.name === 'dtasof') {
            const rawDate = item.content;
            const year = rawDate.substring(0, 4);
            const month = rawDate.substring(5, 7);
            const day = rawDate.substring(8, 10);
            retVal['year'] = year;
            retVal['date'] = `${day}.${month}.${year}.`;
          }
          if (item.name === 'balamt') {
            retVal['finalAmount'] = item.content;
          }
        });
      }
      if (element.name === 'ledgerbal') {
        element.children.forEach((item) => {
          if (item.name === 'balamt') {
            retVal['initialAmount'] = item.content;
          }
        });
      }
      if (element.name === 'trnlist') {
        retVal['table'] = this.tableParseCkb(element);
      }
    });

    return JSON.stringify(retVal);
  }
}
