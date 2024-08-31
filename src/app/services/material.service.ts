import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Entry } from '../models/entry.model';

@Injectable({
  providedIn: 'root'
})
export class MaterialService {
  private apiUrl = 'https://jeelu-backend.up.railway.app/api/materials';

  constructor(private http: HttpClient) { }

  addEntry(entry: Entry): Observable<Entry> {
    return this.http.post<Entry>(this.apiUrl, entry);
  }

  getEntries(filter: any = {}): Observable<Entry[]> {
    const params = new HttpParams({ fromObject: filter });
    return this.http.get<Entry[]>(this.apiUrl, { params });
  }

  markAsInactive(entryId: string, reason: string | null): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/entries/${entryId}/inactive`, null, {
      headers: { 'X-Deletion-Reason': reason || '' }
    });
  }
}
