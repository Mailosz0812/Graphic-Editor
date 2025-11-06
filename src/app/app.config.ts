import {ApplicationConfig, ErrorHandler, provideZoneChangeDetection} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {GlobalErrorHandler} from './main-board/errorHandling/global-error.handler';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes),
    [{ provide: ErrorHandler, useClass: GlobalErrorHandler }]]
};
