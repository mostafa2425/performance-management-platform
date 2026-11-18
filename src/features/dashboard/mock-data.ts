export type Objective = {
  id: string;
  category: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  weight: number;
  progress: number;
  smartScore: number;
  status: "on-track" | "at-risk" | "completed";
  dueDate: string;
};

export const employee = {
  name: "Mostafa Gamal",
  employeeId: "10561",
  email: "mgamal.eo@master-works.sa",
  title: "Frontend Developer",
  department: "Program Management",
  businessUnit: "Program Management",
  location: "MW – Cairo Office",
  manager: "Norah Mohammed Awad Al Mammri",
  cycle: "2026 Performance Cycle"
};

export const objectives: Objective[] = [
  {
    id: "OBJ-01",
    category: "Business & Delivery",
    title: "Ticket Update Hygiene",
    titleAr: "الالتزام بتحديث التذاكر",
    description: "Keep assigned task statuses, comments, and time logs updated in the tracking tool on a daily basis.",
    descriptionAr: "الحفاظ على تحديث حالات المهام والتعليقات وسجلات الوقت في أداة متابعة العمل بشكل يومي.",
    weight: 10,
    progress: 92,
    smartScore: 88,
    status: "on-track",
    dueDate: "Dec 15, 2026"
  },
  {
    id: "OBJ-02",
    category: "Business & Delivery",
    title: "Sprint Task Completion",
    titleAr: "إنجاز مهام السبرنت",
    description: "Achieve a minimum 80% completion rate for assigned user stories and technical tasks within each sprint.",
    descriptionAr: "تحقيق معدل إنجاز لا يقل عن 80% للمهام وقصص المستخدم المسندة خلال كل دورة عمل.",
    weight: 15,
    progress: 84,
    smartScore: 88,
    status: "on-track",
    dueDate: "Dec 20, 2026"
  },
  {
    id: "OBJ-03",
    category: "Business & Delivery",
    title: "Task Estimation Accuracy",
    titleAr: "دقة تقدير المهام",
    description: "Maintain delivery estimates within ±25% variance between estimated and actual effort.",
    descriptionAr: "الحفاظ على دقة تقديرات التسليم في حدود ±25% بين الجهد المتوقع والفعلي.",
    weight: 10,
    progress: 76,
    smartScore: 86,
    status: "at-risk",
    dueDate: "Dec 20, 2026"
  },
  {
    id: "OBJ-04",
    category: "Business & Delivery",
    title: "Documentation Completeness",
    titleAr: "اكتمال التوثيق",
    description: "Deliver clear, updated inline code documentation, API specifications, and technical handover notes.",
    descriptionAr: "تقديم توثيق واضح ومحدّث للكود ومواصفات واجهات API وملاحظات التسليم الفني.",
    weight: 10,
    progress: 90,
    smartScore: 88,
    status: "on-track",
    dueDate: "Dec 25, 2026"
  },
  {
    id: "OBJ-05",
    category: "Business & Delivery",
    title: "Daily Stand-up Participation",
    titleAr: "المشاركة في الاجتماع اليومي",
    description: "Maintain consistent attendance and active contribution in daily stand-up meetings.",
    descriptionAr: "الالتزام بالحضور والمشاركة الفعالة في الاجتماعات اليومية.",
    weight: 10,
    progress: 100,
    smartScore: 95,
    status: "completed",
    dueDate: "Dec 31, 2026"
  },
  {
    id: "OBJ-06",
    category: "Business & Delivery",
    title: "Cross-Functional Collaboration",
    titleAr: "التعاون بين الفرق",
    description: "Actively participate in refinement and planning sessions, contributing constructive technical input.",
    descriptionAr: "المشاركة الفعالة في جلسات التخطيط وتحسين المتطلبات وتقديم مدخلات تقنية بناءة.",
    weight: 10,
    progress: 82,
    smartScore: 77,
    status: "on-track",
    dueDate: "Dec 31, 2026"
  },
  {
    id: "OBJ-07",
    category: "Business & Delivery",
    title: "Code Reusability",
    titleAr: "إعادة استخدام الكود",
    description: "Design modular, reusable components and functions, minimizing duplicate code across projects.",
    descriptionAr: "تصميم مكونات ووظائف معيارية قابلة لإعادة الاستخدام وتقليل تكرار الكود بين المشاريع.",
    weight: 10,
    progress: 86,
    smartScore: 85,
    status: "on-track",
    dueDate: "Dec 31, 2026"
  },
  {
    id: "OBJ-08",
    category: "Business & Delivery",
    title: "Continuous Skill Development",
    titleAr: "التطوير المستمر للمهارات",
    description: "Complete at least two assigned internal or external technical training courses.",
    descriptionAr: "إكمال دورتين تدريبيتين تقنيتين على الأقل من البرامج الداخلية أو الخارجية.",
    weight: 5,
    progress: 50,
    smartScore: 85,
    status: "at-risk",
    dueDate: "Dec 31, 2026"
  }
];

export const competencies = [
  "Achievement of Goals",
  "Team Support",
  "Quality of Work",
  "Responsibility & Decision-Making",
  "Continuous Learning",
  "Process Improvement",
  "Application of Knowledge",
  "Compliance & Policies",
  "Punctuality & Attendance",
  "Professional Representation",
  "Self-Discipline & Accountability",
  "Productivity & Output"
];

export const actionItems = [
  { id: 1, title: "Review your performance plan", detail: "Pending employee review · Approval or modification request", due: "Action required", type: "review" }
];