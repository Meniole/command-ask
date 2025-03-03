import { Context } from "../types";
import { CallbackResult } from "../types/proxy";
import { askQuestion } from "./ask-llm";

export async function processCommentCallback(context: Context<"issue_comment.created" | "pull_request_review_comment.created">): Promise<CallbackResult> {
  const { logger, command, payload } = context;
  let question = "";

  if (payload.comment.user?.type === "Bot") {
    throw logger.error("Comment is from a bot. Skipping.");
  }

  if (command?.name === "ask") {
    question = command.parameters.question;
  } else if (payload.comment.body.trim().startsWith("/ask")) {
    question = payload.comment.body.trim().replace("/ask", "").trim();
  } else if (!question) {
    return { status: 200, reason: logger.info("No question found in comment. Skipping.").logMessage.raw };
  }

  await context.commentHandler.postComment(context, context.logger.ok("Thinking..."), { updateComment: true });

  const response = await askQuestion(context, question);
  const { answer, tokenUsage, groundTruths } = response;
  if (!answer) {
    throw logger.error(`No answer from OpenAI`);
  }

  await context.commentHandler.postComment(
    context,
    context.logger.ok(answer, {
      groundTruths,
      tokenUsage,
    }),
    { raw: true, updateComment: true }
  );
  return { status: 200, reason: logger.info("Comment posted successfully").logMessage.raw };
}
