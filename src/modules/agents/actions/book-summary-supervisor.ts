"use server";

import "server-only";

import { runBookSummarySupervisor } from "@/modules/agents/supervisor.agent";
import type { SummarySupervisorInput } from "@/modules/agents/types";

export async function runBookSummarySupervisorAction(
  input: SummarySupervisorInput
) {
  return runBookSummarySupervisor(input);
}
