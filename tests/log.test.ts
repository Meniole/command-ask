import { jest } from "@jest/globals";
import { Logs } from "@ubiquity-os/ubiquity-os-logger";
import { Context } from "../src/types";

describe("Log post message test", () => {
  it("Should post a waiting message on start", async () => {
    const addCommentToIssue = jest.fn();
    jest.unstable_mockModule("../src/handlers/ask-llm", () => ({
      askQuestion: jest.fn(() => ({
        answer: "hello",
        tokenUsage: 1,
        groundThreshold: [],
      })),
    }));
    const { processCommentCallback } = await import("../src/handlers/comment-created-callback");
    const context = {
      payload: {
        comment: {
          user: {
            type: "User",
          },
          body: "/ask hello",
        },
      },
      logger: new Logs("debug"),
      env: {
        UBIQUITY_OS_APP_NAME: "UbiquityOS",
      },
      commentHandler: {
        postComment: addCommentToIssue,
      },
    } as unknown as Context;

    await processCommentCallback(context);
    expect(addCommentToIssue.mock.calls[0][1]).toMatchObject({ logMessage: { raw: "Thinking..." } });
  });
});
