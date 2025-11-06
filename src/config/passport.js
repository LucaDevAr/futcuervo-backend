import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import { createSession } from "../services/sessionService.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 1️⃣ Buscar usuario por googleId
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // 2️⃣ Si no existe, buscar usuario por email
          user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            // 3️⃣ Si existe usuario con email, actualizar googleId
            user.googleId = profile.id;
            await user.save();
          } else {
            // 4️⃣ Si no existe usuario, crear nuevo
            user = await User.create({
              googleId: profile.id,
              name: profile.displayName,
              image: profile.photos[0].value,
              email: profile.emails[0].value,
            });
          }
        }

        // 5️⃣ Crear sesión en Redis
        const sessionId = await createSession(user._id, {
          id: user._id,
          name: user.name,
          image: user.image,
          email: user.email,
        });

        return done(null, { user, sessionId });
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

export default passport;
