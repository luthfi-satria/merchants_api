import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidatorConstraint,
} from 'class-validator';

function convertTimeToSecond(time: string): number {
  const str1: any = time.split(':');
  const totalSeconds1 = parseInt(str1[0] * 3600 + str1[1] * 60 + str1[0]);
  return totalSeconds1;
}

@ValidatorConstraint({ name: 'IsBiggerThan', async: false })
export class IsBiggerThanConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    return false;
  }
  defaultMessage(args: ValidationArguments) {
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
  validate(value: any, args: ValidationArguments) {
    return false;
  }
  defaultMessage(args: ValidationArguments) {
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
