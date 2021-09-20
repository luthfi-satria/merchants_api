import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraintInterface,
  ValidatorConstraint,
} from 'class-validator';

@ValidatorConstraint({ name: 'IsBiggerThan', async: false })
export class IsBiggerThanConstraint implements ValidatorConstraintInterface {
  validate() {
    return false;
  }
  defaultMessage() {
    return `open hour should not more that than close_hour`;
  }
}

export function IsBiggerThan(
  property: string,
  validationOptions?: ValidationOptions,
) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: IsBiggerThanConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'IsLowerThan', async: false })
export class IsLowerThanConstraint implements ValidatorConstraintInterface {
  validate() {
    return false;
  }
  defaultMessage() {
    return `close_hour value should not below from open_hour`;
  }
}

export function IsLowerThan(
  property: string,
  validationOption?: ValidationOptions,
) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (object: Object, propertyName) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOption,
      constraints: [property],
      validator: IsLowerThanConstraint,
    });
  };
}
