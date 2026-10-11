export interface Interview {
    id: number;
    jobApplicationId: number;
    companyName: string;
    position: string;
    interviewType: string;
    stage: string;
    scheduledAt: string;
    location: string | null;
    meetingUrl: string | null;
    interviewerName: string | null;
    notes: string | null;
  }
  export interface CreateInterview {
    jobApplicationId: number;
    interviewType: string;
    stage: string;
    scheduledAt: string;
    location: string | null;
    meetingUrl: string | null;
    interviewerName: string | null;
    notes: string | null;
  }

  export interface UpdateInterview {
    interviewType: string;
    stage: string;
    scheduledAt: string;
    location: string | null;
    meetingUrl: string | null;
    interviewerName: string | null;
    notes: string | null;
  }