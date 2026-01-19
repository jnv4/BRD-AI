
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
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API Key is missing. Please set VITE_GEMINI_API_KEY in your environment.");

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
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API Key is missing. Please set VITE_GEMINI_API_KEY in your environment.");
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
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API Key is missing. Please set VITE_GEMINI_API_KEY in your environment.");

  const ai = new GoogleGenAI({ apiKey });

  const contextStr = questions.map((q, i) => `Q: ${q}\nA: ${answers[i]}`).join('\n\n');

  const customInstructions = remarks ? `\n\nUSER NOTES: ${remarks}` : '';

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [{
          text: `${INDIRA_IVF_CONTEXT}

Generate a PROFESSIONAL, CONCISE Business Requirements Document for Indira IVF.

PROJECT: "${projectName}"

USER INPUT:
${contextStr}${customInstructions}

=== BRD SECTIONS ===

1. EXECUTIVE SUMMARY (2-3 sentences only)
   - Brief professional overview

2. PROBLEM STATEMENT (1 sentence)
   - The core business challenge

3. PROPOSED SOLUTION (1 sentence)  
   - How this addresses the problem

4. PURPOSE (1 sentence)
   - Why this initiative matters

5. OBJECTIVES (3-4 bullet points)
   - Specific, measurable goals

6. SCOPE
   - In-Scope: 3-4 key deliverables
   - Out-of-Scope: 2-3 exclusions

7. KEY REQUIREMENTS (3-4 critical requirements)
   - Title + description

8. SUCCESS CRITERIA (3 measurable outcomes)

9. STAKEHOLDERS (4-5 key roles with responsibilities)

10. KEY RISKS (2-3 risks with mitigation strategies)

11. ESTIMATED TIMELINE

=== TONE ===
- Professional, formal business language
- Clear and precise
- Suitable for executive presentation`
        }]
      },
      config: {
        systemInstruction: `You are a Senior Business Analyst writing concise BRDs for Indira IVF.

RULES:
- First 4 sections (Summary, Problem, Solution, Purpose) = 1-2 sentences each
- Be concise but professional
- No fluff or filler

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
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API Key is missing. Please set VITE_GEMINI_API_KEY in your environment.");

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [{
          text: `${INDIRA_IVF_CONTEXT}

You are a Senior Business Strategy Consultant, Healthcare IT Expert, and Market Analyst specializing in the Indian healthcare and fertility industry. Perform an EXHAUSTIVE and COMPREHENSIVE analysis of this internal project's Business Requirements Document for Indira IVF.

PROJECT NAME: "${projectName}" (Internal Project for Indira IVF)

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

=== COMPREHENSIVE ANALYSIS REQUIREMENTS ===

Provide DETAILED analysis on EVERY aspect below. This is a critical business decision for Indira IVF - India's largest fertility clinic chain with 130+ centers.

1. OVERALL SCORE (1-100):
   Calculate a weighted overall score considering all factors below.

2. PROBLEMS SOLVED:
   - List every specific problem this project addresses at Indira IVF
   - How will it improve patient care, staff efficiency, operations?
   - Provide detailed summary of problem-solution fit

3. MARKET VALUE ASSESSMENT:
   - Internal market value for Indira IVF (score 1-100)
   - Comparison with similar healthcare solutions
   - Value proposition analysis

4. BUSINESS BENEFITS:
   - List ALL tangible business benefits
   - Revenue impact, cost savings, efficiency gains
   - Operational improvements across 130+ centers

5. SUGGESTIONS FOR IMPROVEMENT:
   - Detailed recommendations to enhance the project
   - Missing features that should be considered
   - Scope refinements for maximum impact

6. BUSINESS VALUE ASSESSMENT:
   - Business value score (1-100)
   - Estimated ROI with calculations
   - Time to value realization

7. MARKET INSIGHTS:
   - 5-7 market insights with positive/neutral/negative verdicts
   - Competitor landscape in healthcare IT
   - Market timing assessment

8. MARKET TRENDS ANALYSIS:
   - Current healthcare industry trends in India
   - Fertility market outlook and growth projections
   - Digital health transformation trends
   - Identify 4-6 relevant market trends with impact levels

9. CULTURAL & REGIONAL CONSIDERATIONS (CRITICAL FOR INDIA):
   - Indian healthcare culture and patient expectations
   - Family dynamics in fertility treatment decisions
   - Regional variations across India (North, South, East, West)
   - Language and communication considerations
   - Trust factors in Indian healthcare
   - Sensitivity around fertility treatments in Indian society
   - Provide 4-6 cultural considerations with recommendations

10. FINANCIAL ANALYSIS:
    - Detailed cost-benefit analysis
    - Investment required estimates
    - Payback period projection
    - Long-term financial impact
    - 4-6 financial projection metrics

11. TECHNOLOGY ASSESSMENT:
    - Tech stack compatibility with existing Indira IVF systems
    - Integration complexity analysis
    - Data security and HIPAA/Indian healthcare data compliance
    - Scalability assessment for 130+ centers
    - 3-5 technology alignment aspects

12. STAKEHOLDER IMPACT ANALYSIS:
    - Impact on patients (experience, outcomes)
    - Impact on medical staff (doctors, nurses, embryologists)
    - Impact on administrative staff
    - Impact on management and decision-makers
    - Adoption challenges for each stakeholder group

13. COMPLIANCE & REGULATORY:
    - Healthcare regulations (PCPNDT Act, MTP Act, etc.)
    - Data privacy compliance (IT Act, proposed DPDP Bill)
    - Audit trail requirements
    - Medical device regulations if applicable

14. STRATEGIC ALIGNMENT:
    - Alignment score with Indira IVF vision (1-100)
    - Competitive advantage assessment
    - Innovation score (1-100)
    - How this positions Indira IVF in the market

15. IMPLEMENTATION CONSIDERATIONS:
    - Implementation complexity (high/medium/low)
    - Realistic timeline estimation
    - Resource requirements
    - Training needs for staff
    - Change management requirements

16. LONG-TERM SUSTAINABILITY:
    - Sustainability score (1-100)
    - Maintenance requirements
    - Future-proofing assessment
    - Exit strategy if needed

17. DETAILED RISK ANALYSIS:
    - Comprehensive risk identification
    - Likelihood and impact assessment for each risk
    - Mitigation strategies
    - Feasibility score (1-100)

18. INDUSTRY BENCHMARKS:
    - How does this compare to industry standards?
    - Best practices alignment
    - Lessons from similar implementations

19. PROS & CONS:
    - Complete list of genuine strengths
    - Honest assessment of weaknesses

20. IMPROVEMENTS NEEDED:
    - Critical improvements (must address)
    - Nice-to-have improvements

21. FINAL VERDICT & EXECUTIVE SUMMARY:
    - Clear verdict: strong_go / go_with_caution / needs_work / no_go
    - Detailed verdict summary
    - Executive summary for leadership
    - 5-7 key takeaways

Be BRUTALLY HONEST and COMPREHENSIVE. This analysis will determine whether Indira IVF invests significant resources.
Consider: healthcare regulations, patient data privacy, scalability across all centers, cultural sensitivities, market trends, and long-term sustainability.
If this project has flaws, identify them clearly with solutions. If it's excellent, explain why with specifics.`
        }]
      },
      config: {
        systemInstruction: `You are an elite business strategist, healthcare IT consultant, and market analyst with deep expertise in:
- Indian healthcare industry and regulations
- Fertility and IVF market in India
- Digital health transformation
- Cultural nuances in Indian healthcare
- Healthcare compliance (PCPNDT, MTP Act, IT Act)
- Enterprise software implementation at scale

You are conducting a COMPREHENSIVE due diligence analysis for Indira IVF - India's largest fertility clinic chain (130+ centers, 1,25,000+ IVF pregnancies).

Your analysis must be:
1. EXHAUSTIVE - Cover every possible angle
2. HONEST - Don't sugarcoat issues
3. ACTIONABLE - Provide specific recommendations
4. CULTURALLY AWARE - Consider Indian context
5. FORWARD-LOOKING - Consider market trends and future implications
6. PRACTICAL - Consider implementation realities at scale

This analysis will be reviewed by CTO, Business heads, and potentially board members.
Output EXTREMELY comprehensive analysis in JSON format.`,
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

