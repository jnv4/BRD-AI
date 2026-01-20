
import { GoogleGenAI, Type } from "@google/genai";
import { BRDContent, BRDAudit } from '../types';

// Indira IVF Context - All BRDs are internal projects for Indira IVF
const INDIRA_IVF_CONTEXT = `
IMPORTANT CONTEXT: This is an internal project for Indira IVF - India's leading chain of IVF and fertility clinics. 
Indira IVF operates 130+ centers across India and has helped over 1,25,000+ IVF pregnancies.
All projects should be considered in the context of:
- Healthcare/fertility clinic operations
- Patient care and experience
- Medical staff workflows
- Compliance with healthcare regulations
- Data privacy and security (especially patient data)
- Integration with existing hospital management systems
- Scalability across 130+ centers
`;

export async function generateClarifyingQuestions(projectName: string): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API Key is missing. Please set GEMINI_API_KEY in your .env file.");

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [{
          text: `${INDIRA_IVF_CONTEXT}
          
A user at Indira IVF wants to build an internal project: "${projectName}". 
          
Think like a friendly helper. Give me 3-4 very simple, easy-to-understand questions to help them explain their idea.

RULES:
1. Use plain English. No business jargon (avoid words like 'stakeholders', 'constraints', 'KPIs').
2. Ask one thing at a time.
3. Focus on: Who is it for? What is the main problem it solves? What should it look like?
4. Consider the healthcare/fertility clinic context of Indira IVF.
5. THE LAST QUESTION MUST ALWAYS BE about the specific problems they want to solve or specific requirements they have. 
   Example: "What specific problems are you trying to solve with this project, or what are your must-have requirements?"

Example for 'Patient Appointment System': 
- Who will be using this system - patients, doctors, or reception staff?
- Which Indira IVF centers will use this system?
- Do you need this to connect with any existing systems (like patient records)?
- What specific problems are you trying to solve with this project, or what are your must-have requirements?`
        }]
      },
      config: {
        systemInstruction: "You are a friendly assistant at Indira IVF helpfully interviewing a team member about their internal project idea. Speak in simple, clear language. Consider the healthcare/fertility context. Output ONLY a JSON array of strings containing 3-4 easy questions. THE LAST QUESTION MUST ALWAYS ask about specific problems to solve or specific requirements.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Failed to generate questions.");
    const questions = JSON.parse(text);
    
    // Ensure the last question is always about problems/requirements
    const lastQuestionKeywords = ['problem', 'requirement', 'solve', 'specific', 'must-have', 'need'];
    const lastQuestion = questions[questions.length - 1]?.toLowerCase() || '';
    const hasProperLastQuestion = lastQuestionKeywords.some(keyword => lastQuestion.includes(keyword));
    
    if (!hasProperLastQuestion) {
      questions.push("What specific problems are you trying to solve with this project, or what are your must-have requirements?");
    }
    
    return questions;
  } catch (error) {
    console.error("Question Generation Error:", error);
    return [
      "What is the main thing you want this project to do at Indira IVF?",
      "Who are the people that will use this most often (patients, doctors, staff)?",
      "Which Indira IVF centers or departments will benefit from this?",
      "What specific problems are you trying to solve with this project, or what are your must-have requirements?"
    ];
  }
}

export async function refineFieldContent(projectName: string, fieldName: string, currentContent: any, fieldType: 'text' | 'list' | 'stakeholders') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API Key is missing. Please set GEMINI_API_KEY in your .env file.");
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `${INDIRA_IVF_CONTEXT}
  
  Project: "${projectName}" (Internal project for Indira IVF)
  Field to refine: "${fieldName}"
  Current User Draft: "${JSON.stringify(currentContent)}"
  
  Task: Take the user's draft and make it professional, clear, and comprehensive. 
  Consider this is for Indira IVF's internal use - a leading fertility clinic chain in India.
  If the draft is empty or short, use your knowledge of the project name and Indira IVF's context to suggest high-quality content.`;

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

