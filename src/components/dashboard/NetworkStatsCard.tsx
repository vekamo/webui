
/***************************************************
 *  COMPONENT: NetworkStatsCard
 *  - Receives an array of PoolStat items
 ***************************************************/

interface PoolStat {
  title: string;
  value: string;
}

export default function NetworkStatsCard({ stats }: { stats: PoolStat[] }) {
  return (
    <div
      className="
        rounded-lg shadow-md
        bg-gradient-to-r from-[#182026] to-[#0f1215]
        border border-[#2A2D34]
        p-6 sm:p-8
        flex flex-col gap-4
      "
    >
      <h2 className="text-xl sm:text-2xl font-extrabold text-white">
        Network Stats
      </h2>
      <p className="text-sm text-gray-400">
        Overview of the MWC network metrics.
      </p>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-sm">
        {stats.map((stat, i) => (
          <li key={i} className="p-2 bg-black/20 rounded-md text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wide">
              {stat.title}
            </p>
            <p className="text-sm sm:text-lg font-bold text-white mt-1">
              {stat.value}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}