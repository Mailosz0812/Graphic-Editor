import {ValidatorFn} from '@angular/forms';

export interface FormFieldModel {
  fieldName: string;
  fieldType: string;
  label: string;
  validators?: ValidatorFn[]
}
