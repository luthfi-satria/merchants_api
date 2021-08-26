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
    return parseInt(moment(weekDayInWIB).format('d'), 10);
  }
}
