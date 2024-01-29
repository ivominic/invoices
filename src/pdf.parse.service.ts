import { Injectable } from '@nestjs/common';
import { PDFExtract, PDFExtractOptions } from 'pdf.js-extract';
import { PrvaPdfService } from './banks/prva.service';

@Injectable()
export class PdfParseService {
  constructor(private readonly prvaPdfService: PrvaPdfService) {}

  async parsePdf(file) {
    let retVal: string = '';
    const pdfExtract = new PDFExtract();
    const options: PDFExtractOptions = {}; /* see below */
    await pdfExtract
      .extract('./files/' + file, options)
      .then((data) => {
        //console.log('DATA', data);
        //console.log('pages', data.pages[0].content);
        retVal = JSON.stringify(this.prvaPdfService.parsePdf(data));
      })
      .catch((err) => console.log(err));
    return retVal;
  }
}
