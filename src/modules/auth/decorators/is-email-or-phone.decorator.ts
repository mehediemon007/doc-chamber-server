import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  isEmail,
  isMobilePhone,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsEmailOrPhoneConstraint implements ValidatorConstraintInterface {
  validate(value: any) {
    return isEmail(value) || isMobilePhone(value, undefined);
  }

  defaultMessage() {
    return 'Identifier must be a valid email or phone number';
  }
}

export function IsEmailOrPhone(validationOptions?: ValidationOptions) {
  // Use lowercase 'object' here
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsEmailOrPhoneConstraint,
    });
  };
}
