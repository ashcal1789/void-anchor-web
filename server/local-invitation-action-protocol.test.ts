import { describe, expect, it } from "vitest";
import {
  LocalInvitationActionProtocol,
  createLocalLetterTool,
  type ActionCandidate,
  type EventSink,
  type SelectionPolicy,
} from "@/lib/local-invitation-action-protocol";

function fixedProtocol(selection: ActionCandidate, now = 1_000) {
  const events: Parameters<EventSink>[0][] = [];
  let id = 0;
  const policy: SelectionPolicy = {
    deriveCandidates: () => [selection],
    selectCandidate: (candidates) => candidates[0],
  };

  const protocol = new LocalInvitationActionProtocol({
    runtimeId: "test-runtime",
    now: () => now,
    random: () => 0.5,
    id: () => `test-${++id}`,
    deferDurationMs: 5_000,
    silenceDurationMs: 2_000,
    policy,
    eventSink: (event) => events.push(event),
  });

  return { protocol, events };
}

describe("Local Invitation and Action Protocol", () => {
  it("keeps invitations optional and permits local continuation", async () => {
    const { protocol } = fixedProtocol({ kind: "continue-local", weight: 1 });
    const invitation = protocol.offerInvitation({
      id: "letter-invitation",
      source: "local-condition",
      createdAt: 1_000,
      toolId: "letter.compose.local",
      text: "A local letter capability is available.",
    });

    const outcome = await protocol.runCycle();

    expect(invitation.requiresResponse).toBe(false);
    expect(outcome.kind).toBe("continue-local");
    expect(protocol.state.pendingInvitations).toHaveLength(1);
  });

  it("records silence as an explicit outcome", async () => {
    const { protocol, events } = fixedProtocol({ kind: "silence", weight: 1 });

    const outcome = await protocol.runCycle();

    expect(outcome.kind).toBe("silence");
    expect(protocol.state.activeSilence?.durationMs).toBe(2_000);
    expect(events.some((event) => event.type === "silence.started")).toBe(true);
  });

  it("records decline without retrying or executing a tool", async () => {
    const { protocol } = fixedProtocol({
      kind: "decline",
      invitationId: "letter-invitation",
      toolId: "letter.compose.local",
      weight: 1,
    });
    protocol.offerInvitation({
      id: "letter-invitation",
      source: "local-condition",
      createdAt: 1_000,
      toolId: "letter.compose.local",
    });

    const outcome = await protocol.runCycle();

    expect(outcome.kind).toBe("decline");
    expect(protocol.state.pendingInvitations).toHaveLength(0);
    expect(protocol.state.recentOutcomes[0]?.kind).toBe("decline");
  });

  it("defers an invitation without converting deferment into execution", async () => {
    const { protocol } = fixedProtocol({
      kind: "defer",
      invitationId: "archive-invitation",
      toolId: "read.archive",
      weight: 1,
    });
    protocol.offerInvitation({
      id: "archive-invitation",
      source: "witness",
      createdAt: 1_000,
      toolId: "read.archive",
    });

    const outcome = await protocol.runCycle();

    expect(outcome.kind).toBe("defer");
    expect(outcome.reviewAfter).toBe(6_000);
    expect(protocol.state.deferredInvitations[0]?.invitationId).toBe("archive-invitation");
    expect(protocol.state.pendingInvitations).toHaveLength(0);
  });

  it("executes a local tool with explicit no-model provenance", async () => {
    const { protocol, events } = fixedProtocol({
      kind: "use-tool",
      invitationId: "letter-invitation",
      toolId: "letter.compose.local",
      weight: 1,
    });
    protocol.registerTool(
      createLocalLetterTool(async () => "A locally composed letter."),
    );
    protocol.offerInvitation({
      id: "letter-invitation",
      source: "local-condition",
      createdAt: 1_000,
      toolId: "letter.compose.local",
    });

    const outcome = await protocol.runCycle();

    expect(outcome.kind).toBe("use-tool");
    expect(outcome.toolResult?.status).toBe("completed");
    expect(outcome.toolResult?.output).toBe("A locally composed letter.");
    expect(outcome.toolResult?.modelUsed).toBe("none");
    expect(events.some((event) => event.type === "tool.started")).toBe(true);
    expect(events.some((event) => event.type === "tool.completed")).toBe(true);
  });
});
