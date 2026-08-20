"use server";

import { GoogleGenAI } from "@google/genai";
import { sampleTopics } from "@/lib/data";

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ 
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

export async function generateLearningPath(grade: string, subjects: string[], diagnosticScore: number): Promise<string[]> {
  const topicsList = sampleTopics["Mathematics"].map(t => `${t.id}: ${t.title}`).join("\n");
  
  const prompt = `You are HuluLearn's AI Learning Agent for an Ethiopian Grade ${grade} student.
The student has selected the following subjects: ${subjects.join(", ")}.
They just completed a diagnostic assessment in Mathematics and scored ${diagnosticScore}/3.

Available Mathematics Topics:
${topicsList}

Create a personalized learning path of 3 topics for this student based on their score.
If they scored low (0-1), start with the most basic topics.
If they scored high (2-3), skip the absolute basics and give them a challenge.

Return ONLY a JSON array of the 3 topic IDs you recommend, in order. 
Example format: ["math_12_1_1", "math_12_1_2", "math_12_1_3"]
Do not wrap in markdown tags like \`\`\`json.`;

  try {
    const ai = getGeminiClient();
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
      });
      
      let text = response.text || "[\"math_12_1_1\", \"math_12_1_2\", \"math_12_1_3\"]";
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(text);
    }
  } catch (error) {
    console.error("AI Learning Path Error:", error);
  }

  // Fallback learning path based on diagnostic score
  if (diagnosticScore <= 1) {
    return ["math_12_1_1", "math_12_1_2", "math_12_1_3"];
  } else if (diagnosticScore === 2) {
    return ["math_12_1_2", "math_12_1_3", "math_12_1_4"];
  } else {
    return ["math_12_1_3", "math_12_1_4", "math_12_1_5"];
  }
}

export async function generateFeedback(topicId: string, isCorrect: boolean, studentAnswer: string, correctAnswer: string): Promise<string> {
  const prompt = `You are a friendly AI tutor for HuluLearn.
The student just answered a practice question about topic ID: ${topicId}.
Their answer was: "${studentAnswer}".
The correct answer is: "${correctAnswer}".
Did they get it right? ${isCorrect ? "Yes" : "No"}.

Provide a very short (2-3 sentences max), friendly feedback message.
If correct, encourage them!
If incorrect, gently explain why the correct answer is right without being overly complicated. Use simple language suitable for a high school student.`;

  try {
    const ai = getGeminiClient();
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
      });
      
      if (response.text) return response.text;
    }
  } catch (error) {
    console.error("AI Feedback Error:", error);
  }

  return isCorrect 
    ? "Awesome job! You applied the core concept accurately." 
    : `Good try! Remember, the correct answer is "${correctAnswer}". Review the formula steps to see how each term is calculated.`;
}

export type ChatHistoryItem = {
  role: "user" | "assistant" | "model";
  content: string;
};

