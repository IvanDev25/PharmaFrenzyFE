import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { ExamService } from '../exam/exam.service';
import { SharedService } from '../shared/shared.service';
import { ExamAttempt } from '../shared/models/exam/exam-attempt';

@Component({
  selector: 'app-exam-history',
  templateUrl: './exam-history.component.html',
  styleUrls: ['./exam-history.component.scss']
})
export class ExamHistoryComponent implements OnInit {
  attempts: ExamAttempt[] = [];
  loading = false;

  constructor(
    private examService: ExamService,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.loadAttempts();
  }

  loadAttempts(): void {
    this.loading = true;
    this.examService.getMyAttempts()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: attempts => {
          this.attempts = attempts;
        },
        error: () => {
          this.attempts = [];
          this.sharedService.showNotification(false, 'Load failed', 'Unable to load your exam history.');
        }
      });
  }
}
