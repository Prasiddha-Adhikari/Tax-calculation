declare module 'nepali-date' {
  export default class NepaliDate {
    constructor(date: string | Date);
    format(format: string): string;
    add(amount: number, unit: string): NepaliDate;
    subtract(amount: number, unit: string): NepaliDate;
    isBefore(date: NepaliDate): boolean;
    isAfter(date: NepaliDate): boolean;
    isSame(date: NepaliDate): boolean;
    isSameOrBefore(date: NepaliDate): boolean;
    isSameOrAfter(date: NepaliDate): boolean;
    isLeapYear(): boolean;
    isValid(): boolean;
    getDate(): number;
    getMonth(): number;
    getYear(): number;
    getDay(): number;
    getDaysInMonth(): number;
    getDaysInYear(): number;
    toDate(): Date;
  }
}