import PageLayout from "@/components/PageLayout";
import KpiBar from "@/components/KpiBar";
import ForecastChart from "@/components/ForecastChart";
import ActivityFeed from "@/components/ActivityFeed";
import TopProducts from "@/components/TopProducts";
import CategoryGrid from "@/components/CategoryGrid";
import InsightPanels from "@/components/InsightPanels";

const Dashboard = () => (
  <PageLayout title="Dashboard" subtitle="Last updated: 2 min ago">
    <KpiBar />
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
      <ForecastChart />
      <ActivityFeed />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-5">
      <TopProducts />
      <CategoryGrid />
    </div>
    <InsightPanels />
  </PageLayout>
);

export default Dashboard;
