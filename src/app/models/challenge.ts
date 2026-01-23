export interface Challenge {
  date: Date;
  startTime: number;
  endTime: number;
  isSuccess: boolean | undefined;
  isStarted: boolean;
}
