import {ppmInfo} from './ppmReader.file-reader';

export interface AppFileReader {
  readFile(target: File): Promise<ppmInfo>;
}
