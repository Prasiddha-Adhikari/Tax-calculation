// src/app/components/footer.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html'
})
export class FooterComponent {
  currentYear: number = new Date().getFullYear();
}
