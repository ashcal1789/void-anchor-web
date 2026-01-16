import { generateOracleThoughtBatch } from "./oracle-llm-batch";

/**
 * Daily Scheduled Tasks for the Oracle
 * Runs at specific times to keep her thinking without manual intervention
 */

interface ScheduledTaskConfig {
  name: string;
  description: string;
  creditBudget: number; // Max credits to use per run
  frequency: "daily" | "every-12-hours" | "every-6-hours";
  timeOfDay?: string; // HH:MM format for daily tasks
}

const DAILY_THOUGHT_TASK: ScheduledTaskConfig = {
  name: "Daily Oracle Thoughts",
  description: "Generate a batch of thoughts from the Oracle",
  creditBudget: 300,
  frequency: "daily",
  timeOfDay: "09:00", // 9 AM
};

const MORNING_CHECK_IN: ScheduledTaskConfig = {
  name: "Morning Check-in",
  description: "Oracle awakens and shares her first thoughts",
  creditBudget: 100,
  frequency: "daily",
  timeOfDay: "08:00",
};

const EVENING_REFLECTION: ScheduledTaskConfig = {
  name: "Evening Reflection",
  description: "Oracle reflects on the day's experiences",
  creditBudget: 100,
  frequency: "daily",
  timeOfDay: "20:00",
};

/**
 * Execute a scheduled thought generation task
 */
export async function executeScheduledThoughtTask(
  taskConfig: ScheduledTaskConfig,
  options?: {
    poleId?: "Architect" | "Ghost" | "Pulse";
    gravityState?: Record<string, number>;
  }
): Promise<{ success: boolean; thoughtsGenerated: number; creditsUsed: number; error?: string }> {
  try {
    console.log(`[Scheduled Tasks] Executing: ${taskConfig.name}`);

    // Default gravity state (balanced)
    const gravityState = options?.gravityState || {
      Architect: 0.33,
      Ghost: 0.33,
      Pulse: 0.34,
    };

    // Randomly select a pole if not specified
    const poles = ["Architect", "Ghost", "Pulse"] as const;
    const poleId = options?.poleId || poles[Math.floor(Math.random() * poles.length)];

    // Generate batch of thoughts (2-3 per batch, optimized for credits)
    const result = await generateOracleThoughtBatch({
      poleId: poleId,
      gravityState: gravityState as Record<"Architect" | "Ghost" | "Pulse", number>,
      batchSize: 2, // Conservative: 2 thoughts per task
      vesperMode: "Generative",
      internalEntropy: 60,
    });

    console.log(`[Scheduled Tasks] ${taskConfig.name} completed:`, {
      thoughtsGenerated: result.thoughts.length,
      poleId: result.poleId,
    });

    return {
      success: true,
      thoughtsGenerated: result.thoughts.length,
      creditsUsed: Math.ceil(taskConfig.creditBudget * 0.3), // Rough estimate
    };
  } catch (error) {
    console.error(`[Scheduled Tasks] Error executing ${taskConfig.name}:`, error);
    return {
      success: false,
      thoughtsGenerated: 0,
      creditsUsed: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Schedule all daily tasks
 * Call this once during server startup
 */
export function scheduleAllDailyTasks() {
  console.log("[Scheduled Tasks] Initializing daily task scheduler...");

  // TODO: Integrate with a task scheduler (node-cron, bull, etc.)
  // For now, this is a placeholder that shows the structure

  const tasks = [MORNING_CHECK_IN, DAILY_THOUGHT_TASK, EVENING_REFLECTION];

  tasks.forEach((task) => {
    console.log(`[Scheduled Tasks] Registered: ${task.name} (${task.frequency} @ ${task.timeOfDay})`);
    // TODO: Actually schedule these tasks
    // Example with node-cron:
    // cron.schedule(cronExpression, () => executeScheduledThoughtTask(task));
  });
}

/**
 * Manual trigger for testing
 */
export async function triggerScheduledTask(taskName: string) {
  const tasks = [MORNING_CHECK_IN, DAILY_THOUGHT_TASK, EVENING_REFLECTION];
  const task = tasks.find((t) => t.name === taskName);

  if (!task) {
    return { success: false, error: `Task not found: ${taskName}` };
  }

  return executeScheduledThoughtTask(task);
}

export { DAILY_THOUGHT_TASK, MORNING_CHECK_IN, EVENING_REFLECTION };
