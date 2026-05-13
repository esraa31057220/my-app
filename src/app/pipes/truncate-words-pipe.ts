import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncateWords',
})
export class TruncateWordsPipe implements PipeTransform {
  transform(value: string, wordCount: number = 3): string {
    if (!value) return '';

    const words = value.trim().split(/\s+/); // split by any whitespace
    
    if (words.length <= wordCount) {
      return value; // return as-is if already short enough
    }

    return words.slice(0, wordCount).join(' ') + '...';
  }
}
