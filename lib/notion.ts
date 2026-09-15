import { Client, isFullPage } from '@notionhq/client';
import type { QueryDataSourceResponse } from '@notionhq/client';
import type { TagFilterItemWithCount } from '@/types/blog';

export const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

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

export const getPublishedPosts = async () => {
  const response = await notion.dataSources.query({
    data_source_id: await getDataSourceId(),
    filter: {
      property: 'Status',
      select: {
        equals: 'Published',
      },
    },
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
