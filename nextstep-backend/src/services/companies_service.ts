import fs from 'fs';
import * as cheerio from 'cheerio';
import { config } from '../config/config';
import { CompanyModel } from '../models/company_model';
import { CompanyData, ICompany, QuizData } from 'types/company_types';
import { Document, PipelineStage } from 'mongoose';
import path from 'path';

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
      process_details: quiz.process_details, // Added new field
      interview_questions: quiz.interview_questions, // Added new field
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
        process_details: undefined, // Not available in this HTML structure
        interview_questions: undefined, // Not available in this HTML structure
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

// New function to parse the provided HTML structure
const parseJobQuizzesFromCompanyTablesHtml = (htmlPath: string): CompanyData[] => {
  const html = fs.readFileSync(htmlPath, 'utf-8');
  const $ = cheerio.load(html);

  const companies: CompanyData[] = [];

  // Iterate over each "table" that contains company interview data
  $('table.container-interview, tbody:has(tr:has(td[colspan="4"][valign="bottom"] table))').each((_, tableElement) => {
    const $table = $(tableElement);

    // Extract company name and quiz title from the first inner table
    const mainInfoTable = $table.find('td[colspan="4"][valign="bottom"] > table').first();
    const companyLink = mainInfoTable.find('td[valign="top"] > a').attr('href');
    let company_en = 'UNKNOWN';
    let company_he = 'UNKNOWN';

    if (companyLink) {
      // Extract company names from the URL path
      const pathParts = companyLink.split('/');
      if (pathParts.length >= 4) {
        company_he = decodeURIComponent(pathParts[pathParts.length - 2]);
        company_en = decodeURIComponent(pathParts[pathParts.length - 1]);
      }
    }

    const quiz_title_full = mainInfoTable.find('td[valign="top"] div[style*="font-size:20px"]').text().trim();
    // The quiz title usually contains "ראיון לתפקיד [job role] בחברת [company name]"
    // We can extract the job role from here.
    const jobRoleMatch = quiz_title_full.match(/ראיון לתפקיד\s*(.*?)\s*בחברת/);
    const jobRole = jobRoleMatch ? jobRoleMatch[1].trim() : '';
    const quiz_title = quiz_title_full; // Keep the full title for now

    // Extract quiz_id (no explicit quiz_id in this structure, so generating a unique one or using a placeholder)
    // For now, we'll use a simple hash of the title and company, or just a placeholder.
    // In a real application, you might generate a UUID or use a counter.
    const quiz_id = Math.abs(quiz_title_full.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));


    // Extract process details
    const processDetailsRow = $table.find('td:contains("פרטים לגבי התהליך")').closest('tr');
    const process_details = processDetailsRow.find('td[style*="font-size:14px;font-weight:normal;"]').text().trim();

    // Extract interview questions
    const interviewQuestionsRow = $table.find('td:contains("שאלות מתוך הראיון")').closest('tr');
    const interview_questions = interviewQuestionsRow.find('td[style*="font-size:14px;font-weight:normal;"]').text().trim();

    // Forum link is present in the `new_answer_` span's ID, but the href is dynamic via JS.
    // We can construct it if the base URL is known, or leave it empty if not directly available.
    const newAnswerSpanId = $table.find('span[id^="new_answer_"]').attr('id');
    let forum_link = '';
    if (newAnswerSpanId) {
      const id = newAnswerSpanId.replace('new_answer_', '');
      forum_link = `/interview/newanswer/Id/${id}`; // Example construction
    }

    // Combine company tags
    const company_tags = Array.from(new Set([
      company_en,
      company_he,
      'interview',
      'hi-tech',
      jobRole, // Add the extracted job role to company tags
    ].filter(Boolean)));

    // Combine quiz tags
    let quiz_tags = Array.from(new Set([
      company_en,
      company_he,
      jobRole,
      ...quiz_title.split(/\s+/),
    ].filter(Boolean)));

    // Add matched predefined tags from title, process details, and interview questions
    const matched_tags = new Set([
      ...matchTags(quiz_title, PREDEFINED_TAGS),
      ...matchTags(process_details, PREDEFINED_TAGS),
      ...matchTags(interview_questions, PREDEFINED_TAGS),
    ]);
    quiz_tags = Array.from(new Set([...quiz_tags, ...matched_tags]));

    // Find if company already exists to add the quiz to it
    let existingCompany = companies.find(c => c.company === company_en && c.company_he === company_he);

    if (!existingCompany) {
      existingCompany = {
        company: company_en,
        company_he: company_he,
        tags: company_tags,
        quizzes: [],
      };
      companies.push(existingCompany);
    }

    existingCompany.quizzes.push({
      title: quiz_title,
      quiz_id,
      tags: quiz_tags,
      content: `${process_details}\n\n${interview_questions}`, // Combine into content
      forum_link,
      process_details,
      interview_questions,
    });
  });

  return companies;
};

