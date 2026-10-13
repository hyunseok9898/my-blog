import type { ReactNode } from 'react';
import type { BlockObjectResponse, RichTextItemResponse } from '@notionhq/client';
import Image from 'next/image';
import { highlightCode } from '@/lib/highlight';

interface PostContentProps {
  blocks: BlockObjectResponse[];
}

export type HeadingItem = {
  id: string;
  title: string;
  level: 1 | 2 | 3;
};

export function getHeadingItems(blocks: BlockObjectResponse[]): HeadingItem[] {
  return blocks.flatMap((block): HeadingItem[] => {
    if (block.type === 'heading_1') {
      const title = joinText(block.heading_1.rich_text);
      return title ? [{ id: toHeadingId(title), title, level: 1 as const }] : [];
    }

    if (block.type === 'heading_2') {
      const title = joinText(block.heading_2.rich_text);
      return title ? [{ id: toHeadingId(title), title, level: 2 as const }] : [];
    }

    if (block.type === 'heading_3') {
      const title = joinText(block.heading_3.rich_text);
      return title ? [{ id: toHeadingId(title), title, level: 3 as const }] : [];
    }

    return [];
  });
}

export function PostContent({ blocks }: PostContentProps) {
  return <>{renderBlocks(blocks)}</>;
}

function renderBlocks(blocks: BlockObjectResponse[]) {
  const elements: ReactNode[] = [];

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];

    if (block.type === 'bulleted_list_item') {
      const items = takeWhile(blocks, index, 'bulleted_list_item');
      elements.push(
        <ul key={block.id}>
          {items.map((item) => (
            <li key={item.id}>
              <RichText items={item.bulleted_list_item.rich_text} />
            </li>
          ))}
        </ul>
      );
      index += items.length - 1;
      continue;
    }

    if (block.type === 'numbered_list_item') {
      const items = takeWhile(blocks, index, 'numbered_list_item');
      elements.push(
        <ol key={block.id}>
          {items.map((item) => (
            <li key={item.id}>
              <RichText items={item.numbered_list_item.rich_text} />
            </li>
          ))}
        </ol>
      );
      index += items.length - 1;
      continue;
    }

    elements.push(<BlockView key={block.id} block={block} />);
  }

  return elements;
}

function takeWhile<T extends 'bulleted_list_item' | 'numbered_list_item'>(
  blocks: BlockObjectResponse[],
  start: number,
  type: T
) {
  const items: Extract<BlockObjectResponse, { type: T }>[] = [];

  for (let index = start; index < blocks.length; index += 1) {
    const block = blocks[index];
    if (block.type !== type) {
      break;
    }
    items.push(block as Extract<BlockObjectResponse, { type: T }>);
  }

  return items;
}

function BlockView({ block }: { block: BlockObjectResponse }) {
  switch (block.type) {
    case 'heading_1': {
      const title = joinText(block.heading_1.rich_text);
      return (
        <h2 id={toHeadingId(title)}>
          <RichText items={block.heading_1.rich_text} />
        </h2>
      );
    }
    case 'heading_2': {
      const title = joinText(block.heading_2.rich_text);
      return (
        <h3 id={toHeadingId(title)}>
          <RichText items={block.heading_2.rich_text} />
        </h3>
      );
    }
    case 'heading_3': {
      const title = joinText(block.heading_3.rich_text);
      return (
        <h4 id={toHeadingId(title)}>
          <RichText items={block.heading_3.rich_text} />
        </h4>
      );
    }
    case 'paragraph':
      return (
        <p>
          <RichText items={block.paragraph.rich_text} />
        </p>
      );
    case 'quote':
      return (
        <blockquote>
          <RichText items={block.quote.rich_text} />
        </blockquote>
      );
    case 'code':
      return (
        <CodeBlock
          code={block.code.rich_text.map((item) => item.plain_text).join('')}
          language={block.code.language}
        />
      );
    case 'divider':
      return <hr />;
    case 'image': {
      const image = getBlockImage(block);
      if (!image) return null;

      return (
        <Image src={image.url} alt={image.alt} width={1200} height={675} className="h-auto w-full" />
      );
    }
    case 'to_do':
      return (
        <p>
          <label className="flex items-start gap-2">
            <input type="checkbox" checked={block.to_do.checked} readOnly className="mt-1.5" />
            <span>
              <RichText items={block.to_do.rich_text} />
            </span>
          </label>
        </p>
      );
    default:
      return null;
  }
}

function RichText({ items }: { items: RichTextItemResponse[] }) {
  return items.map((item, index) => {
    let content: ReactNode = item.plain_text;

    if (item.annotations.code) {
      content = <code>{content}</code>;
    }
    if (item.annotations.bold) {
      content = <strong>{content}</strong>;
    }
    if (item.annotations.italic) {
      content = <em>{content}</em>;
    }
    if (item.annotations.strikethrough) {
      content = <s>{content}</s>;
    }
    if (item.href) {
      content = (
        <a href={item.href} target="_blank" rel="noreferrer">
          {content}
        </a>
      );
    }

    return <span key={`${item.plain_text}-${index}`}>{content}</span>;
  });
}

function getBlockImage(block: Extract<BlockObjectResponse, { type: 'image' }>) {
  if (block.image.type === 'external') {
    return { url: block.image.external.url, alt: joinText(block.image.caption) || '본문 이미지' };
  }

  if (block.image.type === 'file') {
    return { url: block.image.file.url, alt: joinText(block.image.caption) || '본문 이미지' };
  }

  return null;
}

function joinText(items: RichTextItemResponse[]) {
  return items
    .map((item) => item.plain_text)
    .join('')
    .trim();
}

function toHeadingId(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w가-힣-]/g, '');
}

async function CodeBlock({ code, language }: { code: string; language: string }) {
  const html = await highlightCode(code, language);

  return (
    <div
      className="not-prose my-6 overflow-x-auto rounded-lg [&_pre]:m-0 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:p-4"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
