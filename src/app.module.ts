import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MulterModule } from '@nestjs/platform-express';
import { ExcerptService } from './excerpts.service';
import { HtmlParseService } from './html.parse.service';
import { XmlParseService } from './xml.parse.service';
import { PdfParseService } from './pdf.parse.service';
import { PrvaPdfService } from './banks/prva.service';
import { AddikoPdfService } from './banks/addiko.service';

@Module({
  imports: [MulterModule.register({ dest: './files' })],
  controllers: [AppController],
  providers: [
    AppService,
    ExcerptService,
    HtmlParseService,
    XmlParseService,
    PdfParseService,
    PrvaPdfService,
    AddikoPdfService,
  ],
  exports: [],
})
export class AppModule {}
