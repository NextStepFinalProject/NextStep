export interface LoginResponse {
    userId: string;
    username: string;
    accessToken: string;
    refreshToken: string;
    imageFilename?: string;
    email?: string;
    id?: string;
}
