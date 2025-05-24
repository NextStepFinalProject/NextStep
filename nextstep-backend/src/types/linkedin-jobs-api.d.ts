declare module 'linkedin-jobs-api' {
    interface Job {
        position: string;
        company: string;
        location: string;
        date: string;
        // Add other relevant fields as needed
      }
    
      interface QueryOptions {
        keyword: string;
        location?: string;
        dateSincePosted?: string;
        jobType?: string;
        remoteFilter?: string;
        salary?: string;
        experienceLevel?: string;
        limit?: string;
        page?: string;
      }
    
      function query(options: QueryOptions): Promise<Job[]>;
    
      export = { query };
}

