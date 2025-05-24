import axios from 'axios';

export const getCompanyLogo = async (companyName: string): Promise<string | null> => {
    try {
        const response = await axios.get(`https://logo.clearbit.com/${encodeURIComponent(companyName)}.com`);
        return response.status === 200 ? response.config.url ?? null : null;
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Failed to fetch logo for company: ${companyName}`, error.message);
        } else {
            console.error(`Failed to fetch logo for company: ${companyName}`, error);
        }
        return null;
    }
};
