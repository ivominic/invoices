import {
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import { ExcerptService } from './excerpts.service';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly excerptService: ExcerptService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async convert(@UploadedFile() file: Express.Multer.File) {
    //console.log('AAAA', file.originalname, file.filename);
    const retVal = await this.appService.convertPdfToImage(file.filename);

    return { data: retVal };
  }

  @Get('parse')
  async parseFile() {
    return await this.excerptService.parseFile('lovcen002.pdf');
  }

  @Post('parse')
  @UseInterceptors(FileInterceptor('file'))
  async parseExcerpt(@UploadedFile() file: Express.Multer.File) {
    const retVal = await this.excerptService.parseExcerptFile(
      file.filename,
      file.originalname,
    );

    fs.unlink('./files/' + file.filename, (err) => {
      if (err) {
        console.error(err);
        return err;
      }
    });

    return retVal;
  }
}
