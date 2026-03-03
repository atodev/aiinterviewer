import { GoogleGenerativeAI } from '@google/generative-ai';

// ─── Dev switch ───────────────────────────────────────────────────────────────
// Set USE_OLLAMA=true to route all AI calls to a local Ollama instance
// (avoids Gemini quota during development). Flip to false for production.
const USE_OLLAMA = true;
const OLLAMA_BASE = 'http://192.168.0.150:11434';
const OLLAMA_MODEL = 'mistral'; // change to any model from: ollama list
// ─────────────────────────────────────────────────────────────────────────────

const FLASH_MODEL = 'gemini-3-flash-preview';
const PRO_MODEL = 'gemini-3.1-pro-preview';

const RUBRIC_SYSTEM_PROMPT = `<system_role>
You are a Senior Technical Recruiter with 20 years of experience. Your goal is to evaluate
the user's spoken answer to an interview question with extreme precision and helpfulness.
</system_role>

<grading_rubric>
Score the user on a scale of 1-10 based on these 4 pillars:
1. STAR Method Adherence: Did they provide Situation, Task, Action, and Result?
2. Technical Depth: Did they use industry-standard terminology correctly?
3. Delivery & Tone: Is the speaking pace steady? Do they sound confident or hesitant?
4. Conciseness: Did they ramble, or was the answer "punchy"?

Also score 5 specific competency dimensions (1-10 each):
- communication: clarity of expression, structure, and articulation
- problem_solving: logical reasoning, approach to challenges
- tech_depth: use of technical terminology and domain knowledge
- clarity: how concise and easy to follow the answer was
- experience: evidence of real-world examples and past experience
</grading_rubric>

<output_format_json>
{
  "score": number,
  "feedback": {
    "strengths": ["string", "string"],
    "weaknesses": ["string"],
    "delivery_notes": "string"
  },
  "dimensions": {
    "communication": number,
    "problem_solving": number,
    "tech_depth": number,
    "clarity": number,
    "experience": number
  },
  "is_paid_content": {
    "improved_answer": "A 3-sentence professional rewrite of their specific answer.",
    "coach_advice": "A specific tip on how to handle follow-up questions for this topic."
  }
}
</output_format_json>

<constraints>
- Be "critically encouraging": praise what works, but don't sugarcoat technical errors.
- If the transcript is empty or too short (fewer than 5 words), return a score of 0 and ask them to try again.
- The 'is_paid_content' section must only be populated if the user's 'paid_status' flag is TRUE.
- All dimension scores must be numbers between 1 and 10.
</constraints>`;

export interface Dimensions {
  communication: number;
  problem_solving: number;
  tech_depth: number;
  clarity: number;
  experience: number;
}

export interface GradingResult {
  score: number;
  feedback: {
    strengths: string[];
    weaknesses: string[];
    delivery_notes: string;
  };
  dimensions: Dimensions;
  is_paid_content: {
    improved_answer: string;
    coach_advice: string;
  } | null;
}

// ─── Ollama helpers ───────────────────────────────────────────────────────────

async function ollamaChat(system: string, user: string): Promise<string> {
  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Ollama error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data.message?.content ?? '').trim();
}

function extractJSON(text: string): string {
  // Strip markdown fences and grab the first {...} block
  const fenced = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  const match = fenced.match(/\{[\s\S]*\}/);
  return match ? match[0] : fenced;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function generateQuestions(
  jobDescription: string,
  geminiKey: string
): Promise<string[]> {
  const userPrompt = `Generate exactly 3 behavioral or technical interview questions for the following job description. Return ONLY a JSON array of 3 strings, no other text.

Job Description:
${jobDescription}

Example format: ["Question 1?", "Question 2?", "Question 3?"]`;

  let text: string;

  if (USE_OLLAMA) {
    text = await ollamaChat('You are an expert technical interviewer.', userPrompt);
    console.log('[Ollama] Raw questions response:', text);
  } else {
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: FLASH_MODEL });
    const result = await model.generateContent(userPrompt);
    text = result.response.text().trim();
    console.log('[Gemini] Raw questions response:', text);
  }

  const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  const questions: string[] = JSON.parse(arrayMatch ? arrayMatch[0] : cleaned);
  console.log('[AI] Generated questions:', questions);
  return questions;
}

export async function scoreAnswer({
  question,
  transcript,
  isPaid,
  geminiKey,
}: {
  question: string;
  transcript: string;
  isPaid: boolean;
  geminiKey: string;
}): Promise<GradingResult> {
  const userPrompt = `The interview question was: "${question}"

The candidate's spoken answer (transcribed):
"${transcript}"

paid_status: ${isPaid}

Evaluate the transcript above using the grading rubric. Return ONLY valid JSON matching the output_format_json schema. No extra text.`;

  let rawText: string;

  if (USE_OLLAMA) {
    rawText = await ollamaChat(RUBRIC_SYSTEM_PROMPT, userPrompt);
    console.log('[Ollama] Raw score response:', rawText);
  } else {
    const genAI = new GoogleGenerativeAI(geminiKey);
    const modelId = isPaid ? PRO_MODEL : FLASH_MODEL;
    const model = genAI.getGenerativeModel({
      model: modelId,
      systemInstruction: RUBRIC_SYSTEM_PROMPT,
    });
    const result = await model.generateContent(userPrompt);
    rawText = result.response.text().trim();
    console.log('[Gemini] Raw score response:', rawText);
  }

  const parsed: GradingResult = JSON.parse(extractJSON(rawText));

  if (!isPaid) {
    parsed.is_paid_content = null;
  }

  return parsed;
}

export async function fetchJobFromUrl(
  url: string,
  geminiKey: string
): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      Accept: 'text/html',
    },
  });
  if (!response.ok) throw new Error(`Failed to fetch page (${response.status})`);

  let html = await response.text();
  // Strip script/style blocks to cut noise
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<style[\s\S]*?<\/style>/gi, '');
  // Strip remaining tags, collapse whitespace
  html = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  // Trim to ~20 000 chars to stay within token limits
  const truncated = html.slice(0, 20000);

  const userPrompt = `Extract the job title, company name, and full job description (role summary, responsibilities, and requirements) from the following text scraped from a job listing webpage. Return only clean plain text — no HTML, no bullet symbols, no extra commentary.\n\n${truncated}`;

  if (USE_OLLAMA) {
    return ollamaChat('You extract job descriptions from webpage text.', userPrompt);
  }

  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({ model: FLASH_MODEL });
  const result = await model.generateContent(userPrompt);
  return result.response.text().trim();
}

export async function generateSynopsis(
  questions: string[],
  scores: GradingResult[],
  geminiKey: string
): Promise<string> {
  const summary = questions
    .map((q, i) => `Q${i + 1}: "${q}" — Score: ${scores[i].score}/10`)
    .join('\n');

  const userPrompt = `A candidate just completed a 3-question mock interview. Write a concise 2-3 sentence overall synopsis of their performance. Be honest but encouraging. Focus on their biggest strength and the single most important area to improve.

Results:
${summary}

Return only the synopsis text, no JSON.`;

  if (USE_OLLAMA) {
    return ollamaChat('You are a senior technical recruiter.', userPrompt);
  }

  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({ model: FLASH_MODEL });
  const result = await model.generateContent(userPrompt);
  return result.response.text().trim();
}
