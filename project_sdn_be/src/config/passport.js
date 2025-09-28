import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        let user = await User.findOne({ email });

        if (!user) {
          // Tạo tài khoản mới với trạng thái pending
          const randomPassword = crypto.randomBytes(16).toString('hex');
          const passwordHash = await bcrypt.hash(randomPassword, 12);

          user = await User.create({
            name: profile.displayName,
            email: email,
            password: passwordHash,
            phone: profile.phoneNumbers?.[0]?.value || '',
            roles: ['renter'],
            avatar: profile.photos?.[0]?.value || '',
            identityVerification: {
              status: 'pending',
              verifiedAt: null,
            },
            isActive: true,
          });
        }

        // Cho phép login, kể cả khi chưa verified
        return done(null, user);
      } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
