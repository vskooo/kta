export type PlanCategory =
  | 'FOOD'
  | 'ADVENTURE'
  | 'RELAX'
  | 'HOME'
  | 'SURPRISE'
  | 'OTHER';

export interface DatePlan {
  id: string;
  title: string;
  description: string | null;
  emoji: string | null;
  category: PlanCategory;
  weight: number;
}

export interface PlansResponse {
  data: DatePlan[];
}
