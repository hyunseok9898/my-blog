import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BookOpen, Code2, FolderGit2, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const profileLinks = [
  { icon: User, href: '/about', label: '소개' },
  { icon: Code2, href: '/about/stack', label: '기술 스택' },
  { icon: FolderGit2, href: '/about/projects', label: '프로젝트' },
  { icon: BookOpen, href: '/blog', label: '블로그' },
];

export default function ProfileSection() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="bg-muted rounded-full p-2">
              <div className="relative size-36 overflow-hidden rounded-full">
                <Image
                  src="/images/me.png"
                  alt="현석"
                  fill
                  className="object-cover object-[50%_45%]"
                />
              </div>
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-lg font-bold">현석</h3>
            <p className="text-primary text-sm">Frontend Developer</p>
          </div>

          <div className="flex justify-center gap-2">
            {profileLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                title={item.label}
                className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'bg-primary/10')}
              >
                <item.icon className="size-4" />
              </Link>
            ))}
          </div>

          <p className="bg-primary/10 rounded p-2 text-center text-sm">프론트엔드 개발자 ✨</p>
        </div>
      </CardContent>
    </Card>
  );
}
