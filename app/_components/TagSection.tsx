import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TagFilterItemWithCount } from '@/types/blog';
import Link from 'next/link';

interface TagSectionProps {
  tags: TagFilterItemWithCount[];
  selectedTag?: string;
}

export default function TagSection({ tags, selectedTag }: TagSectionProps) {
  const allTag = tags.find((tag) => tag.id === 'all' || tag.name === '전체');
  const otherTags = tags.filter((tag) => tag.id !== 'all' && tag.name !== '전체');
  const isAllSelected = !selectedTag;

  return (
    <aside>
      <Card>
        <CardHeader>
          <CardTitle>태그목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {allTag && (
              <TagItem tag={allTag} href="/" isSelected={isAllSelected} />
            )}
            {otherTags.map((tag) => (
              <TagItem
                key={tag.id}
                tag={tag}
                href={`?tag=${tag.name}`}
                isSelected={selectedTag === tag.name}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}

function TagItem({
  tag,
  href,
  isSelected,
}: {
  tag: TagFilterItemWithCount;
  href: string;
  isSelected: boolean;
}) {
  return (
    <Link href={href}>
      <div
        className={`flex items-center justify-between rounded-md p-1.5 text-sm transition-colors ${
          isSelected
            ? 'bg-primary/10 text-foreground font-medium'
            : 'text-muted-foreground hover:bg-muted-foreground/10'
        }`}
      >
        <span>{tag.name}</span>
        <span>{tag.count}</span>
      </div>
    </Link>
  );
}
