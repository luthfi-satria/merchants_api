import momenttz from 'moment-timezone';
import moment from 'moment';

export class DateTimeUtils {
  /**
   *
   * @param date Date format
   * @returns Time format in HH:mm in string
   */
  static DateTimeToWIB(date: Date): string {
    const currentDate = date ? date : new Date();
    return momenttz(currentDate).tz('Asia/Jakarta').format('HH:mm');
  }

  /**
   *
   * @returns Day of Week (0-6) in number
   */
  static getDayOfWeekInWIB(): number {
    const serverDate = new Date();
    const weekDayInWIB = momenttz(serverDate)
      .tz('Asia/Jakarta')
      .format('YYYY-MM-DD');
    return parseInt(moment(weekDayInWIB).format('d'), 10) - 1;
  }

  /**
   *
   * @returns Day of Week in word (Mon, Tue, ... Sun)
   */
  static getWordDayOfWeekInWIB(): string {
    const serverDate = new Date();
    const weekDayInWIB = momenttz(serverDate)
      .tz('Asia/Jakarta')
      .format('YYYY-MM-DD');

    const dayOfWeek = moment(weekDayInWIB)
      .format('ddd')
      .toString()
      .toLowerCase();

    return dayOfWeek;
  }

  /**
   *
   * @param day_in_number number - day in number format ('d')
   * @returns Day of week in 'ddd' format
   */
  static convertToDayOfWeek(day_in_number: number) {
    const dayOfWeek = moment(day_in_number, 'd')
      .format('ddd')
      .toString()
      .toLowerCase();
    return dayOfWeek;
  }
}
