import {Injectable, NgZone} from '@angular/core';
import {Subject} from 'rxjs';
import {HttpErrorResponse} from '@angular/common/http';

export interface UIError{
  message: string,
  raw: Error | HttpErrorResponse
}
@Injectable({
  providedIn: 'root'
})
export class ErrorBusService {
  private readonly _errors = new Subject<UIError>();
  errors = this._errors.asObservable();

  constructor(private zone: NgZone) { }

  setError(error: Error){
    const err = this.normalize(error);
    this.zone.run(() => this._errors.next(err))
  }

  private normalize(error: Error): UIError {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) return { message: 'Cannot connect with the server', raw: error };
      return { message: `Error ${error.status}: ${error.statusText || 'The request failed'}`, raw: error };
    }
      return { message: error.message || 'Unexpected error occurred.', raw: error };
  }
}