export const initCompanies = async (): Promise<number> => {
  // Check if collection is not empty:
  const anyCompany = await CompanyModel.findOne({}).lean();

  if (anyCompany != null) {
    console.log("Companies already initialized. Skipping insertion.");
    return 0;
  }

  let allCompanies: CompanyData[] = [];

  // Parse JobHunt.
  const jobHuntCompanies = parseJobQuizzesFromJobHuntHtml(config.assets.jobQuizzesJobHuntHtmlPath());
  allCompanies = allCompanies.concat(jobHuntCompanies);

  // Parse TheWorker.
  const directoryPath = config.assets.jobQuizzesTheWorkerHtmlDirectoryPath();
  const aggregatedCompaniesMap = new Map<string, CompanyData>(); // Map to aggregate companies across files

  try {
    const files = fs.readdirSync(directoryPath);
    for (const file of files) {
      if (path.extname(file).toLowerCase() === '.html') {
        const fullPath = path.join(directoryPath, file);
        console.log(`Parsing file: ${fullPath}`);
        const companiesFromFile = parseJobQuizzesFromCompanyTablesHtml(fullPath);

        // Aggregate companies from the current file with the overall collection
        companiesFromFile.forEach(company => {
          const companyKey = `${company.company}_${company.company_he}`;
          if (aggregatedCompaniesMap.has(companyKey)) {
            // Company already exists, merge quizzes
            const existingCompany = aggregatedCompaniesMap.get(companyKey)!;
            // Prevent duplicate quizzes if quiz_id logic isn't perfect for this scenario
            const existingQuizIds = new Set(existingCompany.quizzes.map(q => q.quiz_id));
            company.quizzes.forEach(newQuiz => {
              if (!existingQuizIds.has(newQuiz.quiz_id)) {
                existingCompany.quizzes.push(newQuiz);
                existingQuizIds.add(newQuiz.quiz_id); // Add to set to prevent future duplicates in this company
              }
            });
            // Also merge tags if necessary, though the current parsing logic should handle this well
            existingCompany.tags = Array.from(new Set([...existingCompany.tags, ...company.tags]));

          } else {
            // New company, add it to the map
            aggregatedCompaniesMap.set(companyKey, company);
          }
        });
      }
    }

    allCompanies = allCompanies.concat(Array.from(aggregatedCompaniesMap.values()));

    if (allCompanies.length) {
      console.log(`Found ${allCompanies.length} unique companies across all HTML files.`);
      await CompanyModel.deleteMany({});
      await CompanyModel.insertMany(allCompanies);
      console.log('Successfully inserted parsed companies into MongoDB.');
    } else {
      console.log('No companies found to insert from the HTML files.');
    }
  } catch (error) {
    console.error(`Error reading directory or parsing files from ${directoryPath}:`, error);
    return 0;
  }

  return allCompanies.length;
};


/**
 * Search for quizzes that best match the given tags using MongoDB aggregation.
 * Matches are found in company tags, quiz tags, or quiz content.
 * Returns quizzes sorted by number of tag matches (most relevant first).
 */
export const searchQuizzesByTags = async (tags: string[]): Promise<QuizData[]> => {
  const lowerTags = tags.map(t => t.toLowerCase());

  // Construct a regex pattern for each tag to search within string fields (case-insensitive)
  // And also prepare for direct array matching.
  const tagPatterns = lowerTags.map(tag => new RegExp(tag, 'i')); // Case-insensitive regex for content matching

  const pipeline: PipelineStage[] = [
    // 1. Unwind the quizzes array to treat each quiz as a separate document
    { $unwind: '$quizzes' },
    // 2. Add a 'matchCount' field to each quiz
    {
      $addFields: {
        'quizzes.matchCount': {
          $add: [
            // Match company tags
            {
              $size: {
                $filter: {
                  input: '$tags',
                  as: 'companyTag',
                  cond: { $in: [{ $toLower: '$$companyTag' }, lowerTags] }
                }
              }
            },
            // Match quiz tags
            {
              $size: {
                $filter: {
                  input: '$quizzes.tags',
                  as: 'quizTag',
                  cond: { $in: [{ $toLower: '$$quizTag' }, lowerTags] }
                }
              }
            },
            // Match quiz content (case-insensitive substring match)
            {
              $sum: {
                $map: {
                  input: lowerTags,
                  as: 'tag',
                  in: {
                    $cond: {
                      if: { $regexMatch: { input: { $toLower: '$quizzes.content' }, regex: '$$tag' } },
                      then: 1,
                      else: 0
                    }
                  }
                }
              }
            },
            // Match process_details (case-insensitive substring match)
            {
              $sum: {
                $map: {
                  input: lowerTags,
                  as: 'tag',
                  in: {
                    $cond: {
                      if: { $regexMatch: { input: { $toLower: '$quizzes.process_details' }, regex: '$$tag' } },
                      then: 1,
                      else: 0
                    }
                  }
                }
              }
            },
            // Match interview_questions (case-insensitive substring match)
            {
              $sum: {
                $map: {
                  input: lowerTags,
                  as: 'tag',
                  in: {
                    $cond: {
                      if: { $regexMatch: { input: { $toLower: '$quizzes.interview_questions' }, regex: '$$tag' } },
                      then: 1,
                      else: 0
                    }
                  }
                }
              }
            },
          ]
        }
      }
    },
    // 3. Filter out quizzes that have no matches
    {
      $match: {
        'quizzes.matchCount': { $gt: 0 }
      }
    },
    // 4. Sort by matchCount in descending order
    {
      $sort: {
        'quizzes.matchCount': -1
      }
    },
    // 5. Project to return only the quiz data, excluding the temporary matchCount and other company fields
    {
      $project: {
        _id: '$quizzes._id',
        title: '$quizzes.title',
        quiz_id: '$quizzes.quiz_id',
        tags: '$quizzes.tags',
        content: '$quizzes.content',
        forum_link: '$quizzes.forum_link',
        process_details: '$quizzes.process_details',
        interview_questions: '$quizzes.interview_questions',
        // You might want to include company name if it's relevant for the client
        // company: '$company',
        // company_he: '$company_he',
        // matchCount: '$quizzes.matchCount' // Keep this if you want to see the score
      }
    }
  ];

  try {
    // Execute the aggregation pipeline
    const quizzes = await CompanyModel.aggregate<QuizData>(pipeline).exec();
    console.log(`Found ${quizzes.length} matching quizzes using aggregation.`);
    return quizzes;
  } catch (error) {
    console.error('Error during quiz search aggregation:', error);
    return [];
  }
};