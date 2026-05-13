import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'decimal',
  standalone: true,
})
export class DecimalPipe implements PipeTransform {

  transform(value: number): string {
    if (value === null || value === undefined) return '';
    return value.toFixed(2); // 👈 always 2 decimal places
  }

}