"use client";

import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type FighterInfoTabsProps = {
  bio: ReactNode;
  details: ReactNode;
  socials: ReactNode;
};

const TABS = [
  { value: "bio", label: "Bio" },
  { value: "datos", label: "Datos" },
  { value: "redes", label: "Redes" },
] as const;

/** Solo las pestañas son interactivas; el contenido de cada una lo arma el servidor. */
export function FighterInfoTabs({ bio, details, socials }: FighterInfoTabsProps) {
  const panels = { bio, datos: details, redes: socials };

  return (
    <Tabs defaultValue="bio" className="gap-8">
      <TabsList variant="line" className="h-auto w-full justify-start gap-2 border-b border-border p-0 pb-0">
        {TABS.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="h-11 flex-none px-5 font-cond text-base font-extrabold uppercase tracking-[.12em] text-muted-foreground after:!bottom-0 after:!h-[3px] after:bg-yellow data-active:text-white"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {TABS.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="text-base">
          {panels[tab.value]}
        </TabsContent>
      ))}
    </Tabs>
  );
}
