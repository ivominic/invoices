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
    const retval = await this.appService.convertPdfToImage(file.filename);

    return { data: retval };
  }

  @Get('parse')
  async parseFile() {
    return await this.excerptService.parseFile('erste.htm');
  }
}
