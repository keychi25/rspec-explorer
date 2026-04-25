import { describe, expect, it } from "vitest";
import { parseRSpec } from "./rspecParser";

describe("parseRSpec", () => {
  it("parses describe/context/it/specify with do..end", () => {
    const src = `
RSpec.describe Calculator do
  describe '#add' do
    context 'when x' do
      it 'adds' do
        expect(1 + 2).to eq(3)
      end

      specify 'also works' do
        expect(1 + 2).to eq(3)
      end
    end
  end
end
`.trim();

    const tests = parseRSpec(src);
    expect(tests.map((t) => [t.type, t.name])).toEqual([
      ["group", "Calculator"],
      ["group", "#add"],
      ["group", "when x"],
      ["test", "adds"],
      ["test", "also works"],
    ]);
  });

  it("parses block form with braces", () => {
    const src = `
describe "Thing" {
  it "works" {
    expect(true).to eq(true)
  }
}
`.trim();

    const tests = parseRSpec(src);
    expect(tests.map((t) => t.name)).toEqual(["Thing", "works"]);
  });

  it("keeps non-string first argument as-is", () => {
    const src = `
RSpec.describe Calculator do
  describe :fast do
    it :ok do
      expect(true).to eq(true)
    end
  end
end
`.trim();

    const tests = parseRSpec(src);
    expect(tests.map((t) => t.name)).toEqual(["Calculator", ":fast", ":ok"]);
  });

  it("parses focused/pending aliases and parenthesized arguments", () => {
    const src = `
fdescribe("Calculator", :focus) do
  xcontext "when invalid" do
    fit("works") { expect(true).to eq(true) }
    xit :skipped do
      expect(false).to eq(true)
    end
    example("normal") do
      expect(true).to eq(true)
    end
  end
end
`.trim();

    const tests = parseRSpec(src);
    expect(tests.map((t) => [t.type, t.name])).toEqual([
      ["group", "Calculator"],
      ["group", "when invalid"],
      ["test", "works"],
      ["test", ":skipped"],
      ["test", "normal"],
    ]);
  });
});
