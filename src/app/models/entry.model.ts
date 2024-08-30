export interface Entry {
  _id: string;
  date: string;
  time: string;
  sand: number;
  rocks: number;
  cement: number;
  lotNumber: number;
  isInactive?: boolean; // Optional field if you want to use it in the frontend
  reason?: string;
}