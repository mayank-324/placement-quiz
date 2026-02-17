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
}
