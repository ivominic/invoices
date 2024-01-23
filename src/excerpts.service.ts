import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { HtmlParseService } from './html.parse.service';
import { XmlParseService } from './xml.parse.service';

@Injectable()
export class ExcerptService {
  constructor(
    private readonly htmlParseService: HtmlParseService,
    private readonly xmlParseService: XmlParseService,
  ) {}

  parseHtml(data: string) {
    console.log(data);
    return data;
  }

  async parseFile(file: string) {
    // Use fs.readFile() method to read the file
    if (file.endsWith('html') || file.endsWith('htm')) {
      const data = fs.readFileSync('./files/erste.htm', {
        encoding: 'latin1',
        flag: 'r',
      });
      return this.htmlParseService.parseHtml(data);
    }
    if (file.endsWith('xml')) {
      const data = fs.readFileSync('./files/hb.xml', {
        encoding: 'latin1',
        flag: 'r',
      });
      return this.xmlParseService.parseXml(data);
    }
  }
}
