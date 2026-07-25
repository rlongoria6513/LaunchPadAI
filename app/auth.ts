import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",

      credentials: {
        email: {},
        password: {},
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const connection = await mysql.createConnection({
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
        });

        const [rows] = await connection.execute(
          "SELECT id, name, email, password, role FROM users WHERE email = ? LIMIT 1",
          [String(credentials.email)]
        );

        await connection.end();

        const users = rows as any[];

        if (!users.length) return null;

        const user = users[0];

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!valid) return null;

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
        };
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
  (session.user as any).id = token.id;
  (session.user as any).role = token.role;
  return session;
}
  },

  secret: process.env.AUTH_SECRET,
});