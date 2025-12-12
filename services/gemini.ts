import { GoogleGenAI, Type } from "@google/genai";
import { Student } from '../types';

// NOTE: In a real production app, you would not send all reference images every time.
// You would use a Vector Database or embeddings. 
// However, for this Vibe-Coding demo using Gemini Vision 2.5 Flash, 
// sending context images is a powerful way to simulate "One-Shot" or "Few-Shot" learning without a backend.

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface RecognitionResult {
  matchFound: boolean;
  studentId?: string;
  confidence?: number;
  reasoning?: string;
}

export interface GroupRecognitionResult {
  identifiedStudentIds: string[];
}

export const identifyStudent = async (
  currentFrameBase64: string, 
  students: Student[]
): Promise<RecognitionResult> => {
  if (students.length === 0) {
    return { matchFound: false, reasoning: "No registered students." };
  }

  // UPDATED: Increased limit to 200 to ensure we check against the full class.
  // Gemini 2.5 Flash has a large context window, so handling many small reference images is feasible.
  const batchStudents = students.slice(0, 200); 

  const referenceImages = batchStudents.map(s => ({
    inlineData: {
      mimeType: 'image/jpeg',
      data: s.photoData.split(',')[1] // Remove data:image/jpeg;base64, header
    }
  }));

  const studentMap = batchStudents.map((s, index) => `Image ${index + 1}: ID=${s.id}, Name=${s.name}`).join('\n');

  const promptText = `
    You are a highly precise Face Recognition Attendance System.
    
    I have provided ${referenceImages.length} reference images of registered students (labeled Image 1 to Image ${referenceImages.length}).
    Below is the mapping of Reference Images to Student Details:
    ${studentMap}

    The LAST image provided is the "Live Camera Capture" (or uploaded image) to be identified.
    
    Task:
    1. Analyze the facial features (eyes, nose, mouth, jawline, hair, distinct markers) of the person in the "Live Camera Capture".
    2. Compare these features strictly against EACH of the Reference Images.
    3. Identify the EXACT match.
    
    CRITICAL RULES:
    - You must look for a specific identity match, not just a general lookalike.
    - If the person looks similar but you are not >85% sure, return matchFound: false.
    - If multiple registered students look similar, compare their specific features (e.g., glasses, moles, eye shape) to distinguish them.
    - Ignore differences in lighting or background; focus on the face itself.
    
    Return JSON with:
    - matchFound: true/false
    - studentId: The ID of the matched student (if found)
    - confidence: A number between 0.0 and 1.0
    - reasoning: A short explanation of why it is a match or why no match was found.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          ...referenceImages, 
          { 
            inlineData: {
              mimeType: 'image/jpeg',
              data: currentFrameBase64.split(',')[1]
            }
          },
          { text: promptText }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchFound: { type: Type.BOOLEAN },
            studentId: { type: Type.STRING, nullable: true },
            confidence: { type: Type.NUMBER, description: "0.0 to 1.0" },
            reasoning: { type: Type.STRING }
          },
          required: ['matchFound', 'confidence']
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text) as RecognitionResult;
    }
    return { matchFound: false, reasoning: "No response text." };

  } catch (error) {
    console.error("Gemini Recognition Error:", error);
    return { matchFound: false, reasoning: "API Error" };
  }
};

export const identifyGroup = async (
  currentFrameBase64: string,
  students: Student[]
): Promise<GroupRecognitionResult> => {
  if (students.length === 0) {
    return { identifiedStudentIds: [] };
  }

  // For group photos, we allow a larger context window
  const batchStudents = students.slice(0, 100);

  const referenceImages = batchStudents.map(s => ({
    inlineData: {
      mimeType: 'image/jpeg',
      data: s.photoData.split(',')[1]
    }
  }));

  const studentMap = batchStudents.map((s, index) => `Image ${index + 1}: ID=${s.id}, Name=${s.name}`).join('\n');

  const promptText = `
    You are a Face Recognition Attendance System processing a CLASS GROUP PHOTO.
    
    Reference Images (Registered Students):
    ${studentMap}

    The LAST image is a Group Photo.
    
    Task:
    1. Scan the Group Photo and find ALL faces that match any of the Reference Images.
    2. Be careful to only identify students if the face matches clearly.
    3. Return a JSON object containing a list of "identifiedStudentIds".
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          ...referenceImages,
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: currentFrameBase64.split(',')[1]
            }
          },
          { text: promptText }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            identifiedStudentIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['identifiedStudentIds']
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as GroupRecognitionResult;
    }
    return { identifiedStudentIds: [] };
  } catch (error) {
    console.error("Gemini Group Recognition Error:", error);
    return { identifiedStudentIds: [] };
  }
};