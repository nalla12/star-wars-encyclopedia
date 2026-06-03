import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ResourceData } from '../../types';

@Component({
  selector: 'app-resource-list',
  templateUrl: './resource-list.html',
  styleUrl: './resource-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceListComponent {
  readonly resources = input<ResourceData[]>([]);
  readonly title = input('Resources');
  readonly isLoading = input(false);
  readonly isEmpty = input(false);
  readonly onItemSelect = output<ResourceData>();
}
