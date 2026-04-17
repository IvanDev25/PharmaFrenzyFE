import { Injectable } from '@angular/core';
import { BsModalRef, BsModalService, ModalOptions } from 'ngx-bootstrap/modal';
import { DailyStreakModalComponent } from './components/modals/daily-streak-modal/daily-streak-modal.component';
import { ExamCompleteModalComponent } from './components/modals/exam-complete-modal/exam-complete-modal.component';
import { LevelUpModalComponent } from './components/modals/level-up-modal/level-up-modal.component';
import { NoificationComponent } from './components/modals/noification/noification.component';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
BsModalRef?: BsModalRef;

  constructor(private modalService: BsModalService) { }

  showNotification(isSuccess: boolean, title: string, message: string) {
    const initialState: ModalOptions = {
      initialState: {
        isSuccess,
        title,
        message
      },
      class: 'modal-md game-notification-modal-shell'
    };
    this.BsModalRef = this.modalService.show(NoificationComponent, initialState);
  }

  showExamCompleteModal(data: {
    subjectName: string;
    totalScore: number;
    totalPossibleScore: number;
    correctAnswers: number;
    wrongAnswers: number;
    overallFeedback: string | null;
    experienceGained: number;
    previousStudentLevel: number;
    studentLevel: number;
    studentExperiencePoints: number;
    leveledUp: boolean;
    nextLevelExperienceRequired: number;
    currentLevelExperience: number;
  }) {
    const initialState: ModalOptions = {
      initialState: {
        ...data,
        overallFeedback: data.overallFeedback || 'Great run. Keep going and chase the next level.'
      },
      class: 'modal-lg exam-complete-modal-shell'
    };

    this.BsModalRef = this.modalService.show(ExamCompleteModalComponent, initialState);
    return this.BsModalRef;
  }

  showLevelUpModal(data: {
    previousStudentLevel: number;
    studentLevel: number;
  }) {
    const initialState: ModalOptions = {
      initialState: {
        ...data
      },
      class: 'modal-md level-up-modal-shell'
    };

    this.BsModalRef = this.modalService.show(LevelUpModalComponent, initialState);
    return this.BsModalRef;
  }

  showDailyStreakModal(data: {
    currentStreak: number;
    rewardPoints: number;
  }) {
    const initialState: ModalOptions = {
      initialState: {
        ...data
      },
      class: 'modal-md daily-streak-modal-shell'
    };

    this.BsModalRef = this.modalService.show(DailyStreakModalComponent, initialState);
    return this.BsModalRef;
  }
  }
