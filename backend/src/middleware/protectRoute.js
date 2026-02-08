import { clerkClient, requireAuth } from "@clerk/express";
import User from "../models/User.js";
import { upsertStreamUser } from "../lib/stream.js";

export const protectRoute = [
  requireAuth(),
  async (req, res, next) => {
    try {
      const clerkId = req.auth().userId;

      if (!clerkId) return res.status(401).json({ message: "Unauthorized - invalid token" });

      // find user in db by clerk ID
      let user = await User.findOne({ clerkId });

      if (!user) {
        // fetch user from clerk
        const clerkUser = await clerkClient.users.getUser(clerkId);
        const email = clerkUser.emailAddresses[0].emailAddress;
        const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`;
        const profileImage = clerkUser.imageUrl;

        user = new User({
          clerkId,
          email,
          name,
          profileImage,
        });

        await user.save();

        await upsertStreamUser({
          id: clerkId,
          name,
          image: profileImage,
        });
      }

      // attach user to req
      req.user = user;
 
      next();
    } catch (error) {
      console.error("Error in protectRoute middleware", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
];
