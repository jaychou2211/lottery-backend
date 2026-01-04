export interface Employee {
  department: string;
  employeeId: string;
  name: string;
  role: number; // 0 表示老鳥，1 表示小鳥
  prize?: string;
}

export interface Prize {
  rank: number;
  prizeLevel: string;
  prizeName: string;
  seniorEligible: number;
  juniorEligible: number;
  imageUrl: string;
}