import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,

  providers: [
    Credentials({
      name: "Credentials",

      credentials: {
        email: {},
        password: {},
      },

      async authorize(credentials) {
        console.log("LOGIN EMAIL:", String(credentials?.email || ""));
console.log("LOGIN PASSWORD LENGTH:", String(credentials?.password || "").length);
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = String(credentials.email)
          .trim()
          .toLowerCase();

        const enteredPassword = String(credentials.password);

        const connection = await mysql.createConnection({
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
        });

        try {
          const [rows] = await connection.execute(
            `
            SELECT
              id,
              name,
              email,
              password,
              role
            FROM users
            WHERE LOWER(email) = ?
            LIMIT 1
            `,
            [email]
          );

          const users = rows as any[];

          if (!users.length) {
            console.log("Login failed: user not found");
            return null;
          }

          const user = users[0];

          const storedPassword = String(user.password || "");

          let valid = false;

          // Normal bcrypt password
          if (
            storedPassword.startsWith("$2a$") ||
            storedPassword.startsWith("$2b$") ||
            storedPassword.startsWith("$2y$")
          ) {
            valid = await bcrypt.compare(
              enteredPassword,
              storedPassword
            );
          } else {
            // Support an older LaunchPad account once,
            // then automatically upgrade it to bcrypt.
            valid = enteredPassword === storedPassword;

            if (valid) {
              const newHash = await bcrypt.hash(
                enteredPassword,
                12
              );

              await connection.execute(
                `
                UPDATE users
                SET password = ?
                WHERE id = ?
                `,
                [newHash, user.id]
              );

              console.log(
                "Older password upgraded securely for user:",
                user.id
              );
            }
          }

          if (!valid) {
            console.log("Login failed: incorrect password");
            return null;
          }

          console.log("Login successful for user:", user.id);

          return {
            id: String(user.id),
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } finally {
          await connection.end();
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }

      return session;
    },
  },

  secret: process.env.AUTH_SECRET,
});