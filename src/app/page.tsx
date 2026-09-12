import RoomDisplay from '@/components/RoomDisplay';
import MirrorPanel from '@/components/MirrorPanel';

interface Props {
  searchParams: Promise<{ split?: string }>;
}

export default async function Page({ searchParams }: Props) {
  const { split } = await searchParams;
  const isSplit = split === '1';

  return isSplit ? (
    <div className="h-screen flex">
      {/* Left: room display at 55% */}
      <div className="flex-[55] min-w-0">
        <RoomDisplay />
      </div>
      {/* Right: live Ambiguous workspace at 45% */}
      <div className="flex-[45] min-w-0">
        <MirrorPanel />
      </div>
    </div>
  ) : (
    <RoomDisplay />
  );
}
