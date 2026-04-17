import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface AvatarPickerDialogData {
  avatars: string[];
  selectedAvatar: string;
}

@Component({
  selector: 'app-avatar-picker-dialog',
  template: `
    <div class="avatar-dialog">
      <div class="avatar-dialog__header">
        <h2>Choose Avatar</h2>
        <p>Select one avatar for your student profile.</p>
      </div>

      <div class="avatar-dialog__grid">
        <button
          *ngFor="let avatar of data.avatars"
          type="button"
          class="avatar-dialog__option"
          [class.selected]="avatar === data.selectedAvatar"
          (click)="selectAvatar(avatar)"
        >
          <img [src]="avatar" [alt]="'Avatar ' + avatar" />
        </button>
      </div>

      <div class="avatar-dialog__actions">
        <button mat-button type="button" (click)="close()">Cancel</button>
        <button mat-flat-button color="primary" type="button" (click)="confirm()">Use Avatar</button>
      </div>
    </div>
  `,
  styles: [`
    .avatar-dialog {
      padding: 24px;
      max-width: 560px;
    }

    .avatar-dialog__header h2 {
      margin: 0;
      color: #1f2937;
      font-size: 24px;
      font-weight: 700;
    }

    .avatar-dialog__header p {
      margin: 8px 0 0;
      color: #6b7280;
      font-size: 14px;
    }

    .avatar-dialog__grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
      margin-top: 20px;
    }

    .avatar-dialog__option {
      border: 2px solid #d1d5db;
      border-radius: 18px;
      background: linear-gradient(180deg, #f8fff8 0%, #eefbf1 100%);
      padding: 10px;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    }

    .avatar-dialog__option:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 24px rgba(34, 197, 94, 0.16);
    }

    .avatar-dialog__option.selected {
      border-color: #16a34a;
      box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.14);
    }

    .avatar-dialog__option img {
      width: 100%;
      aspect-ratio: 1;
      object-fit: cover;
      border-radius: 14px;
      display: block;
    }

    .avatar-dialog__actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 20px;
    }

    @media (max-width: 640px) {
      .avatar-dialog {
        padding: 18px;
      }

      .avatar-dialog__grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `]
})
export class AvatarPickerDialogComponent {
  private pendingAvatar: string;

  constructor(
    public dialogRef: MatDialogRef<AvatarPickerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AvatarPickerDialogData
  ) {
    this.pendingAvatar = data.selectedAvatar;
  }

  selectAvatar(avatar: string): void {
    this.pendingAvatar = avatar;
    this.data.selectedAvatar = avatar;
  }

  close(): void {
    this.dialogRef.close();
  }

  confirm(): void {
    this.dialogRef.close(this.pendingAvatar);
  }
}
