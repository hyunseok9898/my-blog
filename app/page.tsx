import { PostCard } from '@/components/features/blog/PostCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getPublishedPosts, getTagFilterItems } from '@/lib/notion';
import { Post } from '@/types/blog';
import { isFullPage } from '@notionhq/client';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import Link from 'next/link';
import ProfileSection from './_components/ProfileSection';
import TagSection from './_components/TagSection';

const sortOptions = [
  { value: 'latest', label: '최신순' },
  { value: 'oldest', label: '오래된순' },
];

const PROPERTY_NAMES = {
  description: ['Description', '설명'],
  tags: ['Tags', '태그'],
  author: ['Author', '작성자'],
  date: ['Date', '날짜', 'Created Date'],
  modifiedDate: ['Modified Date'],
  slug: ['Slug', '슬러그'],
} as const;

export default async function Home() {
  const response = await getPublishedPosts();
  const posts = toPosts(response.results);
  const tags = getTagFilterItems(response.results);

  return (
    <div className="container py-8">
      <div className="grid grid-cols-[200px_1fr_220px] gap-6">
        <aside>
          <TagSection tags={tags} />
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
              <p className="text-muted-foreground">발행된 글이 없습니다.</p>
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

function toPosts(results: Awaited<ReturnType<typeof getPublishedPosts>>['results']): Post[] {
  return results.filter(isFullPage).map(toPost);
}

function toPost(page: PageObjectResponse): Post {
  const title = getTitle(page);
  const slug = getPlainText(page, PROPERTY_NAMES.slug) ?? page.id;

  return {
    id: page.id,
    title,
    description: getPlainText(page, PROPERTY_NAMES.description),
    coverImage: getCoverImage(page),
    tags: getTags(page),
    author: getAuthor(page),
    date: getDateValue(page, PROPERTY_NAMES.date) ?? page.created_time,
    modifiedDate: getDateValue(page, PROPERTY_NAMES.modifiedDate) ?? page.last_edited_time,
    slug,
  };
}

function getTitle(page: PageObjectResponse) {
  const titleProperty = Object.values(page.properties).find(
    (property) => property.type === 'title'
  );

  if (titleProperty?.type !== 'title') {
    return '제목 없음';
  }

  return joinPlainText(titleProperty.title) || '제목 없음';
}

function getPlainText(page: PageObjectResponse, names: readonly string[]) {
  for (const name of names) {
    const property = page.properties[name];

    if (property?.type === 'rich_text') {
      const text = joinPlainText(property.rich_text);
      if (text) return text;
    }
  }

  return undefined;
}

function getTags(page: PageObjectResponse) {
  for (const name of PROPERTY_NAMES.tags) {
    const property = page.properties[name];

    if (property?.type === 'multi_select') {
      return property.multi_select.map((tag) => tag.name);
    }
  }

  return undefined;
}

function getAuthor(page: PageObjectResponse) {
  for (const name of PROPERTY_NAMES.author) {
    const property = page.properties[name];

    if (property?.type === 'rich_text') {
      const text = joinPlainText(property.rich_text);
      if (text) return text;
    }

    if (property?.type === 'people') {
      const names = property.people
        .map((person) => ('name' in person ? person.name : null))
        .filter((personName): personName is string => Boolean(personName));

      if (names.length > 0) {
        return names.join(', ');
      }
    }

    if (property?.type === 'select' && property.select?.name) {
      return property.select.name;
    }
  }

  return undefined;
}

function getDateValue(page: PageObjectResponse, names: readonly string[]) {
  for (const name of names) {
    const property = page.properties[name];

    if (property?.type === 'date' && property.date?.start) {
      return property.date.start;
    }

    if (property?.type === 'created_time') {
      return property.created_time;
    }

    if (property?.type === 'last_edited_time') {
      return property.last_edited_time;
    }
  }

  return undefined;
}

function getCoverImage(page: PageObjectResponse) {
  if (!page.cover) {
    return undefined;
  }

  if (page.cover.type === 'external') {
    return page.cover.external.url;
  }

  if (page.cover.type === 'file') {
    return page.cover.file.url;
  }

  return undefined;
}

function joinPlainText(items: { plain_text: string }[]) {
  return items.map((item) => item.plain_text).join('').trim();
}
