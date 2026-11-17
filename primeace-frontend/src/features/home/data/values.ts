import {
  Target,
  Layers3,
  SlidersHorizontal,
  MessageCircle,
  SearchCheck,
  RefreshCw,
  type LucideIcon
} from "lucide-react";

export interface Value {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const values: Value[] = [
  {
    number: "01",
    title: "Practical, Result-Oriented Solutions",
    description:
      "We focus on understanding the problem and delivering solutions that address real needs and support meaningful outcomes.",
    icon: Target
  },
  {
    number: "02",
    title: "Integrated Expertise",
    description:
      "Our services bring together research, data analytics and technology expertise to address different aspects of a project.",
    icon: Layers3
  },
  {
    number: "03",
    title: "Tailored Approach",
    description:
      "We consider each client's objectives, requirements and circumstances when determining the most suitable approach.",
    icon: SlidersHorizontal
  },
  {
    number: "04",
    title: "Clear Communication",
    description:
      "We value clear communication throughout an engagement, helping clients understand the work, expectations and progress.",
    icon: MessageCircle
  },
  {
    number: "05",
    title: "Attention to Detail",
    description:
      "We pay close attention to accuracy, consistency and quality across research, data analysis and technical deliverables.",
    icon: SearchCheck
  },
  {
    number: "06",
    title: "Flexible Service Delivery",
    description:
      "We adapt our service delivery approach to accommodate the nature, scope and requirements of each engagement.",
    icon: RefreshCw
  }
];
