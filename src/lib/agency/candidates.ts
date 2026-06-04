import { useEffect, useState } from 'react';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, updateDoc, doc, setDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

export type CandidateStatus = 'Ready to Sync' | 'Synced to Bullhorn' | 'Under Review';

export interface AgencyCandidate {
  id: string;
  name: string;
  role: string;
  atsScore: number;
  status: CandidateStatus;
  date: string;
  skills: string[];
  experience: string;
}

const SEED_DATA: AgencyCandidate[] = [
  { id: '1', name: "Sarah Jenkins", role: "Senior Frontend Engineer", atsScore: 94, status: "Ready to Sync", date: "2 hours ago", skills: ["React", "TypeScript", "Next.js"], experience: "6 years" },
  { id: '2', name: "Michael Chen", role: "Product Manager", atsScore: 88, status: "Synced to Bullhorn", date: "5 hours ago", skills: ["Agile", "Jira", "Roadmapping"], experience: "4 years" },
  { id: '3', name: "Emma Watson", role: "UX Designer", atsScore: 91, status: "Ready to Sync", date: "1 day ago", skills: ["Figma", "User Testing", "Wireframing"], experience: "3 years" },
  { id: '4', name: "David Rodriguez", role: "Backend Developer", atsScore: 85, status: "Under Review", date: "2 days ago", skills: ["Node.js", "Express", "MongoDB"], experience: "5 years" },
  { id: '5', name: "Aisha Patel", role: "DevOps Engineer", atsScore: 96, status: "Ready to Sync", date: "3 days ago", skills: ["AWS", "Docker", "Kubernetes", "CI/CD"], experience: "7 years" },
];

export function useAgencyCandidates() {
  const [candidates, setCandidates] = useState<AgencyCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const { firestore } = initializeFirebase();

  useEffect(() => {
    if (!firestore || typeof window === 'undefined') return;

    const q = query(collection(firestore, 'agency_candidates'));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        // Seed data if empty
        console.log("Seeding agency_candidates...");
        for (const candidate of SEED_DATA) {
          await setDoc(doc(firestore, 'agency_candidates', candidate.id), candidate);
        }
        // State will update on the next snapshot from Firestore
      } else {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AgencyCandidate));
        setCandidates(data);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching agency candidates:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore]);

  const pushToATS = async (candidateId: string) => {
    if (!firestore) return;
    const candidateRef = doc(firestore, 'agency_candidates', candidateId);
    
    // Simulate network delay for ATS integration
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    await updateDoc(candidateRef, {
      status: 'Synced to Bullhorn'
    });
  };

  return { candidates, loading, pushToATS };
}