export async function generateBRDContent(projectName: string, questions: string[], answers: string[], remarks?: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API Key is missing. Please set GEMINI_API_KEY in your .env file.");

  const ai = new GoogleGenAI({ apiKey });

  const contextStr = questions.map((q, i) => `Q: ${q}\nA: ${answers[i]}`).join('\n\n');

  const customInstructions = remarks ? `\n\nUSER NOTES: ${remarks}` : '';

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [{
          text: `${INDIRA_IVF_CONTEXT}

Generate a PROFESSIONAL Business Requirements Document for Indira IVF.

PROJECT: "${projectName}"

=== USER'S REQUIREMENTS (MUST USE THESE EXACTLY) ===
${contextStr}${customInstructions}

=== CRITICAL INSTRUCTIONS ===
1. The BRD MUST be based DIRECTLY on the user's answers above
2. DO NOT invent features, problems, or requirements not mentioned by the user
3. Use the EXACT problems, features, and requirements the user specified
4. If the user mentioned specific functionality, include it in the BRD
5. The problem statement MUST reflect what the user said they want to solve
6. The objectives MUST align with the user's stated goals
7. Keep the user's language and terminology where appropriate

=== BRD SECTIONS ===

1. EXECUTIVE SUMMARY (2-3 sentences)
   - Summarize the project based on USER'S answers

2. PROBLEM STATEMENT (1-2 sentences)
   - Extract the core problem from USER'S answers

3. PROPOSED SOLUTION (1-2 sentences)  
   - Based on what USER described they want to build

4. PURPOSE (1 sentence)
   - Why this matters, based on USER'S context

5. OBJECTIVES (3-5 bullet points)
   - Derived from USER'S stated goals and requirements

6. SCOPE
   - In-Scope: Features/deliverables USER mentioned (3-5 items)
   - Out-of-Scope: Logical exclusions based on USER'S scope (2-3 items)

7. KEY REQUIREMENTS (3-5 critical requirements)
   - Title + description - MUST reflect USER'S specific requirements

8. SUCCESS CRITERIA (3-4 measurable outcomes)
   - Based on USER'S definition of success

9. STAKEHOLDERS (4-5 key roles with responsibilities)
   - Include roles USER mentioned

10. KEY RISKS (2-3 risks with mitigation strategies)
    - Realistic risks for this specific project

11. ESTIMATED TIMELINE
    - Realistic estimate based on scope

=== TONE ===
- Professional, formal business language
- Clear and precise
- Suitable for executive presentation
- FAITHFUL to user's input`
        }]
      },
      config: {
        systemInstruction: `You are a Senior Business Analyst writing BRDs for Indira IVF.

CRITICAL RULES:
1. BASE EVERYTHING on the user's answers - do NOT make up requirements
2. If the user said they want feature X, include feature X
3. If the user mentioned problem Y, the problem statement must address Y
4. Do NOT add generic enterprise features the user didn't ask for
5. The BRD should feel like a professional version of what the user described
6. Use the user's terminology and specific details
7. Be concise but comprehensive

Output JSON.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            // Executive Summary (2-3 sentences)
            executiveSummary: { type: Type.STRING },
            
            // Problem & Solution
            problemStatement: { type: Type.STRING },
            proposedSolution: { type: Type.STRING },
            
            // Core Elements
            purpose: { type: Type.STRING },
            objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
            scopeIncluded: { type: Type.ARRAY, items: { type: Type.STRING } },
            scopeExcluded: { type: Type.ARRAY, items: { type: Type.STRING } },
            
            // Key Requirements (3-5 only)
            keyRequirements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["title", "description"]
              }
            },
            
            // Success Criteria
            successCriteria: { type: Type.ARRAY, items: { type: Type.STRING } },
            
            // Stakeholders
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
            },
            
            // Key Risks (2-3 only)
            keyRisks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  risk: { type: Type.STRING },
                  mitigation: { type: Type.STRING }
                },
                required: ["risk", "mitigation"]
              }
            },
            
            // Timeline
            estimatedTimeline: { type: Type.STRING },
            
            // Classification
            priority: { type: Type.STRING, enum: ["Good To Have", "Must To Have"] },
            category: { type: Type.STRING, enum: ["Cost Saving", "Man Days Saving", "Compliance"] }
          },
          required: [
            "executiveSummary", "problemStatement", "proposedSolution",
            "purpose", "objectives", "scopeIncluded", "scopeExcluded",
            "keyRequirements", "successCriteria", "stakeholders", "keyRisks",
            "estimatedTimeline", "priority", "category"
          ]
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
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API Key is missing. Please set GEMINI_API_KEY in your .env file.");

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [{
          text: `${INDIRA_IVF_CONTEXT}

You are a Senior Business Strategy Consultant and Healthcare IT Expert. Perform a PRACTICAL and REALISTIC analysis of this BRD for Indira IVF.

PROJECT NAME: "${projectName}"

=== BRD CONTENT TO EVALUATE ===

EXECUTIVE SUMMARY:
${content.executiveSummary || 'Not provided'}

PROBLEM STATEMENT:
${content.problemStatement || 'Not provided'}

PROPOSED SOLUTION:
${content.proposedSolution || 'Not provided'}

PURPOSE:
${content.purpose || 'Not provided'}

OBJECTIVES (${content.objectives?.length || 0} items):
${content.objectives?.map((o, i) => `${i + 1}. ${o}`).join('\n') || 'None provided'}

SCOPE - INCLUDED (${content.scopeIncluded?.length || 0} items):
${content.scopeIncluded?.map(s => `• ${s}`).join('\n') || 'None provided'}

SCOPE - EXCLUDED (${content.scopeExcluded?.length || 0} items):
${content.scopeExcluded?.map(s => `• ${s}`).join('\n') || 'None provided'}

KEY REQUIREMENTS (${content.keyRequirements?.length || 0} items):
${content.keyRequirements?.map(r => `• ${r.title}: ${r.description}`).join('\n') || 'None provided'}

SUCCESS CRITERIA (${content.successCriteria?.length || 0} items):
${content.successCriteria?.map(c => `• ${c}`).join('\n') || 'None provided'}

STAKEHOLDERS (${content.stakeholders?.length || 0} roles):
${content.stakeholders?.map(s => `• ${s.role}: ${s.responsibility}`).join('\n') || 'None provided'}

RISKS & MITIGATION (${content.keyRisks?.length || 0} identified):
${content.keyRisks?.map(r => `• ${r.risk} → ${r.mitigation}`).join('\n') || 'None provided'}

TIMELINE: ${content.estimatedTimeline || 'Not specified'}
PRIORITY: ${content.priority || 'Not specified'}
CATEGORY: ${content.category || 'Not specified'}

=== BALANCED SCORING (Score each section, then total) ===

Score FAIRLY - give credit for good content, identify gaps for weak content.

SECTION SCORES (add them up):

1. PROBLEM & PURPOSE (0-15 pts):
   - 12-15: Specific problem with clear context, compelling purpose
   - 8-11: Clear problem and purpose, could be more detailed
   - 4-7: Somewhat vague problem or purpose
   - 0-3: Very unclear or missing

2. OBJECTIVES (0-20 pts):
   - 16-20: Specific, measurable goals with clear targets
   - 11-15: Good objectives, mostly clear
   - 6-10: Generic but understandable objectives
   - 0-5: Vague or missing

3. SCOPE & REQUIREMENTS (0-20 pts):
   - 16-20: Well-defined scope, detailed requirements
   - 11-15: Clear scope and requirements with minor gaps
   - 6-10: Reasonable scope, basic requirements
   - 0-5: Unclear or missing

4. SUCCESS CRITERIA (0-15 pts):
   - 12-15: Measurable metrics with targets
   - 8-11: Clear criteria, some measurable
   - 4-7: Basic criteria defined
   - 0-3: Vague or missing

5. RISKS & STAKEHOLDERS (0-15 pts):
   - 12-15: Realistic risks with mitigations, clear stakeholder roles
   - 8-11: Good risk coverage and stakeholder identification
   - 4-7: Basic risks and stakeholders listed
   - 0-3: Superficial or missing

6. TIMELINE & FEASIBILITY (0-15 pts):
   - 12-15: Realistic timeline, clearly feasible
   - 8-11: Reasonable timeline and approach
   - 4-7: Timeline provided but questionable
   - 0-3: Unrealistic or missing

TOTAL = Sum of all sections (max 100)

INTERPRET THE SCORE:
- 80-100: EXCELLENT - Strong BRD, clear value, ready to proceed
- 65-79: GOOD - Solid BRD, minor improvements needed
- 50-64: FAIR - Decent foundation, needs more detail in places
- 35-49: WEAK - Significant gaps, needs revision
- Below 35: POOR - Major issues, needs rethink

VERDICT MUST MATCH SCORE (STRICTLY FOLLOW):
- Score 60+: strong_go (GREEN - good to proceed)
- Score 40-59: go_with_caution (YELLOW - proceed with noted improvements)
- Score below 40: needs_work or no_go (RED - significant issues)

=== ANALYSIS SECTIONS ===

2. PROBLEMS SOLVED:
   - List problems this project addresses
   - Assess problem-solution fit
   - Note if well-defined or needs clarification

3. MARKET VALUE (Score based on actual value potential):
   - Real need at Indira IVF?
   - Competitive advantage potential
   - Score fairly based on the opportunity

4. BUSINESS BENEFITS:
   - List tangible benefits from the BRD
   - Revenue/cost/efficiency impacts
   - Be realistic but fair in assessment

5. SUGGESTIONS FOR IMPROVEMENT:
   - Constructive recommendations
   - What would make this BRD stronger?
   - Prioritize actionable feedback

6. BUSINESS VALUE SCORE:
   - Score the business case fairly
   - Estimate ROI based on scope
   - Time to realize value

7-8. MARKET ANALYSIS:
   - Healthcare IT market context
   - 4-6 relevant insights
   - Market timing assessment

9. CULTURAL CONSIDERATIONS:
   - Indian healthcare context
   - 3-5 relevant factors

10. FINANCIAL ANALYSIS:
    - Cost-benefit assessment
    - Investment estimates
    - Payback projection

11. TECHNOLOGY:
    - Integration needs
    - Scalability for 130+ centers
    - Technical feasibility

12. STAKEHOLDER IMPACT:
    - Benefits to each group
    - Adoption considerations

13. COMPLIANCE:
    - Healthcare regulations
    - Data privacy needs

14. STRATEGIC ALIGNMENT:
    - Fit with Indira IVF goals
    - Innovation assessment
    - Competitive positioning

15. IMPLEMENTATION:
    - Complexity level
    - Timeline assessment
    - Resource needs

16. SUSTAINABILITY:
    - Long-term viability
    - Maintenance needs

17. RISKS:
    - Identified risks assessment
    - Additional risks to consider
    - Overall feasibility score

18. BENCHMARKS:
    - Industry comparison
    - Best practices

19. PROS & CONS:
    - Genuine strengths (give credit!)
    - Areas for improvement

20. IMPROVEMENTS NEEDED:
    - Critical items (must address)
    - Nice-to-have enhancements

21. VERDICT (MUST match overall score - STRICTLY FOLLOW):
    - strong_go: Score 60 or above → GREEN, ready to proceed
    - go_with_caution: Score 40-59 → YELLOW, address improvements
    - needs_work: Score 25-39 → RED, needs revision
    - no_go: Score below 25 → RED, fundamental issues

Provide balanced summary and 5-7 key takeaways. Be fair - good work deserves recognition, gaps need honest feedback.`
        }]
      },
      config: {
        systemInstruction: `You are a fair and balanced business analyst. Evaluate BRDs honestly - reward good work, identify gaps in weak areas.

BALANCED SCORING APPROACH:
- Score each section based on its actual quality (see rubric in prompt)
- A well-written BRD with clear objectives and requirements SHOULD score 75-85
- An average BRD with decent content scores 60-75
- Only penalize for actual problems, not theoretical ones
- Give credit for effort and completeness

RECOGNIZE GOOD BRDs:
- Clear problem statement = good score for that section
- Specific objectives with targets = high score
- Detailed requirements = high score
- Realistic risks with mitigations = high score
- The more specific and detailed, the higher the score

IDENTIFY WEAK AREAS FAIRLY:
- If a section is vague, score it lower but don't penalize other sections
- If something is missing, note it as a gap
- Provide constructive feedback on how to improve

PRACTICAL CONSIDERATIONS:
- Healthcare context for Indira IVF
- Scale of 130+ centers
- Compliance requirements
- Integration needs

VERDICT ALIGNMENT (MUST FOLLOW):
- Score 60+: strong_go (GREEN - proceed with confidence)
- Score 40-59: go_with_caution (YELLOW - address noted gaps)
- Score below 40: needs_work or no_go (RED - significant issues)

Be honest but fair. Good BRDs deserve good scores. Weak BRDs need constructive feedback.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            // Overall Score
            overallScore: { type: Type.NUMBER },
            
            // Problems Solved
            problemsSolved: { type: Type.ARRAY, items: { type: Type.STRING } },
            problemsSolvedSummary: { type: Type.STRING },
            
            // Market Value
            marketValue: { type: Type.STRING },
            marketValueScore: { type: Type.NUMBER },
            
            // Business Benefits
            businessBenefits: { type: Type.ARRAY, items: { type: Type.STRING } },
            businessBenefitsSummary: { type: Type.STRING },
            
            // Suggestions
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            
            // Business Value Assessment
            businessValueScore: { type: Type.NUMBER },
            businessValueSummary: { type: Type.STRING },
            estimatedROI: { type: Type.STRING },
            timeToValue: { type: Type.STRING },
            
            // Market Analysis
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
            
            // Market Trends
            marketTrends: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  trend: { type: Type.STRING },
                  relevance: { type: Type.STRING },
                  impact: { type: Type.STRING, enum: ["high", "medium", "low"] },
                  timeframe: { type: Type.STRING }
                },
                required: ["trend", "relevance", "impact", "timeframe"]
              }
            },
            healthcareIndustryTrends: { type: Type.STRING },
            fertilityMarketOutlook: { type: Type.STRING },
            digitalHealthTrends: { type: Type.STRING },
            
            // Cultural Considerations
            culturalConsiderations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  aspect: { type: Type.STRING },
                  insight: { type: Type.STRING },
                  recommendation: { type: Type.STRING },
                  importance: { type: Type.STRING, enum: ["critical", "important", "nice_to_have"] }
                },
                required: ["aspect", "insight", "recommendation", "importance"]
              }
            },
            indianHealthcareCulture: { type: Type.STRING },
            patientExpectations: { type: Type.STRING },
            familyDynamicsImpact: { type: Type.STRING },
            regionalVariations: { type: Type.STRING },
            
            // Financial Analysis
            financialProjections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  metric: { type: Type.STRING },
                  currentState: { type: Type.STRING },
                  projectedImprovement: { type: Type.STRING },
                  timeframe: { type: Type.STRING }
                },
                required: ["metric", "currentState", "projectedImprovement", "timeframe"]
              }
            },
            costBenefitAnalysis: { type: Type.STRING },
            investmentRequired: { type: Type.STRING },
            paybackPeriod: { type: Type.STRING },
            longTermFinancialImpact: { type: Type.STRING },
            
            // Technology Assessment
            technologyAlignment: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  aspect: { type: Type.STRING },
                  currentState: { type: Type.STRING },
                  requiredChanges: { type: Type.STRING },
                  complexity: { type: Type.STRING, enum: ["high", "medium", "low"] }
                },
                required: ["aspect", "currentState", "requiredChanges", "complexity"]
              }
            },
            integrationComplexity: { type: Type.STRING, enum: ["high", "medium", "low"] },
            integrationComplexityReason: { type: Type.STRING },
            techStackCompatibility: { type: Type.STRING },
            dataSecurityConsiderations: { type: Type.STRING },
            scalabilityAssessment: { type: Type.STRING },
            
            // Stakeholder Impact
            stakeholderImpacts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stakeholder: { type: Type.STRING },
                  currentPainPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                  expectedBenefits: { type: Type.ARRAY, items: { type: Type.STRING } },
                  adoptionChallenge: { type: Type.STRING, enum: ["high", "medium", "low"] }
                },
                required: ["stakeholder", "currentPainPoints", "expectedBenefits", "adoptionChallenge"]
              }
            },
            patientExperienceImpact: { type: Type.STRING },
            staffWorkflowImpact: { type: Type.STRING },
            managementBenefits: { type: Type.STRING },
            
            // Compliance
            complianceConsiderations: { type: Type.ARRAY, items: { type: Type.STRING } },
            healthcareRegulations: { type: Type.STRING },
            dataPrivacyCompliance: { type: Type.STRING },
            auditTrailRequirements: { type: Type.STRING },
            
            // Strategic Alignment
            strategicAlignmentScore: { type: Type.NUMBER },
            alignmentWithIndiraIVFVision: { type: Type.STRING },
            competitiveAdvantage: { type: Type.STRING },
            innovationScore: { type: Type.NUMBER },
            innovationAssessment: { type: Type.STRING },
            
            // Implementation
            implementationComplexity: { type: Type.STRING, enum: ["high", "medium", "low"] },
            implementationTimeline: { type: Type.STRING },
            resourceRequirements: { type: Type.ARRAY, items: { type: Type.STRING } },
            trainingNeeds: { type: Type.STRING },
            changeManagementNeeds: { type: Type.STRING },
            
            // Sustainability
            sustainabilityScore: { type: Type.NUMBER },
            maintenanceRequirements: { type: Type.STRING },
            futureProofing: { type: Type.STRING },
            exitStrategy: { type: Type.STRING },
            
            // Pros & Cons
            pros: { type: Type.ARRAY, items: { type: Type.STRING } },
            cons: { type: Type.ARRAY, items: { type: Type.STRING } },
            
            // Improvements
            criticalImprovements: { type: Type.ARRAY, items: { type: Type.STRING } },
            niceToHaveImprovements: { type: Type.ARRAY, items: { type: Type.STRING } },
            
            // Detailed Risks
            detailedRisks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  risk: { type: Type.STRING },
                  likelihood: { type: Type.STRING, enum: ["high", "medium", "low"] },
                  impact: { type: Type.STRING, enum: ["high", "medium", "low"] },
                  mitigation: { type: Type.STRING }
                },
                required: ["risk", "likelihood", "impact", "mitigation"]
              }
            },
            risks: { type: Type.ARRAY, items: { type: Type.STRING } },
            feasibilityScore: { type: Type.NUMBER },
            feasibilityReason: { type: Type.STRING },
            
            // Industry Benchmarks
            industryBenchmarks: { type: Type.STRING },
            bestPracticesAlignment: { type: Type.STRING },
            
            // Final Verdict
            overallVerdict: { type: Type.STRING, enum: ["strong_go", "go_with_caution", "needs_work", "no_go"] },
            verdictSummary: { type: Type.STRING },
            executiveSummary: { type: Type.STRING },
            keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: [
            "overallScore",
            "problemsSolved", "problemsSolvedSummary", "marketValue", "marketValueScore",
            "businessBenefits", "businessBenefitsSummary", "suggestions",
            "businessValueScore", "businessValueSummary", "estimatedROI", "timeToValue",
            "marketInsights", "competitorLandscape", "marketTiming", "marketTimingReason",
            "marketTrends", "healthcareIndustryTrends", "fertilityMarketOutlook", "digitalHealthTrends",
            "culturalConsiderations", "indianHealthcareCulture", "patientExpectations", "familyDynamicsImpact", "regionalVariations",
            "financialProjections", "costBenefitAnalysis", "investmentRequired", "paybackPeriod", "longTermFinancialImpact",
            "technologyAlignment", "integrationComplexity", "integrationComplexityReason", "techStackCompatibility", "dataSecurityConsiderations", "scalabilityAssessment",
            "stakeholderImpacts", "patientExperienceImpact", "staffWorkflowImpact", "managementBenefits",
            "complianceConsiderations", "healthcareRegulations", "dataPrivacyCompliance", "auditTrailRequirements",
            "strategicAlignmentScore", "alignmentWithIndiraIVFVision", "competitiveAdvantage", "innovationScore", "innovationAssessment",
            "implementationComplexity", "implementationTimeline", "resourceRequirements", "trainingNeeds", "changeManagementNeeds",
            "sustainabilityScore", "maintenanceRequirements", "futureProofing", "exitStrategy",
            "pros", "cons", "criticalImprovements", "niceToHaveImprovements",
            "detailedRisks", "risks", "feasibilityScore", "feasibilityReason",
            "industryBenchmarks", "bestPracticesAlignment",
            "overallVerdict", "verdictSummary", "executiveSummary", "keyTakeaways"
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

