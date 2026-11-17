export type ServiceFormFieldType =
  | "text"
  | "textarea"
  | "email"
  | "tel"
  | "number"
  | "select"
  | "multiselect"
  | "radio"
  | "checkbox"
  | "date"
  | "file";

export type FormConditionOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains";

export interface IFormFieldOption {
  label: string;
  value: string;
}

export interface IFormFieldCondition {
  fieldKey: string;
  operator: FormConditionOperator;
  value: string | number | boolean | string[];
}

export interface IServiceFormFieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
}

export interface IServiceFormField {
  key: string;
  label: string;
  type: ServiceFormFieldType;

  required: boolean;
  displayOrder: number;

  placeholder?: string;
  helpText?: string;

  options?: IFormFieldOption[];
  conditions?: IFormFieldCondition[];
  validation?: IServiceFormFieldValidation;

  acceptedMimeTypes?: string[];
  maxFiles?: number;
  maxFileSizeBytes?: number;
}