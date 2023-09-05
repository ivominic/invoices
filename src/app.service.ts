import { Injectable } from '@nestjs/common';

import { convert } from 'pdf-img-convert';
import * as fs from 'fs';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  async convertPdfToImage(file: string) {
    try {
      const retArray = await convert('./files/' + file, {
        width: 3000,
        //height: 1000,
        base64: true,
        scale: 2.0,
      });

      fs.unlink('./files/' + file, (err) => {
        if (err) {
          console.error(err);
          return err;
        }
      });

      return retArray;
    } catch (e) {
      return e;
    }
  }
}
