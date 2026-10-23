"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NumberCheck } from "./number-check";
import { VoiceCheck } from "./voice-check";
import { GuardianDemo } from "./guardian-demo";
import { VerifiedLookup } from "./verified-lookup";

export function DemoConsole() {
  return (
    <Tabs defaultValue="number" className="w-full">
      <TabsList className="mb-5 flex h-auto w-full flex-wrap justify-start gap-1 rounded-2xl border border-border bg-card p-1.5 sm:inline-grid sm:w-auto sm:grid-cols-4">
        <TabsTrigger value="number" className="rounded-xl px-4 py-2 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
          Check a number
        </TabsTrigger>
        <TabsTrigger value="voice" className="rounded-xl px-4 py-2 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
          Check a voice note
        </TabsTrigger>
        <TabsTrigger value="guardian" className="rounded-xl px-4 py-2 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
          Live Call Guardian
        </TabsTrigger>
        <TabsTrigger value="verified" className="rounded-xl px-4 py-2 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
          Was that call real?
        </TabsTrigger>
      </TabsList>

      <TabsContent value="number" className="mt-0 focus-visible:outline-none">
        <NumberCheck />
      </TabsContent>
      <TabsContent value="voice" className="mt-0 focus-visible:outline-none">
        <VoiceCheck />
      </TabsContent>
      <TabsContent value="guardian" className="mt-0 focus-visible:outline-none">
        <GuardianDemo />
      </TabsContent>
      <TabsContent value="verified" className="mt-0 focus-visible:outline-none">
        <VerifiedLookup />
      </TabsContent>
    </Tabs>
  );
}
