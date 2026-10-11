export interface JobApplication {
    id: number;
    companyName: string;
    position: string;
    status: string;
    appliedDate: string;
    jobUrl: string | null;
    notes: string | null;
  }
  
  export interface CreateJobApplication {
    companyName: string;
    position: string;
    appliedDate: string;
    jobUrl: string | null;
    notes: string | null;
  }
  export interface UpdateJobApplication {
    companyName: string;
    position: string;
    status: string;
    appliedDate: string;
    jobUrl: string | null;
    notes: string | null;
  }
  