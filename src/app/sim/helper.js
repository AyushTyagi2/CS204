import PipelineSimulator from '../components/exp';
import StatsDisplay from '../components/stats';

export default function Home() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-[#191919]">
      <PipelineSimulator />
      <StatsDisplay/>
    </div>
  );
}