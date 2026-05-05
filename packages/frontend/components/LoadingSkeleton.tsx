'use client';

interface LoadingSkeletonProps {
  count?: number;
  height?: string;
}

export function LoadingSkeleton({ count = 1, height = 'h-12' }: LoadingSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${height} bg-gray-200 rounded animate-pulse`} />
      ))}
    </div>
  );
}
