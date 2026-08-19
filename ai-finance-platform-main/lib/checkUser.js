import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";
import { sendEmail } from "@/actions/send-email";
import EmailTemplate from "@/emails/template";

export const checkUser = async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  try {
    const loggedInUser = await db.user.findUnique({
      where: {
        clerkUserId: user.id,
      },
    });

    if (loggedInUser) {
      return loggedInUser;
    }

    const name = `${user.firstName} ${user.lastName}`;

    const newUser = await db.user.create({
      data: {
        clerkUserId: user.id,
        name,
        imageUrl: user.imageUrl,
        email: user.emailAddresses[0].emailAddress,
      },
    });

    // Send the beautiful RGB welcome email asynchronously
    sendEmail({
      to: newUser.email,
      subject: `✨ Welcome to SAMPAT, ${newUser.name}!`,
      react: EmailTemplate({
        userName: newUser.name,
        type: "welcome",
      }),
    }).catch((err) => console.error("Failed to send welcome email:", err));

    return newUser;
  } catch (error) {
    console.log(error.message);
  }
};
