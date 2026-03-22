import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { ReactNode } from "react";

interface PageLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

const PageLayout = ({ children, title, subtitle }: PageLayoutProps) => (
  <div className="min-h-screen bg-background">
    <Sidebar />
    <div className="ml-[230px] flex flex-col min-h-screen">
      <TopBar title={title} subtitle={subtitle} />
      <main className="flex-1 p-6 space-y-5 max-w-[1200px]">
        {children}
      </main>
    </div>
  </div>
);

export default PageLayout;
