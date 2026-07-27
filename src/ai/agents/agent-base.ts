import { AgentType, AgentStatus, AgentMemory, InterAgentMessage } from '../../types/agent-orchestrator';
import { GeminiService } from '../gemini-service';

export abstract class BaseAgent {
  public abstract readonly type: AgentType;
  public abstract readonly name: string;
  public abstract readonly role: string;
  public abstract readonly systemPrompt: string;

  public status: AgentStatus = 'IDLE';
  public memory: AgentMemory[] = [];
  public currentTask: string = 'Standing by for orchestration dispatch...';

  /**
   * Executes a task assigned to this agent with automatic memory logging & failure recovery
   */
  public async executeTask(
    taskDescription: string,
    inputData: any,
    sharedContext: Record<string, any>,
    apiKey?: string
  ): Promise<{ success: boolean; result: any; error?: string }> {
    this.status = 'WORKING';
    this.currentTask = taskDescription;

    const memoryId = `mem_${this.type}_${Date.now()}`;
    const prompt = this.buildPrompt(taskDescription, inputData, sharedContext);

    try {
      // 1. Attempt task via Gemini AI
      const rawAiResponse = await GeminiService.generateTextSafely(
        apiKey,
        prompt,
        JSON.stringify(this.generateFallbackResult(taskDescription, inputData))
      );

      let parsedResult: any;
      try {
        parsedResult = JSON.parse(rawAiResponse);
      } catch (parseErr) {
        parsedResult = { rawOutput: rawAiResponse };
      }

      // Record successful memory
      this.recordMemory({
        id: memoryId,
        agentType: this.type,
        timestamp: new Date().toISOString(),
        inputPrompt: taskDescription,
        outputResult: typeof parsedResult === 'string' ? parsedResult : JSON.stringify(parsedResult),
        status: 'SUCCESS',
        metadata: { inputData }
      });

      this.status = 'IDLE';
      this.currentTask = 'Task completed successfully.';
      return { success: true, result: parsedResult };
    } catch (err: any) {
      console.warn(`[${this.name}] Execution failed, initiating failure recovery:`, err);

      // 2. Failure Recovery - execute fallback logic
      try {
        const fallbackResult = this.generateFallbackResult(taskDescription, inputData);
        this.recordMemory({
          id: memoryId,
          agentType: this.type,
          timestamp: new Date().toISOString(),
          inputPrompt: taskDescription,
          outputResult: JSON.stringify(fallbackResult),
          status: 'RECOVERED',
          metadata: { error: err?.message, inputData }
        });

        this.status = 'RECOVERED';
        this.currentTask = 'Task recovered via fallback logic.';
        return { success: true, result: fallbackResult };
      } catch (recoveryErr: any) {
        this.status = 'FAILED';
        this.currentTask = `Execution failed: ${recoveryErr?.message}`;
        return { success: false, result: null, error: recoveryErr?.message };
      }
    }
  }

  /**
   * Sends a structured message to another agent
   */
  public sendMessage(toAgent: AgentType, payload: any): InterAgentMessage {
    return {
      id: `msg_${this.type}_to_${toAgent}_${Date.now()}`,
      fromAgent: this.type,
      toAgent,
      taskPayload: payload,
      timestamp: new Date().toISOString(),
      status: 'PENDING'
    };
  }

  /**
   * Builds full context prompt with system prompt & past memory
   */
  protected buildPrompt(taskDescription: string, inputData: any, sharedContext: Record<string, any>): string {
    const memoryContext = this.memory
      .slice(-3)
      .map((m) => `[Past Task: ${m.inputPrompt}] -> [Status: ${m.status}]`)
      .join('\n');

    return `
${this.systemPrompt}

AGENT TYPE: ${this.type.toUpperCase()}
AGENT NAME: ${this.name}

MEMORY CONTEXT:
${memoryContext || 'No prior task memory in session.'}

SHARED ORCHESTRATION CONTEXT:
${JSON.stringify(sharedContext, null, 2)}

TASK SPECIFICATION:
"${taskDescription}"

INPUT DATA:
${JSON.stringify(inputData, null, 2)}

INSTRUCTIONS:
Provide your output as a clean, valid JSON object with detailed, actionable agent results.
`;
  }

  protected recordMemory(memory: AgentMemory) {
    this.memory.push(memory);
    if (this.memory.length > 20) {
      this.memory.shift(); // Keep memory lean
    }
  }

  /**
   * Each agent must implement deterministic fallback logic for resilience
   */
  protected abstract generateFallbackResult(taskDescription: string, inputData: any): any;
}
