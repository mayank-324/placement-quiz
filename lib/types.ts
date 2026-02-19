export interface Question {
    id: number;
    question_text: string;
    options: string[]; // parsed from jsonb
    correct_option: number;
}

export interface User {
    id: string;
    email: string;
    role: 'student' | 'admin';
}

export interface Attempt {
    id: string;
    user_id: string;
    score: number;
    answers: Record<string, number>;
    created_at: string;
    user?: { email: string }; // joined
    violations: number;
}

export interface BasicInfo {
    fullName: string;
    personalEmail: string;
    mobile: string;
    dob: string;
    currentCity: string;
    permanentAddress: string;
    gender?: string;
}

export interface AcademicInfo {
    college: string;
    university: string;
    degree: string;
    branch: string;
    yearOfPassing: string;
    cgpa: number;
    tenthPercentage: number;
    twelfthPercentage: number;
    backlogs: "Yes" | "No";
    backlogCount?: number;
}

export interface TechnicalInfo {
    primaryLanguage: string;
    secondaryLanguage: string;
    databaseKnowledge: string;
    frameworkExperience: string;
    git: "Yes" | "No";
    internship: "Yes" | "No";
    internshipDetails?: string;
    liveProjects: "Yes" | "No";
    githubLink?: string;
    githubUrl?: string;
    linkedinUrl?: string;
    portfolio?: string;
    resumeUrl?: string;
    certificatesUrl?: string;
}

export interface AvailabilityInfo {
    fullTimeOnsite: "Yes" | "No";
    relocate: "Yes" | "No";
}

export interface DeclarationInfo {
    confirmTestIdentity: boolean;
    noUnfairMeans: boolean;
    webcamPermission: boolean;
    screenMonitoringConsent: boolean;
}

export interface RegistrationData {
    basic: BasicInfo;
    academic: AcademicInfo;
    technical: TechnicalInfo;
    availability: AvailabilityInfo;
    declaration: DeclarationInfo;
}
