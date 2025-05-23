import fs from 'fs';
import * as cheerio from 'cheerio';
import { config } from '../config/config';
import { CompanyModel } from '../models/company_model';
import { CompanyData, ICompany, QuizData } from 'types/company_types';
import { Document } from 'mongoose';

// Predefined tags to match against quizzes
const PREDEFINED_TAGS = [
  // Company/Organization Tags
  '888', 'Amdocs', 'Apple', 'Applied Materials', 'CEVA', 'Check Point', 'Dalet', 'Elbit', 'exelate', 'Final', 'fiverr', 'Fundtech', 'General Electric', 'Hola', 'HP', 'IBM', 'Innovid', 'Intel', 'Marvell', 'Mellanox', 'Microsoft', 'Optimal', 'Philips', 'Rafael', 'Sandisk', 'SAP', 'Sapiens', 'STMS', 'Trusteer', 'Verint', 'Wix', 'Yopto', 'Zerto',
  // Hebrew Company Names
  'אמדוקס', 'אפל', 'אפלייד מטיריאלס', 'צ\'ק פוינט', 'אלביט', 'אקסלייט', 'פנדטק', 'רפאל', 'סנדיסק', 'סאפ', 'סאפיאנס', 'טרסטיר', 'ורינט', 'וויקס', 'יופטו', 'זרטו', 'אינוביד', 'אינטל', 'מלאנוקס', 'מיקרוסופט', 'פיליפס', 'הולה', 'דלת', 'אופטימל', 'ג\'נרל אלקטריק', 'פיינל', 'פייבר', 'סטמס',
  // Job Roles/Quiz Types
  'QA', 'Software Engineer', 'Firmware Engineer', 'Logic Design Engineer', 'Debugger Engineer', 'Security Analyst', 'Web Developer', 'Board Design', 'Design Verification Engineer', 'Validation', 'Backend', 'Frontend', 'UI', 'Student', 'Intern', 'Automation', 'Support', 'Technical Support', 'Test Engineer', 'Developer', 'Programmer', 'Coder', 'Manager', 'Team Lead', 'Analyst', 'Architect', 'Specialist', 'Consultant', 'Advisor', 'Trainer', 'Instructor', 'Lecturer', 'Professor', 'Researcher', 'Scientist', 'Operator', 'Administrator', 'Director', 'VP', 'CEO', 'CTO', 'CIO', 'COO', 'CMO', 'CSO', 'CHRO',
  // Technical/Topic Tags
  'C++', 'Java', 'Python', 'SQL', 'J2EE', 'UI', 'ALM', 'Video Codec', 'Compiler', 'Multimedia', 'Assembly', 'Networking', 'Cloud', 'Mobile', 'Embedded', 'Hardware', 'Software', 'Database', 'Automation', 'Verification', 'Validation', 'Security', 'Malware', 'Firmware', 'Web', 'Testing', 'Debugging', 'Troubleshooting', 'Maintenance', 'Integration', 'Deployment', 'Release', 'Upgrade', 'Patch', 'Fix', 'Bug', 'Error', 'Solution', 'Algorithm', 'Logic', 'Assessment', 'Interview', 'Exam', 'Coding', 'Challenge', 'Simulation', 'Scenario', 'Task', 'Exercise', 'Problem', 'Tips', 'Advice', 'Preparation', 'Experience', 'Feedback', 'Review', 'Summary', 'Report', 'Result', 'Score', 'Grade', 'Pass', 'Fail', 'Success', 'Failure', 'Mistake',
  // Process/Format Tags
  'Assessment Center', 'Online Test', 'Phone Interview', 'Onsite Interview', 'Technical Interview', 'Behavioral Interview', 'Case Study', 'Presentation', 'Assignment', 'Project', 'Group Dynamics', 'Personal Interview', 'HR Interview', 'Home Assignment', 'Screening', 'Recruitment', 'Hiring',
  // Add more as needed
];

// Helper to match tags in a string (case-insensitive, whole word)
function matchTags(text: string, tags: string[]): string[] {
  const found = new Set<string>();
  for (const tag of tags) {
    // Use word boundary for whole word match, case-insensitive
    const regex = new RegExp(`\\b${tag.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    if (regex.test(text)) {
      found.add(tag);
    }
  }
  return Array.from(found);
}

const companyToCompanyData = (company: Document<unknown, {}, ICompany> & ICompany): CompanyData => {
  return {
    ...company.toJSON(),
    id: company._id?.toString(),
    company: company.company,
    company_he: company.company_he,
    tags: company.tags,
    quizzes: (company.quizzes || []).map((quiz: any) => ({
      id: quiz._id?.toString(),
      title: quiz.title,
      quiz_id: quiz.quiz_id,
      tags: quiz.tags,
      content: quiz.content,
      forum_link: quiz.forum_link,
    })),
  };
};

const parseJobQuizzesFromJobHuntHtml = (htmlPath: string): CompanyData[] => {
  const html = fs.readFileSync(htmlPath, 'utf-8');
  const $ = cheerio.load(html);

  const companies: CompanyData[] = [];

  $('h2.faq-section-heading').each((_, section) => {
    // Extract company_en and company_he from the correct spans
    const company_en = $(section).find('.faq_left').text().trim();
    const company_he = $(section).find('.faq_right').text().trim();
    // Fallback if only one span exists
    const company_en_final = company_en || $(section).text().trim();
    const company_he_final = company_he || company_en_final;

    // Deduplicate company tags
    const company_tags = Array.from(new Set([
      company_en_final,
      company_he_final,
      'interview',
      'hi-tech',
    ].filter(Boolean)));

    const quizzes: QuizData[] = [];

    // Find the next ul.question-list after this section
    const ul = $(section).nextAll('ul.question-list').first();
    if (!ul.length) return;

    ul.find('h4').each((_, h4) => {
      const a = $(h4).find('a');
      const quiz_title = a.text().trim();
      const quiz_id = parseInt(a.attr('href')?.split('-').pop() || '', 10);
      if (!quiz_id) return;

      // Find the corresponding article
      const article = $(`article#faqarticle-${quiz_id}`);
      if (!article.length) return;

      const content = article.find('.faq-content').html() || '';
      const forum_link = article.find('.meta-faq-data-fields a[href]').attr('href') || '';
      // Generate tags: company, job role, technology, year, etc. Deduplicate.
      let quiz_tags = Array.from(new Set([
        company_en_final,
        company_he_final,
        ...quiz_title.split(/\s+/),
      ].filter(Boolean)));

      // Add matched predefined tags from title and content
      const matched_tags = new Set([
        ...matchTags(quiz_title, PREDEFINED_TAGS),
        ...matchTags(content, PREDEFINED_TAGS),
      ]);
      quiz_tags = Array.from(new Set([...quiz_tags, ...matched_tags]));

      quizzes.push({
        title: quiz_title,
        quiz_id,
        tags: quiz_tags,
        content,
        forum_link,
      });
    });

    companies.push({
      company: company_en_final,
      company_he: company_he_final,
      tags: company_tags,
      quizzes,
    });
  });

  return companies;
};

export const importJobQuizzesToDb = async (): Promise<number> => {
  const companies = parseJobQuizzesFromJobHuntHtml(config.assets.jobQuizzesJobHuntHtmlPath());

  if (companies.length) {
    await CompanyModel.deleteMany({});
    await CompanyModel.insertMany(companies);
  }

  return companies.length;
};