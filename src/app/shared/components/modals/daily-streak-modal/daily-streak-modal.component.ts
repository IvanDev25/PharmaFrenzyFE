import { Component } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-daily-streak-modal',
  templateUrl: './daily-streak-modal.component.html',
  styleUrls: ['./daily-streak-modal.component.scss']
})
export class DailyStreakModalComponent {
  currentStreak = 1;
  rewardPoints = 0;

  constructor(public bsModalRef: BsModalRef) {}
}
