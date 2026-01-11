import Link from "next/link";
import { Button } from "@/components/ui/button";

interface SectionNavProps {
  currentHref: string;
  cardsHref: string;
}

const defaultLinks = [
  { href: "/", label: "Words" },
  { href: "/phrases", label: "Phrases" },
  { href: "/sentences", label: "Sentences" }
];

export function SectionNav({ currentHref, cardsHref }: SectionNavProps) {
  const links = [...defaultLinks, { href: cardsHref, label: "Random cards" }];

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => (
        <Button
          key={link.href}
          asChild
          variant={link.href === currentHref ? "default" : "outline"}
        >
          <Link href={link.href} aria-current={link.href === currentHref ? "page" : undefined}>
            {link.label}
          </Link>
        </Button>
      ))}
    </div>
  );
}
