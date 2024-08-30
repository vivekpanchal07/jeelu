import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { Entry } from '../models/entry.model';
import { MaterialService } from '../services/material.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-material-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule], // Import necessary modules
  templateUrl: './material-form.component.html',
  styleUrls: ['./material-form.component.css'], // Corrected property name
  providers: [ToastrService, MaterialService],
})
export class MaterialFormComponent implements OnInit {
  materialForm!: FormGroup;
  entries: Entry[] = [];
  lotNumber!: number;
  isLiveChecked = false;
  currentTime: string = '';

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private materialService: MaterialService,
    private router: Router
  ) {}

  ngOnInit() {
    this.initializeForm();
    this.fetchEntries();

    // Subscribe to changes in the date field to refetch entries
    this.materialForm.get('date')?.valueChanges.subscribe(() => {
      this.fetchEntries();
    });

    this.updateClock();
  }

  initializeForm() {
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().substring(0, 10);
    const formattedTime = currentDate.toTimeString().substring(0, 8); // Including seconds

    this.materialForm = this.fb.group({
      date: [formattedDate],
      time: [formattedTime],
      sand: [0],
      rocks: [0],
      cement: [0],
      live: [false],
    });
  }

  fetchEntries() {
    const selectedDate = this.materialForm.get('date')?.value;

    const filter = {
        specificDate: selectedDate,
        includeInactive: false // or use a form control to determine this
    };

    this.materialService.getEntries(filter).subscribe(
        (data) => {
            this.entries = data;

            if (this.entries.length > 0) {
                this.lotNumber = this.entries[0].lotNumber + 1;
            } else {
                this.lotNumber = 1;
            }
        },
        (error) => {
            this.toastr.error('Failed to fetch entries');
        }
    );
}

  updateClock() {
    setInterval(() => {
      this.currentTime = new Date().toTimeString().substring(0, 8);
      if (this.isLiveChecked) {
        this.materialForm.patchValue({
          time: this.currentTime
        });
      }
    }, 1000);
  }

  onLiveChange() {
    this.isLiveChecked = this.materialForm.get('live')?.value;

    if (this.isLiveChecked) {
      const currentDate = new Date();
      this.materialForm.patchValue({
        date: currentDate.toISOString().substring(0, 10),
        time: currentDate.toTimeString().substring(0, 8), // Including seconds
      });

      // Disable the date and time fields in live mode
      this.materialForm.get('date')?.disable();
      this.materialForm.get('time')?.disable();
    } else {
      // Re-enable the date and time fields when live mode is off
      this.materialForm.get('date')?.enable();
      this.materialForm.get('time')?.enable();
    }
  }

  addEntry() {
    const entry: Entry = {
      date: this.materialForm.get('date')?.value,
      time: this.materialForm.get('time')?.value,
      sand: this.materialForm.get('sand')?.value,
      rocks: this.materialForm.get('rocks')?.value,
      cement: this.materialForm.get('cement')?.value,
      lotNumber: this.lotNumber,
      _id: '',
    };

    this.materialService.addEntry(entry).subscribe({
      next: () => {
        this.entries.unshift(entry);
        this.lotNumber++; // Increment the lot number for the next entry
        this.toastr.success('Record added successfully!', 'Success');
      },
      error: (err) => {
        this.toastr.error('Failed to add record', 'Error');
        console.error(err);
      }
    });
  }

  showRecords() {
    this.router.navigate(['/material-list']);
  }
}
