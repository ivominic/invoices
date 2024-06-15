import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MulterModule } from '@nestjs/platform-express';
import { ExcerptService } from './excerpts.service';
import { HtmlParseService } from './html.parse.service';
import { XmlParseService } from './xml.parse.service';
import { PdfParseService } from './pdf.parse.service';
import { AddikoPdfService } from './banks/addiko.services';
import { LovcenPdfService } from './banks/lovcen.services';
import { PrvaPdfService } from './banks/prva.services';
import { AdriaticPdfService } from './banks/adriatic.services';
import { UniversalPdfService } from './banks/universal.services';
import { Universal2PdfService } from './banks/universal2.services';
import { ZapadPdfService } from './banks/zapad.services';
import { ZiraatPdfService } from './banks/ziraat.services';
import { NlbPdfService } from './banks/nlb.services';
import { UtilService } from './util.service';
import { CkbPdfService } from './banks/ckb.services';
import { HipotekarnaPdfService } from './banks/hipotekarna.services';

@Module({
  imports: [MulterModule.register({ dest: './files' })],
  controllers: [AppController],
  providers: [
    AppService,
    ExcerptService,
    HtmlParseService,
    XmlParseService,
    PdfParseService,
    UtilService,
    AddikoPdfService,
    AdriaticPdfService,
    CkbPdfService,
    HipotekarnaPdfService,
    LovcenPdfService,
    NlbPdfService,
    PrvaPdfService,
    UniversalPdfService,
    Universal2PdfService,
    ZapadPdfService,
    ZiraatPdfService,
  ],
  exports: [],
})
export class AppModule {}
