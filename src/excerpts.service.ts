import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { HtmlParseService } from './html.parse.service';
import { XmlParseService } from './xml.parse.service';
import { PdfParseService } from './pdf.parse.service';

@Injectable()
export class ExcerptService {
  constructor(
    private readonly htmlParseService: HtmlParseService,
    private readonly xmlParseService: XmlParseService,
    private readonly pdfParseService: PdfParseService,
  ) {}

  parseHtml(data: string) {
    console.log(data);
    return data;
  }

  async parseFile(file: string) {
    // Use fs.readFile() method to read the file
    if (
      file.toLowerCase().endsWith('html') ||
      file.toLowerCase().endsWith('htm')
    ) {
      const data = fs.readFileSync('./files/' + file, {
        encoding: 'latin1',
        flag: 'r',
      });
      return this.htmlParseService.parseHtml(data);
    }
    if (file.toLowerCase().endsWith('xml')) {
      const data = fs.readFileSync('./files/' + file, {
        encoding: 'latin1',
        flag: 'r',
      });
      return this.xmlParseService.parseXml(data);
    }
    if (file.toLowerCase().endsWith('pdf')) {
      return await this.pdfParseService.parsePdf(file);
    }
  }

  async parseExcerptFile(file: string, fileName: string) {
    // Use fs.readFile() method to read the file
    if (
      fileName.toLowerCase().endsWith('html') ||
      fileName.toLowerCase().endsWith('htm')
    ) {
      const data = fs.readFileSync('./files/' + file, {
        encoding: 'latin1',
        flag: 'r',
      });
      return this.htmlParseService.parseHtml(data);
    }
    if (fileName.toLowerCase().endsWith('xml')) {
      const data = fs.readFileSync('./files/' + file, {
        encoding: 'latin1',
        flag: 'r',
      });
      return this.xmlParseService.parseXml(data);
    }
    if (fileName.toLowerCase().endsWith('pdf')) {
      return await this.pdfParseService.parsePdf(file);
    }
  }
}
