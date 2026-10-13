import { Client, isFullBlock, isFullPage } from '@notionhq/client';
import type {
  BlockObjectResponse,
  PageObjectResponse,
  QueryDataSourceResponse,
} from '@notionhq/client';
import type { Post, TagFilterItemWithCount } from '@/types/blog';

export const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const PROPERTY_NAMES = {
  description: ['Description', '설명'],
  tags: ['Tags', '태그'],
  author: ['Author', '작성자'],
  date: ['Date', '날짜', 'Created Date'],
  modifiedDate: ['Modified Date'],
  slug: ['Slug', '슬러그'],
} as const;

export type NotionPostDetail = {
  post: Post;
  markdown: string;
  blocks: BlockObjectResponse[];
};

function getDatabaseId() {
  const id = process.env.NOTION_DATABASE_ID ?? process.env.DATABASE_ID;

  if (!id) {
    throw new Error('NOTION_DATABASE_ID 또는 DATABASE_ID 환경 변수가 필요합니다.');
  }

  return id;
}

async function getDataSourceId() {
  if (process.env.NOTION_DATASOURCE_ID) {
    return process.env.NOTION_DATASOURCE_ID;
  }

  const database = await notion.databases.retrieve({
    database_id: getDatabaseId(),
  });

  if (!('data_sources' in database) || database.data_sources.length === 0) {
    throw new Error('Notion 데이터베이스에서 data source를 찾지 못했습니다.');
  }

  return database.data_sources[0].id;
}

export const getPublishedPosts = async (tag?: string) => {
  const publishedFilter = {
    property: 'Status',
    select: {
      equals: 'Published',
    },
  } as const;

  const filter = tag
    ? {
        and: [
          publishedFilter,
          {
            property: 'Tags',
            multi_select: {
              contains: tag,
            },
          },
        ],
      }
    : publishedFilter;

  const response = await notion.dataSources.query({
    data_source_id: await getDataSourceId(),
    filter,
    sorts: [
      {
        property: 'Date',
        direction: 'descending',
      },
    ],
  });

  return {
    ...response,
    results: [...response.results].sort((a, b) => getPostTimestamp(b) - getPostTimestamp(a)),
  };
};

export async function getPostBySlug(slug: string): Promise<NotionPostDetail | null> {
  const page = await findPublishedPageBySlug(slug);

  if (!page) {
    return null;
  }

  const post = toPost(page);
  const blocks = await getAllBlocks(page.id);

  return {
    post,
    blocks,
    markdown: blocksToMarkdown(blocks),
  };
}

export function toPosts(results: QueryDataSourceResponse['results']): Post[] {
  return results.filter(isFullPage).map(toPost);
}

export function toPost(page: PageObjectResponse): Post {
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

export function getTagFilterItems(
  results: QueryDataSourceResponse['results']
): TagFilterItemWithCount[] {
  const posts = results.filter(isFullPage);
  const counts = new Map<string, { id: string; count: number }>();

  for (const post of posts) {
    const tagsProperty = post.properties.Tags ?? post.properties['태그'];

    if (tagsProperty?.type !== 'multi_select') {
      continue;
    }

    for (const tag of tagsProperty.multi_select) {
      const current = counts.get(tag.name);

      counts.set(tag.name, {
        id: tag.id,
        count: (current?.count ?? 0) + 1,
      });
    }
  }

  const tags = [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right, 'ko'))
    .map(([name, tag]) => ({
      id: tag.id,
      name,
      count: tag.count,
    }));

  return [{ id: 'all', name: '전체', count: posts.length }, ...tags];
}

async function findPublishedPageBySlug(slug: string) {
  const response = await notion.dataSources.query({
    data_source_id: await getDataSourceId(),
    filter: {
      and: [
        {
          property: 'Slug',
          rich_text: {
            equals: slug,
          },
        },
        {
          property: 'Status',
          select: {
            equals: 'Published',
          },
        },
      ],
    },
  });

  const matchedPage = response.results.find(isFullPage);
  if (matchedPage) {
    return matchedPage;
  }

  if (!isPageId(slug)) {
    return null;
  }

  const retrieved = await notion.pages.retrieve({ page_id: slug });
  if (!isFullPage(retrieved) || !isPublished(retrieved)) {
    return null;
  }

  return retrieved;
}

async function getAllBlocks(blockId: string) {
  const blocks: BlockObjectResponse[] = [];
  let cursor: string | undefined;

  do {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
      page_size: 100,
    });

    blocks.push(...response.results.filter(isFullBlock));
    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return blocks;
}

function isPublished(page: PageObjectResponse) {
  const status = page.properties.Status;
  return status?.type === 'select' && status.select?.name === 'Published';
}

function isPageId(value: string) {
  return /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i.test(value);
}

function getPostTimestamp(page: QueryDataSourceResponse['results'][number]) {
  if (!isFullPage(page)) {
    return 0;
  }

  const dateProperty = page.properties.Date;
  const dateValue =
    dateProperty?.type === 'date' && dateProperty.date?.start
      ? dateProperty.date.start
      : page.created_time;

  return new Date(dateValue).getTime();
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
  return items
    .map((item) => item.plain_text)
    .join('')
    .trim();
}

function blocksToMarkdown(blocks: BlockObjectResponse[]) {
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'heading_1':
          return `# ${joinPlainText(block.heading_1.rich_text)}`;
        case 'heading_2':
          return `## ${joinPlainText(block.heading_2.rich_text)}`;
        case 'heading_3':
          return `### ${joinPlainText(block.heading_3.rich_text)}`;
        case 'paragraph':
          return joinPlainText(block.paragraph.rich_text);
        case 'bulleted_list_item':
          return `- ${joinPlainText(block.bulleted_list_item.rich_text)}`;
        case 'numbered_list_item':
          return `1. ${joinPlainText(block.numbered_list_item.rich_text)}`;
        case 'quote':
          return `> ${joinPlainText(block.quote.rich_text)}`;
        case 'code':
          return `\`\`\`${block.code.language}\n${joinPlainText(block.code.rich_text)}\n\`\`\``;
        case 'divider':
          return '---';
        default:
          return '';
      }
    })
    .filter(Boolean)
    .join('\n\n');
}
