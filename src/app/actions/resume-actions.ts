"use server";

import { db } from "@/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function updateResumeContentAction(params: {
  resumeId: string;
  uid: string;
  section: string;
  content: any;
  index?: number;
}) {
  const { resumeId, uid, section, content, index } = params;

  try {
    const resumeRef = db.collection("users").doc(uid).collection("resumes").doc(resumeId);
    const doc = await resumeRef.get();

    if (!doc.exists) {
      throw new Error("Resume not found");
    }

    const resumeData = doc.data()!;
    const currentContent = resumeData.content || {};

    if (typeof index === "number" && Array.isArray(currentContent[section])) {
      // Update item in array (e.g. experience[index])
      const newArray = [...currentContent[section]];
      if (typeof content === 'string') {
          // If it's a string, we might be updating just the description
          newArray[index] = { ...newArray[index], description: content };
      } else {
          // If it's an object, replace the whole item
          newArray[index] = { ...newArray[index], ...content };
      }
      
      await resumeRef.update({
        [`content.${section}`]: newArray,
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      // Direct field update (e.g. summary)
      await resumeRef.update({
        [`content.${section}`]: content,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Update Resume Error:", error);
    return { success: false, error: error.message };
  }
}
