import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MulterModule } from '@nestjs/platform-express';
import { ExcerptService } from './excerpts.service';
import { HtmlParseService } from './html.parse.service';
import { XmlParseService } from './xml.parse.service';

@Module({
  imports: [MulterModule.register({ dest: './files' })],
  controllers: [AppController],
  providers: [AppService, ExcerptService, HtmlParseService, XmlParseService],
  exports: [],
})
export class AppModule {}
