export type Topic = {
  id: string;
  title: string;
  unit: string;
  estimatedMinutes: number;
};

export const sampleTopics: Record<string, Topic[]> = {
  "Mathematics": [
    { id: "math_12_1_1", title: "Sequence", unit: "Sequences and Series", estimatedMinutes: 10 },
    { id: "math_12_1_2", title: "Arithmetic and Geometric Sequences", unit: "Sequences and Series", estimatedMinutes: 15 },
    { id: "math_12_1_3", title: "The Sigma Notation and Partial Sums", unit: "Sequences and Series", estimatedMinutes: 12 },
  ]
};

export type Question = {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

export const diagnosticQuestions: Record<string, Question[]> = {
  "Mathematics": [
    {
      id: "q_seq_1",
      text: "Find the next two terms of the sequence: 50, 47, 44, 41, ...",
      options: ["38, 35", "39, 37", "37, 34", "38, 36"],
      correctAnswer: "38, 35",
      explanation: "The common difference is -3. 41 - 3 = 38, 38 - 3 = 35."
    },
    {
      id: "q_seq_2",
      text: "What is the 5th term of the sequence whose general term is a_n = 2n - 1?",
      options: ["5", "7", "9", "11"],
      correctAnswer: "9",
      explanation: "a_5 = 2(5) - 1 = 10 - 1 = 9."
    },
    {
      id: "q_seq_3",
      text: "Is the sequence 2, 4, 8, 16... an arithmetic or geometric sequence?",
      options: ["Arithmetic", "Geometric", "Both", "Neither"],
      correctAnswer: "Geometric",
      explanation: "There is a common ratio of 2 between consecutive terms (4/2 = 2, 8/4 = 2)."
    }
  ]
};

export type Flashcard = {
  front: string;
  back: string;
};

export type LessonContent = {
  topicId: string;
  title: string;
  notes: string;
  keyPoints?: string[];
  tutorTip?: string;
  videoPlaceholder: string;
  videoTitle?: string;
  videoSummary?: string;
  youtubeId?: string;
  flashcards?: Flashcard[];
};

export const lessonContents: Record<string, LessonContent> = {
  "math_12_1_1": {
    topicId: "math_12_1_1",
    title: "1.1 Sequence",
    notes: "A sequence is a function whose domain is the collection of all integers greater than or equal to a given integer m (usually 0 or 1). A sequence with a last term is a finite sequence, and one without a last term is an infinite sequence. The numbers in a sequence are called its terms.",
    keyPoints: [
      "Domain of an infinite sequence is the set of natural numbers (N) or non-negative integers.",
      "General term is denoted as a_n (or f(n)) representing the n-th position.",
      "Finite sequences have a definite last term; infinite sequences continue indefinitely."
    ],
    tutorTip: "Think of a sequence as an ordered list where the position (n = 1, 2, 3...) acts as the input and the term (a_n) is the output!",
    videoPlaceholder: "1.1 Sequence Video",
    videoTitle: "Introduction to Sequences & Terms",
    videoSummary: "In this micro-video, watch how sequence terms are calculated step-by-step from their general formula a_n.",
    youtubeId: "zPLoxPWciFY",
    flashcards: [
      { front: "What is a finite sequence?", back: "A sequence that has a definite last term (e.g. 2, 4, 6, 8, 10)." },
      { front: "What is the domain of an infinite sequence?", back: "The set of natural numbers N = {1, 2, 3, ...} (or {0, 1, 2, ...})." },
      { front: "What does the symbol a_n denote?", back: "The n-th term (or general term) of the sequence." }
    ]
  },
  "math_12_1_2": {
    topicId: "math_12_1_2",
    title: "1.2 Arithmetic & Geometric Sequences",
    notes: "An arithmetic sequence is obtained by adding a fixed number (common difference 'd') to the preceding term. A geometric sequence is obtained by multiplying the preceding term by a non-zero constant (common ratio 'r').",
    keyPoints: [
      "Arithmetic Formula: a_n = a_1 + (n - 1)d, where d = a_(k+1) - a_k.",
      "Geometric Formula: a_n = a_1 * r^(n - 1), where r = a_(k+1) / a_k (r ≠ 0).",
      "Arithmetic involves repeated addition; Geometric involves repeated multiplication (exponential growth/decay)."
    ],
    tutorTip: "To test if a sequence is arithmetic, subtract adjacent terms (a_2 - a_1). To test if it's geometric, divide adjacent terms (a_2 / a_1)!",
    videoPlaceholder: "1.2 Arithmetic & Geometric Sequences Video",
    videoTitle: "Arithmetic vs. Geometric Sequences Explained",
    videoSummary: "Learn how to easily identify the common difference (d) and common ratio (r) in national exam questions.",
    youtubeId: "mGYZ5iFcE_Q",
    flashcards: [
      { front: "What is a common difference (d)?", back: "The constant value added to each term to get the next term in an arithmetic sequence." },
      { front: "What is a common ratio (r)?", back: "The non-zero constant multiplied by each term to get the next term in a geometric sequence." },
      { front: "What is the formula for the n-th term of an arithmetic sequence?", back: "a_n = a_1 + (n - 1)d" }
    ]
  },
  "math_12_1_3": {
    topicId: "math_12_1_3",
    title: "1.3 The Sigma Notation & Partial Sums",
    notes: "Partial sums refer to adding a finite number of consecutive terms from a sequence. Sigma notation (∑) is used to concisely represent these sums. The sum of the first n terms of a sequence is denoted by S_n.",
    keyPoints: [
      "The Greek letter Sigma (∑) indicates summation of terms from index k = 1 to n.",
      "Partial sum S_n = a_1 + a_2 + ... + a_n.",
      "For an arithmetic series: S_n = (n/2)(a_1 + a_n) or S_n = (n/2)[2a_1 + (n - 1)d].",
      "For a geometric series: S_n = a_1(1 - r^n) / (1 - r) when r ≠ 1."
    ],
    tutorTip: "When evaluating ∑ notation, identify the lower limit (starting integer) and upper limit (ending integer), compute each term, and add them together.",
    videoPlaceholder: "1.3 The Sigma Notation Video",
    videoTitle: "Sigma Notation (∑) & Partial Sums Masterclass",
    videoSummary: "Step-by-step walkthrough of expanding and calculating partial sums with sigma notation.",
    youtubeId: "oakQYgGtt3Q",
    flashcards: [
      { front: "What does Sigma (∑) notation represent?", back: "A compact mathematical notation to express the sum of multiple terms." },
      { front: "What is a partial sum (S_n)?", back: "The sum of the first n terms of a given sequence (S_n = a_1 + a_2 + ... + a_n)." },
      { front: "What is the sum formula for an arithmetic series with first term a_1 and last term a_n?", back: "S_n = (n / 2) * (a_1 + a_n)" }
    ]
  }
};

export const practiceQuestions: Record<string, Question[]> = {
  "math_12_1_1": [
    {
      id: "p_seq_1_1",
      text: "List the first three terms of a_n = n / (n + 1).",
      options: ["1/2, 2/3, 3/4", "1, 2, 3", "2/3, 3/4, 4/5", "1/2, 1/3, 1/4"],
      correctAnswer: "1/2, 2/3, 3/4",
      explanation: "a_1 = 1/2, a_2 = 2/3, a_3 = 3/4."
    }
  ],
  "math_12_1_2": [
    {
      id: "p_seq_2_1",
      text: "For the arithmetic sequence 3, 7, 11, 15... what is the common difference?",
      options: ["3", "4", "5", "7"],
      correctAnswer: "4",
      explanation: "7 - 3 = 4, 11 - 7 = 4. The common difference is 4."
    }
  ],
  "math_12_1_3": [
    {
      id: "p_seq_3_1",
      text: "What does ∑ from k=1 to 3 of (2k) equal?",
      options: ["6", "10", "12", "14"],
      correctAnswer: "12",
      explanation: "2(1) + 2(2) + 2(3) = 2 + 4 + 6 = 12."
    }
  ]
};
