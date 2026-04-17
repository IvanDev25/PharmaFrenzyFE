import { Component } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { getLevelBadgeAsset } from '../../../utils/level-badge.util';

@Component({
  selector: 'app-level-up-modal',
  templateUrl: './level-up-modal.component.html',
  styleUrls: ['./level-up-modal.component.scss']
})
export class LevelUpModalComponent {
  previousStudentLevel = 1;
  studentLevel = 1;

  constructor(public bsModalRef: BsModalRef) {}

  levelBadge(level: number): string {
    return getLevelBadgeAsset(level);
  }
}
