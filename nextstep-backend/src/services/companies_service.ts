import fs from 'fs';
import * as cheerio from 'cheerio';
import { config } from '../config/config';
import { CompanyModel } from '../models/company_model';
import { CompanyData, ICompany, QuizData } from 'types/company_types';
import { Document, PipelineStage } from 'mongoose';
import path from 'path';
import { chatWithAI } from './chat_api_service';

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

// Helper function to check if content matches any of the given terms
function hasMatchingTerms(content: string, terms: string[]): boolean {
  const lowerContent = content.toLowerCase();
  return terms.some(term => lowerContent.includes(term.toLowerCase()));
}

// Helper function to check if content matches any of the given terms in both English and Hebrew
function matchTagsBilingual(content: string, englishTerms: string[], hebrewTerms: string[]): boolean {
  const lowerContent = content.toLowerCase();
  return englishTerms.some(term => lowerContent.includes(term.toLowerCase())) ||
         hebrewTerms.some(term => lowerContent.includes(term));
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
        ...quiz_title.split(/\s+/)
      ].filter(Boolean)));

      // Add matched predefined tags from title and content
      const matched_tags = new Set([
        ...matchTags(quiz_title, PREDEFINED_TAGS),
        ...matchTags(content, PREDEFINED_TAGS),
      ]);
      quiz_tags = Array.from(new Set([...quiz_tags, ...matched_tags]));

      // Add specialty tags based on content analysis
      const contentText = $(content).text().toLowerCase();
      
      // Check for code-related content
      const codeTerms = [
        'code', 'programming', 'algorithm', 'function', 'class', 'method', 'variable', 'loop', 'condition', 'syntax',
        'קוד', 'תכנות', 'אלגוריתם', 'פונקציה', 'מחלקה', 'מתודה', 'משתנה', 'לולאה', 'תנאי', 'תחביר',
        'מבנה נתונים', 'אובייקט', 'מערך', 'רשימה', 'עץ', 'גרף', 'חיפוש', 'מיון', 'רקורסיה', 'סיבוכיות'
      ];
      if (hasMatchingTerms(contentText, codeTerms)) {
        quiz_tags.push('SPECIALTY_CODE');
      }

      // Check for system design content
      const designTerms = [
        'design', 'architecture', 'system', 'component', 'service', 'microservice', 'scalability', 'performance', 'database', 'api',
        'עיצוב', 'ארכיטקטורה', 'מערכת', 'רכיב', 'שירות', 'מיקרו-שירות', 'הרחבה', 'ביצועים', 'מסד נתונים', 'ממשק תכנות',
        'תשתית', 'עומסים', 'זמינות', 'שחזור', 'גיבוי', 'אבטחה', 'אימות', 'הרשאות', 'תקשורת', 'פרוטוקול'
      ];
      if (hasMatchingTerms(contentText, designTerms)) {
        quiz_tags.push('SPECIALTY_DESIGN');
      }

      // Check for specific technologies
      const techTerms = [
        'framework', 'library', 'technology', 'stack', 'tool', 'platform', 'language', 'framework', 'library',
        'מסגרת', 'ספרייה', 'טכנולוגיה', 'סט', 'כלי', 'פלטפורמה', 'שפה', 'מסגרת', 'ספרייה',
        'פיתוח', 'תשתית', 'סביבה', 'מערכת הפעלה', 'שרת', 'לקוח', 'דפדפן', 'מובייל', 'ענן', 'תשתית'
      ];
      if (hasMatchingTerms(contentText, techTerms)) {
        quiz_tags.push('SPECIALTY_TECHNOLOGIES');
      }

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
      ...quiz_title.split(/\s+/)
    ].filter(Boolean)));

    // Add matched predefined tags from title, process details, and interview questions
    const matched_tags = new Set([
      ...matchTags(quiz_title, PREDEFINED_TAGS),
      ...matchTags(process_details, PREDEFINED_TAGS),
      ...matchTags(interview_questions, PREDEFINED_TAGS),
    ]);
    quiz_tags = Array.from(new Set([...quiz_tags, ...matched_tags]));

    // Add specialty tags based on content analysis
    const contentText = (process_details + ' ' + interview_questions).toLowerCase();
    
    // Check for code-related content
    const codeTerms = [
      'code', 'programming', 'algorithm', 'function', 'class', 'method', 'variable', 'loop', 'condition', 'syntax',
      'קוד', 'תכנות', 'אלגוריתם', 'פונקציה', 'מחלקה', 'מתודה', 'משתנה', 'לולאה', 'תנאי', 'תחביר',
      'מבנה נתונים', 'אובייקט', 'מערך', 'רשימה', 'עץ', 'גרף', 'חיפוש', 'מיון', 'רקורסיה', 'סיבוכיות'
    ];
    if (hasMatchingTerms(contentText, codeTerms)) {
      quiz_tags.push('SPECIALTY_CODE');
    }

    // Check for system design content
    const designTerms = [
      'design', 'architecture', 'system', 'component', 'service', 'microservice', 'scalability', 'performance', 'database', 'api',
      'עיצוב', 'ארכיטקטורה', 'מערכת', 'רכיב', 'שירות', 'מיקרו-שירות', 'הרחבה', 'ביצועים', 'מסד נתונים', 'ממשק תכנות',
      'תשתית', 'עומסים', 'זמינות', 'שחזור', 'גיבוי', 'אבטחה', 'אימות', 'הרשאות', 'תקשורת', 'פרוטוקול'
    ];
    if (hasMatchingTerms(contentText, designTerms)) {
      quiz_tags.push('SPECIALTY_DESIGN');
    }

    // Check for specific technologies
    const techTerms = [
      'framework', 'library', 'technology', 'stack', 'tool', 'platform', 'language', 'framework', 'library',
      'מסגרת', 'ספרייה', 'טכנולוגיה', 'סט', 'כלי', 'פלטפורמה', 'שפה', 'מסגרת', 'ספרייה',
      'פיתוח', 'תשתית', 'סביבה', 'מערכת הפעלה', 'שרת', 'לקוח', 'דפדפן', 'מובייל', 'ענן', 'תשתית'
    ];
    if (hasMatchingTerms(contentText, techTerms)) {
      quiz_tags.push('SPECIALTY_TECHNOLOGIES');
    }

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
 * Search for quizzes that best match the given tags using MongoDB aggregation
 * and $text search for content fields.
 * Returns quizzes sorted by relevance (text score + tag matches).
 */
