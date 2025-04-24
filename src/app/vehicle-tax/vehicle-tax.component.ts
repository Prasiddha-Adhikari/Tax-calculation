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

  fiscalYears = ['2079/80', '2080/81', '2081/82'];
  provinces = [
    'Province 1', 'Madhesh', 'Bagmati', 'Gandaki',
    'Lumbini', 'Karnali', 'Sudurpashchim'
  ];

  nabikaranFine: number = 200;  // Nabikaran fine amount

  convertToBSDate(date: string | Date): string {
    const bsDateString = new BikramSambat(new Date(date)).toBS(); // Get the BS date as a string
    const [bsYear, bsMonth, bsDay] = bsDateString.split('-'); // Split the string into year, month, and day
    
    // Return the BS date in 'YYYY-MM-DD' format
    return `${bsYear}-${String(Number(bsMonth)).padStart(2, '0')}-${String(Number(bsDay)).padStart(2, '0')}`;
  }

  getCcRange(): string {
    if (!this.engineCapacity) return '';
    if (this.engineCapacity <= 125) return '0 - 125cc';
    else if (this.engineCapacity <= 250) return '126 - 250cc';
    else if (this.engineCapacity <= 400) return '251 - 400cc';
    else if (this.engineCapacity <= 650) return '401 - 650cc';
    else if (this.engineCapacity <= 1000) return '651 - 1000cc';
    else if (this.engineCapacity <= 1200) return '1001 - 1500cc';
    else if (this.engineCapacity <= 1500) return '1501 - 2000cc';
    else if (this.engineCapacity <= 2000) return '2001 - 2500cc';
    else if (this.engineCapacity <= 3000) return '2501 - 2900cc';
    else return 'above - 2901';
  }

  // Calculate the fine for late tax payment
  calculateFine(expiredYears: number) {
    if (!this.expiryDate || !this.taxAmount) {
      this.fine = 0;
      return;
    }

    this.fineBreakdown = [];
    let totalFine = 0;
    const baseFine = (daysLate: number) => {
      if (daysLate <= 90) return 0;
      else if (daysLate <= 120) return 0.05;
      else if (daysLate <= 180) return 0.1;
      else if (daysLate <= 365) return 0.2;
      else return 0.32;
    };

    const now = new Date();
    const expiry = new Date(this.expiryDate);
    for (let i = 1; i <= expiredYears; i++) {
      const yearDate = new Date(expiry);
      yearDate.setFullYear(yearDate.getFullYear() + i);
      const daysLate = Math.ceil((now.getTime() - yearDate.getTime()) / (1000 * 3600 * 24));
      const fineRate = baseFine(daysLate);
      const yearFine = this.taxAmount * fineRate;
      this.fineBreakdown.push({ year: expiry.getFullYear() + i, fine: yearFine });
      totalFine += yearFine;
    }

    this.fine = totalFine;
  }

  // Calculate the new expiry date
  calculateNewExpiryDate(expiredYears: number) {
    if (!this.expiryDate) return;
    const expiryDate = new Date(this.expiryDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + expiredYears + 1);
    this.nextExpiryDate = this.convertToBSDate(expiryDate);
  }

  // Check if Nabikaran is required based on the vehicle's manufacture year
  checkNabikaran() {
    if (!this.yearOfManufacture) {
      this.requiresNabikaran = false;
      return;
    }

    const currentYear = new Date().getFullYear();
    const yearsSinceManufacture = currentYear - this.yearOfManufacture;
    this.requiresNabikaran = yearsSinceManufacture >= 5;

    // Calculate missed Nabikaran years
    this.missedNabikaranYears = [];
    for (let year = this.yearOfManufacture + 5; year <= currentYear; year += 5) {
      const lastPaidYear = new Date(this.lastRenewDate).getFullYear();
      if (year > lastPaidYear) {
        this.missedNabikaranYears.push(year);
      }
    }
  }

  // Main tax calculation
  calculateTax() {
    if (!this.vehicleType || !this.engineCapacity || !this.province || !this.fiscalYear) return;

    // Base tax calculation
    if (this.vehicleType === 'motorcycle') {
      if (this.engineCapacity <= 125) this.taxAmount = 2500;
      else if (this.engineCapacity <= 250) this.taxAmount = 4500;
      else this.taxAmount = 5500;
    } else if (this.vehicleType === 'car') {
      if (this.engineCapacity <= 1000) this.taxAmount = 10000;
      else if (this.engineCapacity <= 2000) this.taxAmount = 20000;
      else this.taxAmount = 30000;
    } else if (this.vehicleType === 'threewheeler') {
      this.taxAmount = 3500;
    }

    // Calculate missed years
    const expiry = new Date(this.expiryDate);
    const now = new Date();
    const expiredYears = now.getFullYear() - expiry.getFullYear();
    this.missedYears = expiredYears;

    // Fine and Nabikaran calculations
    this.calculateFine(expiredYears);
    this.calculateNewExpiryDate(expiredYears);
    this.checkNabikaran();

    // Nabikaran fee addition
    let nabikaranFeeAmount = 0;
    if (this.requiresNabikaran) {
      nabikaranFeeAmount = this.nabikaranFine * this.missedNabikaranYears.length;
    }

    // Calculate total amount including tax, fine, and Nabikaran fee
    this.totalAmount = this.taxAmount! + (this.fine ?? 0) + nabikaranFeeAmount;
    this.showResults = true;
  }
}