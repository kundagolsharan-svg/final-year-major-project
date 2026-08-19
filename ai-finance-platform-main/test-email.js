import { sendEmail } from "./actions/send-email.js";
import EmailTemplate from "./emails/template.jsx";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log("No user found in database!");
      return;
    }

    console.log("Sending test email to:", user.email);

    const result = await sendEmail({
      to: user.email,
      subject: "✨ Your Premium SAMPAT Report",
      react: EmailTemplate({
        userName: user.name || "Sharan",
        type: "monthly-report",
        data: {
          month: "August",
          stats: {
            totalIncome: 125000,
            totalExpenses: 45000,
            byCategory: {
              housing: 20000,
              groceries: 10000,
              transportation: 5000,
              entertainment: 5000,
              utilities: 5000,
            },
          },
          insights: [
            "Your savings rate is excellent this month! You saved 64% of your income.",
            "Housing expenses are within the recommended 30% threshold.",
            "Consider investing your surplus ₹80,000 to maximize returns."
          ],
        },
      }),
    });

    console.log("Send result:", JSON.stringify(result, null, 2));

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
