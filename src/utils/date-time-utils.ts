import momenttz from 'moment-timezone';
import moment from 'moment';

export class DateTimeUtils {
  /**
   *
   * @param date Date format
   * @returns Time format in HH:mm in string
   */
  static DateTimeToUTC(date: Date): string {
    const currentDate = date ? date : new Date();
    return momenttz(currentDate).tz('UTC').format('HH:mm');
  }

  /**
   * Convert military time to gmt offset
   * @param time Date Format 'HH:MM'
   * @param gmt_offset GMT offset from timezone
   */
  static calcClockTimeWithGMTOffset(
    curTime: string,
    gmt_offset: number,
  ): string {
    const inputTime = moment(curTime, 'HH:mm').format('HH:mm');
    const timeWithOffset = moment(inputTime, 'HH:mm')
      .utcOffset(gmt_offset)
      .format('HH:mm');

    return timeWithOffset;
  }

  /**
   *
   * @param currTime Current input time clock in HH:mm
   * @param currTimeGMTOffset GMT offset/ timezone from currTime
   * @returns converted clock Time, based on difference by currTimeGMTOffset with UTC +0
   */
  static convertTimeToUTC(currTime: string, currTimeGMTOffset: number): string {
    if (!currTime) {
      currTime = '00:00';
    }
    const gmtOffset = this.getDiffFromUTCOffset(currTimeGMTOffset);

    const inputTime = moment(currTime, 'HH:mm').format('HH:mm');
    return moment(inputTime, 'HH:mm').utcOffset(gmtOffset).format('HH:mm');
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

  /**
   *
   * @param day_of_week string - string from day of week in format('ddd')
   * @returns Day of week in 'd' format
   */
  static convertToDayOfWeekNumber(day_of_week: string): number {
    const dayOfWeek = moment(day_of_week, 'ddd').format('d');
    return parseInt(dayOfWeek, 10);
  }

  /**
   *
   * @param gmt_offset current input GMT offset
   * @returns GMT offset difference from UTC - 8 OR (-8) - UTC Offset
   */
  static getDiffFromUTCOffset(gmt_offset: number): number {
    return gmt_offset >= 0 ? 0 - gmt_offset : gmt_offset * -1;
  }

  static getNewThisWeekDate(currentDate: Date) {
    return moment(currentDate).subtract(1, 'week').startOf('day');
  }

  //** FIXED */
  static getNewThisWeekDates(currentDate: any) {
    return moment(currentDate)
      .subtract(1, 'week')
      .startOf('day')
      .format('YYYY-MM-DD');
  }

  /**
   *
   * @param current time 1 as current time
   * @param start time 2 as start time
   * @param end time 2 as end time
   * @returns boolean if current is between start and end
   */
  static checkTimeBetween(
    current: string,
    start: string,
    end: string,
  ): boolean {
    let dCurrent = moment(current, 'HH:mm');
    let dstart = moment(start, 'HH:mm');
    const dend = moment(end, 'HH:mm');

    if (dstart.isAfter(dend)) {
      dstart = dstart.subtract(1, 'day');

      dCurrent = dCurrent.isAfter(dend)
        ? dCurrent.subtract(1, 'day')
        : dCurrent;
    }

    return dCurrent.isBetween(dstart, dend);
  }
}
