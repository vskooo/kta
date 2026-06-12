import { PlanCategory } from './date-plan.model';

export interface SelectedPlan {
  id: string;
  title: string;
  description: string | null;
  emoji: string | null;
  category: PlanCategory;
}

export interface SpinResult {
  id: string;
  spunAt: string;
  selectedPlan: SelectedPlan;
}

export interface SpinResponse {
  data: SpinResult;
}
