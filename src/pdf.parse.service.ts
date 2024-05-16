import { Injectable } from '@nestjs/common';
import { PDFExtract, PDFExtractOptions } from 'pdf.js-extract';
import { PrvaPdfService } from './banks/prva.services';
import { AddikoPdfService } from './banks/addiko.services';
import { LovcenPdfService } from './banks/lovcen.services';
import { ZapadPdfService } from './banks/zapad.services';
import { ZiraatPdfService } from './banks/ziraat.services';
import { AdriaticPdfService } from './banks/adriatic.services';
import { UniversalPdfService } from './banks/universal.services';
import { NlbPdfService } from './banks/nlb.services';
import { CkbPdfService } from './banks/ckb.services';
import { HipotekarnaPdfService } from './banks/hipotekarna.services';

@Injectable()
export class PdfParseService {
  constructor(
    private readonly addikoPdfService: AddikoPdfService,
    private readonly adriaticPdfService: AdriaticPdfService,
    private readonly ckbPdfService: CkbPdfService,
    private readonly hipotekarnaPdfService: HipotekarnaPdfService,
    private readonly lovcenPdfService: LovcenPdfService,
    private readonly prvaPdfService: PrvaPdfService,
    private readonly universalPdfService: UniversalPdfService,
    private readonly zapadPdfService: ZapadPdfService,
    private readonly ziraatPdfService: ZiraatPdfService,
    private readonly nlbPdfService: NlbPdfService,
  ) {}

  async parsePdf(file) {
    let retVal;
    const pdfExtract = new PDFExtract();
    const options: PDFExtractOptions = {};
    await pdfExtract
      .extract('./files/' + file, options)
      .then((data) => {
        //retVal = data;
        retVal = this.prvaPdfService.parsePdf(data);
        !retVal['bank'] && (retVal = this.addikoPdfService.parsePdf(data));
        !retVal['bank'] && (retVal = this.adriaticPdfService.parsePdf(data));
        !retVal['bank'] && (retVal = this.ckbPdfService.parsePdf(data));
        !retVal['bank'] && (retVal = this.lovcenPdfService.parsePdf(data));
        !retVal['bank'] && (retVal = this.nlbPdfService.parsePdf(data));
        !retVal['bank'] && (retVal = this.universalPdfService.parsePdf(data));
        !retVal['bank'] && (retVal = this.zapadPdfService.parsePdf(data));
        !retVal['bank'] && (retVal = this.ziraatPdfService.parsePdf(data));
        !retVal['bank'] && (retVal = this.hipotekarnaPdfService.parsePdf(data)); //last on purpose, since no way to be sure if theirs' statement.
      })
      .catch((err) => console.log(err));
    if (retVal['number']) {
      retVal['number'] = parseInt(retVal['number']).toString();
    }
    return retVal;
  }
}
