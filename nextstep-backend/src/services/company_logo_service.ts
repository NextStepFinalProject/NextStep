import axios from 'axios';

export const getCompanyLogo = async (companyName: string, extensions: string[] = ['.com', '.co.il']): Promise<string | null> => {
    try {
        for (const extension of extensions) {
            try {
                const response = await axios.get(`https://logo.clearbit.com/${encodeURIComponent(companyName)}${extension}`);
                if (response.status === 200) {
                    return response.config.url!;
                }
            } catch (error) {
                // Continue to next extension if this one fails
                continue;
            }
        }
        return null;
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Failed to fetch logo for company: ${companyName}`, error.message);
        } else {
            console.error(`Failed to fetch logo for company: ${companyName}`, error);
        }
        return null;
    }
};
