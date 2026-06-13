import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SpinDecision, SpinResponse, SpinResult } from '../models/spin.model';

@Injectable({ providedIn: 'root' })
export class SpinsApiService {
  private readonly http = inject(HttpClient);

  spin(): Observable<SpinResult> {
    return this.http
      .post<SpinResponse>(`${environment.apiUrl}/spins`, {})
      .pipe(map((response) => response.data));
  }

  decide(id: string, outcome: SpinDecision): Observable<SpinResult> {
    return this.http
      .patch<SpinResponse>(`${environment.apiUrl}/spins/${id}/decision`, {
        outcome,
      })
      .pipe(map((response) => response.data));
  }
}
