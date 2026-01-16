
import { GoogleGenAI, Type } from "@google/genai";
import { BRDContent, BRDAudit } from '../types';

export async function generateClarifyingQuestions(projectName: string): Promise<string[]> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing.");

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [{
          text: `A user wants to build: "${projectName}". 
          
          Think like a friendly helper. Give me 3 or 4 very simple, easy-to-understand questions to help them explain their idea.
          
          RULES:
          1. Use plain English. No business jargon (avoid words like 'stakeholders', 'constraints', 'KPIs').
          2. Ask one thing at a time.
          3. Focus on: Who is it for? What is the main problem it solves? What should it look like?
          
          Example for 'Google Analytics': 
          - Who will be looking at these reports?
          - What specific numbers or data are most important for you to track?
          - Where do you want to see this information (on a phone, a big screen, or email)?`
        }]
      },
      config: {
        systemInstruction: "You are a friendly assistant helpfully interviewing a non-technical user about their project idea. Speak in simple, clear language. Output ONLY a JSON array of strings containing 3-4 easy questions.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Failed to generate questions.");
    return JSON.parse(text);
  } catch (error) {
    console.error("Question Generation Error:", error);
    return [
      "What is the main thing you want this project to do?",
      "Who are the people that will use this most often?",
      "Why is this project important to you right now?",
      "Is there anything specific you definitely want to see in the finished version?"
    ];
  }
}

export async function refineFieldContent(projectName: string, fieldName: string, currentContent: any, fieldType: 'text' | 'list' | 'stakeholders') {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Project: "${projectName}"
  Field to refine: "${fieldName}"
  Current User Draft: "${JSON.stringify(currentContent)}"
  
  Task: Take the user's draft and make it professional, clear, and comprehensive. 
  If the draft is empty or short, use your knowledge of the project name to suggest high-quality content.`;

  let responseSchema: any = { type: Type.STRING };
  if (fieldType === 'list') {
    responseSchema = { type: Type.ARRAY, items: { type: Type.STRING } };
  } else if (fieldType === 'stakeholders') {
    responseSchema = { 
      type: Type.ARRAY, 
      items: { 
        type: Type.OBJECT, 
        properties: { 
          role: { type: Type.STRING }, 
          responsibility: { type: Type.STRING } 
        },
        required: ["role", "responsibility"]
      } 
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [{ text: prompt }] },
      config: {
        systemInstruction: `You are a Senior Business Analyst. Refine the provided BRD field. 
        - If fieldType is 'text', return a professional paragraph.
        - If fieldType is 'list', return a JSON array of clear, concise bullet points.
        - If fieldType is 'stakeholders', return a JSON array of objects with 'role' and 'responsibility'.
        Output ONLY the valid JSON or string based on the field type.`,
        responseMimeType: fieldType === 'text' ? "text/plain" : "application/json",
        responseSchema: fieldType === 'text' ? undefined : responseSchema
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return fieldType === 'text' ? text : JSON.parse(text);
  } catch (error) {
    console.error("Refinement Error:", error);
    throw error;
  }
}

export async function generateBRDContent(projectName: string, questions: string[], answers: string[]) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing.");

  const ai = new GoogleGenAI({ apiKey });

  const contextStr = questions.map((q, i) => `User was asked: ${q}\nUser answered: ${answers[i]}`).join('\n\n');

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [{
          text: `Generate a custom, professional BRD for:
          
PROJECT NAME: "${projectName}"

CONTEXT FROM USER INTERVIEW:
${contextStr}

Note: The user provided simple answers. Please translate their simple ideas into professional Business Requirements while keeping the core meaning exactly as they described.`
        }]
      },
      config: {
        systemInstruction: "You are an expert Senior Business Analyst. Take simple user input and transform it into a professional, formal Business Requirements Document in JSON format. Do not use generic ticketing tool examples. Base all content on the user's specific project and their answers.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            purpose: { type: Type.STRING },
            objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
            scopeIncluded: { type: Type.ARRAY, items: { type: Type.STRING } },
            scopeExcluded: { type: Type.ARRAY, items: { type: Type.STRING } },
            priority: { type: Type.STRING, enum: ["Good To Have", "Must To Have"] },
            category: { type: Type.STRING, enum: ["Cost Saving", "Man Days Saving", "Compliance"] },
            stakeholders: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  role: { type: Type.STRING },
                  responsibility: { type: Type.STRING }
                },
                required: ["role", "responsibility"]
              }
            }
          },
          required: ["purpose", "objectives", "scopeIncluded", "scopeExcluded", "stakeholders", "priority", "category"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No content received from AI.");
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Service Error:", error);
    throw new Error(error instanceof Error ? error.message : "Generation failed");
  }
}

export async function auditBRD(
  projectName: string, 
  content: BRDContent, 
  previousAudit?: BRDAudit,
  iterationNumber: number = 1
): Promise<BRDAudit> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing.");

  const ai = new GoogleGenAI({ apiKey });

  // Build context about previous audit if this is a re-audit after refinement
  let previousAuditContext = '';
  if (previousAudit && iterationNumber > 1) {
    previousAuditContext = `

IMPORTANT CONTEXT - PREVIOUS AUDIT (Iteration ${iterationNumber - 1}):
Previous Score: ${previousAudit.overallScore}/100
Previous Weaknesses Identified:
${previousAudit.cons.map(c => `- ${c}`).join('\n')}

Previous Suggestions Given:
${previousAudit.suggestions.map(s => `- [${s.impact}] ${s.description}`).join('\n')}

Previous Risks Identified:
${previousAudit.risks.map(r => `- ${r}`).join('\n')}

THIS IS A REFINED VERSION: The BRD has been updated to address the above issues.
You MUST compare this version against the previous weaknesses and:
1. If a weakness was addressed, acknowledge it and DO NOT list it as a weakness again
2. If the suggestions were implemented, the score SHOULD increase (typically +5 to +15 points per major improvement)
3. Only identify NEW issues or issues that were NOT properly addressed
4. The score should reflect the improvements made - if previous issues were fixed, score MUST be higher than ${previousAudit.overallScore}
5. A well-refined BRD that addressed most issues should score 90+ 
`;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [{
          text: `You are a Senior Business Analyst and Quality Auditor. Perform a comprehensive audit of this Business Requirements Document.

PROJECT NAME: "${projectName}"
AUDIT ITERATION: ${iterationNumber}
${previousAuditContext}
BRD CONTENT:
Purpose: ${content.purpose}

Objectives:
${content.objectives.map((o, i) => `${i + 1}. ${o}`).join('\n')}

Scope Included:
${content.scopeIncluded.map(s => `- ${s}`).join('\n')}

Scope Excluded:
${content.scopeExcluded.map(s => `- ${s}`).join('\n')}

Stakeholders:
${content.stakeholders.map(s => `- ${s.role}: ${s.responsibility}`).join('\n')}

Priority: ${content.priority}
Category: ${content.category}

AUDIT REQUIREMENTS:
1. Give an overall quality score from 1-100
2. Provide a brief executive summary of the BRD quality
3. List 3-5 specific STRENGTHS (pros) of this BRD
4. List 3-5 specific WEAKNESSES (cons) of this BRD
5. Provide actionable suggestions for improvement with impact levels
6. Identify potential risks or gaps
7. Give clear recommendations for enhancement

Be constructive but critical. Identify real issues that could cause problems during implementation.`
        }]
      },
      config: {
        systemInstruction: `You are an expert BRD auditor. Analyze the document critically but constructively. 
Focus on:
- Clarity and completeness of requirements
- Feasibility of objectives  
- Scope definition quality
- Stakeholder coverage
- Potential ambiguities or gaps
- Implementation risks

CRITICAL SCORING RULES:
- First iteration BRDs typically score 70-85
- If this is a REFINED version (iteration > 1), you MUST acknowledge improvements
- Refined versions that addressed previous issues MUST score HIGHER than the previous score
- Each addressed weakness should add +3 to +8 points to the score
- A well-refined BRD should score 90-98
- Only give 100 if the BRD is absolutely perfect with no possible improvements
- NEVER give a refined BRD the same or lower score unless it actually got worse

Output a comprehensive audit in JSON format.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            pros: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING }
            },
            cons: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING }
            },
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ["strength", "weakness", "suggestion", "risk"] },
                  category: { type: Type.STRING },
                  description: { type: Type.STRING },
                  impact: { type: Type.STRING, enum: ["high", "medium", "low"] }
                },
                required: ["type", "category", "description", "impact"]
              }
            },
            risks: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["overallScore", "summary", "pros", "cons", "suggestions", "risks", "recommendations"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No audit response from AI.");
    return JSON.parse(text);
  } catch (error) {
    console.error("BRD Audit Error:", error);
    throw new Error(error instanceof Error ? error.message : "Audit generation failed");
  }
}

