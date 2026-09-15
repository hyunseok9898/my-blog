import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TagFilterItemWithCount } from '@/types/blog';
import Link from 'next/link';

interface TagSectionProps {
  tags: TagFilterItemWithCount[];
}

export default function TagSection({ tags }: TagSectionProps) {
  const allTag = tags.find((tag) => tag.id === 'all' || tag.name === '전체');
  const otherTags = tags.filter((tag) => tag.id !== 'all' && tag.name !== '전체');

  return (
    <aside>
      <Card>
        <CardHeader>
          <CardTitle>태그목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {allTag && <TagItem tag={allTag} href="/" />}
            {otherTags.map((tag) => (
              <TagItem key={tag.id} tag={tag} href={`?tag=${tag.name}`} />
            ))}
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}

function TagItem({ tag, href }: { tag: TagFilterItemWithCount; href: string }) {
  return (
    <Link href={href}>
      <div className="hover:bg-muted-foreground/10 text-muted-foreground flex items-center justify-between rounded-md p-1.5 text-sm transition-colors">
        <span>{tag.name}</span>
        <span>{tag.count}</span>
      </div>
    </Link>
  );
}
