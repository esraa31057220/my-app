import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MasterProducts } from '../../products/master-product/master-product';
import { AdminCmsService } from '../../../admin/services/admin-cms.service';

@Component({
  selector: 'app-home',
  imports: [MasterProducts],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private cms = inject(AdminCmsService);
  readonly banners = toSignal(this.cms.activeHomeBanners(), { initialValue: [] });
}
