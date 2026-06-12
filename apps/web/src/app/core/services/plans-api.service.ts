import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DatePlan, PlansResponse } from '../models/date-plan.model';

@Injectable({ providedIn: 'root' })
export class PlansApiService {
  private readonly http = inject(HttpClient);

  getActivePlans(): Observable<DatePlan[]> {
    return this.http
      .get<PlansResponse>(`${environment.apiUrl}/plans`)
      .pipe(map((response) => response.data));
  }
}