export const searchQuizzesByTags = async (tags: string[]): Promise<QuizData[]> => {
  // if (!tags || tags.length === 0) {
  //   return []; // No tags provided, return empty results
  // }

  // For $text search, tags are space-separated words or phrases.
  // We'll also use them for array matching.
  const lowerTags = tags.map(t => t.toLowerCase());
  const searchText = tags.join(' '); // Combine tags for $text search

  const pipeline: PipelineStage[] = [
    // 1. Initial match for company-level or quiz-level tags, OR $text search on content.
    // This is crucial to filter down documents BEFORE unwinding.
    {
      $match: {
        $or: [
          // Match in company's 'tags' array
          { tags: { $in: lowerTags } },
          // Match in quizzes' 'tags' array (requires dot notation for subdocuments)
          { 'quizzes.tags': { $in: lowerTags } },
          // Text search across content fields.
          // $text operator is highly optimized for this.
          { $text: { $search: searchText } }
        ]
      }
    },
    // 2. Unwind the quizzes array to treat each quiz as a separate document
    // (Only after initial filtering)
    { $unwind: '$quizzes' },
    // 3. Add a 'matchCount' field to each quiz
    // We'll calculate a score based on various matches.
    {
      $addFields: {
        'quizzes.matchScore': {
          $add: [
            // Score from company tags (higher if more tags match)
            {
              $multiply: [ // Give more weight to direct tag matches
                {
                  $size: {
                    $filter: {
                      input: '$tags',
                      as: 'companyTag',
                      cond: { $in: [{ $toLower: '$$companyTag' }, lowerTags] }
                    }
                  }
                }, 5 // Weight for company tag matches
              ]
            },
            // Score from quiz tags
            {
              $multiply: [ // Give more weight to direct quiz tag matches
                {
                  $size: {
                    $filter: {
                      input: '$quizzes.tags',
                      as: 'quizTag',
                      cond: { $in: [{ $toLower: '$$quizTag' }, lowerTags] }
                    }
                  }
                }, 10 // Weight for quiz tag matches
              ]
            },
            // Score from $text search on content fields (if text index is used)
            // This score comes from the initial $match stage.
            // If the $text match is crucial, you might add a specific score here.
            // For now, let's assume the $text match filter is sufficient.
            // If we strictly want to count word occurrences, we'd need more complex logic
            // without a text index. With it, we rely on its own scoring.
            // For a basic score without a text index, one could count occurrences,
            // but that's what was slow with $regexMatch.
            // If a text index is used, we can directly incorporate the $meta: "textScore"
            // but that has to be done at the company level before unwind.
            // A simpler way for a "contains" match score is just to count found words.
            // Let's refine this to directly check lowercased fields for exact tag matches
            // for those cases where $text search might not be ideal (e.g., short tags)
            // or if you choose not to use $text index.

            // If NOT using $text index for content fields, revert to regex counting,
            // but be aware of performance.
            // If using $text index, this part might be less critical or different.

            // As we are already performing $text search in the initial $match,
            // and $text search inherently orders by relevance, we can rely on that.
            // For individual field matches (like "SQL" within content), we can still
            // do counts, but it's crucial to decide if $text search covers this sufficiently.

            // Let's re-add simple contains logic for robustness, assuming content fields are not massive.
            // If they are huge, definitely go for $text index or external search.
            {
              $sum: {
                $map: {
                  input: lowerTags,
                  as: 'tag',
                  in: {
                    $cond: {
                      if: { $regexMatch: { input: { $toLower: '$quizzes.content' }, regex: { $concat: ['.*', '$$tag', '.*'] } } }, // .*.tag.* for contains
                      then: 1,
                      else: 0
                    }
                  }
                }
              }
            },
            // Include $textScore if it was part of the initial $match and you want to use it
            // This would require `$match: { $text: { $search: searchText } }` to be the *first* stage
            // and `$project: { score: { $meta: "textScore" }, ... }` to be applied right after.
            // If you want to use $textScore, you'd calculate it at the Company level,
            // then unwind, then include it in the quiz score.
            // For now, let's keep the existing approach of initial filtering and then scoring after unwind.
          ]
        }
      }
    },
    // 4. Filter out quizzes that have no matches based on the calculated score
    // This is important because the initial $match might have been broad
    {
      $match: {
        'quizzes.matchScore': { $gt: 0 }
      }
    },
    // 5. Sort by matchScore in descending order
    {
      $sort: {
        'quizzes.matchScore': -1
      }
    },
    // 6. Project to return only the quiz data, excluding temporary fields
    {
      $project: {
        _id: '$quizzes._id',
        title: '$quizzes.title',
        quiz_id: '$quizzes.quiz_id',
        tags: '$quizzes.tags',
        content: '$quizzes.content',
        forum_link: '$quizzes.forum_link',
        // Optional: Include company names if needed
        // company: '$company',
        // company_he: '$company_he',
        // matchScore: '$quizzes.matchScore' // Useful for debugging relevance
      }
    }
  ];

  try {
    const quizzes = await CompanyModel.aggregate<QuizData>(pipeline).exec();
    console.log(`Found ${quizzes.length} matching quizzes using aggregation.`);
    return quizzes;
  } catch (error) {
    console.error('Error during quiz search aggregation:', error);
    return [];
  }
};

