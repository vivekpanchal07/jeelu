import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialService } from '../services/material.service';
import { Entry } from '../models/entry.model';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-material-list',
  standalone: true,
  imports: [CommonModule, HttpClientModule, ReactiveFormsModule],
  templateUrl: './material-list.component.html',
  styleUrls: ['./material-list.component.css'],
  providers: [MaterialService],
})
export class MaterialListComponent implements OnInit {
  entries: Entry[] = [];
  currentTime: string = '';
  startDate: string = '';
  endDate: string = '';
  includeInactive: boolean = false;
  dateError: boolean = false;
  filterForm: FormGroup;
  dateRangeInvalid:boolean = false
  isFilterVisible = false; // Manage filter form visibility

  constructor(
    private materialService: MaterialService,
    private router: Router,
    private fb: FormBuilder,
    private toastr: ToastrService,
  ) {
    this.filterForm = this.fb.group(
      {
        startDate: ['', Validators.required],
        endDate: ['', Validators.required],
        includeInactive: [false],
      },
      {
        validator: this.dateRangeValidator,
      }
    );
  }

  ngOnInit() {
    this.fetchEntries();
    this.updateClock();
  }

  toggleFilter() {
    this.isFilterVisible = !this.isFilterVisible;
  }

  dateRangeValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const startDate = control.get('startDate')?.value;
    const endDate = control.get('endDate')?.value;

    if (startDate && endDate && startDate > endDate) {
      return { dateRangeInvalid: true };
    }
    return null;
  }
  
  applyFilter() {
    const filterValues = this.filterForm.value;
    this.fetchEntries(filterValues);
  }

  fetchEntries(filter?: any) {
    // const filter = {
    //     startDate: this.startDate || '',  // Use the value of this.startDate or an empty string if it's not set
    //     endDate: this.endDate || '',      // Use the value of this.endDate or an empty string if it's not set
    //     includeInactive: this.includeInactive !== undefined ? this.includeInactive : false // Use the value of this.includeInactive or false if it's not set
    // };

    this.materialService.getEntries(filter).subscribe(
      (data) => {
        // Ensure sand, rocks, and cement have default values if missing
        this.entries = data.map(entry => ({
          ...entry,
          sand: entry.sand ?? 0,
          rocks: entry.rocks ?? 0,
          cement: entry.cement ?? 0,
        }));
      },
      (error) => {
        console.error('Failed to fetch entries', error);
      }
    );
}

  updateClock() {
    setInterval(() => {
      this.currentTime = new Date().toTimeString().substring(0, 8);
    }, 1000);
  }

  goBack() {
    this.router.navigate(['/']);
  }

  markAsInactive(entryId: string) {
    if (!entryId) {
      console.error('Entry ID is undefined');
      return;
    }

    Swal.fire({
      title: 'Are you sure?',
      text: 'You will mark this record as inactive!',
      input: 'text',
      inputLabel: 'Reason for inactivation',
      inputPlaceholder: 'Enter the reason here...',
      showCancelButton: true,
      confirmButtonText: 'Yes, mark as inactive!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const reason = result.value || null; // Use null if no reason is provided
        this.materialService.markAsInactive(entryId, reason).subscribe(
          () => {
            // Swal.fire('Marked as Inactive!', 'The record has been marked as inactive.', 'success');
            this.toastr.info('The record has been marked as inactive.', 'Info');

            // Fetch entries with the current filter applied
            this.applyFilter();
          },
          (error) => {
            // Swal.fire('Error!', 'There was an error marking the record as inactive.', 'error');
            this.toastr.error('There was an error marking the record as inactive.', 'Error');
            console.error('Failed to mark entry as inactive', error);
          }
        );
      }
    });
  }

  exportToExcel() {
    // Check if there are any records to export
    if (this.entries.length === 0) {
      this.toastr.error('There are no records to export');
      return; // Exit the function if there are no records
    }

    Swal.fire({
      title: 'Enter Camera Number',
      input: 'text',
      inputLabel: 'Camera Number',
      inputPlaceholder: 'Enter the camera number here...',
      inputAttributes: {
        required: 'required',
      },
      showCancelButton: true,
      confirmButtonText: 'Generate Report',
      cancelButtonText: 'Cancel',
      preConfirm: (cameraNumber) => {
        if (!cameraNumber) {
          Swal.showValidationMessage('Camera number is required');
        }
        return cameraNumber;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const cameraNumber = result.value;

        // Get filter values
        const startDate = this.filterForm.get('startDate')?.value;
        const endDate = this.filterForm.get('endDate')?.value;

        // Determine filename based on date availability
        let filename;
        if (startDate && endDate) {
          const formattedStartDate = new Date(startDate).toISOString().substring(0, 10);
          const formattedEndDate = new Date(endDate).toISOString().substring(0, 10);
          filename = `camera${cameraNumber}-${formattedStartDate}-${formattedEndDate}-report.xlsx`;
        } else {
          filename = `camera${cameraNumber}-report.xlsx`;
        }

        // Prepare data for export with only specific fields
        const filteredData = this.entries.map(entry => ({
          date: entry.date,
          time: entry.time,
          sand: entry.sand,
          rocks: entry.rocks,
          cement: entry.cement,
        }));

        // Create worksheet and workbook
        const ws = XLSX.utils.json_to_sheet(filteredData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Entries');

        // Save the file
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([wbout], { type: 'application/octet-stream' }), filename);
      }
    });
  }
}
