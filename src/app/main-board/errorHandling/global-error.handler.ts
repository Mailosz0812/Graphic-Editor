import { ErrorHandler, Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {ErrorBusService} from './error-bus.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private errBus: ErrorBusService) {
  }
  handleError(error: unknown): void {
    const err = (error instanceof HttpErrorResponse) ? error
      : (error instanceof Error ? error : new Error(String(error)));
    console.log(error);
    this.errBus.setError(err);
  }
}
