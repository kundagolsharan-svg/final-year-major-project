const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI
async function list() {
  try {
    const models = await genAI.listModels();
    console.log(JSON.stringify(models, null, 2));
  } catch (e) {
    console.error("List Models Error:", e);
  }
}

list();