export async function refineBRDWithSuggestions(
  projectName: string, 
  currentContent: BRDContent, 
  audit: BRDAudit
): Promise<BRDContent> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing.");

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [{
          text: `You are a Senior Business Analyst tasked with improving a BRD based on audit feedback.

PROJECT NAME: "${projectName}"

CURRENT BRD CONTENT:
${JSON.stringify(currentContent, null, 2)}

AUDIT FEEDBACK:
Overall Score: ${audit.overallScore}/100
Summary: ${audit.summary}

Weaknesses Identified:
${audit.cons.map(c => `- ${c}`).join('\n')}

Suggestions for Improvement:
${audit.suggestions.map(s => `- [${s.impact.toUpperCase()}] ${s.category}: ${s.description}`).join('\n')}

Risks Identified:
${audit.risks.map(r => `- ${r}`).join('\n')}

Recommendations:
${audit.recommendations.map(r => `- ${r}`).join('\n')}

TASK:
Generate an improved version of the BRD that:
1. Addresses ALL the weaknesses mentioned
2. Incorporates the high and medium impact suggestions
3. Mitigates identified risks where possible
4. Follows the recommendations
5. Maintains or improves the existing strengths
6. Keeps the same general structure but with enhanced, clearer content

Ensure the refined BRD is more comprehensive, specific, and implementation-ready.`
        }]
      },
      config: {
        systemInstruction: "You are an expert Business Analyst improving a BRD. Generate a refined, enhanced version that addresses all audit feedback while maintaining professionalism and clarity. Output valid JSON matching the BRD content schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            purpose: { type: Type.STRING },
            objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
            scopeIncluded: { type: Type.ARRAY, items: { type: Type.STRING } },
            scopeExcluded: { type: Type.ARRAY, items: { type: Type.STRING } },
            priority: { type: Type.STRING, enum: ["Good To Have", "Must To Have"] },
            category: { type: Type.STRING, enum: ["Cost Saving", "Man Days Saving", "Compliance"] },
            stakeholders: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  role: { type: Type.STRING },
                  responsibility: { type: Type.STRING }
                },
                required: ["role", "responsibility"]
              }
            }
          },
          required: ["purpose", "objectives", "scopeIncluded", "scopeExcluded", "stakeholders", "priority", "category"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No refined content from AI.");
    return JSON.parse(text);
  } catch (error) {
    console.error("BRD Refinement Error:", error);
    throw new Error(error instanceof Error ? error.message : "Refinement failed");
  }
}
