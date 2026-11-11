import Spinner from '@/components/common/Spinner';

export default function ModuleLoading() {
  return (
    <div className="grid min-h-40 flex-1 place-items-center">
      <Spinner size="lg" label="Loading…" />
    </div>
  );
}
