import { describe, expect, it } from "vitest";
import { getLearnVisualCount } from "../components/LearnVisual";
import { learnTopics } from "../lib/learn-topics";

describe("visual learning guides", () => {
  it("gives every indexed learning topic three teaching diagrams", () => {
    expect(learnTopics).toHaveLength(8);
    for (const topic of learnTopics) {
      expect(getLearnVisualCount(topic.slug), topic.slug).toBe(3);
    }
  });
});
