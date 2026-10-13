import { PostContent, getHeadingItems } from '@/components/features/blog/PostContent';
import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getPostBySlug, getPublishedPosts, toPosts } from '@/lib/notion';
import { formatPostDate } from '@/lib/date';
import { CalendarDays, ChevronLeft, ChevronRight, User } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getPostBySlug(slug);

  if (!detail) {
    return { title: '글을 찾을 수 없습니다' };
  }

  return {
    title: detail.post.title,
    description: detail.post.description,
  };
}

export default async function BlogPost({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const [detail, published] = await Promise.all([getPostBySlug(slug), getPublishedPosts()]);

  if (!detail) {
    notFound();
  }

  const { post, blocks } = detail;
  const headings = getHeadingItems(blocks);
  const posts = toPosts(published.results);
  const currentIndex = posts.findIndex((item) => item.slug === post.slug || item.id === post.id);
  const previousPost = currentIndex > 0 ? posts[currentIndex - 1] : null;
  const nextPost = currentIndex >= 0 ? posts[currentIndex + 1] : null;
  // const readingMinutes = Math.max(1, Math.ceil(detail.markdown.replace(/\s/g, '').length / 500));

  return (
    <div className="container py-12">
      <div className="grid grid-cols-[240px_1fr_240px] gap-8">
        <aside />
        <section>
          <div className="space-y-4">
            {post.coverImage && (
              <div className="relative aspect-2/1 overflow-hidden rounded-xl">
                <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {post.tags?.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
              <h1 className="text-3xl font-bold">{post.title}</h1>
            </div>

            <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
              {post.author && (
                <div className="flex items-center gap-1">
                  <User className="size-4" />
                  <span>{post.author}</span>
                </div>
              )}
              {post.date && (
                <div className="flex items-center gap-1">
                  <CalendarDays className="size-4" />
                  <span>{formatPostDate(post.date)}</span>
                </div>
              )}
              {/* <div className="flex items-center gap-1">
                <Clock className="size-4" />
                <span>{readingMinutes}분 읽기</span>
              </div> */}
            </div>
          </div>

          <Separator className="my-8" />

          <article className="prose prose-sm prose-neutral dark:prose-invert prose-headings:scroll-mt-24 prose-a:text-primary prose-img:rounded-xl max-w-none">
            {post.description && <p className="lead">{post.description}</p>}
            <PostContent blocks={blocks} />
          </article>

          <Separator className="my-16" />

          <nav className="grid grid-cols-2 gap-8">
            {previousPost ? (
              <Link href={`/blog/${previousPost.slug}`}>
                <Card className="group hover:bg-muted/50 transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base font-medium">
                      <ChevronLeft className="size-4" />
                      <span>{previousPost.title}</span>
                    </CardTitle>
                    {previousPost.description && (
                      <CardDescription className="line-clamp-2">
                        {previousPost.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                </Card>
              </Link>
            ) : (
              <div />
            )}

            {nextPost ? (
              <Link href={`/blog/${nextPost.slug}`} className="text-right">
                <Card className="group hover:bg-muted/50 transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-end gap-2 text-base font-medium">
                      <span>{nextPost.title}</span>
                      <ChevronRight className="size-4" />
                    </CardTitle>
                    {nextPost.description && (
                      <CardDescription className="line-clamp-2">
                        {nextPost.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                </Card>
              </Link>
            ) : (
              <div />
            )}
          </nav>
        </section>
        <aside className="relative">
          <div className="sticky top-(--sticky-top)">
            <div className="bg-muted/50 space-y-4 rounded-lg p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold">목차</h3>
              {headings.length === 0 ? (
                <p className="text-muted-foreground text-sm">목차가 없습니다.</p>
              ) : (
                <nav className="space-y-3 text-sm">
                  {headings.map((item) => (
                    <Link
                      key={item.id}
                      href={`#${item.id}`}
                      className={`hover:text-foreground text-muted-foreground block font-medium transition-colors ${
                        item.level === 3 ? 'pl-4' : item.level === 2 ? 'pl-2' : ''
                      }`}
                    >
                      {item.title}
                    </Link>
                  ))}
                </nav>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
