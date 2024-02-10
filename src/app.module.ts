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
import { ZapadPdfService } from './banks/zapad.services';
import { ZiraatPdfService } from './banks/ziraat.services';

@Module({
  imports: [MulterModule.register({ dest: './files' })],
  controllers: [AppController],
  providers: [
    AppService,
    ExcerptService,
    HtmlParseService,
    XmlParseService,
    PdfParseService,
    AddikoPdfService,
    AdriaticPdfService,
    LovcenPdfService,
    PrvaPdfService,
    UniversalPdfService,
    ZapadPdfService,
    ZiraatPdfService,
  ],
  exports: [],
})
export class AppModule {}
