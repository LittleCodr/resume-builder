import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyAboW17yA9ihXLNqnpK6bn-cK6roxqvH2M');

export async function generateJobDescription(role: string, experience: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  const prompt = `Generate professional and ATS-friendly bullet points for the following job role and experience:
  Role: ${role}
  Experience: ${experience}
  Please provide 3-4 impactful bullet points that highlight achievements and responsibilities.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

export async function generateSummary(experience: string, skills: string[]): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  const prompt = `Create a professional summary based on the following experience and skills:
  Experience: ${experience}
  Skills: ${skills.join(', ')}
  Generate a concise, impactful professional summary (2-3 sentences) that highlights key strengths and experience.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

export async function analyzeResume(resumeContent: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  const prompt = `Analyze this resume content for ATS optimization and provide feedback:
  ${resumeContent}
  Please provide:
  1. ATS compatibility score (out of 100)
  2. Key missing keywords or sections
  3. Suggestions for improvement`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}