import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import BikramSambat from 'bikram-sambat-js';

@Component({
  selector: 'app-vehicle-tax',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicle-tax.component.html',
})
export class VehicleTaxComponent {
  currentDate: string = this.convertToBSDate(new Date());

  // Form fields
  ownerName: string = '';
  yearOfManufacture: number | null = null;
  lastRenewDate: string = '';
  expiryDate: string = '';

  vehicleType: string = '';
  engineCapacity: number | null = null;
  province: string = '';
  fiscalYear: string = '';
  fine: number | null = null;

  taxAmount: number | null = null;
  totalAmount: number | null = null;
  nextExpiryDate: string = '';
  showResults: boolean = false;
  requiresNabikaran: boolean = false;

  missedYears: number = 0;
  fineBreakdown: { year: number, fine: number }[] = [];
  missedNabikaranYears: number[] = [];
  totalNabikaranFee: number = 0;

  fiscalYears = ['2079/80', '2080/81', '2081/82'];
  provinces = [
    'Province 1', 'Madhesh', 'Bagmati', 'Gandaki',
    'Lumbini', 'Karnali', 'Sudurpashchim'
  ];

  // Convert AD date to BS (Bikram Sambat)
  convertToBSDate(date: string | Date): string {
    const bsDateString = new BikramSambat(new Date(date)).toBS();
    const [bsYear, bsMonth, bsDay] = bsDateString.split('-');
    return  `${bsYear}-${String(Number(bsMonth)).padStart(2, '0')}-${String(Number(bsDay)).padStart(2, '0')}`;
  }

  // Convert BS date to AD
  convertToADDate(bsDate: string): Date {
    const [bsYear, bsMonth, bsDay] = bsDate.split('-').map(num => parseInt(num));
    const adYear = bsYear - 57;
    return new Date(adYear, bsMonth - 1, bsDay);
  }

  getCcRange(): string {
    if (this.engineCapacity === null) return '';

    if (this.vehicleType === 'motorcycle') {
      if (this.engineCapacity <= 125) return '0 - 125cc';
      if (this.engineCapacity <= 250) return '126 - 250cc';
      if (this.engineCapacity <= 400) return '251 - 400cc';
      if (this.engineCapacity <= 650) return '401 - 650cc';
      if (this.engineCapacity <= 1000) return '651 - 1000cc';
      return '1001cc and above';
    }
    if (this.vehicleType === 'car') {
      if (this.engineCapacity <= 1000) return '0 - 1000cc';
      if (this.engineCapacity <= 1500) return '1001 - 1500cc';
      if (this.engineCapacity <= 2000) return '1501 - 2000cc';
      if (this.engineCapacity <= 2500) return '2001 - 2500cc';
      if (this.engineCapacity <= 2900) return '2501 - 2900cc';
      return '2901cc and above';
    }
    if (this.vehicleType === 'threewheeler') return 'N/A';
    return '';
  }


  calculateNabikaranFee() {
    if (!this.expiryDate || !this.lastRenewDate) {
      this.totalNabikaranFee = 0;
      this.missedNabikaranYears = [];
      return;
    }
  
    const baseNabikaranFee = 300;
    const currentYear = new Date().getFullYear();
    const expiryYear = new Date(this.convertToADDate(this.expiryDate)).getFullYear();
  
    // Track the missed Nabikaran years
    this.missedNabikaranYears = [];
  
    // Collect the missed years for Nabikaran renewals, starting from the expiry year to the current year
    for (let year = expiryYear + 1; year <= currentYear; year++) {
      this.missedNabikaranYears.push(year);
    }
  
    const missedYearsCount = this.missedNabikaranYears.length;
  
    // Start with the base fee charged for every year
    this.totalNabikaranFee =  baseNabikaranFee; // Base fee for each year from expiry year to current year
  
    // Apply penalty for missed years (100% penalty = base fee added again for missed years)
    if (missedYearsCount > 0) {
      const penaltyPerMissedYear = baseNabikaranFee; // 100% penalty = same base fee
      this.totalNabikaranFee += missedYearsCount * penaltyPerMissedYear;
    }
  }
  
  
  

  // Calculate tax based on vehicle type and other properties
  calculateTax() {
    if (!this.vehicleType || this.engineCapacity === null || !this.province || !this.fiscalYear) return;

    if (this.vehicleType === 'motorcycle') {
      if (this.engineCapacity <= 125) this.taxAmount = 2500;
      else if (this.engineCapacity <= 250) this.taxAmount = 4200;
      else if (this.engineCapacity <= 400) this.taxAmount = 5200;
      else if (this.engineCapacity <= 650) this.taxAmount = 8700;
      else if (this.engineCapacity <= 1000) this.taxAmount = 19700;
      else this.taxAmount = 29700;
    } else if (this.vehicleType === 'car') {
      if (this.engineCapacity <= 1000) this.taxAmount = 20500;
      else if (this.engineCapacity <= 1500) this.taxAmount = 23000;
      else if (this.engineCapacity <= 2000) this.taxAmount = 25000;
      else if (this.engineCapacity <= 2500) this.taxAmount = 35000;
      else if (this.engineCapacity <= 2900) this.taxAmount = 40500;
      else this.taxAmount = 58000;
    } else if (this.vehicleType === 'threewheeler') {
      this.taxAmount = 3500;
    }

    const expiry = new Date(this.convertToADDate(this.expiryDate));
    const now = new Date();
    const expiredYears = now.getFullYear() - expiry.getFullYear();
    this.missedYears = expiredYears;

    // Calculate fine and update other data
    this.calculateFine(expiredYears);
    this.calculateNewExpiryDate(expiredYears);
    this.calculateNabikaranFee();

    // Calculate total amount including tax, fine, and Nabikaran fee
    this.totalAmount = this.taxAmount! + (this.fine ?? 0) + this.totalNabikaranFee;
    this.showResults = true;
  }

  // Calculate fine based on expired years and fine rates
  calculateFine(expiredYears: number) {
    if (!this.expiryDate || !this.taxAmount) {
      this.fine = 0;
      this.fineBreakdown = [];
      return;
    }

    this.fineBreakdown = [];
    let totalFine = 0;
    const now = new Date();
    const expiryDate = new Date(this.convertToADDate(this.expiryDate));

    const baseFine = (daysLate: number) => {
      if (daysLate <= 90) return 0;
      else if (daysLate <= 120) return 0.05;
      else if (daysLate <= 180) return 0.1;
      else if (daysLate <= 365) return 0.2;
      else return 0.32;
    };

    // Calculate fine for each year
    for (let i = 1; i <= expiredYears; i++) {
      const yearDate = new Date(expiryDate);
      yearDate.setFullYear(yearDate.getFullYear() + i);

      const daysLate = Math.ceil((now.getTime() - yearDate.getTime()) / (1000 * 3600 * 24));
      const fineRate = baseFine(daysLate);
      const yearFine = this.taxAmount * fineRate;

      const bsYear = this.convertToBSDate(yearDate).split('-')[0]; // Just the BS year
      this.fineBreakdown.push({ year: parseInt(bsYear), fine: yearFine });

      totalFine += yearFine;
    }

    this.fine = totalFine;
  }

  // Calculate new expiry date based on expired years
  calculateNewExpiryDate(expiredYears: number) {
    if (!this.expiryDate) return;
    const expiryDate = new Date(this.convertToADDate(this.expiryDate));
    expiryDate.setFullYear(expiryDate.getFullYear() + expiredYears + 1);
    this.nextExpiryDate = this.convertToBSDate(expiryDate);
  }
}