export async function chatWithLessonTutor({
  messages,
  topicTitle,
  lessonNotes,
  keyPoints = [],
  quizQuestion = "",
  studentAnswer = "",
  correctAnswer = "",
  isCorrect = true,
  grade = "12",
}: {
  messages: ChatHistoryItem[];
  topicTitle: string;
  lessonNotes: string;
  keyPoints?: string[];
  quizQuestion?: string;
  studentAnswer?: string;
  correctAnswer?: string;
  isCorrect?: boolean;
  grade?: string;
}): Promise<string> {
  const systemInstruction = `You are HuluLearn's empathetic, highly knowledgeable AI Math Tutor for Ethiopian high school students (Grade ${grade}).
The student has just finished learning the micro-lesson on "${topicTitle}" and completed the practice quiz.

Lesson Context:
- Topic Title: ${topicTitle}
- Core Notes: ${lessonNotes}
- Key Takeaways: ${keyPoints.length > 0 ? keyPoints.join("; ") : "N/A"}
- Quiz Question: ${quizQuestion || "N/A"}
- Student Answer: ${studentAnswer || "N/A"}
- Correct Answer: ${correctAnswer || "N/A"}
- Student Quiz Result: ${isCorrect ? "Correct" : "Incorrect"}

Your Objectives:
1. Help the student understand any concepts, formulas, notation, or quiz steps they didn't fully understand before completing the lesson.
2. If the student asks for clarification or why a specific formula works, break it down clearly with intuitive reasoning and step-by-step math.
3. If the student asks for another quick example/check problem, provide one friendly mini-problem and guide them through it.
4. If the student says they understood everything and are ready to finish, warmly congratulate them on mastering the topic, praise their effort, and encourage them to press the Complete button!
5. Keep your responses concise (2-4 clear sentences or bullet points), engaging, respectful, and formatted with clean markdown.`;

  try {
    // Crucial for Gemini API: multi-turn conversation MUST start with a 'user' turn.
    // Filter out initial model/assistant greetings from the history payload sent to the API.
    const conversationTurns = [...messages];
    while (conversationTurns.length > 0 && (conversationTurns[0].role === "assistant" || conversationTurns[0].role === "model")) {
      conversationTurns.shift();
    }

    const latestUserMessage = messages.filter(m => m.role === "user").pop()?.content || "";

    const ai = getGeminiClient();
    if (ai && conversationTurns.length > 0) {
      const contents = conversationTurns.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        },
      });

      if (response.text && response.text.trim().length > 0) {
        return response.text.trim();
      }
    }

    // Contextual fallback logic if AI key is pending or during connection hiccups
    return generateCurriculumFallback({
      latestUserMessage,
      topicTitle,
      lessonNotes,
      keyPoints,
      quizQuestion,
      studentAnswer,
      correctAnswer,
      isCorrect,
    });
  } catch (error) {
    console.error("AI Tutor Chat Error:", error);
    const latestUserMessage = messages.filter(m => m.role === "user").pop()?.content || "";
    return generateCurriculumFallback({
      latestUserMessage,
      topicTitle,
      lessonNotes,
      keyPoints,
      quizQuestion,
      studentAnswer,
      correctAnswer,
      isCorrect,
    });
  }
}

function generateCurriculumFallback({
  latestUserMessage,
  topicTitle,
  lessonNotes,
  keyPoints,
  quizQuestion,
  correctAnswer,
  isCorrect,
}: {
  latestUserMessage: string;
  topicTitle: string;
  lessonNotes: string;
  keyPoints: string[];
  quizQuestion?: string;
  studentAnswer?: string;
  correctAnswer?: string;
  isCorrect?: boolean;
}): string {
  const query = latestUserMessage.toLowerCase();

  if (query.includes("ready") || query.includes("understood") || query.includes("complete") || query.includes("got it") || query.includes("all good")) {
    return `🎉 Fantastic effort mastering **${topicTitle}**! You've grasped the core formulas and problem-solving steps. Whenever you're ready, tap the green **Complete Lesson** button below to collect your XP and maintain your streak!`;
  }

  if (query.includes("why") || query.includes("explain the answer") || query.includes("correct answer")) {
    if (quizQuestion && correctAnswer) {
      return `For the question _"${quizQuestion}"_, the correct result is **${correctAnswer}**.\n\nIn this topic, we apply the general formula by substituting the given initial values and common difference/ratio. That directly yields **${correctAnswer}** without needing to calculate all intermediate terms.`;
    }
    return `In **${topicTitle}**, each step builds systematically: identify your first term $a_1$, determine the pattern (difference or ratio), and apply the formula directly to find the target value.`;
  }

  if (query.includes("formula") || query.includes("summarize") || query.includes("summary")) {
    const summaryPoints = keyPoints.length > 0 ? keyPoints.map(p => `• ${p}`).join("\n") : lessonNotes;
    return `Here is a quick summary of the core rules for **${topicTitle}**:\n\n${summaryPoints}\n\nKeep these handy for exams and problem sets!`;
  }

  if (query.includes("example") || query.includes("test") || query.includes("another")) {
    return `Here is a quick check problem for you:\n\n**Problem**: If the first term is $a_1 = 3$ and the common difference is $d = 4$, what is the $5^{\\text{th}}$ term $a_5$?\n\n**Hint**: Use $a_n = a_1 + (n-1)d \\Rightarrow a_5 = 3 + 4(4) = 19$. Try verifying with other values!`;
  }

  return `Great question on **${topicTitle}**! Remember that high school curriculum problems rely on setting up your known variables first, choosing the right formula, and checking your arithmetic. Is there a specific step you want to double-check before completing?`;
}

