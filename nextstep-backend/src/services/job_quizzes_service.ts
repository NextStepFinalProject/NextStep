import fs from 'fs';
import * as cheerio from 'cheerio';
import { config } from '../config/config';
import { CompanyModel } from '../models/company_model';
import { CompanyData, ICompany, QuizData } from 'types/company_types';
import { Document } from 'mongoose';

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
    const sectionText = $(section).text().replace(/\s+/g, ' ').trim();
    let [company_en, company_he] = sectionText.split('-').map(s => s.trim());
    if (!company_he) {
      company_he = company_en;
    }
    const company_tags = [company_en, company_he, "interview", "hi-tech"];
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
    await CompanyModel.deleteMany({});
    await CompanyModel.insertMany(companies);
  }

  return companies.length;
};