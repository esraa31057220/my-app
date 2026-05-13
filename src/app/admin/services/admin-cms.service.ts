import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { PromoCode } from '../../models/admin-promo';
import { SiteBanner } from '../../models/admin-banner';

const LS_PROMO = 'admin_promo_codes_v1';
const LS_BANNER = 'admin_site_banners_v1';

/** Promo/banner HTTP routes are not defined in `swagger.json`; persist locally only. */
@Injectable({ providedIn: 'root' })
export class AdminCmsService {
  listPromos(): Observable<PromoCode[]> {
    return of(this.readLs<PromoCode[]>(LS_PROMO, []));
  }

  savePromosRemote(list: PromoCode[]): Observable<PromoCode[]> {
    this.writeLs(LS_PROMO, list);
    return of(list);
  }

  listBanners(): Observable<SiteBanner[]> {
    return of(this.readLs<SiteBanner[]>(LS_BANNER, []));
  }

  saveBannersRemote(list: SiteBanner[]): Observable<SiteBanner[]> {
    this.writeLs(LS_BANNER, list);
    return of(list);
  }

  savePromosLocal(list: PromoCode[]): void {
    this.writeLs(LS_PROMO, list);
  }

  saveBannersLocal(list: SiteBanner[]): void {
    this.writeLs(LS_BANNER, list);
  }

  activeHomeBanners(): Observable<SiteBanner[]> {
    return this.listBanners().pipe(
      map((list) =>
        [...list]
          .filter((b) => b.active)
          .sort((a, b) => a.sortOrder - b.sortOrder)
      )
    );
  }

  private readLs<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  private writeLs(key: string, val: unknown): void {
    localStorage.setItem(key, JSON.stringify(val));
  }
}
