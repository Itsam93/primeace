import {
  BarChart3,
  Briefcase,
  Code2,
  GraduationCap,
  LayoutDashboard,
  type LucideIcon
} from "lucide-react";

import researchImage from "../../../assets/research.png";
import analyticsImage from "../../../assets/data-analysis.png";
import reportingImage from "../../../assets/reporting.png";
import developmentImage from "../../../assets/dev.png";
import consultancyImage from "../../../assets/digital.png";

export interface Service {
  number: string;
  title: string;
  description: string;
  offerings: string[];
  icon: LucideIcon;
  backgroundImage: string;
}

export const services: Service[] = [
  {
    number: "01",
    title: "Research & Academic Services",
    description:
      "Research and academic support designed to help individuals develop, refine and complete quality academic work.",
    offerings: [
      "Research Projects",
      "Research Proposals",
      "Topic Development",
      "Literature Reviews",
      "Research Methodology",
      "Questionnaires",
      "Academic Editing",
      "Academic Consultancy"
    ],
    icon: GraduationCap,
    backgroundImage: researchImage
  },
  {
    number: "02",
    title: "Data Analytics & Statistical Analysis",
    description:
      "Transforming raw data into meaningful insights through statistical tools, analytical techniques and interpretation.",
    offerings: [
      "SPSS",
      "EViews",
      "Microsoft Excel",
      "SQL",
      "Statistical Analysis",
      "Econometrics",
      "Data Cleaning",
      "Data Interpretation"
    ],
    icon: BarChart3,
    backgroundImage: analyticsImage
  },
  {
    number: "03",
    title: "Business Intelligence & Reporting",
    description:
      "Helping organisations understand performance and make informed decisions through reporting and business intelligence solutions.",
    offerings: [
      "Business Dashboards",
      "Automated Reports",
      "VBA Automation",
      "Business Performance Analysis",
      "Management Reporting"
    ],
    icon: LayoutDashboard,
    backgroundImage: reportingImage
  },
  {
    number: "04",
    title: "Web Development & UI/UX Design",
    description:
      "Designing intuitive digital experiences and building functional web solutions that help businesses connect with customers and improve their operations.",
    offerings: [
      "Business Websites",
      "Web Applications",
      "E-commerce Solutions",
      "UI Design",
      "UX Design",
      "Wireframing & Prototyping",
      "Responsive Web Design",
      "Web Dashboards",
      "Database Systems",
      "System Integrations"
    ],
    icon: Code2,
    backgroundImage: developmentImage
  },
  {
    number: "05",
    title: "Professional & Technical Consultancy",
    description:
      "Providing professional guidance and technical support to help individuals and organisations navigate research and technology-related challenges.",
    offerings: [
      "Technical Documentation",
      "Research Consultancy",
      "Technology Advisory",
      "Digital Transformation"
    ],
    icon: Briefcase,
    backgroundImage: consultancyImage
  }
];
