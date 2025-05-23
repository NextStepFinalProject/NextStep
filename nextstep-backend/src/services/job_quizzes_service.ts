import fs from 'fs';
import * as cheerio from 'cheerio';
import mongoose from 'mongoose';
import { config } from '../config/config';

export interface Quiz {
  title: string;
  quiz_id: number;
  tags: string[];
  content: string;
  forum_link: string;
}

export interface CompanyQuizzes {
  company: string;
  company_he: string;
  tags: string[];
  quizzes: Quiz[];
}

// Define the schema (or use your own models)
const quizSchema = new mongoose.Schema({
  company: String,
  company_he: String,
  tags: [String],
  quizzes: [
    {
      title: String,
      quiz_id: Number,
      tags: [String],
      content: String,
      forum_link: String,
    }
  ]
}, { collection: 'job_quizzes' });

const QuizModel = mongoose.models.JobQuiz || mongoose.model('JobQuiz', quizSchema);

const parseJobQuizzesFromJobHuntHtml = (htmlPath: string): CompanyQuizzes[] => {
  const html = fs.readFileSync(htmlPath, 'utf-8');
  const $ = cheerio.load(html);

  const companies: CompanyQuizzes[] = [];

  $('h2.faq-section-heading').each((_, section) => {
    const sectionText = $(section).text().replace(/\s+/g, ' ').trim();
    let [company_en, company_he] = sectionText.split('-').map(s => s.trim());
    if (!company_he) {
      company_he = company_en;
    }
    const company_tags = [company_en, company_he, "interview", "hi-tech"];
    const quizzes: Quiz[] = [];

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
      // Generate tags: company, job role, technology, year, etc.
      const quiz_tags = [company_en, company_he, ...quiz_title.split(/\s+/)];

      quizzes.push({
        title: quiz_title,
        quiz_id,
        tags: quiz_tags,
        content,
        forum_link,
      });
    });

    companies.push({
      company: company_en,
      company_he,
      tags: company_tags,
      quizzes,
    });
  });

  return companies;
};

export const importJobQuizzesToDb = async (): Promise<number> => {
  const companies = parseJobQuizzesFromJobHuntHtml(config.assets.jobQuizzesJobHuntHtmlPath());

  if (companies.length) {
    await QuizModel.deleteMany({});
    await QuizModel.insertMany(companies);
  }

  return companies.length;
};