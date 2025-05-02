import PipelineSimulator from '../components/exp';
import StatsDisplay from '../components/stats';

export default function Home() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-purple-100 to-blue-100">
      <PipelineSimulator />
      <StatsDisplay/>
    </div>
  );
}