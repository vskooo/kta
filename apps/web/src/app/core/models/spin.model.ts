import { PlanCategory } from './date-plan.model';

export type SpinOutcome = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export type SpinDecision = 'ACCEPTED' | 'REJECTED';

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
  outcome: SpinOutcome;
  selectedPlan: SelectedPlan;
}

export interface SpinResponse {
  data: SpinResult;
}
