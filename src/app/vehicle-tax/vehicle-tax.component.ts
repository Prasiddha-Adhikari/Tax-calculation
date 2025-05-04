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

  ownerName = '';
  yearOfManufacture: number | null = null;
  lastRenewDate = '';
  expiryDate = '';
  nextExpiryDate = '';

  vehicleType: 'motorcycle' | 'car' | 'threewheeler' | '' = '';
  engineCapacity: number | null = null;
  province = '';
  fiscalYear = '';
  fine: number = 0;

  taxAmount: number = 0;
  totalAmount: number = 0;
  showResults = false;
  requiresNabikaran = false;

  missedYears = 0;
  fineBreakdown: { year: number; fine: number }[] = [];
  missedNabikaranYears: number[] = [];
  totalNabikaranFee = 0;

  fiscalYears = ['2079/80', '2080/81', '2081/82'];
  provinces = [
    'Province 1', 'Madhesh', 'Bagmati', 'Gandaki',
    'Lumbini', 'Karnali', 'Sudurpashchim'
  ];

  convertToBSDate(date: string | Date): string {
    const bsDateString = new BikramSambat(new Date(date)).toBS();
    const [bsYear, bsMonth, bsDay] = bsDateString.split('-');
    return `${bsYear}-${String(bsMonth).padStart(2, '0')}-${String(bsDay).padStart(2, '0')}`;
  }

  convertToADDate(bsDate: string): Date {
    const [bsYear, bsMonth, bsDay] = bsDate.split('-').map(Number);
    const adYear = bsYear - 57;
    return new Date(adYear, bsMonth - 1, bsDay);
  }

  getCcRange(): string {
    if (this.engineCapacity == null) return '';

    const cc = this.engineCapacity;
    switch (this.vehicleType) {
      case 'motorcycle':
        if (cc <= 125) return '0 - 125cc';
        if (cc <= 250) return '126 - 250cc';
        if (cc <= 400) return '251 - 400cc';
        if (cc <= 650) return '401 - 650cc';
        if (cc <= 1000) return '651 - 1000cc';
        return '1001cc and above';
      case 'car':
        if (cc <= 1000) return '0 - 1000cc';
        if (cc <= 1500) return '1001 - 1500cc';
        if (cc <= 2000) return '1501 - 2000cc';
        if (cc <= 2500) return '2001 - 2500cc';
        if (cc <= 2900) return '2501 - 2900cc';
        return '2901cc and above';
      case 'threewheeler':
        return 'N/A';
      default:
        return '';
    }
  }

  calculateTax() {
    if (!this.vehicleType || this.engineCapacity == null || !this.province || !this.fiscalYear) return;

    const cc = this.engineCapacity;
    switch (this.vehicleType) {
      case 'motorcycle':
        this.taxAmount = cc <= 125 ? 2500 :
                         cc <= 250 ? 4200 :
                         cc <= 400 ? 5200 :
                         cc <= 650 ? 8700 :
                         cc <= 1000 ? 19700 : 29700;
        break;
      case 'car':
        this.taxAmount = cc <= 1000 ? 20500 :
                         cc <= 1500 ? 23000 :
                         cc <= 2000 ? 25000 :
                         cc <= 2500 ? 35000 :
                         cc <= 2900 ? 40500 : 58000;
        break;
      case 'threewheeler':
        this.taxAmount = 3500;
        break;
    }

    const expiryAD = this.convertToADDate(this.expiryDate);
    const now = new Date();

    // If the expiry date is in the future, no fine
    if (expiryAD > now) {
      this.missedYears = 0;
      this.fine = 0;
      this.totalNabikaranFee = 0;
      this.totalAmount = this.taxAmount;
      this.calculateNewExpiryDate(0);
      this.showResults = true;
      return;
    }

    const expiredDays = Math.ceil((now.getTime() - expiryAD.getTime()) / (1000 * 3600 * 24)); // Number of days overdue
    this.missedYears = Math.floor(expiredDays / 365); // Full years missed, to show in the breakdown

    // Call calculateFine to calculate fine based on overdue days
    this.calculateFine(expiredDays);
    this.calculateNabikaranFee();
    this.calculateNewExpiryDate(this.missedYears);

    // Total amount includes tax, fine, and nabikaran fee
    this.totalAmount = this.taxAmount + this.fine + this.totalNabikaranFee;
    this.showResults = true;
  }

  calculateFine(overdueDays: number) {
    this.fineBreakdown = [];
    this.fine = 0;

    if (!this.expiryDate || !this.taxAmount || overdueDays <= 0) return;

    let fineRate = 0; // default fine rate

    // Apply different fine rates based on the number of days overdue
    if (overdueDays <= 30) {
      fineRate = 0.05;  // 5% fine rate for 1 month
    } else if (overdueDays <= 90) {
      fineRate = 0.10;  // 10% fine rate for 1 to 3 months
    } else if (overdueDays <= 180) {
      fineRate = 0.15;  // 15% fine rate for 3 to 6 months
    } else if (overdueDays <= 365) {
      fineRate = 0.20;  // 20% fine rate for 6 months to 1 year
    } else {
      fineRate = 0.30;  // 30% fine rate for more than 1 year
    }

    const fineAmount = this.taxAmount * fineRate;
    this.fineBreakdown.push({ year: new Date(this.expiryDate).getFullYear(), fine: fineAmount });

    // Calculate total fine
    this.fine = Math.round(fineAmount);  // Round total fine to nearest integer
  }

  calculateNabikaranFee() {
    if (!this.expiryDate || !this.lastRenewDate) {
      this.totalNabikaranFee = 0;
      this.missedNabikaranYears = [];
      return;
    }
  
    const baseNabikaranFee = 300;
    const expiryAD = new Date(this.convertToADDate(this.expiryDate));
    const now = new Date();
  
    const daysSinceExpiry = Math.ceil((now.getTime() - expiryAD.getTime()) / (1000 * 60 * 60 * 24));
  
    this.totalNabikaranFee = baseNabikaranFee;
    this.missedNabikaranYears = [];
  
    const currentYear = now.getFullYear();
    const expiryYear = expiryAD.getFullYear();
  
    for (let year = expiryYear + 1; year <= currentYear; year++) {
      this.missedNabikaranYears.push(year);
    }
  
    const missedYearsCount = this.missedNabikaranYears.length;
  
    if (daysSinceExpiry > 90) {
      const penaltyPerMissedYear = baseNabikaranFee;
  
      if (missedYearsCount === 0) {
        this.totalNabikaranFee += penaltyPerMissedYear;
      } else {
        this.totalNabikaranFee += missedYearsCount * penaltyPerMissedYear;
      }
    }
  }

  calculateNewExpiryDate(expiredYears: number) {
    if (!this.expiryDate) return;

    const expiryAD = this.convertToADDate(this.expiryDate);
    expiryAD.setFullYear(expiryAD.getFullYear() + expiredYears + 1);
    this.nextExpiryDate = this.convertToBSDate(expiryAD);
  }

  // ✅ NEW: Getter for days since expiry
  get daysSinceExpiry(): number | null {
    if (!this.expiryDate) return null;

    try {
      const expiryAD = this.convertToADDate(this.expiryDate);
      const today = new Date();

      const diffTime = today.getTime() - expiryAD.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      return diffDays > 0 ? diffDays : 0;
    } catch {
      return null;
    }
  }
}
