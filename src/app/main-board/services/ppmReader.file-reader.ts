import {AppFileReader} from './app-file.reader';

export interface ppmInfo{
  magicToken: string,
  width: number,
  height: number,
  maxValue: number
  array?: Uint8ClampedArray
}
export class PpmReaderFileReader implements AppFileReader{
  private blockSize = 4096;
  private position = 0;
  constructor() {}
  async readFile(target: File): Promise<ppmInfo> {
    let scale = 0;
    let tokens: number[] = [];
    console.time('PPM Reading');
    let ppmData: ppmInfo = await this.parseHeaderData(target);
    if(ppmData.magicToken === 'P3'){
      tokens = await this.loadP3File(target);
      let data = new Uint8ClampedArray(ppmData.width* ppmData.height * 4);
      let written:number = 0;
      scale = ppmData.maxValue === 255 ? 1 : 255/ ppmData.maxValue;
      for(let i = 0; i < data.length; i+=4){
        data[i] = Math.round(tokens[written++] * scale);
        data[i + 1] = Math.round(tokens[written++] * scale);
        data[i + 2] = Math.round(tokens[written++] * scale);
        data[i + 3] = 255;
      }
      ppmData.array = data;
    }else if(ppmData.magicToken === 'P6') {
      this.position++;
      ppmData.array = await this.loadP6File(target, ppmData);
    }
    console.timeEnd('PPM Reading');
    return ppmData;
  }
  async *readBlock(file: File): AsyncGenerator<Uint8ClampedArray> {
    let start = this.position;
    while(start < file.size){
      let end = Math.min(start+this.blockSize,file.size);
      let block = await file.slice(start,end).arrayBuffer();
      yield new Uint8ClampedArray(block);
      start = end;
    }
  }
  isWS(b: number){
    return b === 9 || b === 10 || b === 13 || b === 32;
  }
  isDigit(b: number){
    return b >= 48 && b <= 57
  }
  async parseHeaderData(target: File): Promise<ppmInfo>{
    let inComment = false;

    let sawMagic = false;
    let magicBytes: number[] = [];
    let magicHeader:string = '';

    let inNumber = false;
    let headerCount = 0;
    let currVal = 0;
    let width = 0;
    let height = 0;
    let maxVal = 0;


    for await( const chunk of this.readBlock(target)){
      for(let i = 0; i < chunk.length; i++, this.position++){

        const b = chunk[i];

        if(inComment){
          if(b === 10) inComment = false;
          continue;
        }
        if(b === 35) {
          if (inNumber) {
            if (headerCount < 3) {
              if (headerCount === 0) width = currVal;
              else if (headerCount === 1) height = currVal;
              else if (headerCount === 2) maxVal = currVal;
              headerCount++;
              if (headerCount === 3) {
                if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
                  throw new Error("Invalid image size.");
                }
                if (!Number.isFinite(maxVal) || maxVal <= 0) {
                  throw new Error("Invalid max value.");
                }
                return{
                  width,
                  height,
                  magicToken: magicHeader,
                  maxValue: maxVal
                }
              }
            }
            currVal = 0;
            inNumber = false;
          }
          inComment = true;
          continue;
        }

        if(!sawMagic){
          if(!this.isWS(b)){
            magicBytes.push(b);
            if(magicBytes.length > 4) throw new Error('Invalid file header');
            continue;
          }else{
            if(magicBytes.length > 0){
              const token = String.fromCharCode(...magicBytes)
              if(token !== "P3" && token !== "P6"){
                throw new Error('Invalid file header')
              }
              magicHeader = token;
              sawMagic = true;
              continue;
            }
          }
        }
        if(this.isDigit(b)){
          inNumber = true;
          currVal = currVal * 10 + (b - 48);
        }
        if(this.isWS(b)){
          if(inNumber){
            if(headerCount < 3){
              if(headerCount === 0) width = currVal;
              else if(headerCount === 1) height = currVal;
              else maxVal = currVal;
              headerCount++;
              if(headerCount === 3){
                if(!Number.isFinite(width)){
                  throw new Error('Invalid width');
                }if(!Number.isFinite(height)){
                  throw new Error('Invalid height');
                }if(!Number.isFinite(maxVal)){
                  throw new Error('Invalid max value');
                }
                return{
                  width,
                  height,
                  magicToken: magicHeader,
                  maxValue: maxVal
                }
              }
            }
            currVal = 0;
            inNumber = false;
          }
        }
      }
    }
    throw new Error('Invalid header data');
  }
  async loadP6File(target: File, info: ppmInfo): Promise<Uint8ClampedArray> {
    const { width, height, maxValue } = info;
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      throw new Error("Invalid image size.");
    }
    if (!Number.isFinite(maxValue) || maxValue <= 0) {
      throw new Error("Invalid max value.");
    }

    const pixels = width * height;
    const out = new Uint8ClampedArray(pixels * 4);
    const twoBytesPerSample = maxValue >= 256;
    const scale = maxValue === 255 ? 1 : 255 / maxValue;

    let outIdx = 0;
    let neededSamples = pixels * 3; // R,G,B
    let hi: number | null = null;   // do 16-bit

    const pushSample = (sample: number) => {
      const v = Math.round(sample * scale);
      out[outIdx++] = v < 0 ? 0 : v > 255 ? 255 : v;
      if ((outIdx % 4) === 3) {
        out[outIdx++] = 255;
      }
    };

    for await (const chunk of this.readBlock(target)) {
      for (let i = 0; i < chunk.length && neededSamples > 0; i++, this.position++) {
        const b = chunk[i];

        if (!twoBytesPerSample) {
          pushSample(b);
          neededSamples--;
        } else {
          if (hi === null) {
            hi = b;
          } else {
            const value = (hi << 8) | b;
            hi = null;
            pushSample(value);
            neededSamples--;
          }
        }
      }
      if (neededSamples === 0) break;
    }

    if (twoBytesPerSample && hi !== null) {
      throw new Error("Unexpected EOF: half of a 16-bit sample at the end.");
    }
    if (neededSamples !== 0) {
      throw new Error("Unexpected EOF while reading P6 pixel data.");
    }

    return out;
  }


  async loadP3File(target: File,): Promise<number[]> {
    let inComment = false;
    let inNumber = false;
    let currValue = 0;
    let tokens: number[] = [];
    for await(const chunk of this.readBlock(target)){
      for(let i = 0; i < chunk.length; i++, this.position++){
        let b = chunk[i];
        if(inComment){
          if(b === 10){
            inComment = false;
          }
          continue;
        }
        if(b === 35) {
          inComment = true;
          if(inNumber){
            tokens.push(currValue);
            currValue = 0;
            inNumber = false;
          }
          continue;
        }
        if(this.isDigit(b)){
          inNumber = true;
          currValue = currValue *10 + (b - 48);
        }else{
          if(inNumber){
            tokens.push(currValue);
            currValue = 0;
            inNumber = false;
          }
        }
      }
    }
    return tokens;
  }
}
