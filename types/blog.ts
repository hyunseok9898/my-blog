export interface TagFilterItem {
  id: string;
  name: string;
}

export interface TagFilterItemWithCount extends TagFilterItem {
  count: number;
}

export interface Post {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  tags?: string[];
  author?: string;
  date?: string;
  modifiedDate?: string;
  slug: string;
}
