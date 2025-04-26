import passport from 'passport';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import dotenv from 'dotenv';
import dotenvExpand from "dotenv-expand";

dotenv.config();
dotenvExpand.expand(dotenv.config());

passport.serializeUser((user: any, done) => {
    done(null, user);
});

passport.deserializeUser((user: any, done) => {
    done(null, user);
});

passport.use('linkedin', new LinkedInStrategy({
        clientID: process.env.LINKEDIN_CLIENT_ID!,
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
        callbackURL: process.env.LINKEDIN_CALLBACK_URL || 'http://localhost:3000/linkedin/callback',
        scope: ['profile', 'openid', 'email'], // Request additional scopes here if needed.
        // state: true,
    },
    (accessToken: string, refreshToken: string, profile: any, done: Function) => {

        if (!profile) {
            console.error('Failed to fetch user profile');
            return done(new Error('No profile returned by LinkedIn'));
        }

        // Here you could perform further processing (e.g., saving the profile to a database)
        console.log('LinkedIn profile:', profile);
        console.log('Access Token:', accessToken);
        console.log('Refresh Token:', refreshToken);
        return done(null, profile);
    }
));
