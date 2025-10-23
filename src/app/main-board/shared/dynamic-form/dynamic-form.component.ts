import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormFieldModel} from '../formField.model';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {NgForOf} from '@angular/common';

@Component({
  selector: 'app-dynamic-form',
  imports: [
    NgForOf,
    ReactiveFormsModule
  ],
  templateUrl: './dynamic-form.component.html',
  styleUrl: './dynamic-form.component.css'
})
export class DynamicFormComponent implements OnInit{
  @Input({
    required: true
  }) formFields: FormFieldModel[] = [];
  @Input({
    required: true
  }) formTitle: string = ''
  form!: FormGroup;
  @Output() formSubmit = new EventEmitter<any>();
  constructor(private fb: FormBuilder) {}
  ngOnInit(): void {
    const group: any = {};
    this.formFields.forEach(field => {
      group[field.fieldName] = [0];
    });
    this.form = this.fb.group(group);
  }
  onSubmit(){
    this.formSubmit.emit(this.form.value);
  }
}
