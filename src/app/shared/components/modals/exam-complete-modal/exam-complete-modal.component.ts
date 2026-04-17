import { Component } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-exam-complete-modal',
  templateUrl: './exam-complete-modal.component.html',
  styleUrls: ['./exam-complete-modal.component.scss']
})
export class ExamCompleteModalComponent {
  subjectName = '';
  totalScore = 0;
  totalPossibleScore = 0;
  correctAnswers = 0;
  wrongAnswers = 0;
  overallFeedback = '';
  experienceGained = 0;
  previousStudentLevel = 1;
  studentLevel = 1;
  studentExperiencePoints = 0;
  nextLevelExperienceRequired = 100;
  currentLevelExperience = 0;
  leveledUp = false;
  viewResults = false;

  constructor(public bsModalRef: BsModalRef) {}

  close(): void {
    this.viewResults = false;
    this.bsModalRef.hide();
  }

  openResults(): void {
    this.viewResults = true;
    this.bsModalRef.hide();
  }
}
