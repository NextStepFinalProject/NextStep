import fs from 'fs';
import * as cheerio from 'cheerio';
import { config } from '../config/config';
import { CompanyModel } from '../models/company_model';
import { CompanyData, ICompany, QuizData } from 'types/company_types';
import { Document } from 'mongoose';

// Predefined tags to match against quizzes
const PREDEFINED_TAGS = [
  // Example tags, replace/add as needed
  'QA', 'Software Engineer', 'Backend', 'Frontend', 'DevOps', 'Data Scientist', 'Algorithm', 'Student', 'Intern', 'Manager',
  'Automation', 'Validation', 'Verification', 'UI', 'C++', 'Java', 'Python', 'SQL', 'Security', 'Malware', 'Firmware',
  'Embedded', 'Web', 'Mobile', 'Cloud', 'Networking', 'Support', 'Technical', 'Test', 'Interview', 'Assessment', 'Coding',
  'Logic', 'HR', 'Personal', 'Group Dynamics', 'Exam', 'Assessment Center', 'Online Test', 'Phone Interview',
  'Onsite Interview', 'Technical Interview', 'Behavioral Interview', 'Case Study', 'Presentation', 'Assignment', 'Project',
  'Challenge', 'Simulation', 'Scenario', 'Task', 'Exercise', 'Problem', 'Solution', 'Tips', 'Advice', 'Preparation',
  'Experience', 'Feedback', 'Review', 'Summary', 'Report', 'Result', 'Score', 'Grade', 'Pass', 'Fail', 'Success', 'Failure',
  'Mistake', 'Error', 'Bug', 'Fix', 'Patch', 'Update', 'Upgrade', 'Release', 'Deployment', 'Integration', 'Testing',
  'Debugging', 'Troubleshooting', 'Maintenance', 'Customer', 'Client', 'User', 'Stakeholder', 'Partner', 'Vendor', 'Supplier',
  'Contractor', 'Consultant', 'Advisor', 'Mentor', 'Coach', 'Trainer', 'Teacher', 'Instructor', 'Lecturer', 'Professor',
  'Researcher', 'Scientist', 'Engineer', 'Developer', 'Programmer', 'Coder', 'Designer', 'Architect', 'Analyst', 'Specialist',
  'Expert', 'Professional', 'Practitioner', 'Technician', 'Operator', 'Administrator', 'Director', 'VP', 'C-level', 'CEO',
  'CTO', 'CIO', 'COO', 'CFO', 'CMO', 'CSO', 'CHRO', 'Board', 'Committee', 'Team', 'Group', 'Department', 'Division', 'Unit',
  'Section', 'Branch', 'Office', 'Site', 'Location', 'Region', 'Country', 'City', 'Area', 'Zone', 'District', 'Territory',
  'Market', 'Segment', 'Industry', 'Sector', 'Field', 'Domain', 'Discipline', 'Subject', 'Topic', 'Category', 'Type', 'Class',
  'Level', 'Grade', 'Rank', 'Position', 'Role', 'Title', 'Function', 'Responsibility', 'Duty', 'Activity', 'Operation',
  'Process', 'Procedure', 'Method', 'Technique', 'Tool', 'Instrument', 'Device', 'Equipment', 'Machine', 'System', 'Platform',
  'Application', 'Software', 'Hardware', 'Network', 'Database', 'Server', 'Interface', 'Protocol', 'Standard', 'Specification',
  'Requirement', 'Constraint', 'Limitation', 'Condition', 'Assumption', 'Risk', 'Issue', 'Opportunity', 'Threat', 'Weakness',
  'Strength', 'Advantage', 'Disadvantage', 'Benefit', 'Cost', 'Price', 'Value', 'Quality', 'Performance', 'Efficiency',
  'Effectiveness', 'Productivity', 'Reliability', 'Availability', 'Scalability', 'Flexibility', 'Adaptability', 'Maintainability',
  'Usability', 'Accessibility', 'Security', 'Privacy', 'Confidentiality', 'Integrity', 'Authenticity', 'Accountability',
  'Compliance', 'Regulation', 'Law', 'Policy', 'Rule', 'Guideline', 'Best Practice', 'Lesson Learned',
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