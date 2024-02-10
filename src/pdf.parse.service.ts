import { Injectable } from '@nestjs/common';
import { PDFExtract, PDFExtractOptions } from 'pdf.js-extract';
import { PrvaPdfService } from './banks/prva.service';
import { AddikoPdfService } from './banks/addiko.service';
import { LovcenPdfService } from './banks/lovcen.services';
import { ZapadPdfService } from './banks/zapad.service';
import { ZiraatPdfService } from './banks/ziraat.services';
import { AdriaticPdfService } from './banks/adriatic.services';
import { UniversalPdfService } from './banks/universal.services';

@Injectable()
export class PdfParseService {
  constructor(
    private readonly addikoPdfService: AddikoPdfService,
    private readonly adriaticPdfService: AdriaticPdfService,
    private readonly lovcenPdfService: LovcenPdfService,
    private readonly prvaPdfService: PrvaPdfService,
    private readonly universalPdfService: UniversalPdfService,
    private readonly zapadPdfService: ZapadPdfService,
    private readonly ziraatPdfService: ZiraatPdfService,
  ) {}

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
        !retVal['bank'] &&
          (retVal = JSON.stringify(this.addikoPdfService.parsePdf(data)));
        !retVal['bank'] &&
          (retVal = JSON.stringify(this.lovcenPdfService.parsePdf(data)));
        !retVal['bank'] &&
          (retVal = JSON.stringify(this.adriaticPdfService.parsePdf(data)));
        !retVal['bank'] &&
          (retVal = JSON.stringify(this.universalPdfService.parsePdf(data)));
        !retVal['bank'] &&
          (retVal = JSON.stringify(this.zapadPdfService.parsePdf(data)));
        !retVal['bank'] &&
          (retVal = JSON.stringify(this.ziraatPdfService.parsePdf(data)));
      })
      .catch((err) => console.log(err));
    return retVal;
  }
}
