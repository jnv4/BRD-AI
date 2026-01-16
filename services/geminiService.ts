
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
  content: BRDContent
): Promise<BRDAudit> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing.");

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [{
          text: `You are a Senior Business Strategy Consultant and Market Analyst. Perform a comprehensive BUSINESS VALUE and MARKET VIABILITY analysis of this Business Requirements Document.

PROJECT NAME: "${projectName}"

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

ANALYSIS REQUIREMENTS:

1. BUSINESS VALUE ASSESSMENT (Score 1-100):
   - Does this project deliver real business value?
   - What's the estimated ROI potential?
   - How long until value is realized?

2. MARKET ANALYSIS:
   - Is there market demand for this?
   - What's the competitive landscape like?
   - Is the timing right for this project?
   - Provide 3-5 market insights with verdicts

3. HONEST PROS & CONS:
   - What are the genuine strengths of this proposal?
   - What are the real weaknesses or concerns?

4. WHAT NEEDS TO IMPROVE:
   - Critical improvements required before proceeding
   - Nice-to-have improvements that would strengthen the proposal

5. RISKS & FEASIBILITY:
   - What could go wrong?
   - Is this technically and organizationally feasible?

6. FINAL VERDICT:
   - strong_go: Excellent proposal, proceed immediately
   - go_with_caution: Good potential but address concerns first
   - needs_work: Significant improvements needed before proceeding
   - no_go: Fundamentally flawed or not viable

Be brutally honest. This is a real business decision. Don't sugarcoat issues. 
If this project shouldn't proceed, say so clearly and explain why.
If it's a great opportunity, be enthusiastic but realistic.`
        }]
      },
      config: {
        systemInstruction: `You are an expert business strategist who evaluates project proposals for real-world viability.

Your job is to:
1. Assess if this project will actually deliver business value
2. Analyze market conditions and timing
3. Identify what's good and what's problematic
4. Give a clear verdict: should they proceed or not?

Be like a trusted advisor who gives honest feedback:
- Don't be overly positive just to be nice
- Don't be harsh just to seem critical
- Give genuinely useful insights that help make better decisions
- If something is a bad idea, say so diplomatically but clearly
- If something is great, explain why with specifics

Output comprehensive analysis in JSON format.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            businessValueScore: { type: Type.NUMBER },
            businessValueSummary: { type: Type.STRING },
            estimatedROI: { type: Type.STRING },
            timeToValue: { type: Type.STRING },
            marketInsights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  aspect: { type: Type.STRING },
                  analysis: { type: Type.STRING },
                  verdict: { type: Type.STRING, enum: ["positive", "neutral", "negative"] }
                },
                required: ["aspect", "analysis", "verdict"]
              }
            },
            competitorLandscape: { type: Type.STRING },
            marketTiming: { type: Type.STRING, enum: ["excellent", "good", "fair", "poor"] },
            marketTimingReason: { type: Type.STRING },
            pros: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING }
            },
            cons: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING }
            },
            criticalImprovements: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            niceToHaveImprovements: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            risks: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            feasibilityScore: { type: Type.NUMBER },
            feasibilityReason: { type: Type.STRING },
            overallVerdict: { type: Type.STRING, enum: ["strong_go", "go_with_caution", "needs_work", "no_go"] },
            verdictSummary: { type: Type.STRING }
          },
          required: [
            "businessValueScore", "businessValueSummary", "estimatedROI", "timeToValue",
            "marketInsights", "competitorLandscape", "marketTiming", "marketTimingReason",
            "pros", "cons", "criticalImprovements", "niceToHaveImprovements",
            "risks", "feasibilityScore", "feasibilityReason", "overallVerdict", "verdictSummary"
          ]
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

