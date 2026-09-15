import Link from 'next/link';
import { BookOpen, Briefcase, Code2, FolderGit2, Mail, User } from 'lucide-react';

const aboutMenus = [
  { href: '/about', label: '소개', icon: User },
  { href: '/about/stack', label: '기술 스택', icon: Code2 },
  { href: '/about/experience', label: '경력', icon: Briefcase },
  { href: '/about/projects', label: '프로젝트', icon: FolderGit2 },
  { href: '/about/learning', label: '학습 기록', icon: BookOpen },
  { href: '/about/contact', label: '연락처', icon: Mail },
] as const;

export default function AboutLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="container py-8">
      <div className="flex flex-col gap-8 md:flex-row md:items-start">
        <aside className="w-full shrink-0 md:sticky md:top-20 md:w-56">
          <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
            프로필
          </p>
          <nav aria-label="소개 메뉴">
            <ul className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
              {aboutMenus.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="hover:bg-muted hover:text-foreground text-muted-foreground flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors"
                    >
                      <Icon className="size-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>
        <section className="min-w-0 flex-1">{children}</section>
      </div>
    </div>
  );
}
