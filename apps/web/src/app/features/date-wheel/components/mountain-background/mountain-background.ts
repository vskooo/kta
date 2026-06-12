import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-mountain-background',
  templateUrl: './mountain-background.html',
  styleUrl: './mountain-background.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MountainBackground {}
