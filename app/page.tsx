import { PostCard } from '@/components/features/blog/PostCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getPublishedPosts, getTagFilterItems, toPosts } from '@/lib/notion';
import Link from 'next/link';
import ProfileSection from './_components/ProfileSection';
import TagSection from './_components/TagSection';

const sortOptions = [
  { value: 'latest', label: '최신순' },
  { value: 'oldest', label: '오래된순' },
];

interface HomePageProps {
  searchParams: Promise<{
    tag?: string;
  }>;
}

export default async function Home({ searchParams }: HomePageProps) {
  const { tag } = await searchParams;
  const selectedTag = tag && tag !== '전체' ? tag : undefined;

  const [listResponse, allPostsResponse] = await Promise.all([
    getPublishedPosts(selectedTag),
    selectedTag ? getPublishedPosts() : Promise.resolve(null),
  ]);

  const posts = toPosts(listResponse.results);
  const tags = getTagFilterItems((allPostsResponse ?? listResponse).results);

  return (
    <div className="container py-8">
      <div className="grid grid-cols-[200px_1fr_220px] gap-6">
        <aside>
          <TagSection tags={tags} selectedTag={selectedTag} />
        </aside>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">블로그 목록</h2>
            <Select defaultValue="latest" items={sortOptions}>
              <SelectTrigger className="w-45">
                <SelectValue placeholder="정렬 방식 선택" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {posts.length === 0 ? (
              <p className="text-muted-foreground">
                {selectedTag
                  ? `"${selectedTag}" 태그의 글이 없습니다.`
                  : '발행된 글이 없습니다.'}
              </p>
            ) : (
              posts.map((post) => (
                <Link href={`/blog/${post.slug}`} key={post.id}>
                  <PostCard post={post} />
                </Link>
              ))
            )}
          </div>
        </div>
        <aside>
          <ProfileSection />
        </aside>
      </div>
    </div>
  );
}
