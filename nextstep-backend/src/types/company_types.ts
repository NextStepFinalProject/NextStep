export interface IQuiz extends Document {
  title: string;
  quiz_id: number;
  tags: string[];
  content: string;
  forum_link: string;
}

export interface ICompany extends Document {
  company: string;
  company_he: string;
  tags: string[];
  quizzes: IQuiz[];
}

export interface CompanyData {
  id?: string;
  company: string;
  company_he: string;
  tags: string[];
  quizzes: QuizData[];
}

export interface QuizData {
  id?: string;
  title: string;
  quiz_id: number;
  tags: string[];
  content: string;
  forum_link: string;
}