/**
 * Generate a custom-tailored quiz on any subject, based on our real quiz database.
 * @param quizSubject The subject you want to generate a quiz for.
 *                    Example: "Java Spring Boot Microservices Interview Questions" or
 *                             "QA Automation Python" or
 *                             "Java Spring Boot Microservices Interview Questions SPECIALTY_CODE SPECIALTY_DESIGN SPECIALTY_TECHNOLOGIES"
 *                    Note: The SPECIALTY_ tags are optional, and can be used to specify the specialty of the quiz.
 */
export const generateQuiz = async (quizSubject: string): Promise<any> => {
  // Take the first 10 best matching quizzes.
  const tags = quizSubject.split(' ');
  const quizzes = (await searchQuizzesByTags(tags)).slice(0, 10);

  const GEN_QUIZ_SYSTEM_PROMPT = "You are an AI assistant specialized in generating personalized interview quiz content based on real-world interview data. Your goal is to create a new, well-structured interview quiz tailored to a user's specific search query, drawing insights and patterns from a provided set of actual interview quizzes.";

  const userQuizSpecialties = quizSubject.split(' ')
  .filter((tag: string) => tag.startsWith('SPECIALTY_'))
  .map((tag: string) => tag.replace('SPECIALTY_', ''))
  .join(', ');

  const prompt = `
**User Search Query:**
${quizSubject}

${userQuizSpecialties.length > 0 ? `**User Quiz Specialties:**
${userQuizSpecialties}` : ''}

${userQuizSpecialties.length > 0 ? `**Specialty Tags Description:**
Added content analysis to detect and add the specialty tags:
CODE: Added when content contains code-related terms like 'code', 'programming', 'algorithm', 'function', 'class', 'method', 'variable', 'loop', 'condition', or 'syntax'
DESIGN: Added when content contains system design terms like 'design', 'architecture', 'system', 'component', 'service', 'microservice', 'scalability', 'performance', 'database', or 'api'
TECHNOLOGIES: Added when content contains technology-related terms like 'framework', 'library', 'technology', 'stack', 'tool', 'platform', 'language'` : ''}

**Relevant Real Quiz Data (JSON Array):**
\`\`\`json
${quizzes}
\`\`\`

**Instructions:**
Analyze: Review the User Search Query and the provided Relevant Real Quiz Data.
Synthesize: Combine common themes, technologies, question types, process details, and implied soft skill requirements found across the relevant real quizzes, prioritizing relevance to the user's query.
Generate One Quiz: Create one (1) brand new, highly relevant, and unique interview quiz specifically tailored to the User Search Query. Do NOT simply copy-paste existing quizzes.
Structure: Format the output as a single JSON object adhering strictly to the QuizData interface below.
Content Details:
  _id: Generate a unique string, e.g., "generated_[TIMESTAMP]".
  title: A concise and relevant title for the generated quiz.
  tags: Include highly relevant technical and role-based tags, both English and Hebrew if appropriate, derived from the query and the provided data.
  content: A comprehensive narrative combining the interview process and specific questions, similar in style to the provided examples.
  job_role: Infer the most appropriate job role from the user query and real data.
  company_name_en, company_name_he: You can use a generic "Leading Tech Company" / "חברת טכנולוגיה מובילה" or "Startup in [relevant field]" / "סטארטאפ בתחום ה[רלוונטי]".
  process_details: A concise summary of a typical interview process for this role/company type, extracted or synthesized from the provided data.
  question_list: Crucially, all generated specific interview questions. An array of individual questions. Each element should be a distinct question.
  answer_list: Crucially, parse the question_list string into an array of individual answers. Each element should be a distinct answer, corresponding to the questions.
  keywords: Extract 5-10 additional relevant technical or conceptual keywords that the user might find useful for preparation.
  interviewer_mindset: Describe the soft skills, characteristics, temperament, and professional attributes that an interviewer for this specific job role (based on the user's query and the context from real quizzes) would likely be looking for. Focus on traits that would give the applicant "extra points," such as straightforwardness, curiosity, social skills, professionalism, collaboration, communication (with colleagues, 3rd parties, customers), problem-solving approach, adaptability, initiative, attention to detail, etc. Aim for a paragraph or two.
  ${userQuizSpecialties.length > 0 ? `specialty_tags: Define the quiz with specialty tags, as provided to you earlier, relevant technical or conceptual keywords that the user might find useful for preparation. The possible tags are: Code, Design, Technologies. The quiz should have at least one specialty tag.` : ''}

**Desired Output Format (JSON)**:
\`\`\`json
{
  "_id": "string",
  "title": "string",
  "tags": ["string", "string", ...],
  "content": "string",
  "job_role": "string",
  "company_name_en": "string",
  "company_name_he": "string",
  "process_details": "string",
  "question_list": ["string", "string", ...],
  "answer_list": ["string", "string", ...],
  "keywords": ["string", "string", ...],
  "interviewer_mindset": "string",
  ${userQuizSpecialties.length > 0 ? `"specialty_tags": ["string", "string", ...]` : ''}
}
\`\`\`

Return ONLY the JSON, without any other text, so I could easily retrieve it. As A correct json format.
`;

  const aiResponse = await chatWithAI(GEN_QUIZ_SYSTEM_PROMPT, [prompt]);

  const cleanedResponse = aiResponse
  .trim()
  .replace(/^```json[\s\n]*/, "") // Remove "json" and any whitespace after it
  .replace(/^```/, "") // Remove leading ```
  .replace(/```$/, ""); // Remove trailing ```

  const parsed = JSON.parse(cleanedResponse) as any;

  parsed.specialty_tags = parsed.specialty_tags || [];

  return parsed;
}

/**
 * @param answeredQuiz The quiz answered by the user.
 * @returns Graded quiz with tips.
 */
export const gradeQuiz = async (answeredQuiz: any): Promise<any> => {
  const GRADE_QUIZ_SYSTEM_PROMPT = "You are an AI Interview Coach, an expert in real-world interviews, and skilled in providing constructive feedback and grading. Your task is to evaluate a user's answers to an interview quiz based on the original questions, your pre-generated ideal answers, and general professional knowledge. You should grade each answer from 0-100, considering that multiple correct or valid approaches may exist (or may not). Your feedback should be actionable and focused on improvement. Base yourself only on the user's answered quiz that will be given to you.";

  const prompt = `
**Original Quiz Data with User's Answers (JSON Object):**
${JSON.stringify(answeredQuiz)}

**Instructions:**
  Base yourself on the the user_answer_list and question_list fields.
  Also, base yourself on the answer_list and the interviewer_mindset fields.
  Grade and tip to user's answers one by one, by the following rules:

  Grade (0-100): Assign a numerical score from 0 to 100 to the user_answer_list based on:
    Accuracy: Is the answer technically correct?
    Completeness: Does it cover the key aspects of the question?
    Clarity and Conciseness: Is it well-articulated and to the point?
    Depth: Does it demonstrate a solid understanding beyond surface-level knowledge?
    Professional Knowledge: Use your general professional knowledge to evaluate, not just keywords. Be open to multiple valid answers.
    Context: Consider the complexity implied by the question and the job_role.
  Generate "Tip": Provide a small, concise, and actionable tip for the user to improve that specific answer for future interviews. This tip should be professional and forward-looking. Consider:
    Suggesting deeper dives into specific technologies or concepts (e.g., "Explore idempotent operations in distributed systems").
    Improving explanation clarity or structure (e.g., "Next time, start with a clear definition before diving into examples").
    Relating the answer to the interviewer_mindset (e.g., "Highlighting the trade-offs involved would demonstrate critical thinking and problem-solving skills, which are valued by interviewers.").
    Suggesting a real-world example or scenario.

Summarize Results:

  final_quiz_grade: Calculate the average of all individual grade scores to get a final overall quiz grade (0-100).
  final_summary_tip: Provide one overarching, professional tip for the user to improve their overall interview performance, drawing insights from their collective answers and directly referencing the interviewer_mindset field for behavioral/soft skill advice.

**Desired Output Format (JSON)**:
\`\`\`json
{
  "graded_answers": [
    {
      "question": "string",
      "user_answer": "string",
      "grade": "number (0-100)",
      "tip": "string"
    },
    // ... one object for each question answered
  ],
  "final_quiz_grade": "number (0-100)",
  "final_summary_tip": "string"
}
\`\`\`

Return ONLY the JSON, without any other text, so I could easily retrieve it.
`;

  const aiResponse = await chatWithAI(GRADE_QUIZ_SYSTEM_PROMPT, [prompt]);
  const parsed = JSON.parse(aiResponse.trim().replace("```json", "").replace("```", "")) as any;

  return parsed;
}
